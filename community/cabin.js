(()=>{'use strict';
const base='https://zdgopdrehbphshdptjjr.supabase.co',key='sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s';
const root=document.createElement('section');root.id='community-cabin';root.innerHTML=`<div class="cc-news"><strong>NEWS COO</strong><div class="cc-ticker-window"><span id="cc-ticker" aria-live="polite">오늘도 그랜드라인의 바람은 순조롭습니다.</span></div></div><button type="button" id="cc-toggle" aria-expanded="false" aria-controls="cc-panel">실시간 무전 ▾</button><aside id="cc-panel" hidden><div class="cc-radio-head"><div><span class="cc-device-label">MARINE · COMMUNICATIONS</span><h2>실시간 무전</h2></div><span class="cc-speaker" aria-hidden="true"></span></div><div class="cc-channel"><span>CH 01 · 공개 채널</span><span>RX / TX</span></div><p class="cc-hint">공개 채널입니다. 연락처나 개인정보를 남기지 마세요.</p><div id="cc-messages" role="log"></div><form id="cc-form"><label for="cc-input">무전 메시지 (100자 이내)</label><input id="cc-input" maxlength="100" required><button><span aria-hidden="true">●</span> 송출 <small>TX</small></button></form><p id="cc-status" role="status"></p></aside>`;document.body.append(root);
const $=id=>document.getElementById(id);const client=window.supabase?.createClient(base,key,{auth:{storageKey:'marine-community-auth'}});if(!client){$('cc-status').textContent='인증 모듈을 불러오지 못했습니다.';return;}
async function api(action,fields={},write=false){const {data:{session}}=await client.auth.getSession();if(write&&!session)throw Error('입장 화면에서 커뮤니티 인증을 먼저 진행하세요.');const r=await fetch(base+'/functions/v1/community-handler',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(action==='delete_my_data'?60000:12000)});const j=await r.json();if(!r.ok||j.data?.success===false)throw Error(j.data?.error||j.error||'요청 실패');return j.data;}
let open=false,sending=false,radioBusy=false,newsBusy=false;
const privacyButton=document.createElement('button');privacyButton.type='button';privacyButton.className='captain-auth';privacyButton.id='cc-privacy-button';privacyButton.textContent='개인정보 설정';$('captain-logout').before(privacyButton);
const privacy=document.createElement('dialog');privacy.id='cc-privacy';privacy.innerHTML=`<header class="cc-privacy-head"><h2>항해자 개인정보 설정</h2><form method="dialog"><button class="cc-close" aria-label="닫기">×</button></form></header><p id="cc-privacy-status" role="status"></p><fieldset disabled><legend>나의 공개 설정</legend><label><input type="checkbox" id="cc-rank"> WANTED 순위표 공개</label><label><input type="checkbox" id="cc-nick"> 커뮤니티 닉네임 공개</label><label><input type="checkbox" id="cc-welcome"> 환영 방송 공개</label><button type="button" id="cc-save-privacy">변경 사항 저장</button><button type="button" id="cc-revoke-privacy">모든 공개 동의 철회</button></fieldset><button type="button" id="cc-my-data">내 개인정보 열람</button><div id="cc-my-data-result" hidden aria-live="polite"></div><section class="cc-delete-area"><h3>개인정보 및 계정 삭제</h3><p>방문 기록과 작성 기록, 익명 인증 계정이 삭제되며 복구할 수 없습니다. 다른 사용자의 답글·신고 및 일부 로그·백업은 남을 수 있습니다.</p><button type="button" id="cc-delete-data">개인정보 삭제</button></section><a href="/">입장 화면에서 인증 및 이용 동의</a>`;document.body.append(privacy);
const rank=$('cc-rank'),nick=$('cc-nick'),welcome=$('cc-welcome'),status=$('cc-privacy-status'),fields=privacy.querySelector('fieldset'),save=$('cc-save-privacy');let visitorExists=false,communityExists=false,privacyBusy=false;
async function loadPrivacy(){fields.disabled=true;status.textContent='설정을 불러오는 중입니다.';try{const data=await api('get_privacy',{},true);visitorExists=data.visitor?.success===true;communityExists=data.community?.success===true;rank.checked=visitorExists&&data.visitor.leaderboard_consent===true;nick.checked=communityExists&&data.community.nickname_public===true;welcome.checked=nick.checked&&data.community.welcome_consent===true;rank.disabled=!visitorExists;nick.disabled=!communityExists;welcome.disabled=!communityExists||!nick.checked;fields.disabled=!(visitorExists||communityExists);status.textContent=fields.disabled?'저장된 이용 설정이 없습니다. 입장 화면에서 동의할 수 있습니다.':'';}catch(e){status.textContent=e.message;}}
privacyButton.onclick=()=>{if(!privacy.open&&!privacyBusy){privacy.showModal();loadPrivacy();}};
nick.onchange=()=>{if(!nick.checked)welcome.checked=false;welcome.disabled=!communityExists||!nick.checked;};
save.onclick=async()=>{if(privacyBusy)return;privacyBusy=true;fields.disabled=true;try{if(visitorExists)await api('set_visitor_privacy',{leaderboard_consent:rank.checked},true);if(communityExists)await api('set_community_privacy',{nickname_public:nick.checked,welcome_consent:nick.checked&&welcome.checked},true);await loadPrivacy();status.textContent='변경 사항을 저장했습니다.';newsNext=0;radioNext=0;refreshNews();refreshRadio();}catch(e){await loadPrivacy();status.textContent='일부 설정이 저장되지 않았을 수 있습니다. '+e.message;}finally{privacyBusy=false;}};
$('cc-revoke-privacy').onclick=async()=>{if(privacyBusy||fields.disabled)return;if(!confirm('세 가지 공개 동의를 모두 철회할까요? 방문 기록과 계정은 삭제되지 않습니다.'))return;privacyBusy=true;fields.disabled=true;status.textContent='공개 동의를 철회하는 중입니다.';try{const result=await api('revoke_publicity',{},true);if(result?.success!==true)throw Error('철회 결과를 확인할 수 없습니다.');await loadPrivacy();if(!fields.disabled&&!rank.checked&&!nick.checked&&!welcome.checked)status.textContent='모든 공개 동의를 철회했습니다.';else status.textContent='철회 요청은 완료됐지만 설정 재조회에 실패했거나 설정이 변경되었습니다. 다시 확인해 주세요.';queue.length=0;newsFresh=false;if(active)clearBroadcast();newsNext=0;radioNext=0;refreshNews();refreshRadio();}catch(e){await loadPrivacy();status.textContent='철회 결과를 확인하지 못했습니다. '+e.message;}finally{privacyBusy=false;}};

const myDataButton=$('cc-my-data'),myDataResult=$('cc-my-data-result');
let dataGeneration=0;
function clearMyData(){dataGeneration++;myDataResult.textContent='';myDataResult.hidden=true;myDataButton.disabled=false;myDataButton.textContent='내 개인정보 열람';}
privacy.addEventListener('close',clearMyData);
client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN')clearMyData();});
myDataButton.onclick=async()=>{
 if(privacyBusy)return;if(!myDataResult.hidden){clearMyData();return;}myDataButton.textContent='개인정보 열람 접기';
 const generation=++dataGeneration;myDataButton.disabled=true;myDataResult.hidden=false;myDataResult.textContent='개인정보를 불러오는 중입니다.';
 try{
 const before=(await client.auth.getSession()).data.session?.user.id;if(!before)throw Error('입장 화면에서 인증을 먼저 진행하세요.');
 const data=await api('get_my_data',{},true);
 const after=(await client.auth.getSession()).data.session?.user.id;
 if(generation!==dataGeneration||!privacy.open||before!==after)return;
 if(data?.success!==true)throw Error('조회 결과를 확인할 수 없습니다.');
 const date=v=>v?new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'없음';
 const consent=v=>v===true?'동의':'미동의';
 const v=data.visitor,c=data.community;
 myDataResult.textContent='';
 const section=(title)=>{const s=document.createElement('section');const h=document.createElement('h3');h.textContent=title;s.append(h);myDataResult.append(s);return s;};
 const paragraph=(parent,value)=>{const p=document.createElement('p');p.textContent=value;parent.append(p);};
 const details=(title,rows)=>{const s=section(title);if(!rows){paragraph(s,'등록 기록 없음');return;}const dl=document.createElement('dl');for(const [label,value] of rows){const row=document.createElement('div');const dt=document.createElement('dt');const dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value??'없음');row.append(dt,dd);dl.append(row);}s.append(dl);};
 details('방문 기록',v?[['닉네임',v.nickname],['방문 횟수',v.visit_count],['최초 방문',date(v.first_visited_at)],['최근 방문',date(v.last_visited_at)],['순위표 공개',consent(v.leaderboard_consent)]]:null);
 details('커뮤니티',c?[['닉네임',c.nickname],['등록 일시',date(c.created_at)],['닉네임 공개',consent(c.nickname_public)],['환영 방송 공개',consent(c.welcome_consent)]]:null);


 }catch(e){if(generation===dataGeneration&&privacy.open)myDataResult.textContent=e.message;}
 finally{if(generation===dataGeneration)myDataButton.disabled=false;}
};

const deleteButton=$('cc-delete-data');
privacy.addEventListener('cancel',e=>{if(privacyBusy)e.preventDefault();});
privacy.querySelector('.cc-close').addEventListener('click',e=>{if(privacyBusy)e.preventDefault();});
deleteButton.onclick=async()=>{
 if(privacyBusy||!privacy.open)return;
 const initial=(await client.auth.getSession()).data.session;
 if(!initial){status.textContent='삭제할 방문자 인증 계정이 없습니다.';return;}
 if(privacyBusy||!privacy.open)return;
 if(prompt('방문 기록, 작성 기록 및 익명 계정을 삭제합니다. 복구할 수 없습니다. 계속하려면 개인정보삭제 를 입력하세요.')!=='개인정보삭제')return;
 privacyBusy=true;fields.disabled=true;deleteButton.disabled=true;clearMyData();myDataButton.disabled=true;
 status.textContent='개인정보를 삭제하는 중입니다. 창을 닫지 마세요.';
 let confirmed=false;
 try{
 const current=(await client.auth.getSession()).data.session;
 if(current?.user.id!==initial.user.id)throw Error('인증 계정이 변경되었습니다.');
 const result=await api('delete_my_data',{confirmation:'개인정보삭제'},true);
 if(result?.success!==true)throw Error('삭제 결과를 확인할 수 없습니다.');
 confirmed=true;
 const latest=(await client.auth.getSession()).data.session;
 if(latest?.user.id===initial.user.id){
 const {error}=await client.auth.signOut({scope:'local'});
 if(error){const again=(await client.auth.getSession()).data.session;if(again?.user.id===initial.user.id){client.auth.stopAutoRefresh();localStorage.removeItem('marine-community-auth');localStorage.removeItem('marine-community-auth-code-verifier');}}
 }
 alert('개인정보 및 방문자 인증 계정이 삭제되었습니다.');location.replace('/');
 }catch(e){status.textContent=confirmed?'서버 삭제는 완료되었으나 브라우저 세션 정리를 확인하지 못했습니다. 새로고침 후 확인해 주세요.':'삭제 완료를 확인하지 못했습니다. 같은 계정으로 다시 시도해 주세요. '+e.message;}
 finally{privacyBusy=false;deleteButton.disabled=confirmed;myDataButton.disabled=confirmed;}
};

const queue=[],seen=new Map();let active=null,newsFresh=false,newsNext=0,newsDelay=15000,radioNext=0,radioDelay=10000;
const ticker=$('cc-ticker'), viewport=ticker.parentElement;
let tickerMotion, holdUntil=0, lastAmbient='', deck=[];
const ambient=[
  "안녕하세요, 청취자 여러분. NEWS COO입니다.",
  "지금 막 주파수를 맞추신 분들을 환영합니다.",
  "오늘은 어떤 하루를 보내고 계신가요?",
  "바다 위에서 듣고 계신 분들도, 육지에서 듣고 계신 분들도 반갑습니다.",
  "오늘도 어김없이 NEWS COO의 방송은 계속됩니다.",
  "청취자 여러분, 식사는 챙기셨나요?",
  "바다 건너 새로운 소식들이 들어오고 있습니다.",
  "먼바다에서도 저희 방송이 잘 들리고 있기를 바랍니다.",
  "그랜드라인 곳곳의 크고 작은 이야기를 전해드리고 있습니다.",
  "잠시 쉬어가는 시간입니다.",
  "오늘도 전보벌레 상태는 아주 좋습니다.",
  "어느덧 하루가 또 흘러가고 있네요.",
  "따뜻한 차 한 잔과 함께 방송을 듣는 것도 좋겠네요.",
  "어디에서 듣고 계시든 오늘도 함께해 주셔서 감사합니다.",
  "오늘은 비교적 평온한 소식들이 이어지고 있습니다.",
  "긴 항해 중이신 분들은 중간중간 휴식도 잊지 마세요.",
  "오늘도 바쁜 하루를 보내고 계신 청취자 여러분, 수고 많으십니다.",
  "새로운 소식이 확인되는 대로 전해드리겠습니다.",
  "오늘도 안전하고 즐거운 항해 되시길 바랍니다.",
  "바다를 건너 전해드리는 세상 이야기, NEWS COO입니다.",
  "최근 전보벌레를 이용한 통신 사기가 증가하고 있습니다.",
  "출처가 불분명한 전보에는 응답하지 않도록 주의하시기 바랍니다.",
  "일부 항구에서 위조 신분증이 발견되었습니다.",
  "해군은 수상한 선박 발견 시 가까운 지부에 신고할 것을 당부했습니다.",
  "해상 거래 시 상대방의 신원을 반드시 확인하시기 바랍니다.",
  "최근 위조된 현상수배서가 유통되고 있습니다.",
  "일부 지역의 전보벌레 통신 장애가 복구되었습니다.",
  "세계정부가 개인정보 보호에 관한 새로운 지침을 발표했습니다.",
  "전보벌레 통신망의 정기 점검이 예정되어 있습니다.",
  "최근 허위 보물 지도를 판매하는 사기 사건이 잇따르고 있습니다.",
  "이번 주말 워터 세븐에서 선박 축제가 개최됩니다.",
  "이스트 블루의 한 항구 마을에서 낚시 대회가 열렸습니다.",
  "샤본디 제도의 놀이공원이 새롭게 단장을 마쳤습니다.",
  "해상 요리 경연대회의 참가 신청이 시작되었습니다.",
  "알라바스타에서 전통문화 축제가 개최될 예정입니다.",
  "최근 항해 일지를 수집하는 취미가 인기를 끌고 있습니다.",
  "워터 세븐의 조선 기술 전시회가 오늘 개막했습니다.",
  "여러 섬의 특산품을 만나볼 수 있는 해상 박람회가 열렸습니다.",
  "한 어부가 보기 드문 대형 물고기를 낚아 화제가 되고 있습니다.",
  "그랜드라인의 작은 섬에서 새로운 관광 명소가 발견되었습니다.",
  "최근 해상 운송비 상승으로 일부 지역의 물가가 올랐습니다.",
  "워터 세븐의 선박 제작 주문량이 꾸준히 증가하고 있습니다.",
  "전보벌레 통신 이용 요금이 다음 달부터 인하될 예정입니다.",
  "이스트 블루의 어획량이 지난해보다 증가했습니다.",
  "샤본디 제도를 찾는 관광객이 늘어나고 있습니다.",
  "일부 항구의 선박 정박 요금이 조정되었습니다.",
  "최근 항해용 나침반의 수요가 증가하고 있습니다.",
  "주요 항구의 식료품 공급은 안정적으로 유지되고 있습니다.",
  "해상 무역량이 지난달보다 증가한 것으로 나타났습니다.",
  "새로운 여객선 노선이 개설될 예정입니다.",
  "오늘 그랜드라인 동부 해역은 대체로 맑겠습니다.",
  "북쪽 해역에서는 강한 바람이 예상됩니다.",
  "워터 세븐행 여객선은 정상 운항 중입니다.",
  "오늘 저녁 샤본디 제도 인근에 짙은 안개가 예상됩니다.",
  "현재 이스트 블루의 주요 항로는 정상적으로 운영되고 있습니다.",
  "일부 해역의 높은 파도로 여객선 운항이 지연되고 있습니다.",
  "내일 오전부터 해상 기상 상황이 개선될 전망입니다.",
  "오늘은 바람이 비교적 잔잔해 항해하기 좋은 날씨입니다.",
  "신세계 일부 해역에 폭풍주의보가 발령되었습니다.",
  "현재 주요 항구의 선박 입출항은 원활하게 이루어지고 있습니다.",
  "오늘 오전 그랜드라인 서부 해역에서 두 해적단이 충돌했습니다.",
  "해군 본부가 주요 항로의 순찰을 강화한다고 발표했습니다.",
  "신세계에서 활동 중인 일부 해적들의 현상금이 조정되었습니다.",
  "세계정부가 새로운 현상수배 명단을 발표했습니다.",
  "해군과 해적단의 충돌로 일부 해역의 통행이 제한되고 있습니다.",
  "해군 제7지부가 최근 해상 소탕 작전에서 승리를 거뒀습니다.",
  "최근 두 해적단이 새로운 동맹을 체결한 것으로 알려졌습니다.",
  "세계정부의 정기회의가 오늘 개최되었습니다.",
  "해군 함대가 장기간의 원정을 마치고 귀환했습니다.",
  "해군 본부는 최근 해상 충돌로 인한 민간 선박의 피해는 없다고 밝혔습니다."
];
function shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function nextAmbient(){
 if(!deck.length){deck=shuffle(ambient);const first=deck.findIndex(m=>ambient.slice(0,20).includes(m)&&m!==lastAmbient);if(first>=0)[deck[0],deck[first]]=[deck[first],deck[0]];}
 lastAmbient=deck.shift();return lastAmbient;
}
function rollNews(message){
 tickerMotion?.cancel();ticker.textContent=message;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return 8500;
 const distance=viewport.clientWidth+ticker.scrollWidth;
 const duration=Math.max(5000,distance/65*1000);
 tickerMotion=ticker.animate([{transform:`translateX(${viewport.clientWidth}px)`},{transform:`translateX(${-ticker.scrollWidth}px)`}],{duration,iterations:1,easing:'linear',fill:'both'});
 return duration;
}
function clearBroadcast(){active=null;holdUntil=0;tickerMotion?.cancel();ticker.textContent='';}
viewport.setAttribute('aria-label','NEWS COO: 일반 방송은 가상의 세계관 뉴스입니다.');
viewport.title='일반 방송은 가상의 세계관 뉴스입니다.';
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
  queue.sort((a,b)=>Number(b.event_type==='notice')-Number(a.event_type==='notice'));newsFresh=true;newsDelay=15000;
 }catch{newsFresh=false;queue.length=0;if(active)clearBroadcast();newsDelay=Math.min(newsDelay*2,120000);}
 finally{newsNext=Date.now()+newsDelay;newsBusy=false;}
}
function tick(){
 if(document.hidden)return;
 const now=Date.now();
 if(active&&(!newsFresh||Date.parse(active.expires_at)<=now))clearBroadcast();
 if(now<holdUntil)return;
 active=null;
 while(queue.length&&Date.parse(queue[0].expires_at)<=now)queue.shift();
 if(newsFresh&&queue.length){active=queue.shift();holdUntil=Math.min(Date.parse(active.expires_at),now+rollNews(active.content));}
 else{holdUntil=now+rollNews(nextAmbient());}
}
$('cc-form').onsubmit=async e=>{e.preventDefault();if(sending)return;const input=$('cc-input');if(!input.value.trim())return;if(!confirm('이 메시지는 공개 무전 및 NEWS COO에 표시될 수 있습니다. 송출할까요?'))return;sending=true;const button=e.currentTarget.querySelector('button');button.disabled=true;try{await api('send_radio',{content:input.value},true);input.value='';$('cc-status').textContent='송출 완료';radioNext=0;await refreshRadio();await refreshNews();}catch(err){$('cc-status').textContent=err.message;}finally{sending=false;button.disabled=false;}};
(async()=>{try{const {data:{session}}=await client.auth.getSession();if(session&&Date.now()-Number(sessionStorage.getItem('cc-welcome')||0)>=1800000){await api('welcome',{},true);sessionStorage.setItem('cc-welcome',String(Date.now()));}}catch{}})();
tick();refreshNews();setInterval(refreshNews,1000);setInterval(refreshRadio,1000);setInterval(tick,100);document.addEventListener('visibilitychange',()=>{if(document.hidden){newsFresh=false;clearBroadcast();}else{newsNext=0;radioNext=0;refreshNews();refreshRadio();}});
})();
