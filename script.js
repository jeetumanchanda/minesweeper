const rows = 9;
const cols = 9;
const minesCount = 10;

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const flagBtn = document.getElementById("flag-btn");

let board = [];
let revealed = [];
let flagged = [];
let mines = [];
let flagMode = false;
let timer;
let seconds = 0;

function init() {
  board = Array(rows).fill().map(() => Array(cols).fill(0));
  revealed = Array(rows).fill().map(() => Array(cols).fill(false));
  flagged = Array(rows).fill().map(() => Array(cols).fill(false));
  mines = [];

  // place mines
  while (mines.length < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!mines.some(m => m[0] === r && m[1] === c)) {
      mines.push([r, c]);
      board[r][c] = -1;
    }
  }

  // calculate numbers
  mines.forEach(([r, c]) => {
    for (let dr=-1; dr<=1; dr++) {
      for (let dc=-1; dc<=1; dc++) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0 && nr<rows && nc>=0 && nc<cols && board[nr][nc] !== -1) {
          board[nr][nc]++;
        }
      }
    }
  });

  // reset UI
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, 32px)`;

  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.addEventListener("click", onTileClick);
      boardEl.appendChild(tile);
    }
  }

  mineCounterEl.textContent = minesCount.toString().padStart(3,"0");
  seconds = 0;
  timerEl.textContent = "000";
  clearInterval(timer);
  timer = setInterval(() => {
    seconds++;
    timerEl.textContent = seconds.toString().padStart(3,"0");
  }, 1000);
}

function onTileClick(e) {
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);

  if (flagMode) {
    flagged[r][c] = !flagged[r][c];
    e.target.textContent = flagged[r][c] ? "🚩" : "";
    updateMineCounter();
    return;
  }

  if (revealed[r][c] || flagged[r][c]) return;

  reveal(r,c);
}

function reveal(r,c) {
  if (r<0 || r>=rows || c<0 || c>=cols) return;
  if (revealed[r][c] || flagged[r][c]) return;

  const tile = getTile(r,c);
  revealed[r][c] = true;
  tile.classList.add("revealed");

  if (board[r][c] === -1) {
    tile.textContent = "💣";
    clearInterval(timer);
    return;
  }

  if (board[r][c] > 0) {
    tile.textContent = board[r][c];
  } else {
    for (let dr=-1; dr<=1; dr++) {
      for (let dc=-1; dc<=1; dc++) {
        reveal(r+dr,c+dc);
      }
    }
  }
}

function updateMineCounter() {
  const flagsPlaced = flagged.flat().filter(Boolean).length;
  mineCounterEl.textContent = (minesCount - flagsPlaced).toString().padStart(3,"0");
}

function getTile(r,c) {
  return boardEl.querySelector(`.tile[data-row='${r}'][data-col='${c}']`);
}

// flag mode toggle
flagBtn.addEventListener("click", () => {
  flagMode = !flagMode;
  flagBtn.classList.toggle("active", flagMode);
});

init();
