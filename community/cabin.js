(()=>{'use strict';
const base='https://zdgopdrehbphshdptjjr.supabase.co',key='sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s';
const root=document.createElement('section');root.id='community-cabin';root.innerHTML=`<div class="cc-news"><strong>NEWS COO</strong><div class="cc-ticker-window"><span id="cc-ticker" aria-live="polite">오늘도 그랜드라인의 바람은 순조롭습니다.</span></div></div><button type="button" id="cc-toggle" aria-expanded="false" aria-controls="cc-panel">실시간 무전 ▾</button><aside id="cc-panel" hidden><h2>실시간 무전</h2><p class="cc-hint">공개 채널입니다. 연락처나 개인정보를 남기지 마세요.</p><div id="cc-messages" role="log"></div><form id="cc-form"><label for="cc-input">무전 메시지 (100자 이내)</label><input id="cc-input" maxlength="100" required><button>송출</button></form><p id="cc-status" role="status"></p><a href="/">입장 인증</a></aside>`;document.body.append(root);
const $=id=>document.getElementById(id);const client=window.supabase?.createClient(base,key,{auth:{storageKey:'marine-community-auth'}});if(!client){$('cc-status').textContent='인증 모듈을 불러오지 못했습니다.';return;}
async function api(action,fields={},write=false){const {data:{session}}=await client.auth.getSession();if(write&&!session)throw Error('입장 화면에서 커뮤니티 인증을 먼저 진행하세요.');const r=await fetch(base+'/functions/v1/community-handler',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(12000)});const j=await r.json();if(!r.ok||j.data?.success===false)throw Error(j.data?.error||j.error||'요청 실패');return j.data;}
let open=false,sending=false,radioBusy=false,newsBusy=false;
const queue=[],seen=new Map();let active=null,newsFresh=false,newsNext=0,newsDelay=15000,radioNext=0,radioDelay=10000;
const ticker=$('cc-ticker'), viewport=ticker.parentElement;
let tickerMotion;
function rollNews(message){
 tickerMotion?.cancel(); ticker.textContent=message;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;
 const distance=viewport.clientWidth+ticker.scrollWidth;
 const duration=Math.max(5000,distance/65*1000);
 tickerMotion=ticker.animate([{transform:`translateX(${viewport.clientWidth}px)`},{transform:`translateX(${-ticker.scrollWidth}px)`}],{duration,iterations:Infinity,easing:'linear'});
 return duration;
}
rollNews(ticker.textContent);
let lastAmbient=Date.now(),nextAmbient=30000+Math.random()*30000,holdUntil=0;
function clearBroadcast(){active=null;holdUntil=0;rollNews(ambient[0]);}
const ambient=['오늘도 그랜드라인의 바람은 순조롭습니다.','항해자 여러분, 평온한 항해 되세요.'];
$('cc-toggle').onclick=()=>{open=!open;$('cc-panel').hidden=!open;$('cc-toggle').setAttribute('aria-expanded',String(open));if(open){radioNext=0;refreshRadio();}};
async function refreshRadio(){if(!open||radioBusy||document.hidden||Date.now()<radioNext)return;radioBusy=true;try{const rows=await api('radio');const box=$('cc-messages');const bottom=box.scrollHeight-box.scrollTop-box.clientHeight<50;const nodes=rows.map(m=>{const p=document.createElement('p');const name=document.createElement('strong');name.textContent=m.nickname+' · ';p.append(name,document.createTextNode(m.content));if(m.is_mine)p.className='cc-mine';else{const b=document.createElement('button');b.type='button';b.textContent='신고';b.onclick=async()=>{const reason=prompt('신고 사유 (개인정보 제외)');if(!reason?.trim())return;b.disabled=true;try{await api('report_radio',{target_id:m.id,content:reason},true);$('cc-status').textContent='신고 접수 완료';}catch(e){$('cc-status').textContent=e.message;}finally{b.disabled=false;}};p.append(b);}return p;});box.replaceChildren(...nodes);if(bottom)box.scrollTop=box.scrollHeight;radioDelay=10000;}catch(e){radioDelay=Math.min(radioDelay*2,120000);$('cc-status').textContent=e.message;}finally{radioNext=Date.now()+radioDelay;radioBusy=false;}}
async function refreshNews(){
 if(newsBusy||document.hidden||Date.now()<newsNext)return;
 newsBusy=true;
 try{
  const rows=await api('news',{since:new Date(Date.now()-300000).toISOString()});
  if(!Array.isArray(rows))throw Error('Invalid news response');
  if(document.hidden){newsFresh=false;return;}
  const now=Date.now(), valid=new Map(rows.filter(m=>m.id&&Date.parse(m.expires_at)>now).map(m=>[m.id,m]));
  for(const [id,expiry] of seen)if(expiry<=now)seen.delete(id);
  for(let i=queue.length-1;i>=0;i--)if(!valid.has(queue[i].id))queue.splice(i,1);
  if(active&&!valid.has(active.id))clearBroadcast();
  for(const m of valid.values())if(!seen.has(m.id)){seen.set(m.id,Date.parse(m.expires_at));queue.push(m);}
  newsFresh=true;newsDelay=15000;
 }catch{newsFresh=false;queue.length=0;clearBroadcast();newsDelay=Math.min(newsDelay*2,120000);}
 finally{newsNext=Date.now()+newsDelay;newsBusy=false;}
}
function tick(){
 if(document.hidden)return;
 const now=Date.now();
 if(active&&(!newsFresh||Date.parse(active.expires_at)<=now))clearBroadcast();
 if(now<holdUntil)return;
 if(active)clearBroadcast();
 if(!newsFresh)return;
 while(queue.length&&Date.parse(queue[0].expires_at)<=now)queue.shift();
 if(queue.length){active=queue.shift();holdUntil=Math.min(Date.parse(active.expires_at),now+Math.max(6500,rollNews(active.content)));lastAmbient=now;}
 else if(now-lastAmbient>=nextAmbient){rollNews(ambient[Math.floor(Math.random()*ambient.length)]);lastAmbient=now;nextAmbient=30000+Math.random()*30000;}
}
$('cc-form').onsubmit=async e=>{e.preventDefault();if(sending)return;const input=$('cc-input');if(!input.value.trim())return;if(!confirm('이 메시지는 공개 무전 및 NEWS COO에 표시될 수 있습니다. 송출할까요?'))return;sending=true;const button=e.currentTarget.querySelector('button');button.disabled=true;try{await api('send_radio',{content:input.value},true);input.value='';$('cc-status').textContent='송출 완료';radioNext=0;await refreshRadio();await refreshNews();}catch(err){$('cc-status').textContent=err.message;}finally{sending=false;button.disabled=false;}};
(async()=>{try{const {data:{session}}=await client.auth.getSession();if(session&&Date.now()-Number(sessionStorage.getItem('cc-welcome')||0)>=1800000){await api('welcome',{},true);sessionStorage.setItem('cc-welcome',String(Date.now()));}}catch{}})();
refreshNews();setInterval(refreshNews,1000);setInterval(refreshRadio,1000);setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(document.hidden){newsFresh=false;clearBroadcast();}else{newsNext=0;radioNext=0;refreshNews();refreshRadio();}});
})();
