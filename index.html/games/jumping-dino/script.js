const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('jumping_dino');
const particleSystem = new ParticleSystem(ctx);
const levelManager = new LevelManager(5, 0.5, 5); // Start speed 5, +0.5 every 5 points

// Game State
let gameActive = false;
let score = 0;
let gameSpeed = 5;
let animationId;
let frames = 0;

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

// Dino
const dino = {
    x: 50,
    y: 200,
    w: 40,
    h: 60,
    dy: 0,
    jumpForce: 12,
    originalGravity: 0.6,
    gravity: 0.6,
    grounded: false,
    color: '#0aff0a', // Neon Green

    draw: function () {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Eye
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x + 25, this.y + 10, 5, 5);

        // Mouth (simple)
        ctx.fillRect(this.x + 25, this.y + 30, 10, 5);
    },

    jump: function () {
        if (this.grounded) {
            this.dy = -this.jumpForce;
            this.grounded = false;
            audioManager.playSound('jump');
            // Jump dust
            particleSystem.createExplosion(this.x + this.w / 2, this.y + this.h, '#fff', 5);
        }
    },

    update: function () {
        // Apply gravity
        if (this.y < canvas.height - this.h - 20) {
            this.dy += this.gravity;
            this.grounded = false;
        } else {
            this.dy = 0;
            this.grounded = true;
            this.y = canvas.height - this.h - 20;

            // Running dust
            if (gameActive && frames % 10 === 0) {
                particleSystem.createTrail(this.x, this.y + this.h, 'rgba(255, 255, 255, 0.3)');
            }
        }

        this.y += this.dy;
    }
};

// Obstacles
let obstacles = [];

function spawnObstacle() {
    const size = Math.random() * 30 + 30;
    const type = Math.random() > 0.5 ? 'cactus' : 'block';

    obstacles.push({
        x: canvas.width,
        y: canvas.height - size - 20,
        w: type === 'cactus' ? 20 : size,
        h: size,
        color: '#ff003c', // Neon Red
        type: type
    });
}

function updateObstacles() {
    // Spawn logic
    if (frames % Math.floor(Math.random() * 50 + 100) === 0) {
        spawnObstacle();
    }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Draw
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obs.color;

        if (obs.type === 'cactus') {
            // Simple cactus shape
            ctx.fillRect(obs.x + 5, obs.y, 10, obs.h);
            ctx.fillRect(obs.x, obs.y + 10, 20, 10);
            ctx.fillRect(obs.x, obs.y + 10, 5, obs.h - 20);
            ctx.fillRect(obs.x + 15, obs.y + 10, 5, obs.h - 25);
        } else {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
        ctx.shadowBlur = 0;

        // Collision
        if (
            dino.x < obs.x + obs.w &&
            dino.x + dino.w > obs.x &&
            dino.y < obs.y + obs.h &&
            dino.y + dino.h > obs.y
        ) {
            gameOver();
        }

        // Remove off-screen
        if (obs.x + obs.w < 0) {
            obstacles.splice(i, 1);
            i--;
            score++;
            scoreElement.textContent = score;
            audioManager.playSound('collect');
        }
    }
}

function drawGround() {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Speed
    gameSpeed = levelManager.getSpeed(score);

    drawGround();
    dino.update();
    dino.draw();
    updateObstacles();

    particleSystem.update();
    particleSystem.draw();

    frames++;
    animationId = requestAnimationFrame(update);
}

function startGame() {
    if (gameActive) return;
    gameActive = true;
    score = 0;
    gameSpeed = 5;
    frames = 0;
    obstacles = [];
    particleSystem.particles = [];
    scoreElement.textContent = 0;
    dino.y = canvas.height - dino.h - 20;
    dino.dy = 0;
    gameOverScreen.classList.add('hidden');
    update();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    audioManager.playSound('crash');

    // Explosion
    particleSystem.createExplosion(dino.x + dino.w / 2, dino.y + dino.h / 2, '#0aff0a', 30);
    particleSystem.update();
    particleSystem.draw();

    setTimeout(() => audioManager.playSound('lose'), 500);

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;

    gameOverScreen.classList.remove('hidden');
}

// Input Handling
function handleJump() {
    if (gameActive) {
        dino.jump();
    } else if (!gameOverScreen.classList.contains('hidden')) {
        startGame();
    } else if (frames === 0 && score === 0) {
        startGame();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
    }
});

// Mobile Controls
const btnJump = document.getElementById('btn-jump');
if (btnJump) {
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); handleJump(); });
}

// Tap anywhere on canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleJump();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleJump();
});

restartBtn.addEventListener('click', startGame);

// Initial Draw
drawGround();
dino.draw();
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText("Press Space or Tap to Jump", 280, 150);
