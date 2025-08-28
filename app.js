// Minesweeper - full implementation
const LEVELS = {
  beginner: {rows:9,cols:9,mines:10},
  intermediate: {rows:16,cols:16,mines:40},
  expert: {rows:16,cols:30,mines:99}
};

const boardEl = document.getElementById('board');
const minesCounterEl = document.getElementById('minesCounter');
const timerEl = document.getElementById('timer');
const pauseOverlay = document.getElementById('pauseOverlay');
const winOverlay = document.getElementById('winOverlay');
const winTime = document.getElementById('winTime');
const winMsg = document.getElementById('winMsg');
const levelOverlay = document.getElementById('levelOverlay');
const levelStartBtns = document.querySelectorAll('.level-start');
const levelBtnsDesktop = document.querySelectorAll('.level-btn');
const hintBtn = document.getElementById('hintBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const newGameBtn = document.getElementById('newGameBtn');
const flagToggle = document.getElementById('flagToggle');

let state = {
  level: 'beginner',
  rows:9, cols:9, mines:10,
  board: [],
  flags:0,
  revealedCount:0,
  running:false,
  timer:0,
  timerInterval:null,
  previousMinesPositions: null,
  flagMode:false,
  firstMove:true,
  paused:false
};

// Helper functions
function formatTime(s){ const m = Math.floor(s/60), sec = s%60; return `${m}:${String(sec).padStart(2,'0')}`; }
function updateTimerDisplay(){ timerEl.textContent = String(state.timer).padStart(3,'0'); }
function updateMinesDisplay(){ const remaining = Math.max(0, state.mines - state.flags); minesCounterEl.textContent = String(remaining).padStart(3,'0'); }

// Attach listeners
levelStartBtns.forEach(b=> b.addEventListener('click', ()=> { const lvl=b.dataset.level; selectLevel(lvl); levelOverlay.classList.add('hidden'); startNewGame(); }));
levelBtnsDesktop.forEach(b=> b.addEventListener('click', ()=> { levelBtnsDesktop.forEach(x=>x.classList.remove('active')); b.classList.add('active'); selectLevel(b.dataset.level); startNewGame(); }));
hintBtn.addEventListener('click', ()=> { if(!state.running || state.paused) return; showHint(); });
pauseBtn.addEventListener('click', ()=> { if(!state.running) return; pauseGame(); });
resumeBtn.addEventListener('click', ()=> resumeGame());
newGameBtn.addEventListener('click', ()=> { startNewGame(); winOverlay.classList.add('hidden'); });
flagToggle.addEventListener('click', ()=> { state.flagMode = !state.flagMode; flagToggle.style.opacity = state.flagMode ? '0.7' : '1'; });

document.addEventListener('contextmenu', e=> e.preventDefault()); // prevent default right-click menu

// level selection helper
function selectLevel(lvl){
  state.level = lvl;
  const cfg = LEVELS[lvl];
  state.rows = cfg.rows; state.cols = cfg.cols; state.mines = cfg.mines;
  // update desktop buttons active state
  levelBtnsDesktop.forEach(b=> b.classList.toggle('active', b.dataset.level === lvl));
}

// start a fresh game ensuring mine distribution differs from previous
function startNewGame(){
  stopTimer();
  state.board = [];
  state.flags = 0; state.revealedCount = 0; state.timer = 0; state.firstMove = true;
  state.running = true; state.paused = false;
  setupBoardInDOM();
  placeMinesAvoidPrevious();
  computeAdjacents();
  updateMinesDisplay();
  updateTimerDisplay();
  // show/hide overlays
  pauseOverlay.classList.add('hidden');
  winOverlay.classList.add('hidden');
  // start timer (starts immediately)
  startTimer();
}

// create grid DOM and state cells
function setupBoardInDOM(){
  boardEl.innerHTML='';
  boardEl.style.gridTemplateColumns = `repeat(${state.cols}, auto)`;
  for(let r=0;r<state.rows;r++){
    const row = [];
    for(let c=0;c<state.cols;c++){
      const cell = {r,c,isMine:false,adj:0,revealed:false,flagged:false,el:null};
      const div = document.createElement('div');
      div.className='cell';
      div.dataset.r = r; div.dataset.c = c;
      // pointer handlers
      div.addEventListener('pointerdown', onPointerDown);
      div.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); toggleFlag(cell); });
      // mobile long-press to flag
      let pressTimer=null;
      div.addEventListener('touchstart', ()=>{ pressTimer = setTimeout(()=>{ toggleFlag(cell); pressTimer=null; }, 650); });
      div.addEventListener('touchend', ()=>{ if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; } });
      cell.el = div;
      row.push(cell);
      boardEl.appendChild(div);
    }
    state.board.push(row);
  }
}

// place mines randomly, trying to avoid repeating previous exact layout
function placeMinesAvoidPrevious(maxAttempts=8){
  let attempt=0;
  let prev = state.previousMinesPositions || null;
  while(attempt < maxAttempts){
    // clear mines
    for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++) state.board[r][c].isMine=false;
    // place
    let placed=0;
    while(placed < state.mines){
      const rr = Math.floor(Math.random()*state.rows);
      const cc = Math.floor(Math.random()*state.cols);
      if(!state.board[rr][cc].isMine){
        state.board[rr][cc].isMine = true; placed++;
      }
    }
    // create set string
    const cur = new Set();
    for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++) if(state.board[r][c].isMine) cur.add(`${r},${c}`);
    const curStr = JSON.stringify(Array.from(cur).sort());
    if(prev === null || curStr !== prev) { state.previousMinesPositions = curStr; break; }
    attempt++;
  }
}

// compute adjacent mine counts
function computeAdjacents(){
  for(let r=0;r<state.rows;r++){
    for(let c=0;c<state.cols;c++){
      const cell = state.board[r][c];
      if(cell.isMine){ cell.adj=0; continue; }
      let cnt=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r+dr, nc=c+dc;
        if(nr>=0 && nr<state.rows && nc>=0 && nc<state.cols && state.board[nr][nc].isMine) cnt++;
      }
      cell.adj = cnt;
    }
  }
}

// pointer handler
function onPointerDown(e){
  const el = e.currentTarget;
  const r = parseInt(el.dataset.r), c = parseInt(el.dataset.c);
  const cell = state.board[r][c];
  if(state.paused || !state.running) return;
  // right click handled via contextmenu; left click as normal
  if(state.flagMode){ toggleFlag(cell); return; }
  reveal(cell);
}

// reveal cell (with flood fill)
function reveal(cell){
  if(cell.revealed || cell.flagged) return;
  // if first move, ensure the clicked cell is not a mine (move mine if necessary)
  if(state.firstMove){
    state.firstMove = false;
    if(cell.isMine){
      // move mine to a different random cell
      cell.isMine = false;
      let moved=false;
      for(let attempts=0; attempts<500 && !moved; attempts++){
        const rr = Math.floor(Math.random()*state.rows), cc = Math.floor(Math.random()*state.cols);
        if(!state.board[rr][cc].isMine && !(rr===cell.r && cc===cell.c)){
          state.board[rr][cc].isMine = true; moved=true;
        }
      }
      computeAdjacents();
    }
  }
  cell.revealed = true;
  cell.el.classList.add('revealed');
  state.revealedCount++;
  if(cell.isMine){
    // reveal all mines and lose
    cell.el.classList.add('mine');
    revealAllMines();
    gameOver(false);
    return;
  } else {
    if(cell.adj > 0){
      cell.el.textContent = cell.adj;
      cell.el.style.color = colorForNumber(cell.adj);
    } else {
      // reveal neighbors (flood fill)
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr = cell.r + dr, nc = cell.c + dc;
        if(nr>=0 && nr<state.rows && nc>=0 && nc<state.cols){
          const neighbor = state.board[nr][nc];
          if(!neighbor.revealed && !neighbor.flagged) reveal(neighbor);
        }
      }
    }
  }
  checkWin();
}

// color helper for numbers
function colorForNumber(n){
  switch(n){
    case 1: return '#0000cc';
    case 2: return '#007a00';
    case 3: return '#cc0000';
    case 4: return '#000080';
    case 5: return '#800000';
    case 6: return '#008080';
    case 7: return '#000000';
    case 8: return '#808080';
    default: return '#000';
  }
}

// toggle flag
function toggleFlag(cell){
  if(cell.revealed) return;
  cell.flagged = !cell.flagged;
  if(cell.flagged){
    cell.el.classList.add('flagged'); cell.el.textContent='🚩';
    state.flags++;
  } else {
    cell.el.classList.remove('flagged'); cell.el.textContent='';
    state.flags = Math.max(0, state.flags-1);
  }
  updateMinesDisplay();
  checkWin();
}

// reveal all mines
function revealAllMines(){
  for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++){
    const cell = state.board[r][c];
    if(cell.isMine){
      cell.revealed = true;
      cell.el.classList.add('revealed','mine');
      cell.el.textContent = '💣';
    }
  }
}

// check for win
function checkWin(){
  const total = state.rows * state.cols;
  if(state.revealedCount === total - state.mines){
    gameOver(true);
    return;
  }
  // additional win if all mines flagged correctly
  let allMinesFlagged = true;
  for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++){
    const cell = state.board[r][c];
    if(cell.isMine && !cell.flagged) allMinesFlagged = false;
  }
  if(allMinesFlagged && state.flags === state.mines){
    // reveal remaining safe tiles visually
    for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++){
      const cell = state.board[r][c];
      if(!cell.revealed && !cell.isMine){ reveal(cell); }
    }
    gameOver(true);
  }
}

// game over handler
function gameOver(won){
  state.running = false;
  stopTimer();
  if(won){
    winMsg.textContent = 'You solved it!';
  } else {
    winMsg.textContent = 'Boom! You hit a mine.';
  }
  winTime.textContent = `Time taken to solve ${formatTime(state.timer)}`;
  winOverlay.classList.remove('hidden');
}

// timer control
function startTimer(){ stopTimer(); state.timerInterval = setInterval(()=>{ state.timer++; updateTimerDisplay(); }, 1000); }
function stopTimer(){ if(state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

// pause/resume
function pauseGame(){
  if(!state.running) return;
  state.paused = true;
  stopTimer();
  pauseOverlay.classList.remove('hidden');
  // block interactions by setting pointer-events none on board
  boardEl.setAttribute('aria-hidden','true');
}
function resumeGame(){
  if(!state.running) return;
  state.paused = false;
  startTimer();
  pauseOverlay.classList.add('hidden');
  boardEl.setAttribute('aria-hidden','false');
}

// hint: highlight one covered mine (not flagged)
function showHint(){
  for(let r=0;r<state.rows;r++) for(let c=0;c<state.cols;c++){
    const cell = state.board[r][c];
    if(cell.isMine && !cell.revealed && !cell.flagged){
      cell.el.classList.add('hint');
      setTimeout(()=> cell.el.classList.remove('hint'), 1400);
      return;
    }
  }
}

// initial default start: show level overlay on load
(function init(){
  // default level 'beginner'
  selectLevel('beginner');
  // show level overlay (user picks)
  levelOverlay.classList.remove('hidden');
  // For accessibility, ensure timer and mines display reset
  updateTimerDisplay(); updateMinesDisplay();
})();
