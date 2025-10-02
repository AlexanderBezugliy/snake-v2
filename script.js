// canvas 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Основная единица измерения игры (размер клетки)
const box = 20; // 20px
// ----- Состояние игры -----
let snake = []; 
let food = { //объект еды в случайной позиции
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
};
let direction; // Переменная для хранения текущего направления движения
let score = 0; // счет
let changingDirection = false; //"замок"(что бы делать только одно действие в 100мс)
let game = setInterval(draw, 100); //будет вызывать draw каждые 100 миллисекунд (то есть 10 раз в секунду), перерисовывая нашу змейку и создавая иллюзию анимации
// ----------

snake[0] = { x: 9 * box, y: 10 * box }; // голова змеи
snake[1] = { x: 8 * box, y: 10 * box };
snake[2] = { x: 7 * box, y: 10 * box };

function draw() {
    
    if (direction) {// --- ДВИЖЕНИЕ ПРОИСХОДИТ, ТОЛЬКО ЕСЛИ НАПРАВЛЕНИЕ ЗАДАНО ---
        changingDirection = false;// "Отпираем" возможность сменить направление для следующего хода

        // Получаем текущие координаты головы
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;

        // Сдвигаем координаты в зависимости от направления
        if (direction == "LEFT") snakeX = snakeX - box;
        if (direction == "RIGHT") snakeX =  snakeX + box;
        if (direction == "UP") snakeY = snakeY - box;
        if (direction == "DOWN") snakeY = snakeY + box;

        if (snakeX === food.x && snakeY === food.y) {
            score++; // увеличиваем счет на 1 единицу
            // Генерируем новую еду в случайном месте
            food = {
                x: Math.floor(Math.random() * 20) * box,
                y: Math.floor(Math.random() * 20) * box
            };
            // Хвост НЕ удаляем, так как змейка выросла
        } else {
            // Удаляем хвост змейки
            snake.pop() //метод pop удаляет последний елемент массива
        }

        // Создаем новую голову с новыми координатами
        let newHead = {
            x: snakeX,
            y: snakeY
        }

        //Реализация "Game Over" (когда будет столкновение со стеной)
        if (newHead.x < 0 || newHead.y < 0 || newHead.x >= canvas.width || newHead.y >= canvas.height) {
            clearInterval(game)// Останавливаем игровой цикл
            alert("Игра окнчена! Ваш счет: " + score)

            return; // Прерываем выполнение функции, чтобы не рисовать змейку за пределами поля
        }

        //ПРОВЕРКА СТОЛКНОВЕНИЯ С ХВОСТОМ
        for (let i = 0; i < snake.length; i++) {
            if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
                clearInterval(game)
                alert("Игра окнчена! Ваш счет: " + score)

                return //Прерываем выполнение функции, чтобы не рисовать змейку за пределами тела змеи
            } 
        }

        // Добавляем новую голову в начало массива змейки
        snake.unshift(newHead); //добавляет объект в самое начало массива
    }


// ------------ОТРИСОВКА-----------------
    // Полностью очищаем холст перед новой отрисовкой
    ctx.clearRect(0, 0, canvas.width, canvas.height);// "сбрасіваем" канвас удаляя след змейки

    snake.forEach((segment, index) => {
        // Задаем цвет для сегмента змейки
        // Голову сделаем другого цвета, чтобы она выделялась
        ctx.fillStyle = (index === 0) ? "green" : "lightgreen";

        // Рисуем прямоугольник (сегмент змейки)
        ctx.fillRect(segment.x, segment.y, box, box);

        // Добавим обводку для каждого сегмента для красоты
        ctx.strokeStyle = "#333";
        ctx.strokeRect(segment.x, segment.y, box, box);
    });

    // ДОБАВЛЯЕМ ЕДУ НА ПОЛЕ
    // рисуем еду
    ctx.fillStyle = 'red';//Устанавливаем красный цвет
    ctx.fillRect(food.x, food.y, box, box);//Рисуем красный квадрат в координатах food.x и food.y
}



document.addEventListener('keydown', updateDirection);

function updateDirection(e) {
    // e.key содержит имя нажатой клавиши (например, "ArrowUp")
    const key = e.key;

    // Выполняем код, только если мы не в процессе смены направления
    if (!changingDirection) {
        changingDirection = true; //"Ставим замок"запираем смену направления

        // Предотвращаем разворот змейки на 180 градусов
        if (key === "ArrowLeft" && direction !== "RIGHT") {
            direction = "LEFT"
        } else if (key === "ArrowRight" && direction !== "LEFT") {
            direction = "RIGHT"
        } else if (key === "ArrowUp" && direction !== "DOWN") {
            direction = "UP"
        } else if (key === "ArrowDown" && direction !== "UP") {
            direction = "DOWN"
        }
    }
}


