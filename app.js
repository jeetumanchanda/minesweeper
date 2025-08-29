document.addEventListener('DOMContentLoaded', () => {
  const boardEl = document.getElementById('game-board');
  const timerEl = document.getElementById('timer');
  const counterEl = document.getElementById('mine-counter');
  const flagBtn = document.getElementById('flag-btn');
  const hintBtn = document.getElementById('hint-btn');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const levelSelect = document.getElementById('level-select');
  const backBtn = document.getElementById('back-btn');
  const pauseBtn = document.getElementById('pause-btn');

  let rows, cols, mines, board, timer, time, flags, paused, firstClick;

  const levels = {
    beginner: {rows: 9, cols: 9, mines: 10},
    player: {rows: 16, cols: 16, mines: 40},
    pro: {rows: 16, cols: 30, mines: 99}
  };

  function init(level) {
    rows = levels[level].rows;
    cols = levels[level].cols;
    mines = levels[level].mines;
    flags = 0;
    time = 0;
    paused = false;
    firstClick = true;
    counterEl.textContent = String(mines).padStart(3, '0');
    timerEl.textContent = '000';
    boardEl.style.gridTemplateRows = `repeat(${rows}, 24px)`;
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 24px)`;
    boardEl.innerHTML = '';
    board = Array(rows).fill().map(()=>Array(cols).fill({revealed:false,mine:false,flag:false}));
    clearInterval(timer);
    overlay.classList.add('hidden');
    levelSelect.classList.add('hidden');
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      if(!paused) {
        time++;
        timerEl.textContent = String(time).padStart(3, '0');
      }
    }, 1000);
  }

  flagBtn.addEventListener('click', ()=> {
    flagBtn.classList.toggle('active');
  });

  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      init(e.target.dataset.level);
    });
  });

  backBtn.addEventListener('click', ()=> {
    levelSelect.classList.remove('hidden');
  });

  pauseBtn.addEventListener('click', ()=> {
    paused = !paused;
    overlay.classList.toggle('hidden', !paused);
    overlayText.textContent = paused ? 'Paused' : '';
    overlayBtn.textContent = paused ? 'Resume' : 'Play';
  });

  overlayBtn.addEventListener('click', ()=> {
    if(overlayText.textContent.startsWith('Time')) {
      levelSelect.classList.remove('hidden');
    } else {
      paused = false;
      overlay.classList.add('hidden');
    }
  });
});
