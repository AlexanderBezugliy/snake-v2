/**
 * SNAKE // DIGITAL EDITION
 * Core Engine v1.0
 * Refactored with high-end visual standards.
 */

/**
 * UI Focus Manager for Keyboard Navigation
 */
class FocusManager {
    constructor() {
        this.currentContext = null;
        this.elements = [];
        this.currentIndex = -1;
        this.focusClass = 'keyboard-focused';
    }

    /**
     * Rule 1: Hard Reset State
     * Resets index and clears all classes from elements
     */
    reset() {
        this.clearAllFocus();
        this.currentIndex = -1;
        this.elements = [];
        this.currentContext = null;
    }

    /**
     * Rule 3: Global cleanup of focus class
     */
    clearAllFocus() {
        document.querySelectorAll(`.${this.focusClass}`).forEach(el => {
            el.classList.remove(this.focusClass);
        });
    }

    /**
     * Rule 2: Dynamic Collection
     * Re-scans container for visible buttons every time context is set
     */
    setContext(containerId) {
        // Rule 1: Always start with a clean slate
        this.reset();
        
        if (!containerId) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        this.currentContext = containerId;
        this.refresh();
    }

    /**
     * Refresh the list of active elements in the current context
     */
    refresh() {
        if (!this.currentContext) return;
        
        const container = document.getElementById(this.currentContext);
        if (!container) return;

        // Rule 2: Find all visible and non-disabled buttons
        this.elements = Array.from(container.querySelectorAll('button:not([disabled]):not(.hidden)'))
            .filter(btn => {
                const style = window.getComputedStyle(btn);
                return style.display !== 'none';
            });

        if (this.elements.length > 0) {
            // Rule 1: Reset to first button
            this.focus(0);
        } else {
            this.currentIndex = -1;
        }

        // Sync with mouse hover
        this.elements.forEach((el) => {
            if (!el._hasFocusSync) {
                el.addEventListener('mouseenter', () => {
                    if (this.elements.includes(el)) {
                        this.focus(this.elements.indexOf(el));
                    }
                });
                
                // Rule 3: Clear keyboard focus on mouse click
                el.addEventListener('mousedown', () => {
                    this.clearAllFocus();
                });

                el._hasFocusSync = true;
            }
        });
    }

    focus(index) {
        if (index < 0 || index >= this.elements.length) return;
        
        this.clearAllFocus(); // Ensure only one element has focus
        this.currentIndex = index;
        this.elements[this.currentIndex].classList.add(this.focusClass);
    }

    clearFocus() {
        if (this.currentIndex >= 0 && this.elements[this.currentIndex]) {
            this.elements[this.currentIndex].classList.remove(this.focusClass);
        }
    }

    next() {
        if (this.elements.length === 0) {
            this.refresh(); // Attempt to recover if elements changed
            if (this.elements.length === 0) return;
        }
        const nextIndex = (this.currentIndex + 1) % this.elements.length;
        this.focus(nextIndex);
    }

    prev() {
        if (this.elements.length === 0) {
            this.refresh();
            if (this.elements.length === 0) return;
        }
        const prevIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
        this.focus(prevIndex);
    }

    activate() {
        if (this.currentIndex >= 0 && this.elements[this.currentIndex]) {
            // Visual feedback before click
            this.elements[this.currentIndex].click();
        }
    }

    isActive() {
        return this.currentContext !== null && this.elements.length > 0;
    }
}

class Particle {
    constructor(x, y, color, gridSize) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.gridSize = gridSize || 20;
        this.size = Math.random() * (this.gridSize / 6) + 1;
        this.speedX = (Math.random() - 0.5) * (this.gridSize * 0.75);
        this.speedY = (Math.random() - 0.5) * (this.gridSize * 0.75);
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
        ctx.shadowBlur = this.gridSize / 2;
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
        this.baseGridX = 50; // Target grid columns
        this.baseGridY = 30; // Target grid rows
        this.gridSize = 0;
        this.tileCountX = 0;
        this.tileCountY = 0;
        
        // High-DPI support
        this.dpr = window.devicePixelRatio || 1;
        
        this.resizeCanvas();

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
        this.displayScore = 0; // For animated score
        this.stats = {}; // Tracking eaten items: { id: count }
        this.isGameOver = false;
        this.isPaused = false;
        this.highScores = JSON.parse(localStorage.getItem('snake_highscores_v1')) || [];
        
        // UI Focus Management
        this.focusManager = new FocusManager();

        this.init();
    }

    init() {
        // Set initial focus context for main menu
        this.focusManager.setContext('menu-screen');

        // DOM Elements for Stats
        this.inventoryPanel = document.getElementById('inventory-stats');
        // Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.transitionTo('game'));
        document.getElementById('highscores-btn').addEventListener('click', () => this.showModal('highscores'));
        document.getElementById('close-highscores').addEventListener('click', () => this.hideModal('highscores'));
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.transitionTo('menu');
            
            // Жесткий сброс клавиатурной навигации
            document.activeElement.blur();
            this.focusManager.currentIndex = 0;
            document.querySelectorAll('.keyboard-focused').forEach(btn => btn.classList.remove('keyboard-focused'));
        });
        
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.togglePause());
        
        window.addEventListener('keydown', (e) => this.handleInput(e));
        window.addEventListener('resize', () => this.handleResize());
        
        this.updateBestScoreDisplay();
        this.animateMenu();
    }

    handleResize() {
        this.resizeCanvas();
        // Redraw if paused to show changes
        if (this.isPaused || this.isGameOver) {
            this.draw(0);
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Calculate physical dimensions for High-DPI
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        
        // Set CSS dimensions
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        // Update context scaling for High-DPI
        this.ctx.scale(this.dpr, this.dpr);
        
        // Calculate logical grid
        // We want a roughly 50x30 grid, but we should adjust it to keep cells square
        const aspectRatio = rect.width / rect.height;
        
        // We'll fix tileCountY and calculate tileCountX to match aspect ratio
        this.tileCountY = this.baseGridY;
        this.gridSize = rect.height / this.tileCountY;
        this.tileCountX = Math.floor(rect.width / this.gridSize);
        
        // Re-center the grid logic (optional, but good for visuals)
        // Here we just use the calculated tileCountX and tileCountY
    }

    // --- Transitions & UI ---

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseOverlay.classList.add('active');
            this.pauseBtn.querySelector('.pause-icon').style.display = 'none';
            this.pauseBtn.querySelector('.play-icon').style.display = 'block';
            this.focusManager.setContext('pause-overlay');
        } else {
            this.pauseOverlay.classList.remove('active');
            this.pauseBtn.querySelector('.pause-icon').style.display = 'block';
            this.pauseBtn.querySelector('.play-icon').style.display = 'none';
            this.focusManager.setContext(null);
            // Resume the loop
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    transitionTo(screen) {
        if (screen === 'game') {
            this.menuScreen.classList.remove('active');
            this.focusManager.setContext(null);
            setTimeout(() => {
                this.gameScreen.classList.add('active');
                this.startGame();
            }, 400);
        } else if (screen === 'menu') {
            this.hideAllModals();
            this.gameScreen.classList.remove('active');
            setTimeout(() => {
                this.menuScreen.classList.add('active');
                this.focusManager.setContext('menu-screen');
            }, 400);
        }
    }

    showModal(type) {
        if (type === 'highscores') {
            this.renderHighscores();
            this.highscoresModal.classList.add('active');
            this.focusManager.setContext('highscores-modal');
        } else if (type === 'gameover') {
            this.finalScoreEl.textContent = this.score;
            this.gameoverModal.classList.add('active');
            this.focusManager.setContext('gameover-modal');
        }
    }

    hideModal(type) {
        if (type === 'highscores') {
            this.highscoresModal.classList.remove('active');
            // Return focus to menu if it was the previous context
            if (this.menuScreen.classList.contains('active')) {
                this.focusManager.setContext('menu-screen');
            }
        }
        if (type === 'gameover') {
            this.gameoverModal.classList.remove('active');
            // If we're going back to menu or restarting, context is handled elsewhere
        }
    }

    hideAllModals() {
        this.hideModal('highscores');
        this.hideModal('gameover');
    }

    // --- Game Logic ---

    startGame() {
        this.resetState();
        this.focusManager.setContext(null);
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    restartGame() {
        this.hideModal('gameover');
        setTimeout(() => this.startGame(), 300);
    }

    resetState() {
        const startX = Math.floor(this.tileCountX / 2);
        const startY = Math.floor(this.tileCountY / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.displayScore = 0;
        this.stats = {};
        this.moveInterval = 150;
        this.isGameOver = false;
        this.isPaused = false;
        this.particles = [];
        this.bonuses = [];
        this.floatingTexts = [];
        this.spawnFood();
        this.updateScoreDisplay(true); // Reset display score
        this.clearInventory();
        
        // Ensure UI is reset
        this.pauseOverlay.classList.remove('active');
        this.pauseBtn.querySelector('.pause-icon').style.display = 'block';
        this.pauseBtn.querySelector('.play-icon').style.display = 'none';
    }

    spawnFood() {
        let newFood;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY)
            };
            const collision = this.snake.some(s => s.x === newFood.x && s.y === newFood.y);
            if (!collision) break;
        }
        this.food = newFood;
    }

    handleInput(e) {
        // UI Navigation handling
        if (this.focusManager.isActive()) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusManager.prev();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusManager.next();
                return;
            }
            if (e.key === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                // If it's Space and we are in pause overlay, we want to resume
                // But activate() will click the button, which is #resume-btn, so it works!
                this.focusManager.activate();
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault(); // Disable Tab navigation for console-like experience
                return;
            }
            // If it's a modal, we might want to close it with Escape
            if (e.key === 'Escape') {
                if (this.highscoresModal.classList.contains('active')) {
                    this.hideModal('highscores');
                    return;
                }
                if (this.isPaused) {
                    this.togglePause();
                    return;
                }
            }
        }

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
            if (this.isPaused || this.isGameOver) return; // Prevent movement while paused or game over
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
            x = Math.floor(Math.random() * this.tileCountX);
            y = Math.floor(Math.random() * this.tileCountY);
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
        if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY ||
            this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.shakeAmount = this.gridSize * 0.75;
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.trackEaten('food');
            this.shakeAmount = this.gridSize * 0.25;
            this.createExplosion(
                head.x * this.gridSize + this.gridSize / 2,
                head.y * this.gridSize + this.gridSize / 2,
                '#ff0055'
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
                    this.trackEaten(bonus.id, bonus.color);
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
                    this.shakeAmount = this.gridSize * 0.5;
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
            this.particles.push(new Particle(x, y, color, this.gridSize));
        }
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, '#ffffff', this.gridSize));
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
                const offset = Math.sin(time * 10) * (this.gridSize * 0.15);
                this.ctx.fillRect(x - (this.gridSize * 0.3) + offset, y - (this.gridSize * 0.3), this.gridSize * 0.6, this.gridSize * 0.6);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x - (this.gridSize * 0.1) - offset, y - (this.gridSize * 0.1), this.gridSize * 0.2, this.gridSize * 0.2);
                break;
            case 'pulse':
                this.ctx.beginPath();
                this.ctx.arc(x, y, (this.gridSize * 0.35) * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'sparkle':
                for (let i = 0; i < 4; i++) {
                    const angle = time + i * Math.PI / 2;
                    this.ctx.fillRect(x + Math.cos(angle) * (this.gridSize * 0.4) - (this.gridSize * 0.1), y + Math.sin(angle) * (this.gridSize * 0.4) - (this.gridSize * 0.1), this.gridSize * 0.2, this.gridSize * 0.2);
                }
                this.ctx.fillRect(x - (this.gridSize * 0.2), y - (this.gridSize * 0.2), this.gridSize * 0.4, this.gridSize * 0.4);
                break;
            case 'ring':
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.gridSize * 0.3, 0, Math.PI * 2);
                this.ctx.lineWidth = this.gridSize * 0.15;
                this.ctx.strokeStyle = bonus.color;
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x, y, (this.gridSize * 0.15) * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'float':
                const fy = Math.sin(time * 3) * (this.gridSize * 0.2);
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - (this.gridSize * 0.4) + fy);
                this.ctx.lineTo(x + (this.gridSize * 0.3), y + fy);
                this.ctx.lineTo(x, y + (this.gridSize * 0.4) + fy);
                this.ctx.lineTo(x - (this.gridSize * 0.3), y + fy);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'fire':
                for (let i = 0; i < 3; i++) {
                    const h = (this.gridSize * 0.5) + Math.random() * (this.gridSize * 0.25);
                    this.ctx.fillRect(x - (this.gridSize * 0.2) + i * (this.gridSize * 0.15), y - h / 2, this.gridSize * 0.1, h);
                }
                break;
            case 'prism':
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - (this.gridSize * 0.4));
                this.ctx.lineTo(x + (this.gridSize * 0.4), y + (this.gridSize * 0.2));
                this.ctx.lineTo(x - (this.gridSize * 0.4), y + (this.gridSize * 0.2));
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'shine':
                const s1 = this.gridSize * 0.5;
                const s2 = this.gridSize * 0.1;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - s1);
                this.ctx.lineTo(x + s2, y - s2);
                this.ctx.lineTo(x + s1, y);
                this.ctx.lineTo(x + s2, y + s2);
                this.ctx.lineTo(x, y + s1);
                this.ctx.lineTo(x - s2, y + s2);
                this.ctx.lineTo(x - s1, y);
                this.ctx.lineTo(x - s2, y - s2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'vortex':
                this.ctx.rotate(time * 5);
                this.ctx.fillRect(-(this.gridSize * 0.25), -(this.gridSize * 0.25), this.gridSize * 0.5, this.gridSize * 0.5);
                break;
            case 'electric':
                this.ctx.beginPath();
                this.ctx.moveTo(x - (this.gridSize * 0.25), y - (this.gridSize * 0.4));
                this.ctx.lineTo(x + (this.gridSize * 0.15), y - (this.gridSize * 0.1));
                this.ctx.lineTo(x - (this.gridSize * 0.15), y + (this.gridSize * 0.1));
                this.ctx.lineTo(x + (this.gridSize * 0.25), y + (this.gridSize * 0.4));
                this.ctx.stroke();
                break;
            default:
                this.ctx.fillRect(x - (this.gridSize * 0.25), y - (this.gridSize * 0.25), this.gridSize * 0.5, this.gridSize * 0.5);
        }

        this.ctx.restore();
    }

    drawFloatingTexts() {
        this.ctx.save();
        this.ctx.font = `bold ${Math.max(12, this.gridSize * 0.8)}px var(--font-display)`;
        this.ctx.textAlign = 'center';
        this.floatingTexts.forEach(text => {
            this.ctx.globalAlpha = text.alpha;
            this.ctx.fillStyle = text.color;
            this.ctx.shadowBlur = this.gridSize / 2;
            this.ctx.shadowColor = text.color;
            this.ctx.fillText(text.text, text.x, text.y);
        });
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let i = 0; i <= this.tileCountX; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height / this.dpr);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.tileCountY; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width / this.dpr, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawFood() {
        const pulse = Math.sin(Date.now() / 150) * (this.gridSize * 0.1);
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;

        this.ctx.save();
        this.ctx.shadowBlur = this.gridSize + pulse * 2;
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
            this.ctx.shadowBlur = isHead ? this.gridSize * 1.25 : this.gridSize * 0.5 * ratio;
            this.ctx.shadowColor = isHead ? '#00f2ff' : '#7000ff';
            
            const grad = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
            grad.addColorStop(0, isHead ? '#00f2ff' : '#7000ff');
            grad.addColorStop(1, isHead ? '#7000ff' : '#300066');
            
            this.ctx.fillStyle = grad;
            
            const padding = this.gridSize * 0.1;
            const size = this.gridSize - padding * 2;
            this.drawRoundedRect(x + padding, y + padding, size, size, isHead ? this.gridSize * 0.3 : this.gridSize * 0.2);
            
            if (isHead) {
                // Eyes
                this.ctx.fillStyle = '#fff';
                const eyeSize = this.gridSize * 0.15;
                const eyeOffset = this.gridSize * 0.25;
                const eyePos = this.gridSize * 0.6;
                
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + eyePos, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyePos, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + this.gridSize - eyePos - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyePos - eyeSize, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === -1) {
                    this.ctx.fillRect(x + eyeOffset, y + this.gridSize - eyePos - eyeSize, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + this.gridSize - eyePos - eyeSize, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + eyeOffset, y + eyePos, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + eyePos, eyeSize, eyeSize);
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

    // --- HUD & Stats ---

    trackEaten(id, color) {
        if (!this.stats[id]) {
            this.stats[id] = 0;
            this.createInventoryItem(id, color);
        }
        this.stats[id]++;
        this.updateInventoryItem(id);
    }

    createInventoryItem(id, color) {
        if (!this.inventoryPanel) return;
        
        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.id = `inv-${id}`;
        
        // Use food color if not specified
        const iconColor = id === 'food' ? '#ff0055' : color;
        
        item.innerHTML = `
            <div class="item-icon" style="background: ${iconColor}; box-shadow: 0 0 10px ${iconColor}"></div>
            <span class="item-count">x1</span>
        `;
        
        this.inventoryPanel.appendChild(item);
        
        // Force reflow for animation
        item.offsetHeight;
        item.classList.add('visible');
    }

    updateInventoryItem(id) {
        const item = document.getElementById(`inv-${id}`);
        if (item) {
            const countEl = item.querySelector('.item-count');
            countEl.textContent = `x${this.stats[id]}`;
            
            // Pulse animation
            item.classList.remove('pulse');
            item.offsetHeight; // trigger reflow
            item.classList.add('pulse');
        }
    }

    clearInventory() {
        if (this.inventoryPanel) {
            this.inventoryPanel.innerHTML = '';
        }
    }

    updateScoreDisplay(reset = false) {
        if (reset) {
            this.displayScore = this.score;
            this.currentScoreEl.textContent = this.score.toString().padStart(3, '0');
            return;
        }

        // Animated score increment
        const start = this.displayScore;
        const end = this.score;
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.displayScore = Math.floor(start + (end - start) * easeProgress);
            
            this.currentScoreEl.textContent = this.displayScore.toString().padStart(3, '0');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
        
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
