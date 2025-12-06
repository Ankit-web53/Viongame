const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverTitle = document.getElementById('gameOverTitle');
const restartBtn = document.getElementById('restartBtn');

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('2048');

// Game State
let grid = [];
let score = 0;
let gameActive = false;
const size = 4;

// Initialize High Score
highScoreElement.textContent = scoreManager.getHighScore();

function initGame() {
    grid = Array(size).fill().map(() => Array(size).fill(0));
    score = 0;
    scoreElement.textContent = 0;
    gameActive = true;
    gameOverScreen.classList.add('hidden');

    // Clear board
    gameBoard.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.classList.add('tile'); // Placeholder for grid background
        cell.style.background = 'rgba(255,255,255,0.05)';
        cell.style.boxShadow = 'none';
        gameBoard.appendChild(cell);
    }

    addNewTile();
    addNewTile();
    updateBoard();
}

function addNewTile() {
    const emptyCells = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) emptyCells.push({ r, c });
        }
    }

    if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function updateBoard() {
    gameBoard.innerHTML = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const val = grid[r][c];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (val > 0) {
                tile.textContent = val;
                tile.setAttribute('data-val', val);
                tile.classList.add('tile-new');
            } else {
                tile.style.background = 'rgba(255,255,255,0.05)';
                tile.style.boxShadow = 'none';
            }
            gameBoard.appendChild(tile);
        }
    }
    scoreElement.textContent = score;
}

function slide(row) {
    let arr = row.filter(val => val);
    let missing = size - arr.length;
    let zeros = Array(missing).fill(0);
    return arr.concat(zeros);
}

function combine(row) {
    for (let i = 0; i < size - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            row[i + 1] = 0;
            score += row[i];
            audioManager.playSound('collect'); // Merge sound
            if (row[i] === 2048) {
                // Win condition (optional, usually continue)
                audioManager.playSound('win');
            }
        }
    }
    return row;
}

function move(direction) {
    if (!gameActive) return;

    let moved = false;
    let oldGrid = JSON.stringify(grid);

    if (direction === 'ArrowLeft' || direction === 'Left') {
        for (let r = 0; r < size; r++) {
            let row = grid[r];
            row = slide(row);
            row = combine(row);
            row = slide(row);
            grid[r] = row;
        }
    } else if (direction === 'ArrowRight' || direction === 'Right') {
        for (let r = 0; r < size; r++) {
            let row = grid[r];
            row.reverse();
            row = slide(row);
            row = combine(row);
            row = slide(row);
            row.reverse();
            grid[r] = row;
        }
    } else if (direction === 'ArrowUp' || direction === 'Up') {
        for (let c = 0; c < size; c++) {
            let row = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            row = slide(row);
            row = combine(row);
            row = slide(row);
            for (let r = 0; r < size; r++) {
                grid[r][c] = row[r];
            }
        }
    } else if (direction === 'ArrowDown' || direction === 'Down') {
        for (let c = 0; c < size; c++) {
            let row = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            row.reverse();
            row = slide(row);
            row = combine(row);
            row = slide(row);
            row.reverse();
            for (let r = 0; r < size; r++) {
                grid[r][c] = row[r];
            }
        }
    }

    if (JSON.stringify(grid) !== oldGrid) {
        addNewTile();
        updateBoard();
        checkGameOver();
    }
}

function checkGameOver() {
    // Check for 2048 win (optional stop)
    // Check for moves left
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) return;
            if (c < size - 1 && grid[r][c] === grid[r][c + 1]) return;
            if (r < size - 1 && grid[r][c] === grid[r + 1][c]) return;
        }
    }

    gameOver();
}

function gameOver() {
    gameActive = false;
    audioManager.playSound('lose');

    const results = scoreManager.updateScore(score);
    highScoreElement.textContent = results.highScore;
    finalScoreElement.textContent = score;
    gameOverTitle.textContent = "GAME OVER";

    gameOverScreen.classList.remove('hidden');
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        move(e.key);
    }
});

// Mobile Controls
const mobileControls = new MobileControls({
    up: () => move('Up'),
    down: () => move('Down'),
    left: () => move('Left'),
    right: () => move('Right')
});

restartBtn.addEventListener('click', initGame);

// Start game
initGame();
