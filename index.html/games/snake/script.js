const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snake = [];
let food = { x: 15, y: 15 };
let velocity = { x: 0, y: 0 };
let gameLoop;
let isGameOver = false;

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('snake');
const mobileControls = new MobileControls({
    up: () => { if (velocity.y === 0) { velocity = { x: 0, y: -1 }; } },
    down: () => { if (velocity.y === 0) { velocity = { x: 0, y: 1 }; } },
    left: () => { if (velocity.x === 0) { velocity = { x: -1, y: 0 }; } },
    right: () => { if (velocity.x === 0) { velocity = { x: 1, y: 0 }; } }
});

function initGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    velocity = { x: 0, y: 0 };
    score = 0;
    isGameOver = false;
    scoreElement.innerText = score;
    highScoreElement.innerText = scoreManager.getHighScore();
    gameOverScreen.classList.add('hidden');

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
}

function update() {
    if (isGameOver) return;

    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            // Don't die on start if not moving
            if (velocity.x !== 0 || velocity.y !== 0) {
                gameOver();
                return;
            }
        }
    }

    snake.unshift(head);

    // Eat Food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.innerText = score;
        audioManager.playSound('collect');
        placeFood();
    } else {
        // Only remove tail if we didn't eat (unless we haven't started moving yet)
        if (velocity.x !== 0 || velocity.y !== 0) {
            snake.pop();
        } else {
            // If not moving, keep snake size 1 but unshift added one, so pop one to stay same
            snake.pop();
        }
    }

    draw();
}

function draw() {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Snake
    ctx.fillStyle = '#0aff0a';
    for (let i = 0; i < snake.length; i++) {
        // Head is slightly different color
        ctx.fillStyle = i === 0 ? '#ccffcc' : '#0aff0a';
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
    }

    // Draw Food
    ctx.fillStyle = '#ff003c';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Check if food spawned on snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            placeFood();
            break;
        }
    }
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    audioManager.playSound('lose');
    const result = scoreManager.updateScore(score);
    highScoreElement.innerText = result.highScore;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            if (velocity.y === 0) velocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (velocity.y === 0) velocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (velocity.x === 0) velocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (velocity.x === 0) velocity = { x: 1, y: 0 };
            break;
    }
});

restartBtn.addEventListener('click', initGame);

// Start game
initGame();
