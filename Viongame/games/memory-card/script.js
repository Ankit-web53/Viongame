const grid = document.getElementById('memoryGrid');
const movesElement = document.getElementById('moves');
const timeElement = document.getElementById('time');
const bestMovesElement = document.getElementById('best-moves');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalMovesElement = document.getElementById('finalMoves');
const finalTimeElement = document.getElementById('finalTime');
const restartBtn = document.getElementById('restartBtn');

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('memory_match'); // Using for high score (best moves) logic manually

// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval;
let gameActive = false;
let isLocked = false;

// Icons for cards (8 pairs)
const icons = [
    'fa-ghost', 'fa-dragon', 'fa-gamepad', 'fa-dice-d20',
    'fa-rocket', 'fa-robot', 'fa-skull', 'fa-bolt'
];

// Initialize Best Score (Low score is better for moves)
// We'll use localStorage directly for "best moves" since ScoreManager is designed for high scores
let bestMoves = localStorage.getItem('viongame_memory_best_moves');
if (bestMoves) {
    bestMovesElement.textContent = bestMoves;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    timeElement.textContent = "00:00";
    timerInterval = setInterval(() => {
        timer++;
        timeElement.textContent = formatTime(timer);
    }, 1000);
}

function createBoard() {
    grid.innerHTML = '';
    const cardIcons = [...icons, ...icons];
    shuffle(cardIcons);

    cardIcons.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        card.dataset.index = index;

        const front = document.createElement('div');
        front.classList.add('card-face', 'card-front');
        front.innerHTML = `<i class="fas ${icon}"></i>`;

        const back = document.createElement('div');
        back.classList.add('card-face', 'card-back');

        card.appendChild(front);
        card.appendChild(back);

        card.addEventListener('click', flipCard);
        grid.appendChild(card);
        cards.push(card);
    });
}

function flipCard() {
    if (!gameActive || isLocked) return;
    if (this === flippedCards[0]) return; // Don't flip same card twice

    this.classList.add('flipped');
    audioManager.playSound('click');

    if (flippedCards.length === 0) {
        flippedCards.push(this);
        return;
    }

    flippedCards.push(this);
    moves++;
    movesElement.textContent = moves;
    checkForMatch();
}

function checkForMatch() {
    isLocked = true;
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.icon === card2.dataset.icon;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    flippedCards.forEach(card => {
        card.classList.add('matched');
        // Clone to remove event listeners easily or just keep logic simple
    });

    audioManager.playSound('collect');
    matchedPairs++;
    flippedCards = [];
    isLocked = false;

    if (matchedPairs === icons.length) {
        endGame();
    }
}

function unflipCards() {
    setTimeout(() => {
        flippedCards.forEach(card => {
            card.classList.remove('flipped');
        });
        audioManager.playSound('hit'); // Using 'hit' as a "wrong" sound
        flippedCards = [];
        isLocked = false;
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    gameActive = false;
    audioManager.playSound('win');

    finalMovesElement.textContent = moves;
    finalTimeElement.textContent = formatTime(timer);

    // Check best moves
    if (!bestMoves || moves < parseInt(bestMoves)) {
        bestMoves = moves;
        localStorage.setItem('viongame_memory_best_moves', bestMoves);
        bestMovesElement.textContent = bestMoves;
    }

    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 500);
}

function startGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    movesElement.textContent = 0;
    gameActive = true;
    isLocked = false;
    gameOverScreen.classList.add('hidden');

    createBoard();
    startTimer();
}

restartBtn.addEventListener('click', startGame);

// Start game on load
startGame();
