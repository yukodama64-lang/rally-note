const $ = (id) => document.getElementById(id);
const defaults = () => ({ meta:{date:new Date().toISOString().slice(0,10), opponent:'', venue:'', player:'自分'}, games:[], current:{me:0, opponent:0, events:[]}, matchOver:false });
let state = JSON.parse(localStorage.getItem('rallyNoteState') || 'null') || defaults();
const reasonLabels={opponentError:'相手のミス',myAce:'自分のエース',myError:'自分のミス',opponentAce:'相手のエース'};
function save(){localStorage.setItem('rallyNoteState',JSON.stringify(state));}
function wins(side){return state.games.filter(g=>g.winner===side).length;}
function total(side){return [...state.games.flatMap(g=>g.events),...state.current.events].filter(e=>e.side===side).length;}
function count(reason){return [...state.games.flatMap(g=>g.events),...state.current.events].filter(e=>e.reason===reason).length;}
function isGameWon(a,b){return (a>=15 && a-b>=2) || a===21;}
function render(){
  $('matchDate').value=state.meta.date;$('opponentName').value=state.meta.opponent;$('venue').value=state.meta.venue;$('playerName').value=state.meta.player;
  $('opponentDisplay').textContent=state.meta.opponent||'対戦相手';$('myScore').textContent=state.current.me;$('opScore').textContent=state.current.opponent;
  $('myGames').textContent=`GAME ${wins('me')}`;$('opGames').textContent=`GAME ${wins('opponent')}`;$('gameLabel').textContent=`GAME ${state.games.length+1}`;
  $('gameDots').innerHTML=[0,1].map(i=>`<i class="${i<state.games.length?'done':''}"></i>`).join(''); $('undoButton').disabled=!state.current.events.length||state.matchOver;
  const mt=total('me'),ot=total('opponent'),all=mt+ot;$('myTotal').textContent=mt;$('opTotal').textContent=ot;$('opponentErrorCount').textContent=count('opponentError');$('myAceCount').textContent=count('myAce');$('myErrorCount').textContent=count('myError');$('opponentAceCount').textContent=count('opponentAce');
  $('pointRate').textContent=all?`${Math.round(mt/all*100)}%`:'—';
  $('gameHistory').innerHTML=state.games.length?state.games.map((g,i)=>`<div class="history-item">G${i+1} <b>${g.me} - ${g.opponent}</b> ${g.winner==='me'?'WIN':'LOSE'}</div>`).join(''):'<p>まだ完了したゲームはありません。</p>';
  const banner=$('resultBanner'), status=$('matchState');
  if(state.matchOver){const won=wins('me')===2;banner.innerHTML=`<span>RESULT</span><strong>${won?'勝利':'敗北'}</strong><p>${wins('me')} - ${wins('opponent')} で試合終了</p>`;status.textContent='試合終了';}
  else {banner.innerHTML='<span>RESULT</span><strong>記録中</strong><p>2ゲーム先取で試合終了</p>';status.textContent=`GAME ${state.games.length+1} を記録中`;}
  $('insight').textContent=!all?'記録を始めると、ここに分析が表示されます。':mt>=ot?`得点率は ${Math.round(mt/all*100)}%。${count('myAce')>=count('opponentError')?'エースで主導権を取れています。':'相手のミスを確実に得点へつなげています。'}`:`得点率は ${Math.round(mt/all*100)}%。${count('myError')>count('opponentAce')?'自分のミスを抑えることが、最初の改善点です。':'相手のエースへの対応を見直しましょう。'}`;
}
function updateMeta(){state.meta={date:$('matchDate').value,opponent:$('opponentName').value,venue:$('venue').value,player:$('playerName').value||'自分'};save();render();}
['matchDate','opponentName','venue','playerName'].forEach(id=>$(id).addEventListener('change',updateMeta));
document.querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click',()=>{
  if(state.matchOver)return;const side=b.dataset.side,reason=b.dataset.reason;state.current[side]++;state.current.events.push({side,reason});
  const a=state.current.me,o=state.current.opponent;if(isGameWon(a,o)||isGameWon(o,a)){const winner=isGameWon(a,o)?'me':'opponent';state.games.push({...state.current,winner});state.current={me:0,opponent:0,events:[]};if(wins(winner)===2)state.matchOver=true;showDialog(winner,a,o);}save();render();
}));
$('undoButton').addEventListener('click',()=>{const last=state.current.events.pop();if(last)state.current[last.side]--;save();render();});
$('newMatchButton').addEventListener('click',()=>{if(confirm('現在の記録を消去して、新しい試合を始めますか？')){state=defaults();save();render();}});
function showDialog(winner,me,op){$('dialogKicker').textContent=state.matchOver?'MATCH FINISHED':'GAME FINISHED';$('dialogTitle').textContent=state.matchOver?(winner==='me'?'試合に勝利！':'試合終了'):(winner==='me'?'このゲームを獲得！':'このゲームは相手が獲得');$('dialogText').textContent=`スコア ${me} - ${op}`;$('continueButton').textContent=state.matchOver?'結果を確認':'次のゲームへ';$('gameDialog').showModal();}
$('continueButton').addEventListener('click',()=>$('gameDialog').close());render();

let installPrompt;
const installButton = $('installButton');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
