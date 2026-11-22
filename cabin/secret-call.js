(()=>{
const cabin=document.querySelector('#cabin');if(!cabin)return;
try{localStorage.removeItem('captain-secret-v1')}catch{}
const calls=[['……들리나?','수집한 정보는 예정대로 전달하도록.','아직 네 정체를 눈치챈 자는 없겠지?','다음 전문을 전달한다.','QLJKW','……이상.'],['항해는 순조로운가?','다음 연락까지 평소대로 행동하도록.'],['여보세요? 여기가 보급선인가?','아, 잘못 연결됐군.']];
const ui=document.createElement('div');ui.className='secret-inline';ui.hidden=true;ui.innerHTML='<div class="secret-ring" aria-live="polite">벌레벌레벌레벌레……</div><div class="secret-choice"><button type="button">받는다</button><button type="button">받지 않는다</button></div><button type="button" class="secret-bubble" hidden><span class="secret-words"></span><span class="secret-next" aria-hidden="true">▾</span></button>';cabin.append(ui);
const ring=ui.querySelector('.secret-ring'),choice=ui.querySelector('.secret-choice'),bubble=ui.querySelector('.secret-bubble'),words=ui.querySelector('.secret-words');let timer,typing,state='idle',call,index=0,pos=0,completed=false;
function schedule(ms){clearTimeout(timer);timer=setTimeout(receive,ms)}
function later(){schedule(60000+Math.random()*120000)}
function finish(){clearInterval(typing);clearTimeout(timer);state='idle';ui.hidden=true;later()}
function receive(){if(document.hidden||state!=='idle'){schedule(10000);return}state='ring';ui.hidden=false;ring.hidden=false;choice.hidden=false;bubble.hidden=true;schedule(35000);clearTimeout(timer);timer=setTimeout(finish,35000)}
function show(){clearInterval(typing);pos=0;const t=call[index];words.textContent='';bubble.classList.toggle('cipher',t==='QLJKW');bubble.setAttribute('aria-label','다음 대사');if(matchMedia('(prefers-reduced-motion: reduce)').matches){words.textContent=t;pos=t.length;return}typing=setInterval(()=>{words.textContent=t.slice(0,++pos);if(pos>=t.length)clearInterval(typing)},35)}
choice.children[0].onclick=()=>{clearTimeout(timer);state='talk';ring.hidden=true;choice.hidden=true;bubble.hidden=false;call=completed?calls[1+Math.floor(Math.random()*2)]:calls[0];index=0;show()};choice.children[1].onclick=finish;
bubble.onclick=()=>{if(state!=='talk')return;const t=call[index];if(pos<t.length){clearInterval(typing);words.textContent=t;pos=t.length;return}if(++index<call.length)show();else{if(call===calls[0]){completed=true;try{sessionStorage.setItem('captain-secret-clue','1')}catch{}}finish()}};
ui.addEventListener('click',e=>e.stopPropagation());document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state!=='idle')finish()});schedule(new URLSearchParams(location.search).has('calltest')?1000:15000+Math.random()*20000);
})();
