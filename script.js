/* ══════════════════════════════════════════════════
   WORD POOLS
══════════════════════════════════════════════════ */
const WORDS = {
  easy: [
    'html','css','div','span','var','let','for','if','map','get',
    'put','set','tag','box','row','col','btn','nav','img','src',
    'alt','id','px','em','rem','rgb','url','svg','dom','api'
  ],
  normal: [
    'function','const','return','import','export','class','async','await',
    'object','array','string','number','boolean','typeof','console',
    'document','window','button','input','style','color','width',
    'height','margin','padding','border','display','flex','grid'
  ],
  hard: [
    'addEventListener','querySelector','getElementById','innerHTML',
    'appendChild','removeChild','setAttribute','getAttribute',
    'localStorage','sessionStorage','prototype','constructor',
    'asynchronous','destructuring','spreadOperator','templateLiteral',
    'requestAnimationFrame','MutationObserver','IntersectionObserver',
    'WebComponents','ServiceWorker'
  ]
};

const DIFF_CONFIG = {
  easy:   { speed: 60,  spawnRate: 2200, maxWords: 5,  time: 60, lives: 5,  baseScore: 10 },
  normal: { speed: 90,  spawnRate: 1600, maxWords: 7,  time: 60, lives: 3,  baseScore: 20 },
  hard:   { speed: 130, spawnRate: 1000, maxWords: 10, time: 60, lives: 2,  baseScore: 40 }
};

const COLORS = ['#7c6cf8','#4ecdc4','#ff6b6b','#ffd93d','#6bcb77','#a78bfa','#38bdf8'];

/* ══════════════════════════════════════════════════
   STAR BACKGROUND
══════════════════════════════════════════════════ */
function makeStars(containerId) {
  const c = document.getElementById(containerId);
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%; top:${Math.random()*100}%;
      --d:${(Math.random()*3+2).toFixed(1)}s;
      --delay:${(Math.random()*5).toFixed(1)}s;
      --op:${(Math.random()*0.6+0.3).toFixed(2)};
    `;
    c.appendChild(s);
  }
}
makeStars('stars');
makeStars('result-stars');

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let state = {
  diff: 'easy',
  running: false,
  paused: false,
  score: 0,
  combo: 1,
  lives: 3,
  timeLeft: 60,
  totalTyped: 0,
  correctTyped: 0,
  wordsCompleted: 0,
  startTime: null,
  words: [],     // {id, text, x, y, color, speed, el, textEl}
  spawnTimer: null,
  countdownTimer: null,
  animId: null,
  lastTime: null,
};

/* ══════════════════════════════════════════════════
   HIGH SCORE
══════════════════════════════════════════════════ */
function getHS(diff) { return parseInt(localStorage.getItem('codebeat_hs_'+diff)||'0'); }
function setHS(diff, s) { localStorage.setItem('codebeat_hs_'+diff, s); }
function updateHSDisplay() {
  const v = getHS(state.diff);
  document.getElementById('hs-val').textContent = v ? v.toLocaleString() : '—';
}

/* ══════════════════════════════════════════════════
   DIFFICULTY BUTTONS
══════════════════════════════════════════════════ */
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.diff = btn.dataset.diff;
    updateHSDisplay();
  });
});
updateHSDisplay();

/* ══════════════════════════════════════════════════
   CANVAS BACKGROUND (particles)
══════════════════════════════════════════════════ */
let bgCtx, bgW, bgH;
const particles = [];

function initCanvas() {
  const zone = document.getElementById('canvas-zone');
  const canvas = document.getElementById('bg-canvas');
  bgW = zone.clientWidth;
  bgH = zone.clientHeight;
  canvas.width = bgW;
  canvas.height = bgH;
  bgCtx = canvas.getContext('2d');
  particles.length = 0;
  for (let i = 0; i < 40; i++) spawnParticle(true);
}

function spawnParticle(initial) {
  particles.push({
    x: Math.random() * (bgW||800),
    y: initial ? Math.random() * (bgH||500) : -5,
    r: Math.random() * 1.5 + 0.3,
    speed: Math.random() * 0.4 + 0.1,
    opacity: Math.random() * 0.4 + 0.1,
    color: COLORS[Math.floor(Math.random()*COLORS.length)]
  });
}

function drawBg(timestamp) {
  if (!bgCtx) return;
  bgCtx.clearRect(0, 0, bgW, bgH);
  // scanlines
  for (let y = 0; y < bgH; y += 4) {
    bgCtx.fillStyle = 'rgba(0,0,0,0.15)';
    bgCtx.fillRect(0, y, bgW, 1);
  }
  // danger line
  const dangerY = bgH - 80;
  bgCtx.strokeStyle = 'rgba(255,107,107,0.2)';
  bgCtx.setLineDash([8,12]);
  bgCtx.lineWidth = 1;
  bgCtx.beginPath();
  bgCtx.moveTo(0, dangerY);
  bgCtx.lineTo(bgW, dangerY);
  bgCtx.stroke();
  bgCtx.setLineDash([]);
  bgCtx.fillStyle = 'rgba(255,107,107,0.15)';
  bgCtx.font = '11px JetBrains Mono';
  bgCtx.fillText('// DANGER ZONE', 12, dangerY - 6);
  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.speed;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fillStyle = p.color;
    bgCtx.globalAlpha = p.opacity;
    bgCtx.fill();
    bgCtx.globalAlpha = 1;
    if (p.y > bgH + 10) { particles.splice(i,1); spawnParticle(false); }
  }
}

/* ══════════════════════════════════════════════════
   WORD RENDERING (DOM-based)
══════════════════════════════════════════════════ */
function spawnWord() {
  if (!state.running || state.paused) return;
  const cfg = DIFF_CONFIG[state.diff];
  if (state.words.length >= cfg.maxWords) return;

  const pool = WORDS[state.diff];
  const text = pool[Math.floor(Math.random()*pool.length)];
  const color = COLORS[Math.floor(Math.random()*COLORS.length)];
  const zone = document.getElementById('canvas-zone');
  const zW = zone.clientWidth;

  const el = document.createElement('div');
  el.className = 'word-obj';
  const textEl = document.createElement('div');
  textEl.className = 'word-text';
  textEl.style.color = color;

  // Show typed prefix highlight
  textEl.innerHTML = `<span style="color:rgba(255,255,255,0.3)">${text}</span>`;
  el.appendChild(textEl);
  zone.appendChild(el);

  const w = {
    id: Date.now() + Math.random(),
    text,
    x: Math.random() * (zW - 150) + 20,
    y: -30,
    color,
    speed: cfg.speed,
    el,
    textEl,
    typed: ''
  };
  state.words.push(w);
  el.style.left = w.x + 'px';
  el.style.top = w.y + 'px';
}

function updateWordEl(w) {
  const matched = w.typed.length;
  const rest = w.text.slice(matched);
  const typed = w.text.slice(0, matched);
  w.textEl.innerHTML =
    `<span style="color:#fff">${typed}</span>` +
    `<span style="color:${w.color}; opacity:0.7">${rest}</span>`;
  const fontSize = state.diff === 'hard' ? 14 : state.diff === 'normal' ? 17 : 20;
  w.textEl.style.fontSize = fontSize + 'px';
}

function removeWord(w, success) {
  if (w.el.parentNode) w.el.parentNode.removeChild(w.el);
  state.words = state.words.filter(x => x.id !== w.id);
  if (!success) {
    loseLife(w.x, w.y);
  }
}

/* ══════════════════════════════════════════════════
   GAME LOOP
══════════════════════════════════════════════════ */
function gameLoop(timestamp) {
  if (!state.running) return;
  const dt = state.lastTime ? (timestamp - state.lastTime) / 1000 : 0;
  state.lastTime = timestamp;

  if (!state.paused) {
    drawBg(timestamp);
    const cfg = DIFF_CONFIG[state.diff];
    const zone = document.getElementById('canvas-zone');
    const dangerY = zone.clientHeight - 80;

    state.words.forEach(w => {
      w.y += w.speed * dt;
      w.el.style.top = w.y + 'px';
      // Color shift near danger
      if (w.y > dangerY) {
        w.el.style.opacity = '1';
        w.textEl.style.textShadow = `0 0 20px #ff6b6b, 0 0 40px #ff6b6b`;
      } else {
        w.textEl.style.textShadow = `0 0 12px ${w.color}`;
      }
    });

    // Check if word fell off
    const bottom = zone.clientHeight;
    const escaped = state.words.filter(w => w.y > bottom);
    escaped.forEach(w => removeWord(w, false));
  }

  state.animId = requestAnimationFrame(gameLoop);
}

/* ══════════════════════════════════════════════════
   LIVES & COMBO
══════════════════════════════════════════════════ */
function renderLives() {
  const cfg = DIFF_CONFIG[state.diff];
  const row = document.getElementById('lives-row');
  row.innerHTML = '';
  for (let i = 0; i < cfg.lives; i++) {
    const h = document.createElement('div');
    h.className = 'heart' + (i >= state.lives ? ' lost' : '');
    h.innerHTML = `<svg viewBox="0 0 24 24" fill="${i < state.lives ? '#ff6b6b' : '#333'}">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`;
    row.appendChild(h);
  }
}

function loseLife(x, y) {
  state.lives--;
  state.combo = 1;
  updateComboBar();
  renderLives();
  flashScreen('#ff6b6b');
  if (state.lives <= 0) endGame();
}

function flashScreen(color) {
  const zone = document.getElementById('canvas-zone');
  zone.style.background = color + '22';
  setTimeout(() => zone.style.background = '', 200);
}

/* ══════════════════════════════════════════════════
   INPUT HANDLING
══════════════════════════════════════════════════ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(freq, type='square', dur=0.07, vol=0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e){}
}

function playSuccess() {
  playSound(523, 'triangle', 0.1, 0.2);
  setTimeout(() => playSound(659, 'triangle', 0.1, 0.15), 60);
}
function playFail() { playSound(150, 'sawtooth', 0.2, 0.1); }
function playKey() { playSound(400 + Math.random()*200, 'square', 0.04, 0.05); }

const input = document.getElementById('type-input');

input.addEventListener('keydown', e => {
  if (e.key === 'Escape') { togglePause(); return; }
  if (!state.running || state.paused) return;
});

input.addEventListener('input', e => {
  if (!state.running || state.paused) return;
  const val = input.value;
  state.totalTyped++;
  playKey();

  // Find matching word (prefix match)
  const match = state.words.find(w => w.text.startsWith(val) && val.length > 0);

  if (match) {
    match.typed = val;
    updateWordEl(match);
    input.classList.remove('wrong');
    input.classList.add('correct');
    state.correctTyped++;
    updateAccDisplay();

    // Full match — word completed!
    if (val === match.text) {
      completeWord(match);
      input.value = '';
      input.classList.remove('correct');
    }
  } else if (val.length > 0) {
    input.classList.add('correct');
    input.classList.remove('wrong');
    // partial mismatch — check any exact match first then highlight wrong
    const exact = state.words.find(w => w.text === val);
    if (exact) {
      completeWord(exact);
      input.value = '';
      input.classList.remove('correct', 'wrong');
    } else {
      const anyMatch = state.words.find(w => w.text.startsWith(val));
      if (!anyMatch && val.length > 0) {
        input.classList.add('wrong');
        input.classList.remove('correct');
      }
    }
    // Reset typed highlights on all words
    state.words.forEach(w => {
      if (w !== match) { w.typed = ''; updateWordEl(w); }
    });
  } else {
    input.classList.remove('correct', 'wrong');
    state.words.forEach(w => { w.typed = ''; updateWordEl(w); });
  }
});

input.addEventListener('keypress', e => {
  if ((e.key === 'Enter' || e.key === ' ') && input.value.trim()) {
    e.preventDefault();
    const val = input.value.trim();
    const exact = state.words.find(w => w.text === val);
    if (exact) {
      completeWord(exact);
      input.value = '';
      input.classList.remove('correct','wrong');
    } else {
      input.classList.add('wrong');
      playFail();
      setTimeout(() => input.classList.remove('wrong'), 300);
    }
  }
});

function completeWord(w) {
  state.wordsCompleted++;
  state.combo = Math.min(state.combo + 1, 16);
  const cfg = DIFF_CONFIG[state.diff];
  const pts = cfg.baseScore * state.combo;
  state.score += pts;

  playSuccess();
  showEffect('+' + pts, w.x, w.y, w.color);
  if (state.combo >= 3) showEffect('x'+state.combo+' COMBO!', w.x, w.y - 30, '#ffd93d');

  updateComboBar();
  updateHUD();
  removeWord(w, true);
  flashScreen('#7c6cf8');
}

function showEffect(text, x, y, color) {
  const zone = document.getElementById('canvas-zone');
  const el = document.createElement('div');
  el.className = 'effect';
  el.style.cssText = `left:${x}px; top:${y}px; color:${color}; font-size:16px;`;
  el.textContent = text;
  zone.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ══════════════════════════════════════════════════
   HUD UPDATES
══════════════════════════════════════════════════ */
function updateHUD() {
  document.getElementById('hud-score').textContent = state.score.toLocaleString();
  document.getElementById('hud-combo').textContent = 'x' + state.combo;
  updateWPM();
  updateAccDisplay();
}

function updateWPM() {
  if (!state.startTime) return;
  const mins = (Date.now() - state.startTime) / 60000;
  const wpm = mins > 0 ? Math.round(state.wordsCompleted / mins) : 0;
  document.getElementById('hud-wpm').textContent = wpm;
}

function updateAccDisplay() {
  const acc = state.totalTyped > 0
    ? Math.round(state.correctTyped / state.totalTyped * 100)
    : 100;
  document.getElementById('hud-acc').textContent = acc + '%';
}

function updateComboBar() {
  const bar = document.getElementById('combo-glow');
  const ratio = (state.combo - 1) / 15;
  bar.style.transform = `scaleX(${ratio})`;
  const hue = 260 + ratio * 100;
  bar.style.background = `hsl(${hue}, 80%, 65%)`;
}

/* ══════════════════════════════════════════════════
   PAUSE
══════════════════════════════════════════════════ */
function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  const overlay = document.getElementById('pause-overlay');
  overlay.classList.toggle('show', state.paused);
  if (!state.paused) {
    state.lastTime = null;
    requestAnimationFrame(gameLoop);
  }
}

document.getElementById('pause-overlay').addEventListener('click', () => {
  if (state.paused) togglePause();
});

/* ══════════════════════════════════════════════════
   START / END / RESTART
══════════════════════════════════════════════════ */
document.getElementById('start-btn').addEventListener('click', startGame);

function startGame() {
  const cfg = DIFF_CONFIG[state.diff];
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.combo = 1;
  state.lives = cfg.lives;
  state.timeLeft = cfg.time;
  state.totalTyped = 0;
  state.correctTyped = 0;
  state.wordsCompleted = 0;
  state.words = [];
  state.startTime = Date.now();
  state.lastTime = null;

  showScreen('game');
  initCanvas();
  renderLives();
  updateHUD();
  updateComboBar();

  input.value = '';
  input.focus();

  // Spawn timer
  state.spawnTimer = setInterval(spawnWord, cfg.spawnRate);

  // Countdown
  document.getElementById('hud-time').textContent = state.timeLeft;
  state.countdownTimer = setInterval(() => {
    if (state.paused) return;
    state.timeLeft--;
    document.getElementById('hud-time').textContent = state.timeLeft;
    if (state.timeLeft <= 0) endGame(true);
  }, 1000);

  state.animId = requestAnimationFrame(gameLoop);
  spawnWord();
}

function endGame(timeUp = false) {
  state.running = false;
  clearInterval(state.spawnTimer);
  clearInterval(state.countdownTimer);
  cancelAnimationFrame(state.animId);

  // Clear remaining words
  state.words.forEach(w => { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); });
  state.words = [];

  const mins = (Date.now() - state.startTime) / 60000;
  const wpm = mins > 0 ? Math.round(state.wordsCompleted / mins) : 0;
  const acc = state.totalTyped > 0
    ? Math.round(state.correctTyped / state.totalTyped * 100)
    : 100;

  // High score
  const prev = getHS(state.diff);
  const isNew = state.score > prev;
  if (isNew) setHS(state.diff, state.score);

  document.getElementById('r-score').textContent = state.score.toLocaleString();
  document.getElementById('r-wpm').textContent = wpm;
  document.getElementById('r-acc').textContent = acc + '%';

  const title = document.getElementById('result-title');
  if (timeUp) {
    title.textContent = 'TIME UP!';
    title.className = 'result-title win';
  } else {
    title.textContent = 'GAME OVER';
    title.className = 'result-title lose';
  }

  const badge = document.getElementById('new-hs-badge');
  badge.classList.toggle('hidden', !isNew);

  const scoreEl = document.getElementById('r-score');
  scoreEl.className = isNew ? 'stat-num best' : 'stat-num';

  showScreen('result');
}

document.getElementById('retry-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  showScreen('start');
  updateHSDisplay();
});

/* ══════════════════════════════════════════════════
   SCREEN MANAGER
══════════════════════════════════════════════════ */
function showScreen(name) {
  ['start','game','result'].forEach(n => {
    document.getElementById(n+'-screen').classList.toggle('hidden', n !== name);
  });
}

window.addEventListener('resize', () => { if (state.running) initCanvas(); });