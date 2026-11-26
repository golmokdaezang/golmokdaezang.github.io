(()=>{'use strict';
const base='https://zdgopdrehbphshdptjjr.supabase.co',key='sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s';
const root=document.createElement('section');root.id='community-cabin';root.innerHTML=`<div class="cc-news"><strong>NEWS COO</strong><div class="cc-ticker-window"><span id="cc-ticker" aria-live="polite">오늘도 그랜드라인의 바람은 순조롭습니다.</span></div></div><button type="button" id="cc-toggle" aria-expanded="false" aria-controls="cc-panel">실시간 무전 ▾</button><aside id="cc-panel" hidden><div class="cc-radio-head"><div><span class="cc-device-label">MARINE · COMMUNICATIONS</span><h2>실시간 무전</h2></div><span class="cc-speaker" aria-hidden="true"></span></div><div class="cc-channel"><span>CH 01 · 공개 채널</span><span>RX / TX</span></div><p class="cc-hint">공개 채널입니다. 연락처나 개인정보를 남기지 마세요.</p><div id="cc-messages" role="log"></div><form id="cc-form"><label for="cc-input">무전 메시지 (100자 이내)</label><input id="cc-input" maxlength="100" required><button><span aria-hidden="true">●</span> 송출 <small>TX</small></button></form><p id="cc-status" role="status"></p></aside>`;document.body.append(root);
const $=id=>document.getElementById(id);const client=window.getMarineCommunityClient();if(!client){$('cc-status').textContent='인증 모듈을 불러오지 못했습니다.';return;}
const captainClient=window.MarineClient||(window.MarineClient=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY));
async function communitySession(action){
  if(['radio','send_radio','report_radio'].includes(action)){
    const {data:{session}}=await captainClient.auth.getSession();
    if(session?.user?.id==='6e6288e5-3612-4d2f-8d8b-fb08007d86a9') return session;
  }
  return (await client.auth.getSession()).data.session;
}
async function api(action,fields={},write=false){const session=await communitySession(action);if(write&&!session)throw Error('입장 화면에서 커뮤니티 인증을 먼저 진행하세요.');const r=await fetch(base+'/functions/v1/community-handler',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(action==='delete_my_data'?60000:12000)});const j=await r.json();if(!r.ok||j.data?.success===false)throw Error(j.data?.error||j.error||'요청 실패');return j.data;}
let open=false,sending=false,radioBusy=false,newsBusy=false;
const privacyButton=document.createElement('button');privacyButton.type='button';privacyButton.className='captain-auth';privacyButton.id='cc-privacy-button';privacyButton.textContent='개인정보 설정';$('captain-logout').after($('captain-command'),privacyButton);
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
function clearBroadcast(){window.marineNews?.reset();}
$('cc-toggle').onclick=()=>{open=!open;$('cc-panel').hidden=!open;$('cc-toggle').setAttribute('aria-expanded',String(open));if(open){radioNext=0;refreshRadio();}};
async function refreshRadio(){if(!open||radioBusy||document.hidden||Date.now()<radioNext)return;radioBusy=true;try{const rows=await api('radio');const box=$('cc-messages');const bottom=box.scrollHeight-box.scrollTop-box.clientHeight<50;const nodes=rows.filter(m=>Date.parse(m.created_at)>Date.now()-1800000).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)).map(m=>{const p=document.createElement('div');p.className="cc-message";const name=document.createElement('strong');name.textContent=m.is_mine?'나':m.nickname;const bubble=document.createElement('span');bubble.className='cc-bubble';bubble.textContent=m.content;const time=document.createElement('small');time.textContent=new Date(m.created_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});p.append(name,bubble,time);if(m.is_mine)p.classList.add('cc-mine');else{const b=document.createElement('button');b.type='button';b.textContent='신고';b.onclick=async()=>{const reason=prompt('신고 사유 (개인정보 제외)');if(!reason?.trim())return;b.disabled=true;try{await api('report_radio',{target_id:m.id,content:reason},true);$('cc-status').textContent='신고 접수 완료';}catch(e){$('cc-status').textContent=e.message;}finally{b.disabled=false;}};p.append(b);}return p;});box.replaceChildren(...nodes);if(bottom)box.scrollTop=box.scrollHeight;radioDelay=10000;}catch(e){radioDelay=Math.min(radioDelay*2,120000);$('cc-status').textContent=e.message;}finally{radioNext=Date.now()+radioDelay;radioBusy=false;}}
async function refreshNews(){window.marineNews?.refresh();}
$('cc-form').onsubmit=async e=>{e.preventDefault();if(sending)return;const input=$('cc-input');if(!input.value.trim())return;if(!confirm('이 메시지는 공개 무전 및 NEWS COO에 표시될 수 있습니다. 송출할까요?'))return;sending=true;const button=e.currentTarget.querySelector('button');button.disabled=true;try{await api('send_radio',{content:input.value},true);input.value='';$('cc-status').textContent='송출 완료';radioNext=0;await refreshRadio();await refreshNews();}catch(err){$('cc-status').textContent=err.message;}finally{sending=false;button.disabled=false;}};
(async()=>{try{const {data:{session}}=await client.auth.getSession();if(session&&Date.now()-Number(sessionStorage.getItem('cc-welcome')||0)>=1800000){await api('welcome',{},true);sessionStorage.setItem('cc-welcome',String(Date.now()));}}catch{}})();
const alarm=document.createElement('dialog');alarm.id='cc-notice-alarm';alarm.innerHTML='<header><svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4L45 42H3Z" fill="#b93d32"/><path d="M24 15V29" stroke="white" stroke-width="4"/><circle cx="24" cy="35" r="2" fill="white"/></svg><h2>공지 알람!</h2></header><p class="alarm-label">CAPTAIN’S ANNOUNCEMENT</p><p id="cc-alarm-text"></p><label><input type="checkbox" id="cc-alarm-mute"> 알림음 끄기</label><button id="cc-alarm-ok">공지 확인</button>';document.body.append(alarm);
const alarms=[];let currentAlarm=null;let audio=null;const acknowledged=new Set();try{JSON.parse(localStorage.getItem('marine-notice-ack')||'[]').forEach(v=>acknowledged.add(v));$('cc-alarm-mute').checked=localStorage.getItem('marine-alarm-mute')==='1';}catch{};
$('cc-alarm-mute').onchange=()=>{try{localStorage.setItem('marine-alarm-mute',$('cc-alarm-mute').checked?'1':'0')}catch{}};
document.addEventListener('pointerdown',()=>{try{audio??=new AudioContext();audio.resume()}catch{}},{once:true});
function showAlarm(){if(currentAlarm||!alarms.length)return;currentAlarm=alarms.shift();$('cc-alarm-text').textContent=currentAlarm.content;alarm.showModal();if(audio?.state==='running'&&!$('cc-alarm-mute').checked){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=520;g.gain.value=.07;o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.6);}}
function enqueueNotice(m){if(!acknowledged.has(m.id)){alarms.push(m);showAlarm();}}
function acknowledge(){if(!currentAlarm)return;acknowledged.add(currentAlarm.id);try{localStorage.setItem('marine-notice-ack',JSON.stringify([...acknowledged].slice(-200)))}catch{};currentAlarm=null;alarm.close();showAlarm();}
$('cc-alarm-ok').onclick=acknowledge;alarm.addEventListener('cancel',e=>{e.preventDefault();acknowledge();});
window.addEventListener("marine-notice",e=>enqueueNotice(e.detail));refreshNews();setInterval(refreshRadio,1000);document.addEventListener('visibilitychange',()=>{if(document.hidden){newsFresh=false;clearBroadcast();}else{newsNext=0;radioNext=0;refreshNews();refreshRadio();}});
})();
