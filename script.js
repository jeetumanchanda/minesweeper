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
const flagButton = document.getElementById('flag-btn');
const flagCountElement = document.getElementById('flag-count');
const timerElement = document.getElementById('timer');

resetButton.addEventListener('click', init);
flagButton.addEventListener('click', () => {
  flagMode = !flagMode;
  flagButton.textContent = `Flag Mode: ${flagMode ? 'On' : 'Off'}`;
});

function init() {
  gameOver = false;
  timer = 0;
  timerElement.textContent = timer;
  clearInterval(timerInterval);

  flagsUsed = 0;
  flagMode = false;
  flagButton.textContent = 'Flag Mode: Off';
  updateFlagCount();

  boardElement.innerHTML = '';
  board = [];

  // Create board
  for (let r = 0; r < boardSize; r++) {
    board[r] = [];
    for (let c = 0; c < boardSize; c++) {
      board[r][c] = {mine: false, revealed: false, flagged: false, count: 0};
    }
  }

  // Place mines
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * boardSize);
    const c = Math.floor(Math.random() * boardSize);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  // Calculate adjacent mines
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (!board[r][c].mine) {
        board[r][c].count = countMines(r, c);
      }
    }
  }

  renderBoard();
}

function countMines(r, c) {
  let count = 0;
  for (let i = r-1; i <= r+1; i++) {
    for (let j = c-1; j <= c+1; j++) {
      if (i >= 0 && i < boardSize && j >= 0 && j < boardSize && board[i][j].mine) count++;
    }
  }
  return count;
}

function renderBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 40px)`;
  boardElement.innerHTML = '';

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      const cell = board[r][c];

      if (cell.revealed) cellEl.classList.add('revealed');
      if (cell.flagged) cellEl.classList.add('flag');
      if (cell.revealed && cell.mine) cellEl.classList.add('mine');

      if (cell.revealed && !cell.mine && cell.count > 0) cellEl.textContent = cell.count;

      cellEl.addEventListener('click', () => {
        if (gameOver) return;
        if (flagMode) toggleFlag(r,c); else reveal(r,c);
      });

      cellEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (gameOver) return;
        toggleFlag(r,c);
      });

      boardElement.appendChild(cellEl);
    }
  }
}

function reveal(r,c) {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  if (!timerInterval) startTimer();

  if (cell.mine) {
    gameOver = true;
    clearInterval(timerInterval);
    alert("Game Over!");
    revealAllMines();
    return;
  }

  if (cell.count === 0) {
    for (let i = r-1; i <= r+1; i++) {
      for (let j = c-1; j <= c+1; j++) {
        if (i >=0 && i < boardSize && j >=0 && j < boardSize) reveal(i,j);
      }
    }
  }

  renderBoard();
}

function toggleFlag(r,c) {
  const cell = board[r][c];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  updateFlagCount();
  renderBoard();
}

function updateFlagCount() {
  flagsUsed = 0;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c].flagged) flagsUsed++;
    }
  }
  flagCountElement.textContent = `Flags: ${flagsUsed} / ${mineCount}`;
}

function revealAllMines() {
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c].mine) board[r][c].revealed = true;
    }
  }
  renderBoard();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    timerElement.textContent = timer;
  }, 1000);
}

// Initialize the game
init();
