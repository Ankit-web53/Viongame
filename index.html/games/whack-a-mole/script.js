const holes = document.querySelectorAll('.hole');
const scoreElement = document.getElementById('score');
const timeLeftElement = document.getElementById('time-left');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('whack_a_mole');

// Game State
let lastHole;
let timeUp = false;
let score = 0;
let timeLeft = 30;
let timerInterval;
let gameActive = false;

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    const time = randomTime(400, 1000);
    const hole = randomHole(holes);
    hole.classList.add('up');

    // Reset hit state if any
    const mole = hole.querySelector('.mole');
    mole.classList.remove('hit');

    setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    if (gameActive) return;

    scoreElement.textContent = 0;
    timeLeftElement.textContent = 30;
    score = 0;
    timeLeft = 30;
    timeUp = false;
    gameActive = true;
    gameOverScreen.classList.add('hidden');

    peep();

    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp = true;
            gameOver();
        }
    }, 1000);
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!
    if (!this.parentNode.classList.contains('up')) return;
    if (this.classList.contains('hit')) return; // already hit

    score++;
    this.classList.add('hit');
    this.parentNode.classList.remove('up');
    scoreElement.textContent = score;
    audioManager.playSound('hit');
}

holes.forEach(hole => {
    const mole = hole.querySelector('.mole');
    mole.addEventListener('click', bonk);
    mole.addEventListener('touchstart', bonk); // Mobile support
});

function gameOver() {
    gameActive = false;
    audioManager.playSound('win'); // Or lose sound depending on perspective

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;

    gameOverScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', startGame);

// Start automatically or wait for user? Let's wait for click on start button or something, 
// but for consistency with other games, maybe auto start or overlay.
// We'll use the "Play Again" button logic for initial start too if we want, 
// but let's add a simple "Click to Start" overlay or just start.
// For now, let's just show the game over screen as a "Start Screen" initially? 
// Or just auto start. Let's auto start for simplicity as per other games.
startGame();
