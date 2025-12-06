const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreElement = document.getElementById('playerScore');
const aiScoreElement = document.getElementById('aiScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerText = document.getElementById('winnerText');
const finalScoreDisplay = document.getElementById('finalScoreDisplay');
const restartBtn = document.getElementById('restartBtn');

// Game State
let gameActive = false;
let playerScore = 0;
let aiScore = 0;
const winScore = 5;
let animationId;

// Managers
const audioManager = new AudioManager();

// Paddle Properties
const paddleWidth = 10;
const paddleHeight = 80;
const paddleSpeed = 6;

// Ball Properties
const ballSize = 10;
let ballSpeed = 5;

// Objects
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    score: 0,
    color: '#0aff0a', // Neon Green
    dy: 0
};

const ai = {
    x: canvas.width - 20,
    y: canvas.height / 2 - paddleHeight / 2,
    score: 0,
    color: '#ff003c', // Neon Red
    dy: 0,
    speed: 4.5 // Slightly slower than player
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: ballSpeed,
    dy: ballSpeed,
    speed: ballSpeed,
    color: '#fff'
};

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawNet() {
    ctx.fillStyle = '#333';
    for (let i = 0; i <= canvas.height; i += 20) {
        ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = ballSpeed;
    ball.dx = -ball.dx; // Serve to winner or alternate
    // Randomize slight angle
    ball.dy = (Math.random() * 2 - 1) * ballSpeed;
}

function update() {
    if (!gameActive) return;

    // Move Player
    player.y += player.dy;

    // Player Boundaries
    if (player.y < 0) player.y = 0;
    if (player.y + paddleHeight > canvas.height) player.y = canvas.height - paddleHeight;

    // AI Movement (Simple tracking)
    // Add some reaction delay or error margin for realism if needed, but simple tracking is fine for now
    const aiCenter = ai.y + paddleHeight / 2;
    if (aiCenter < ball.y - 10) {
        ai.y += ai.speed;
    } else if (aiCenter > ball.y + 10) {
        ai.y -= ai.speed;
    }

    // AI Boundaries
    if (ai.y < 0) ai.y = 0;
    if (ai.y + paddleHeight > canvas.height) ai.y = canvas.height - paddleHeight;

    // Move Ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall Collision (Top/Bottom)
    if (ball.y - ballSize < 0 || ball.y + ballSize > canvas.height) {
        ball.dy = -ball.dy;
        audioManager.playSound('hit');
    }

    // Paddle Collision
    let playerPaddle = (ball.x < canvas.width / 2) ? player : ai;

    if (collision(ball, playerPaddle)) {
        audioManager.playSound('jump'); // Using jump sound as paddle hit

        // Calculate impact point to change angle
        let collidePoint = (ball.y - (playerPaddle.y + paddleHeight / 2));
        collidePoint = collidePoint / (paddleHeight / 2);

        let angleRad = (Math.PI / 4) * collidePoint;

        let direction = (ball.x < canvas.width / 2) ? 1 : -1;

        ball.speed += 0.2; // Increase speed
        ball.dx = direction * ball.speed * Math.cos(angleRad);
        ball.dy = ball.speed * Math.sin(angleRad);
    }

    // Scoring
    if (ball.x - ballSize < 0) {
        // AI Scored
        aiScore++;
        aiScoreElement.textContent = aiScore;
        audioManager.playSound('lose');
        resetBall();
        checkWin();
    } else if (ball.x + ballSize > canvas.width) {
        // Player Scored
        playerScore++;
        playerScoreElement.textContent = playerScore;
        audioManager.playSound('collect');
        resetBall();
        checkWin();
    }
}

function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + paddleHeight;
    p.left = p.x;
    p.right = p.x + paddleWidth;

    b.top = b.y - ballSize;
    b.bottom = b.y + ballSize;
    b.left = b.x - ballSize;
    b.right = b.x + ballSize;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function checkWin() {
    if (playerScore >= winScore || aiScore >= winScore) {
        gameActive = false;
        cancelAnimationFrame(animationId);

        if (playerScore >= winScore) {
            winnerText.textContent = "YOU WIN!";
            winnerText.style.color = player.color;
            audioManager.playSound('win');
        } else {
            winnerText.textContent = "AI WINS!";
            winnerText.style.color = ai.color;
            audioManager.playSound('lose');
        }

        finalScoreDisplay.textContent = `${playerScore} - ${aiScore}`;
        gameOverScreen.classList.remove('hidden');
    }
}

function draw() {
    // Clear Canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNet();

    drawRect(player.x, player.y, paddleWidth, paddleHeight, player.color);
    drawRect(ai.x, ai.y, paddleWidth, paddleHeight, ai.color);

    drawCircle(ball.x, ball.y, ballSize, ball.color);
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
    playerScore = 0;
    aiScore = 0;
    playerScoreElement.textContent = 0;
    aiScoreElement.textContent = 0;

    player.y = canvas.height / 2 - paddleHeight / 2;
    ai.y = canvas.height / 2 - paddleHeight / 2;

    resetBall();
    gameOverScreen.classList.add('hidden');
    loop();
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        player.dy = -paddleSpeed;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        player.dy = paddleSpeed;
    }
});

document.addEventListener('keyup', (e) => {
    if (
        e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' ||
        e.key === 'ArrowDown' || e.key === 's' || e.key === 'S'
    ) {
        player.dy = 0;
    }
});

// Mobile Controls
const mobileControls = new MobileControls({
    up: () => { player.dy = -paddleSpeed; setTimeout(() => player.dy = 0, 200); }, // Short burst for tap
    down: () => { player.dy = paddleSpeed; setTimeout(() => player.dy = 0, 200); }
});

// Continuous touch for mobile buttons
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');

if (btnUp) {
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); player.dy = -paddleSpeed; });
    btnUp.addEventListener('touchend', (e) => { e.preventDefault(); player.dy = 0; });
}
if (btnDown) {
    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); player.dy = paddleSpeed; });
    btnDown.addEventListener('touchend', (e) => { e.preventDefault(); player.dy = 0; });
}

restartBtn.addEventListener('click', startGame);

// Initial Draw
draw();
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText("Press Start to Play", 220, 200);
canvas.addEventListener('click', () => {
    if (!gameActive && gameOverScreen.classList.contains('hidden')) startGame();
});
