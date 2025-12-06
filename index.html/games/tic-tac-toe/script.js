const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('statusMessage');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerText = document.getElementById('winnerText');
const restartBtn = document.getElementById('restartBtn');
const scoreElement = document.getElementById('score');

let board = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let currentPlayer = 'X'; // Human
const aiPlayer = 'O'; // AI
let score = 0;

const audioManager = new AudioManager();
const scoreManager = new ScoreManager('tictactoe');

scoreElement.innerText = scoreManager.getHighScore(); // Actually let's just show current session wins or something? Or just keep high score as total wins.
// Let's use score as total wins for this session.
score = 0;
scoreElement.innerText = score;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !gameActive || currentPlayer !== 'X') {
        return;
    }

    makeMove(clickedCellIndex, 'X');

    if (checkWin('X')) {
        endGame('You Win!');
        score++;
        scoreElement.innerText = score;
        audioManager.playSound('win');
        return;
    }

    if (checkDraw()) {
        endGame('Draw!');
        audioManager.playSound('lose'); // Draw sound
        return;
    }

    currentPlayer = aiPlayer;
    statusMessage.innerText = "AI Thinking...";
    setTimeout(makeAiMove, 500);
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].innerText = player;
    cells[index].classList.add(player.toLowerCase());
    audioManager.playSound('click');
}

function makeAiMove() {
    if (!gameActive) return;

    // Minimax or simple random for now? Prompt said "with AI". Let's do Minimax for unbeatable AI, or slightly dumb for fun.
    // Let's do a decent AI (win if can, block if must, else random).

    let bestMove = getBestMove();
    makeMove(bestMove, aiPlayer);

    if (checkWin(aiPlayer)) {
        endGame('AI Wins!');
        audioManager.playSound('lose');
        return;
    }

    if (checkDraw()) {
        endGame('Draw!');
        audioManager.playSound('lose');
        return;
    }

    currentPlayer = 'X';
    statusMessage.innerText = "Your Turn (X)";
}

function getBestMove() {
    // 1. Check if AI can win
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = aiPlayer;
            if (checkWin(aiPlayer)) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // 2. Check if Player can win (Block)
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'X';
            if (checkWin('X')) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // 3. Take center
    if (board[4] === '') return 4;

    // 4. Take random corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Take random side
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(i => board[i] === '');
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return -1; // Should not happen if checkDraw is correct
}

function checkWin(player) {
    return winningConditions.some(condition => {
        return condition.every(index => board[index] === player);
    });
}

function checkDraw() {
    return board.every(cell => cell !== '');
}

function endGame(message) {
    gameActive = false;
    winnerText.innerText = message;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    statusMessage.innerText = "Your Turn (X)";
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o');
    });
    gameOverScreen.classList.add('hidden');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);
