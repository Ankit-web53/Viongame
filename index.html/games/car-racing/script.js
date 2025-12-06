const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

// Game State
let gameActive = false;
let score = 0;
let speed = 5;
let roadOffset = 0;
let animationId;

// Managers
const audioManager = new AudioManager();
const scoreManager = new ScoreManager('car_racing');
const particleSystem = new ParticleSystem(ctx);
const levelManager = new LevelManager(5, 1, 10); // Start speed 5, +1 every 10 points

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

// Car Dimensions
const carWidth = 50;
const carHeight = 90;

// Player Car
const player = {
    x: canvas.width / 2 - carWidth / 2,
    y: canvas.height - carHeight - 20,
    speed: 5,

    draw: function () {
        // Car Body
        ctx.fillStyle = '#ff003c'; // Neon Red
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff003c';
        ctx.fillRect(this.x, this.y, carWidth, carHeight);

        // Racing Stripes
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x + 20, this.y, 10, carHeight);

        // Windshield
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 20, carWidth - 10, 15);

        // Rear Window
        ctx.fillRect(this.x + 5, this.y + 60, carWidth - 10, 10);

        // Headlights
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillRect(this.x + 2, this.y + 2, 8, 10);
        ctx.fillRect(this.x + carWidth - 10, this.y + 2, 8, 10);

        // Taillights
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(this.x + 2, this.y + carHeight - 5, 8, 5);
        ctx.fillRect(this.x + carWidth - 10, this.y + carHeight - 5, 8, 5);

        ctx.shadowBlur = 0;
    },

    moveLeft: function () {
        if (this.x > 20) { // Keep within road bounds
            this.x -= this.speed * 4; // Snappy movement
            particleSystem.createTrail(this.x + carWidth, this.y + carHeight, 'rgba(100, 100, 100, 0.5)');
        }
    },

    moveRight: function () {
        if (this.x < canvas.width - carWidth - 20) {
            this.x += this.speed * 4;
            particleSystem.createTrail(this.x, this.y + carHeight, 'rgba(100, 100, 100, 0.5)');
        }
    }
};

// Enemy Cars
let enemies = [];

function spawnEnemy() {
    const laneWidth = (canvas.width - 40) / 3; // 3 lanes roughly
    const lane = Math.floor(Math.random() * 3);
    const x = 20 + lane * laneWidth + (laneWidth - carWidth) / 2;

    enemies.push({
        x: x,
        y: -100,
        color: getRandomNeonColor()
    });
}

function getRandomNeonColor() {
    const colors = ['#00f0ff', '#b026ff', '#0aff0a', '#ffff00'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function drawRoad() {
    // Road Background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grass/Side borders
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);

    // Road Lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -roadOffset;

    // Lane dividers
    const laneWidth = (canvas.width - 40) / 3;

    ctx.beginPath();
    ctx.moveTo(20 + laneWidth, 0);
    ctx.lineTo(20 + laneWidth, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20 + laneWidth * 2, 0);
    ctx.lineTo(20 + laneWidth * 2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
}

function update() {
    if (!gameActive) return;

    // Update Speed based on Level
    speed = levelManager.getSpeed(score);

    // Scroll Road
    roadOffset += speed;
    if (roadOffset > 60) roadOffset = 0;

    // Spawn Enemies
    if (Math.random() < 0.02 + (score * 0.0005)) { // Increase spawn rate slightly with score
        // Ensure not too close to other enemies
        let canSpawn = true;
        for (let e of enemies) {
            if (e.y < 150) canSpawn = false;
        }
        if (canSpawn) spawnEnemy();
    }

    // Update Enemies
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        e.y += speed;

        // Collision Detection
        if (
            player.x < e.x + carWidth &&
            player.x + carWidth > e.x &&
            player.y < e.y + carHeight &&
            player.y + carHeight > e.y
        ) {
            gameOver();
        }

        // Score & Remove
        if (e.y > canvas.height) {
            enemies.splice(i, 1);
            i--;
            score++;
            scoreElement.textContent = score;
            audioManager.playSound('collect'); // Using collect sound for passing cars
        }
    }

    particleSystem.update();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();

    // Draw Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.fillRect(e.x, e.y, carWidth, carHeight);

        // Enemy Windshield
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(e.x + 5, e.y + carHeight - 35, carWidth - 10, 15);

        // Enemy Headlights
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + 2, e.y + carHeight - 5, 8, 5);
        ctx.fillRect(e.x + carWidth - 10, e.y + carHeight - 5, 8, 5);

        ctx.shadowBlur = 0;
    });

    player.draw();
    particleSystem.draw();

    // Draw Speed/Level info
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Level: ${levelManager.getLevel()}`, 30, 30);
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
    speed = 5;
    enemies = [];
    particleSystem.particles = [];
    scoreElement.textContent = 0;
    gameOverScreen.classList.add('hidden');
    loop();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    audioManager.playSound('crash');

    // Explosion at collision point
    particleSystem.createExplosion(player.x + carWidth / 2, player.y + carHeight / 2, '#ff003c', 50);
    particleSystem.update();
    particleSystem.draw();

    setTimeout(() => audioManager.playSound('lose'), 500);

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;

    gameOverScreen.classList.remove('hidden');
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.moveLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.moveRight();
    }
});

// Mobile Controls
const mobileControls = new MobileControls({
    left: () => { if (gameActive) player.moveLeft(); },
    right: () => { if (gameActive) player.moveRight(); }
});

restartBtn.addEventListener('click', startGame);

// Initial Draw
drawRoad();
player.draw();
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText("Press Start to Race", 110, 300);
// Auto start on click for simplicity if not active
canvas.addEventListener('click', () => {
    if (!gameActive && gameOverScreen.classList.contains('hidden')) startGame();
});
