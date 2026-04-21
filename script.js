/**
 * SNAKE // DIGITAL EDITION
 * Core Engine v1.0
 * Refactored with high-end visual standards.
 */

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 15;
        this.speedY = (Math.random() - 0.5) * 15;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.type = Math.random() > 0.5 ? 'square' : 'line';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.96;
        this.speedY *= 0.96;
        this.alpha -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        if (this.type === 'square') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillRect(-this.size, -0.5, this.size * 2, 1);
        }
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.highscoresModal = document.getElementById('highscores-modal');
        this.gameoverModal = document.getElementById('gameover-modal');
        
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.highscoresListEl = document.getElementById('highscores-list');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');

        // Config
        this.gridSize = 20;
        this.tileCount = 20;
        this.canvas.width = this.gridSize * this.tileCount;
        this.canvas.height = this.gridSize * this.tileCount;

        // Visual State
        this.particles = [];
        this.floatingTexts = []; // To store floating point texts
        this.lastTime = 0;
        this.accumulator = 0;
        this.moveInterval = 150; // ms
        this.shakeAmount = 0;
        
        // Game State
        this.snake = [];
        this.food = { x: 5, y: 5 };
        this.bonuses = []; // Active special objects
        this.bonusTypes = [
            { id: 'glitch', color: '#00f2ff', points: 50, effect: 'glitch' },
            { id: 'plasma', color: '#7000ff', points: 75, effect: 'pulse' },
            { id: 'neon', color: '#fffb00', points: 100, effect: 'sparkle' },
            { id: 'pulse', color: '#00ff44', points: 60, effect: 'ring' },
            { id: 'ghost', color: '#ffffff', points: 120, effect: 'float' },
            { id: 'flame', color: '#ff4400', points: 80, effect: 'fire' },
            { id: 'crystal', color: '#0088ff', points: 90, effect: 'prism' },
            { id: 'gold', color: '#ffd700', points: 150, effect: 'shine' },
            { id: 'void', color: '#440088', points: 200, effect: 'vortex' },
            { id: 'spark', color: '#ff00aa', points: 70, effect: 'electric' }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.highScores = JSON.parse(localStorage.getItem('snake_highscores_v1')) || [];

        this.init();
    }

    init() {
        // Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.transitionTo('game'));
        document.getElementById('highscores-btn').addEventListener('click', () => this.showModal('highscores'));
        document.getElementById('close-highscores').addEventListener('click', () => this.hideModal('highscores'));
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.transitionTo('menu'));
        
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.togglePause());
        
        window.addEventListener('keydown', (e) => this.handleInput(e));
        
        this.updateBestScoreDisplay();
        this.animateMenu();
    }

    // --- Transitions & UI ---

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseOverlay.classList.add('active');
            this.pauseBtn.querySelector('.pause-icon').style.display = 'none';
            this.pauseBtn.querySelector('.play-icon').style.display = 'block';
        } else {
            this.pauseOverlay.classList.remove('active');
            this.pauseBtn.querySelector('.pause-icon').style.display = 'block';
            this.pauseBtn.querySelector('.play-icon').style.display = 'none';
            // Resume the loop
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    transitionTo(screen) {
        if (screen === 'game') {
            this.menuScreen.classList.remove('active');
            setTimeout(() => {
                this.gameScreen.classList.add('active');
                this.startGame();
            }, 400);
        } else if (screen === 'menu') {
            this.hideAllModals();
            this.gameScreen.classList.remove('active');
            setTimeout(() => {
                this.menuScreen.classList.add('active');
            }, 400);
        }
    }

    showModal(type) {
        if (type === 'highscores') {
            this.renderHighscores();
            this.highscoresModal.classList.add('active');
        } else if (type === 'gameover') {
            this.finalScoreEl.textContent = this.score;
            this.gameoverModal.classList.add('active');
        }
    }

    hideModal(type) {
        if (type === 'highscores') this.highscoresModal.classList.remove('active');
        if (type === 'gameover') this.gameoverModal.classList.remove('active');
    }

    hideAllModals() {
        this.hideModal('highscores');
        this.hideModal('gameover');
    }

    // --- Game Logic ---

    startGame() {
        this.resetState();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    restartGame() {
        this.hideModal('gameover');
        setTimeout(() => this.startGame(), 300);
    }

    resetState() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.moveInterval = 150;
        this.isGameOver = false;
        this.isPaused = false;
        this.particles = [];
        this.bonuses = [];
        this.floatingTexts = [];
        this.spawnFood();
        this.updateScoreDisplay();
        
        // Ensure UI is reset
        this.pauseOverlay.classList.remove('active');
        this.pauseBtn.querySelector('.pause-icon').style.display = 'block';
        this.pauseBtn.querySelector('.play-icon').style.display = 'none';
    }

    spawnFood() {
        let newFood;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            const collision = this.snake.some(s => s.x === newFood.x && s.y === newFood.y);
            if (!collision) break;
        }
        this.food = newFood;
    }

    handleInput(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        const keys = {
            ArrowUp: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 }
        };

        if (keys[e.key]) {
            if (this.isPaused) return; // Prevent movement while paused
            const move = keys[e.key];
            // Prevent 180 degree turns
            if (move.x !== -this.direction.x && move.y !== -this.direction.y) {
                this.nextDirection = move;
                
                // Visual feedback for keys
                const keyMap = { ArrowUp: 0, ArrowLeft: 1, ArrowDown: 2, ArrowRight: 3 };
                const keyEls = document.querySelectorAll('.controls-hint .key');
                const idx = keyMap[e.key];
                if (keyEls[idx]) {
                    keyEls[idx].classList.add('pressed');
                    setTimeout(() => keyEls[idx].classList.remove('pressed'), 150);
                }
            }
        }
    }

    // --- Engine ---

    gameLoop(timestamp) {
        if (this.isGameOver || this.isPaused) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.accumulator += deltaTime;

        // Update visual elements every frame
        this.updateVisuals(deltaTime);

        while (this.accumulator >= this.moveInterval) {
            this.update();
            this.accumulator -= this.moveInterval;
        }

        this.draw(this.accumulator / this.moveInterval);
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    updateVisuals(deltaTime) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.y -= 1; // Float up
            text.alpha -= 0.02; // Fade out
            if (text.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update bonuses timers
        this.updateBonuses(deltaTime);

        // Screenshake decay
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
    }

    updateBonuses(deltaTime) {
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            this.bonuses[i].lifetime -= deltaTime;
            if (this.bonuses[i].lifetime <= 0) {
                this.bonuses.splice(i, 1);
            }
        }

        // Randomly spawn bonus
        if (this.bonuses.length < 2 && Math.random() < 0.005) {
            this.spawnBonus();
        }
    }

    spawnBonus() {
        const type = this.bonusTypes[Math.floor(Math.random() * this.bonusTypes.length)];
        let x, y;
        while (true) {
            x = Math.floor(Math.random() * this.tileCount);
            y = Math.floor(Math.random() * this.tileCount);
            const inSnake = this.snake.some(s => s.x === x && s.y === y);
            const inFood = this.food.x === x && this.food.y === y;
            const inBonuses = this.bonuses.some(b => b.x === x && b.y === y);
            if (!inSnake && !inFood && !inBonuses) break;
        }

        this.bonuses.push({
            ...type,
            x,
            y,
            lifetime: Math.random() * 5000 + 5000, // 5-10 seconds
            maxLifetime: 10000, // for the indicator
            spawnTime: performance.now()
        });
    }

    update() {
        this.direction = this.nextDirection;
        const head = { 
            x: this.snake[0].x + this.direction.x, 
            y: this.snake[0].y + this.direction.y 
        };

        // Collisions
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount ||
            this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.shakeAmount = 15;
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.shakeAmount = 5;
            this.createExplosion(
                head.x * this.gridSize + this.gridSize / 2,
                head.y * this.gridSize + this.gridSize / 2
            );
            this.spawnFood();
            this.updateScoreDisplay();
            this.moveInterval = Math.max(70, 150 - Math.floor(this.score / 50) * 10);
        } else {
            // Check bonus collision
            let bonusEaten = false;
            for (let i = this.bonuses.length - 1; i >= 0; i--) {
                const bonus = this.bonuses[i];
                if (head.x === bonus.x && head.y === bonus.y) {
                    this.score += bonus.points;
                    this.createExplosion(bonus.x * this.gridSize + this.gridSize / 2, bonus.y * this.gridSize + this.gridSize / 2, bonus.color);
                    this.floatingTexts.push({
                        x: bonus.x * this.gridSize + this.gridSize / 2,
                        y: bonus.y * this.gridSize,
                        text: `+${bonus.points}`,
                        color: bonus.color,
                        alpha: 1
                    });
                    this.bonuses.splice(i, 1);
                    this.updateScoreDisplay();
                    this.shakeAmount = 10;
                    bonusEaten = true;
                    break;
                }
            }
            if (!bonusEaten) {
                this.snake.pop();
            }
        }

        // Particles update
        this.particles = this.particles.filter(p => p.alpha > 0);
        this.particles.forEach(p => p.update());
    }

    createExplosion(x, y, color = '#00f2ff') {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color));
        }
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, '#ffffff'));
        }
    }

    // --- Rendering ---

    draw(alpha) {
        this.ctx.save();
        
        // Camera Shake
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount;
            const sy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(sx, sy);
        }

        // Clear with slight trail effect
        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.4)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid();

        // Draw Food
        this.drawFood();

        // Draw bonuses
        this.bonuses.forEach(bonus => this.drawBonus(bonus));

        // Draw Snake with interpolation
        this.drawSnake(alpha);

        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));

        // Draw floating texts
        this.drawFloatingTexts();
        
        this.ctx.restore();
    }

    drawBonus(bonus) {
        const x = bonus.x * this.gridSize + this.gridSize / 2;
        const y = bonus.y * this.gridSize + this.gridSize / 2;
        const time = performance.now() * 0.005;
        const pulse = Math.sin(time * 2) * 0.2 + 0.8;
        const lifetimeRatio = bonus.lifetime / 10000;

        this.ctx.save();
        
        // Lifetime indicator (fading ring)
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.gridSize * 0.8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lifetimeRatio));
        this.ctx.strokeStyle = bonus.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3;
        this.ctx.stroke();

        // Specific effect based on type
        this.ctx.shadowBlur = 15 * pulse;
        this.ctx.shadowColor = bonus.color;
        this.ctx.fillStyle = bonus.color;
        this.ctx.globalAlpha = 1;

        switch (bonus.effect) {
            case 'glitch':
                const offset = Math.sin(time * 10) * 3;
                this.ctx.fillRect(x - 6 + offset, y - 6, 12, 12);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x - 2 - offset, y - 2, 4, 4);
                break;
            case 'pulse':
                this.ctx.beginPath();
                this.ctx.arc(x, y, 7 * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'sparkle':
                for (let i = 0; i < 4; i++) {
                    const angle = time + i * Math.PI / 2;
                    this.ctx.fillRect(x + Math.cos(angle) * 8 - 2, y + Math.sin(angle) * 8 - 2, 4, 4);
                }
                this.ctx.fillRect(x - 4, y - 4, 8, 8);
                break;
            case 'ring':
                this.ctx.beginPath();
                this.ctx.arc(x, y, 6, 0, Math.PI * 2);
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = bonus.color;
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3 * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'float':
                const fy = Math.sin(time * 3) * 4;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 8 + fy);
                this.ctx.lineTo(x + 6, y + fy);
                this.ctx.lineTo(x, y + 8 + fy);
                this.ctx.lineTo(x - 6, y + fy);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'fire':
                for (let i = 0; i < 3; i++) {
                    const h = 10 + Math.random() * 5;
                    this.ctx.fillRect(x - 4 + i * 3, y - h / 2, 2, h);
                }
                break;
            case 'prism':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 8);
                this.ctx.lineTo(x + 8, y + 4);
                this.ctx.lineTo(x - 8, y + 4);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'shine':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 10);
                this.ctx.lineTo(x + 2, y - 2);
                this.ctx.lineTo(x + 10, y);
                this.ctx.lineTo(x + 2, y + 2);
                this.ctx.lineTo(x, y + 10);
                this.ctx.lineTo(x - 2, y + 2);
                this.ctx.lineTo(x - 10, y);
                this.ctx.lineTo(x - 2, y - 2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'vortex':
                this.ctx.rotate(time * 5);
                this.ctx.fillRect(-5, -5, 10, 10);
                break;
            case 'electric':
                this.ctx.beginPath();
                this.ctx.moveTo(x - 5, y - 8);
                this.ctx.lineTo(x + 3, y - 2);
                this.ctx.lineTo(x - 3, y + 2);
                this.ctx.lineTo(x + 5, y + 8);
                this.ctx.stroke();
                break;
            default:
                this.ctx.fillRect(x - 5, y - 5, 10, 10);
        }

        this.ctx.restore();
    }

    drawFloatingTexts() {
        this.ctx.save();
        this.ctx.font = 'bold 16px var(--font-display)';
        this.ctx.textAlign = 'center';
        this.floatingTexts.forEach(text => {
            this.ctx.globalAlpha = text.alpha;
            this.ctx.fillStyle = text.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = text.color;
            this.ctx.fillText(text.text, text.x, text.y);
        });
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawFood() {
        const pulse = Math.sin(Date.now() / 150) * 2;
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;

        this.ctx.save();
        this.ctx.shadowBlur = 20 + pulse * 2;
        this.ctx.shadowColor = '#ff0055';
        this.ctx.fillStyle = '#ff0055';
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, (this.gridSize / 3) + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner glow
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, (this.gridSize / 6), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawSnake(alpha) {
        this.snake.forEach((segment, i) => {
            const isHead = i === 0;
            
            // Interpolate position for smooth movement
            let x = segment.x * this.gridSize;
            let y = segment.y * this.gridSize;
            
            if (isHead) {
                // Head moves toward its next position
                x += this.direction.x * this.gridSize * alpha;
                y += this.direction.y * this.gridSize * alpha;
            } else {
                // Body segments follow the segment in front of them
                const prev = this.snake[i - 1];
                const dx = prev.x - segment.x;
                const dy = prev.y - segment.y;
                x += dx * this.gridSize * alpha;
                y += dy * this.gridSize * alpha;
            }
            
            this.ctx.save();
            
            // Gradient based on position in snake
            const ratio = 1 - (i / this.snake.length);
            this.ctx.shadowBlur = isHead ? 25 : 10 * ratio;
            this.ctx.shadowColor = isHead ? '#00f2ff' : '#7000ff';
            
            const grad = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
            grad.addColorStop(0, isHead ? '#00f2ff' : '#7000ff');
            grad.addColorStop(1, isHead ? '#7000ff' : '#300066');
            
            this.ctx.fillStyle = grad;
            
            const padding = 2;
            const size = this.gridSize - padding * 2;
            this.drawRoundedRect(x + padding, y + padding, size, size, isHead ? 6 : 4);
            
            if (isHead) {
                // Eyes
                this.ctx.fillStyle = '#fff';
                const eyeSize = 3;
                const offset = 5;
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + 12, y + offset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + 5, y + offset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                } else if (this.direction.y === -1) {
                    this.ctx.fillRect(x + 5, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 5, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                }
            }
            
            this.ctx.restore();
        });
    }

    drawRoundedRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // --- Data Persistence ---

    updateScoreDisplay() {
        const formatted = this.score.toString().padStart(3, '0');
        this.currentScoreEl.textContent = formatted;
        
        // Visual glitch effect on update
        this.currentScoreEl.style.animation = 'none';
        this.currentScoreEl.offsetHeight; // trigger reflow
        this.currentScoreEl.style.animation = 'glitch-1 0.3s var(--ease-out-expo)';

        const best = this.highScores.length > 0 ? this.highScores[0] : 0;
        this.bestScoreEl.textContent = Math.max(this.score, best).toString().padStart(3, '0');
    }

    updateBestScoreDisplay() {
        const best = this.highScores.length > 0 ? this.highScores[0] : 0;
        this.bestScoreEl.textContent = best.toString().padStart(3, '0');
    }

    saveScore(score) {
        if (score <= 0) return;
        this.highScores.push(score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5);
        localStorage.setItem('snake_highscores_v1', JSON.stringify(this.highScores));
    }

    renderHighscores() {
        this.highscoresListEl.innerHTML = '';
        if (this.highScores.length === 0) {
            this.highscoresListEl.innerHTML = '<li style="justify-content:center; opacity:0.5">NO DATA FOUND</li>';
        } else {
            this.highScores.forEach((s, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>ARCHIVE_0${i+1}</span> <span>${s.toString().padStart(3, '0')}</span>`;
                this.highscoresListEl.appendChild(li);
            });
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.saveScore(this.score);
        this.showModal('gameover');
    }

    animateMenu() {
        // Subtle mouse parallax for the background spheres
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            document.querySelector('.sphere-1').style.transform = `translate(${x}px, ${y}px)`;
            document.querySelector('.sphere-2').style.transform = `translate(${-x}px, ${-y}px)`;
        });
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
