const params = new URLSearchParams(window.location.search);
const gameCode = params.get('gameCode') || 'WinGo_1M';

async function tick(){
  const r = await fetch(`/api/state?gameCode=${gameCode}`);
  const d = await r.json();
  info.innerText = `Game: ${d.gameCode} | Period: ${d.period}`;
  result.innerText = d.current ? d.current.n : '?';
  bs.innerText = d.current ? d.current.bs : '';
  color.innerText = d.current ? d.current.color : '';
  history.innerHTML='';
  d.history.forEach(x=>{
    const div=document.createElement('div');
    div.innerText = x.period.slice(-4)+' : '+x.n;
    history.appendChild(div);
  });
}
setInterval(tick,1000);
tick();
