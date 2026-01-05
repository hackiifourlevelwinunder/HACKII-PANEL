const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

/*
 FINAL PERIOD FORMAT (LOCKED):
 YYYYMMDD10001XXXX

 RULES:
 - Game reset: 5:30 AM
 - 5:30 AM = 0001
 - Every minute +1
 - 7:59 PM example → 0870
*/

const GAME_CODE = 'WinGo_1M';

let current = null;
let history = [];
let lastPeriod = null;

// ===== GAME DATE (5:30 AM RESET) =====
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

// ===== PERIOD INDEX (+1 LOGIC) =====
function periodIndex(d) {
  const g = gameDate(d);
  const base = new Date(g);
  base.setHours(5, 30, 0, 0);
  return Math.floor((d - base) / 60000) + 1;
}

// ===== BUILD PERIOD (FINAL FIX) =====
function buildPeriod(d) {
  const g = gameDate(d);
  const yyyy = g.getFullYear();
  const mm = String(g.getMonth() + 1).padStart(2, '0');
  const dd = String(g.getDate()).padStart(2, '0');
  const idx = String(periodIndex(d)).padStart(4, '0');
  return `${yyyy}${mm}${dd}10001${idx}`;
}

// ===== 80% MATCH ENGINE =====
function decideNumber() {
  let n;
  if (Math.random() < 0.8) {
    n = Math.random() < 0.5
      ? [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)]
      : [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
  } else {
    n = Math.floor(Math.random() * 10);
  }
  return n;
}

// ===== META =====
function meta(n) {
  if (n === 0) return { bs: 'SMALL', color: 'RED+VIOLET' };
  if (n === 5) return { bs: 'BIG', color: 'GREEN+VIOLET' };
  return {
    bs: n >= 5 ? 'BIG' : 'SMALL',
    color: [1, 3, 7, 9].includes(n) ? 'GREEN' : 'RED'
  };
}

// ===== MAIN CLOCK ENGINE =====
setInterval(() => {
  const now = new Date();
  const sec = now.getSeconds();
  const period = buildPeriod(now);

  // New period → reset current
  if (period !== lastPeriod) {
    current = null;
    lastPeriod = period;
  }

  // 20–40 sec → decide number
  if (sec >= 20 && sec <= 40) {
    if (!current) {
      const n = decideNumber();
      current = { period, n, ...meta(n) };
    }
  }

  // 59 sec → FINAL LOCK + HISTORY ADD
  if (sec === 59 && current) {
    if (history.length === 0 || history[0].period !== period) {
      history.unshift(current);
      history = history.slice(0, 50);
    }
  }
}, 1000);

// ===== API =====
app.get('/api/state', (req, res) => {
  const now = new Date();
  res.json({
    game: GAME_CODE,
    period: buildPeriod(now),
    current,
    history
  });
});

// ===== STATIC UI =====
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log('POWER OF PANEL SERVER RUNNING', PORT);
});
