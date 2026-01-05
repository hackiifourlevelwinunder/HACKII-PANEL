const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const GAME_CODE = 'WinGo_1M';
const STATE_FILE = path.join(__dirname, 'state.json');

// ================= STATE =================
let state = {
  lastPeriod: null,
  current: null,
  history: []
};

// ================= LOAD STATE =================
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    console.log('STATE LOADED');
  } catch (e) {
    console.log('STATE LOAD FAILED');
  }
}

// ================= SAVE STATE =================
function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ================= TIME HELPERS =================
function gameDate(d) {
  const reset = new Date(d);
  reset.setHours(5, 30, 0, 0);
  if (d < reset) {
    const y = new Date(d);
    y.setDate(d.getDate() - 1);
    return y;
  }
  return d;
}

function periodIndex(d) {
  const g = gameDate(d);
  const base = new Date(g);
  base.setHours(5, 30, 0, 0);
  return Math.floor((d - base) / 60000) + 1;
}

function buildPeriod(d) {
  const g = gameDate(d);
  const yyyy = g.getFullYear();
  const mm = String(g.getMonth() + 1).padStart(2, '0');
  const dd = String(g.getDate()).padStart(2, '0');
  const idx = String(periodIndex(d)).padStart(4, '0');
  return `${yyyy}${mm}${dd}10001${idx}`;
}

// ================= RESULT ENGINE =================
function decideNumber() {
  if (Math.random() < 0.8) {
    return Math.random() < 0.5
      ? [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)]
      : [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
  }
  return Math.floor(Math.random() * 10);
}

function meta(n) {
  if (n === 0) return { bs: 'SMALL', color: 'RED+VIOLET' };
  if (n === 5) return { bs: 'BIG', color: 'GREEN+VIOLET' };
  return {
    bs: n >= 5 ? 'BIG' : 'SMALL',
    color: [1, 3, 7, 9].includes(n) ? 'GREEN' : 'RED'
  };
}

// ================= MAIN ENGINE =================
setInterval(() => {
  const now = new Date();
  const sec = now.getSeconds();
  const period = buildPeriod(now);

  // new period
  if (period !== state.lastPeriod) {
    state.current = null;
    state.lastPeriod = period;
    saveState();
  }

  // decide number (20–40 sec)
  if (sec >= 20 && sec <= 40 && !state.current) {
    const n = decideNumber();
    state.current = { period, n, ...meta(n) };
    saveState();
  }

  // lock & history add (59 sec)
  if (sec === 59 && state.current) {
    if (state.history.length === 0 || state.history[0].period !== period) {
      state.history.unshift(state.current);
      state.history = state.history.slice(0, 50);
      saveState();
    }
  }
}, 1000);

// ================= API =================
app.get('/api/state', (req, res) => {
  res.json({
    game: GAME_CODE,
    period: buildPeriod(new Date()),
    current: state.current,
    history: state.history
  });
});

// ================= STATIC =================
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log('POWER OF PANEL RUNNING');
});
