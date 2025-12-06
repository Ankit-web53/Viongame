const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverTitle = document.getElementById('gameOverTitle');
const restartBtn = document.getElementById('restartBtn');

// Game State
let gameActive = false;
let score = 0;
let animationId;
let level = 1;
let shake = 0;

// Managers
const audioManager = new AudioManager();
const scoreManager = new ScoreManager('brick_breaker');
const particleSystem = new ParticleSystem(ctx);

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

// Paddle
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 20,
    w: 100,
    h: 10,
    speed: 8,
    dx: 0,
    color: '#00f0ff' // Neon Cyan
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    size: 8,
    speed: 4,
    dx: 4,
    dy: -4,
    color: '#fff'
};

// Bricks
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 60;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 25;

let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: getRowColor(r) };
        }
    }
}

function getRowColor(row) {
    const colors = ['#ff003c', '#ff8a00', '#ffff00', '#0aff0a', '#00f0ff'];
    return colors[row % colors.length];
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ball.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = paddle.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }
        }
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (
                    ball.x > b.x &&
                    ball.x < b.x + brickWidth &&
                    ball.y > b.y &&
                    ball.y < b.y + brickHeight
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score++;
                    scoreElement.textContent = score;
                    audioManager.playSound('collect');

                    // Particles
                    particleSystem.createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2, b.color, 10);
                    shake = 5;

                    // Check win
                    if (score % (brickRowCount * brickColumnCount) === 0) {
                        levelUp();
                    }
                }
            }
        }
    }
}

function levelUp() {
    level++;
    ball.speed += 1;
    resetBall();
    initBricks();
    audioManager.playSound('win');
    // Visual flair for level up
    particleSystem.createExplosion(canvas.width / 2, canvas.height / 2, '#fff', 50);
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -ball.speed;
    paddle.x = canvas.width / 2 - paddle.w / 2;
}

function update() {
    if (!gameActive) return;

    // Move Paddle
    paddle.x += paddle.dx;

    // Paddle Boundaries
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;

    // Move Ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall Collision
    if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
        ball.dx = -ball.dx;
        audioManager.playSound('hit');
        shake = 3;
    }
    if (ball.y - ball.size < 0) {
        ball.dy = -ball.dy;
        audioManager.playSound('hit');
        shake = 3;
    } else if (ball.y + ball.size > canvas.height) {
        // Game Over
        gameOver();
    }

    // Paddle Collision
    if (
        ball.y + ball.size > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.w
    ) {
        ball.dy = -ball.speed;
        // Add some angle based on where it hit the paddle
        const hitPoint = ball.x - (paddle.x + paddle.w / 2);
        ball.dx = hitPoint * 0.15;
        audioManager.playSound('jump');
        particleSystem.createExplosion(ball.x, ball.y, '#00f0ff', 5);
    }

    collisionDetection();
    particleSystem.update();

    // Decay shake
    if (shake > 0) shake *= 0.9;
    if (shake < 0.5) shake = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    drawBricks();
    drawBall();
    drawPaddle();
    particleSystem.draw();

    ctx.restore();

    // Level Info
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Level: ${level}`, 30, 30);
}

function loop() {
    if (!gameActive) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}

function startGame() {
    if (gameActive) return;
    gameActive = true;
    score = 0;
    level = 1;
    scoreElement.textContent = 0;
    gameOverScreen.classList.add('hidden');
    initBricks();
    resetBall();
    particleSystem.particles = [];
    loop();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    audioManager.playSound('lose');

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;
    gameOverTitle.textContent = "GAME OVER";

    gameOverScreen.classList.remove('hidden');
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddle.dx = -paddle.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ||
        e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'
    ) {
        paddle.dx = 0;
    }
});

// Mobile Controls
const mobileControls = new MobileControls({
    left: () => { paddle.dx = -paddle.speed; setTimeout(() => paddle.dx = 0, 200); },
    right: () => { paddle.dx = paddle.speed; setTimeout(() => paddle.dx = 0, 200); }
});

// Continuous touch
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); paddle.dx = -paddle.speed; });
    btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); paddle.dx = 0; });
}
if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); paddle.dx = paddle.speed; });
    btnRight.addEventListener('touchend', (e) => { e.preventDefault(); paddle.dx = 0; });
}

restartBtn.addEventListener('click', startGame);

// Initial Draw
initBricks();
draw();
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText("Press Start to Play", 220, 250);
canvas.addEventListener('click', () => {
    if (!gameActive && gameOverScreen.classList.contains('hidden')) startGame();
});
