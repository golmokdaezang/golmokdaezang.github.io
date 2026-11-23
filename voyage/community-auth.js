(() => {
  const url = 'https://zdgopdrehbphshdptjjr.supabase.co';
  // Replace with visitor project publishable key before deployment.
  const key = 'sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s';
  const consent = document.getElementById('community-consent');
  const pub = document.getElementById('community-public');
  const welcome = document.getElementById('community-welcome');
  const wrap = document.getElementById('community-captcha');
  const visit = document.getElementById('visit-consent');
  let widget, token = '', client, session = null;
  const getClient = () => client ??= window.supabase.createClient(url,key,{auth:{storageKey:'marine-community-auth'}});
  const needed = () => consent.checked || visit.checked;
  function sync() {
    pub.disabled = !consent.checked;
    if (pub.disabled) pub.checked = false;
    welcome.disabled = !pub.checked;
    if (welcome.disabled) welcome.checked = false;
    wrap.hidden = !needed() || !!session;
    if (!needed() && widget !== undefined) { token = ''; window.turnstile.reset(widget); }
    if (needed() && !session && widget === undefined && window.turnstile?.render) {
      widget = window.turnstile.render(wrap, {sitekey:'0x4AAAAAAGOcr2t3f9O8ILkB', callback:t=>{token=t;}, 'expired-callback':()=>{token='';}, 'error-callback':()=>{token='';}});
    }
  }
  visit.addEventListener('change',sync); consent.addEventListener('change',sync); pub.addEventListener('change',sync); window.addEventListener('load',()=>{sync(); if(window.supabase) getClient().auth.getSession().then(r=>{session=r.data.session;sync();}).catch(()=>{});}); sync();
  async function ensureSession() {
    if (!needed()) return null;
    if (key.startsWith('REPLACE_')) throw new Error('방문자 프로젝트 공개 키 설정 필요');
    const current = await getClient().auth.getSession();
    if (current.error) throw new Error('인증 세션 확인 실패');
    session = current.data.session;
    if (!session) {
      if (!token) throw new Error('CAPTCHA 인증을 완료해 주세요.');
      const result = await client.auth.signInAnonymously({options:{captchaToken:token}});
      token=''; if(widget!==undefined) window.turnstile.reset(widget);
      if(result.error || !result.data.session) throw new Error('익명 로그인 실패');
      session=result.data.session;
    }
    sync();
    return session;
  }
  async function register(name, session) {
    if (!consent.checked) return;
    if (!session) throw new Error('인증 필요');
    const response=await fetch(url+'/functions/v1/community-handler',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'register',nickname:name,nickname_public:pub.checked,welcome_consent:welcome.checked})});
    const result=await response.json();
    if(!response.ok || !result.data?.success) throw new Error(result.data?.error || result.error || '등록 실패');
  }
  window.communityAuth=Object.freeze({register,ensureSession,key});
})();
