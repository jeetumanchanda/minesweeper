const boardSize = 8;
const mineCount = 10;

let board = [];
let gameOver = false;
let timer = 0;
let timerInterval;
let flagMode = false;
let flagsUsed = 0;

const boardElement = document.getElementById('game-board');
const resetButton = document.getElementById('reset');
const timerElement = document.getElementById('timer');
const flagButton = document.getElementById('flag-btn');
const flagCountElement = document.getElementById('flag-count');

// Toggle flag mode
flagButton.addEventListener('click', () => {
  flagMode = !flagMode;
  flagButton.textContent = `Flag Mode: ${flagMode ? 'On' : 'Off'}`;
});

// Initialize the game
function init() {
  gameOver = false;
  timer = 0;
  timerElement.textContent = timer;
  clearInterval(timerInterval);
  boardElement.innerHTML = '';
  board = [];
  flagMode = false;
  flagButton.textContent = 'Flag Mode: Off';
  flagsUsed = 0;
  updateFlagCount();

  // Initialize board
  for (let i = 0; i < boardSize; i++) {
    board[i] = [];
    for (let j = 0; j < boardSize; j++) {
      board[i][j] = { mine: false, revealed: false, flagged: false, count: 0 };
    }
  }

  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const r = Math.floor(Math.random() * boardSize);
    const c = Math.floor(Math.random() * boardSize);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      minesPlaced++;
    }
  }

  // Calculate counts
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (!board[i][j].mine) {
        board[i][j].count = countAdjacentMines(i, j);
      }
    }
  }

  renderBoard();
}

function countAdjacentMines(x, y) {
  let count = 0;
  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      if (i >= 0 && i < boardSize && j >= 0 && j < boardSize && board[i][j].mine) {
        count++;
      }
    }
  }
  return count;
}

function renderBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 30px)`;
  boardElement.innerHTML = '';

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (board[i][j].revealed) cell.classList.add('revealed');
      if (board[i][j].flagged) cell.classList.add('flag');
      if (board[i][j].revealed && board[i][j].mine) cell.classList.add('mine');

      cell.addEventListener('click', () => {
        if (flagMode) {
          toggleFlag(i, j);
        } else {
          revealCell(i, j);
        }
      });

      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(i, j);
      });

      if (board[i][j].revealed && !board[i][j].mine && board[i][j].count > 0) {
        cell.textContent = board[i][j].count;
      }

      boardElement.appendChild(cell);
    }
  }
}

function revealCell(x, y) {
  if (gameOver || board[x][y].revealed || board[x][y].flagged) return;

  board[x][y].revealed = true;

  if (board[x][y].mine) {
    alert('Game Over!');
    gameOver = true;
    clearInterval(timerInterval);
    revealAllMines();
  } else if (board[x][y].count === 0) {
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        if (i >= 0 && i < boardSize && j >= 0 && j < boardSize) {
          revealCell(i, j);
        }
      }
    }
  }

  renderBoard();
  if (!gameOver) startTimer();
}

function toggleFlag(x, y) {
  if (gameOver || board[x][y].revealed) return;

  board[x][y].flagged = !board[x][y].flagged;
  updateFlagCount();
  renderBoard();
}

function updateFlagCount() {
  flagsUsed = 0;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j].flagged) flagsUsed++;
    }
  }
  flagCountElement.textContent = `Flags: ${flagsUsed} / ${mineCount}`;
}

function revealAllMines() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j].mine) board[i][j].revealed = true;
    }
  }
  renderBoard();
}

function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      timer++;
      timerElement.textContent = timer;
    }, 1000);
  }
}

resetButton.addEventListener('click', init);

init();
