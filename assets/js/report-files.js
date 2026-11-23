(() => {
const bucket='report-attachments', prefix='/report-media/';
const image=/\.(png|jpe?g|webp|gif)$/i;
const allowed=/\.(pdf|md|txt|log|png|jpe?g|webp|gif|docx|hwp|hwpx|pptx|xlsx|csv|py|c|cpp|java|zip|7z)$/i;
const safeName=n=>n.normalize('NFC').replace(/[\\/\x00-\x1f\x7f]/g,'_').slice(0,180);
const make=(tag,text)=>{const e=document.createElement(tag); e.textContent=text; return e;};
const check=r=>{if(r.error)throw r.error;return r.data;};
async function list(c,id){return check(await c.storage.from(bucket).list(String(id),{limit:1000})).filter(x=>x.id);}
async function url(c,id,name,download=false){return check(await c.storage.from(bucket).createSignedUrl(id+'/'+name,60,download?{download:name.split('--').slice(1).join('--')}:{})).signedUrl;}
function original(n){return n.split('--').slice(1).join('--')||n;}
function ref(n){return prefix+encodeURIComponent(n);}
function refName(s){if(!s?.startsWith(prefix))return null;try{return decodeURIComponent(s.slice(prefix.length));}catch{return null;}}
function filename(f){return f.name.split('.').pop().toLowerCase();}
function stored(f){return crypto.randomUUID()+'--'+safeName(f.name).replace(/[^a-zA-Z0-9._-]/g,'_');}
async function render(c,id,root,valid=()=>true){
 const rows=await list(c,id); if(!valid())return;
 const names=new Set(rows.map(r=>r.name)); const used=new Set();
 for(const im of root.querySelectorAll('img')){const n=refName(im.getAttribute('src'));if(!n)continue;im.removeAttribute('src');if(names.has(n)&&image.test(n)){used.add(n);const u=await url(c,id,n);if(!valid())return;im.src=u;im.style.maxWidth='100%';im.style.height='auto';}}
 const rest=rows.filter(r=>!used.has(r.name));if(!rest.length||!valid())return;
 const section=make('section','');section.className='report-attachments';section.append(make('h3','첨부 자료'));
 for(const r of rest){const line=make('div','');line.className='report-file';line.append(make('span',original(r.name)+' · '+Math.ceil((r.metadata?.size||0)/1024)+' KB'));
 for(const mode of (image.test(r.name)||/\.pdf$/i.test(r.name)?['열기','다운로드']:['다운로드'])){const b=make('button',mode);b.type='button';b.onclick=async()=>{try{if(mode==='다운로드'){const a=document.createElement('a');a.href=await url(c,id,r.name,true);a.click();}else{const frame=make('iframe','');frame.title=original(r.name);frame.setAttribute('sandbox','');frame.style.cssText='width:100%;height:65vh;border:0';if(image.test(r.name)){const im=make('img','');im.alt=original(r.name);im.src=await url(c,id,r.name);im.style.maxWidth='100%';line.append(im);}else{frame.src=await url(c,id,r.name);line.append(frame);}b.disabled=true;}}catch(e){alert(e.message);}};line.append(b);}section.append(line);}root.append(section);
}
function editor(c,t,preview,getId,status){const pending=new Map(), existing=new Map(), removed=new Set(), blobs=new Map();const input=document.getElementById('report-files'),zone=document.getElementById('report-drop'),rows=document.getElementById('report-list');let working=false;
 function insert(n,label){t.setRangeText('\n!['+label.replace(/[\[\]\n]/g,'')+']('+ref(n)+')\n',t.selectionStart,t.selectionEnd,'end');t.focus();preview();}
 function draw(){rows.replaceChildren();for(const [n,f] of [...existing,...pending]){if(removed.has(n))continue;const line=make('div','');line.className='report-file';line.append(make('span',f.name||original(n)));if(image.test(n)){const b=make('button','본문 삽입');b.type='button';b.onclick=()=>insert(n,f.name||original(n));line.append(b);}const x=make('button','제거');x.type='button';x.onclick=()=>{if(working)return;if(pending.has(n)){pending.delete(n);URL.revokeObjectURL(blobs.get(n));blobs.delete(n);}else removed.add(n);t.value=t.value.split('\n').filter(l=>!l.includes(ref(n))).join('\n');draw();preview();};line.append(x);rows.append(line);}}
 async function add(files,inline=false){if(working)return;for(const f of files){if(!allowed.test(f.name)||f.size>20*1024*1024||f.size===0){status('지원하지 않는 파일 또는 20MB 초과: '+f.name);continue;}if(existing.size+pending.size>=100){status('최대 100개 첨부 가능');break;}if(/\.md$/i.test(f.name)&&confirm('Markdown 파일의 내용을 본문에 불러올까요?')){t.setRangeText(await f.text(),t.selectionStart,t.selectionEnd,'end');continue;}const n=stored(f);pending.set(n,f);if(image.test(n)){blobs.set(n,URL.createObjectURL(f));if(inline)insert(n,f.name);else{const escaped=f.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');t.value=t.value.replace(new RegExp('!\\[\\['+escaped+'\\]\\]','g'),'!['+f.name.replace(/[\[\]]/g,'')+']('+ref(n)+')');}}}draw();preview();}
 input.onchange=()=>{add([...input.files]);input.value='';};zone.onclick=()=>input.click();for(const target of [zone,t]){target.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});target.addEventListener('drop',e=>{if(e.dataTransfer.files.length){e.preventDefault();add([...e.dataTransfer.files],target===t);}});}t.addEventListener('paste',e=>{const fs=[...e.clipboardData.files].filter(f=>image.test(f.name));if(fs.length){e.preventDefault();add(fs,true);}});
 return {async load(id){for(const r of await list(c,id))existing.set(r.name,r);draw();},async preview(root){for(const im of root.querySelectorAll('img')){const n=refName(im.getAttribute('src'));if(!n)continue;im.removeAttribute('src');if(blobs.has(n))im.src=blobs.get(n);else if(existing.has(n)&&!removed.has(n)){try{im.src=await url(c,getId(),n);}catch{}}}},lock(v){working=v;input.disabled=v;t.readOnly=v;},async save(id){for(const [n,f] of pending){await check(await c.storage.from(bucket).upload(id+'/'+n,f,{contentType:({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',pdf:'application/pdf'})[filename(f)]||'application/octet-stream',upsert:false}));existing.set(n,{name:n});pending.delete(n);} },async cleanup(id){if(removed.size){check(await c.storage.from(bucket).remove([...removed].map(n=>id+'/'+n)));removed.clear();}}};
}
window.ReportFiles={editor,render,list,removeAll:async(c,id)=>{const rows=await list(c,id);if(rows.length)check(await c.storage.from(bucket).remove(rows.map(r=>id+'/'+r.name)));}};
})();