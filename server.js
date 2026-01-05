const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ===== STATE (per gameCode) =====
const games = {}; // { gameCode: { current, history } }

// ===== HELPERS =====
function getGameDate(d){
  const r = new Date(d);
  r.setHours(5,30,0,0);
  if(d < r){
    const y = new Date(d);
    y.setDate(d.getDate()-1);
    return y;
  }
  return d;
}
function minuteIndexSince530(d){
  const g = getGameDate(d);
  const b = new Date(g);
  b.setHours(5,30,0,0);
  return Math.max(0, Math.floor((d - b) / 60000));
}
function fmt(d){
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
function calcPeriod(d, gameCode){
  const idx = minuteIndexSince530(d) + 1;
  return `${fmt(getGameDate(d))}10001${String(idx).padStart(4,'0')}`;
}

// ===== 80% MATCH ENGINE =====
function decideNumber(d, history){
  const seed = `${d.getHours()}${d.getMinutes()}`;
  const base = parseInt(seed.slice(-1),10);
  let n;
  if(Math.random() < 0.8){
    const pool = base >= 5 ? [5,6,7,8,9] : [0,1,2,3,4];
    n = pool[Math.floor(Math.random()*pool.length)];
  } else {
    n = Math.floor(Math.random()*10);
  }
  const last6 = history.slice(0,6).map(h=>h.n);
  if(last6.filter(x=>x===n).length>=2 && Math.random()<0.5){
    n = (n+1)%10;
  }
  if((n===0||n===5) && Math.random()>0.18){
    n = (n+2)%10;
  }
  return n;
}
function meta(n){
  if(n===0) return { bs:'SMALL', color:'RED+VIOLET' };
  if(n===5) return { bs:'BIG', color:'GREEN+VIOLET' };
  return {
    bs: n>=5 ? 'BIG' : 'SMALL',
    color: [1,3,7,9].includes(n) ? 'GREEN' : 'RED'
  };
}

// ===== CLOCK TICK (shared) =====
setInterval(()=>{
  const now = new Date();
  const sec = now.getSeconds();

  Object.keys(games).forEach(gameCode=>{
    const game = games[gameCode];
    const period = calcPeriod(now, gameCode);

    if(sec < 20){
      game.current = null;
    } else if(sec < 41){
      if(!game.current || game.current.period !== period){
        const n = decideNumber(now, game.history);
        game.current = { gameCode, period, n, ...meta(n) };
      }
    } else if(sec >= 59){
      if(game.current && (game.history.length===0 || game.history[0].period !== period)){
        game.history.unshift(game.current);
        game.history = game.history.slice(0,20);
      }
    }
  });
}, 1000);

// ===== API =====
app.get('/api/state', (req,res)=>{
  const gameCode = req.query.gameCode || 'WinGo_1M';
  if(!games[gameCode]){
    games[gameCode] = { current: null, history: [] };
  }
  const now = new Date();
  res.json({
    gameCode,
    period: calcPeriod(now, gameCode),
    upcoming: calcPeriod(new Date(now.getTime()+60000), gameCode),
    current: games[gameCode].current,
    history: games[gameCode].history
  });
});

// ===== STATIC =====
app.use(express.static(__dirname));
app.listen(PORT, ()=>console.log('Node server running on', PORT));
