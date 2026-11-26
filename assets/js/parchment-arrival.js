// 이 스크립트는 Chirpy 페이지에도 포함해야 작동합니다.
(() => {
  let arriving = false;
  try {
    arriving = sessionStorage.getItem('parchmentArrival') === '1';
    if (arriving) sessionStorage.removeItem('parchmentArrival');
  } catch (_) {}
  if (!arriving) return;
  const style = document.createElement('style');
  style.textContent = `
    #parchment-arrival-cover { position:fixed; inset:0; z-index:2147483647;
      background:#e8c99b url('/assets/images/parchment-bg.webp') center/cover no-repeat;
      opacity:1; pointer-events:none; transition:opacity .35s ease; }
    #parchment-arrival-cover.done {opacity:0}
    @media(prefers-reduced-motion:reduce){#parchment-arrival-cover{transition-duration:.01s}}
  `;
  document.head.appendChild(style);
  const cover = document.createElement('div');
  cover.id='parchment-arrival-cover';
  const show = () => {
    document.body.appendChild(cover);
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.add('done')));
      setTimeout(() => {cover.remove();style.remove();}, 450);
    };
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, {once:true});
    setTimeout(reveal, 900);
  };
  if (document.body) show();
  else document.addEventListener('DOMContentLoaded',show,{once:true});
})();
