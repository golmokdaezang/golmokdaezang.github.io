(() => {
  const url = 'https://zdgopdrehbphshdptjjr.supabase.co';
  // Replace with visitor project publishable key before deployment.
  const key = 'sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s';
  const consent = document.getElementById('community-consent');
  const pub = document.getElementById('community-public');
  const welcome = document.getElementById('community-welcome');
  const wrap = document.getElementById('community-captcha');
  let widget, token = '', client;
  function sync() {
    pub.disabled = !consent.checked;
    if (pub.disabled) pub.checked = false;
    welcome.disabled = !pub.checked;
    if (welcome.disabled) welcome.checked = false;
    wrap.hidden = !consent.checked;
    if (!consent.checked && widget !== undefined) { token = ''; window.turnstile.reset(widget); }
    if (consent.checked && widget === undefined && window.turnstile?.render) {
      widget = window.turnstile.render(wrap, {sitekey:'0x4AAAAAAGOcr2t3f9O8ILkB', callback:t=>{token=t;}, 'expired-callback':()=>{token='';}, 'error-callback':()=>{token='';}});
    }
  }
  consent.addEventListener('change',sync); pub.addEventListener('change',sync); window.addEventListener('load',sync); sync();
  async function register(name) {
    if (!consent.checked) return;
    if (key.startsWith('REPLACE_')) throw new Error('방문자 프로젝트 공개 키 설정 필요');
    client ??= window.supabase.createClient(url,key,{auth:{storageKey:'marine-community-auth'}});
    let {data:{session}} = await client.auth.getSession();
    if (!session) {
      if (!token) throw new Error('CAPTCHA 인증을 완료해 주세요.');
      const result = await client.auth.signInAnonymously({options:{captchaToken:token}});
      token=''; if(widget!==undefined) window.turnstile.reset(widget);
      if(result.error || !result.data.session) throw new Error('익명 로그인 실패');
      session=result.data.session;
    }
    const response=await fetch(url+'/functions/v1/community-handler',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'register',nickname:name,nickname_public:pub.checked,welcome_consent:welcome.checked})});
    const result=await response.json();
    if(!response.ok || !result.data?.success) throw new Error(result.data?.error || result.error || '등록 실패');
  }
  window.communityAuth=Object.freeze({register});
})();
