const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

// Game State
let gameActive = false;
let frames = 0;
let score = 0;
let gameSpeed = 2;

// Managers
const audioManager = new AudioManager();
const scoreManager = new ScoreManager('flappy_bird');
const particleSystem = new ParticleSystem(ctx);

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

// Bird Object
const bird = {
    x: 50,
    y: 150,
    w: 20,
    h: 20,
    radius: 12,
    velocity: 0,
    gravity: 0.25,
    jumpStrength: 4.5,
    rotation: 0,

    draw: function () {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotate based on velocity
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#ffff00'; // Yellow bird base
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-5, 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    update: function () {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Add trail particles
        if (frames % 5 === 0) {
            particleSystem.createTrail(this.x - 10, this.y, 'rgba(255, 255, 0, 0.5)');
        }

        // Floor collision
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }

        // Ceiling collision
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },

    jump: function () {
        this.velocity = -this.jumpStrength;
        audioManager.playSound('jump');
        // Jump particles
        particleSystem.createExplosion(this.x, this.y + 10, '#fff', 5);
    },

    reset: function () {
        this.y = 150;
        this.velocity = 0;
        this.rotation = 0;
    }
};

// Pipes
const pipes = {
    position: [],
    w: 50,
    gap: 120,
    dx: 2,

    draw: function () {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;

            // Pipe Gradient
            const grad = ctx.createLinearGradient(p.x, 0, p.x + this.w, 0);
            grad.addColorStop(0, '#0aff0a');
            grad.addColorStop(0.5, '#ccffcc');
            grad.addColorStop(1, '#0aff0a');

            ctx.fillStyle = grad;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0aff0a';

            // Top Pipe
            ctx.fillRect(p.x, 0, this.w, topY);

            // Bottom Pipe
            ctx.fillRect(p.x, bottomY, this.w, canvas.height - bottomY);

            ctx.shadowBlur = 0;

            // Pipe Borders
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, this.w, topY);
            ctx.strokeRect(p.x, bottomY, this.w, canvas.height - bottomY);
        }
    },

    update: function () {
        // Add new pipe
        if (frames % 120 === 0) {
            this.position.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - this.gap - 100) + 50
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;

            // Collision Detection
            // Horizontal check
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w) {
                // Vertical check (hit top or bottom pipe)
                if (bird.y - bird.radius < p.y || bird.y + bird.radius > p.y + this.gap) {
                    gameOver();
                }
            }

            // Score update
            if (p.x + this.w < bird.x - bird.radius && !p.passed) {
                score++;
                scoreElement.textContent = score;
                p.passed = true;
                audioManager.playSound('collect');

                // Increase difficulty slightly
                if (score % 5 === 0) {
                    this.dx += 0.2;
                }
            }

            // Remove off-screen pipes
            if (p.x + this.w <= 0) {
                this.position.shift();
                i--;
            }
        }
    },

    reset: function () {
        this.position = [];
        this.dx = 2;
    }
};

// Background Stars
const stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
    });
}

function drawBackground() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        // Move stars for parallax
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
    });
}

// Game Loop
function loop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    bird.update();
    bird.draw();

    pipes.update();
    pipes.draw();

    particleSystem.update();
    particleSystem.draw();

    frames++;
    requestAnimationFrame(loop);
}

// Game Control Functions
function startGame() {
    if (gameActive) return;
    gameActive = true;
    score = 0;
    frames = 0;
    scoreElement.textContent = 0;
    bird.reset();
    pipes.reset();
    particleSystem.particles = [];
    gameOverScreen.classList.add('hidden');
    loop();
}

function gameOver() {
    gameActive = false;
    audioManager.playSound('hit');
    particleSystem.createExplosion(bird.x, bird.y, '#ffff00', 30);
    // Draw one last frame to show explosion
    particleSystem.update();
    particleSystem.draw();

    setTimeout(() => audioManager.playSound('lose'), 500);

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;

    gameOverScreen.classList.remove('hidden');
}

// Input Handling
function handleInput() {
    if (gameActive) {
        bird.jump();
    } else {
        // Only restart if game over screen is visible (simple check)
        if (!gameOverScreen.classList.contains('hidden')) {
            startGame();
        } else if (frames === 0 && score === 0) {
            // Start game on first click if not active and not game over
            startGame();
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleInput();
});

// Mobile Controls
const mobileControls = new MobileControls({
    action: handleInput, // Tap anywhere or specific button
    up: handleInput // Swipe up or tap
});

// Also bind touch to canvas for simple tapping
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
}, { passive: false });


restartBtn.addEventListener('click', startGame);

// Initial Draw
drawBackground();
bird.draw();
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText("Press Space or Tap to Start", 80, 300);
