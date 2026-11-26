(() => {
"use strict";
const trigger=document.getElementById("cabin-about-trigger");
if(!trigger)return;
const ADMIN="6e6288e5-3612-4d2f-8d8b-fb08007d86a9";
const defaults={"name": "아현", "major": "컴퓨터공학 · 경찰학", "bio": "정보보안과 디지털 포렌식을 공부하고 있습니다. 사이버수사경찰을 목표로 다양한 경험과 배움을 기록합니다.", "tags": ["Digital Forensics", "Cyber Security", "CTF"], "activities": [{"date": "2026.11", "title": "충북 정보보호 해커톤", "description": "A&D 및 CTF 대회 참가", "url": ""}, {"date": "2026", "title": "KITRI Skill2Work-Seoul", "description": "정보보안 멘토링 참여", "url": ""}, {"date": "2026", "title": "seKUrity", "description": "정보보안 소모임 활동", "url": ""}], "interests": "디지털 포렌식 · 웹 보안 · 사이버수사", "tools": [{"label": "Languages", "value": "C/C++ · Python · Java"}, {"label": "Security", "value": "Ghidra · Wireshark · Burp Suite"}, {"label": "Environment", "value": "Linux · Docker · MySQL"}], "sections": []};
const icons={back:'<path d="M19 12H5m7-7-7 7 7 7"/>',moon:'<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',edit:'<path d="m4 16 12-12 4 4-12 12H4Zm10-10 4 4"/>'};
const icon=n=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;
const dlg=document.createElement("dialog");dlg.id="captain-about";dlg.setAttribute("aria-labelledby","about-heading");
dlg.innerHTML=`<div class="about-wrap"><div class="about-bar"><button class="about-back" type="button">${icon("back")}선장실로 돌아가기</button><div class="about-actions"><button class="about-edit" hidden type="button">${icon("edit")}편집</button><button class="about-theme" type="button" aria-label="테마 전환"></button></div></div><header class="about-header"><svg class="about-emblem" viewBox="0 0 80 90" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="40" cy="38" r="29"/><ellipse cx="40" cy="38" rx="14" ry="29" transform="rotate(35 40 38)"/><ellipse cx="40" cy="38" rx="14" ry="29" transform="rotate(-35 40 38)"/><ellipse cx="40" cy="38" rx="37" ry="10"/><path d="M40 2 V9 M40 67 V78 M26 83 H54 L48 78 H32 Z"/></svg><div><div class="about-kicker">GRAND SECURITY LINE</div><h1 id="about-heading">CAPTAIN'S HISTORY</h1><p>선장의 항해 기록</p></div></header><p class="about-status" role="status"></p><div class="about-content"></div><form class="about-editor" hidden></form></div>`;
document.body.append(dlg);
const q=s=>dlg.querySelector(s), content=q(".about-content"), form=q("form"), edit=q(".about-edit"), theme=q(".about-theme"), status=q(".about-status");
let data=structuredClone(defaults), draft=null, admin=false, ready=false, busy=false, generation=0;
const client=()=>window.MarineClient||(window.MarineClient=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY));
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;return e};
const section=(title)=>{const e=el("section");if(title)e.append(el("h2",title));content.append(e);return e};
const arr=v=>Array.isArray(v)?v:[];
function render(){
 content.replaceChildren();
 let s=section();s.append(el("h2",data.name,"about-name"),el("p",data.major,"about-major"),el("p",data.bio));
 const tags=el("div",null,"about-tags");arr(data.tags).forEach(t=>tags.append(el("span",t)));s.append(tags);
 s=section("이력 및 활동");s.append(el("div","VOYAGE TIMELINE","about-kicker"));
 const list=el("ol",null,"about-timeline");arr(data.activities).forEach(a=>{const li=el("li"), body=el("div");li.append(el("div",a.date,"about-date"),body);body.append(el("strong",a.title),el("p",a.description));try{const u=new URL(a.url);if(["https:","http:"].includes(u.protocol)){const link=el("a","관련 링크");link.href=u.href;link.target="_blank";link.rel="noopener noreferrer";body.append(link)}}catch{}list.append(li)});s.append(list);
 s=section("관심 분야");s.append(el("p",data.interests));
 s=section("기술 및 도구");const dl=el("dl",null,"about-tools");arr(data.tools).forEach(t=>dl.append(el("dt",t.label),el("dd",t.value)));s.append(dl);
 arr(data.sections).forEach(t=>section(t.title).append(el("p",t.body)));
}
function setTheme(t){dlg.dataset.theme=t==="dark"?"dark":"light";theme.innerHTML=icon(t==="dark"?"sun":"moon");try{localStorage.setItem("captain-about-theme",dlg.dataset.theme)}catch{}}
let saved="light";try{saved=localStorage.getItem("captain-about-theme")||saved}catch{}setTheme(saved);
theme.onclick=()=>setTheme(dlg.dataset.theme==="dark"?"light":"dark");
function message(m){status.textContent=m}
function endEdit(){draft=null;form.hidden=true;content.hidden=false;edit.hidden=!(admin&&ready);form.replaceChildren()}
async function load(){
 const g=++generation;admin=false;ready=false;edit.hidden=true;message("항해 기록 불러오는 중…");
 try{
 const c=client();
 const [record,auth]=await Promise.all([c.from("captain_about").select("content").eq("id",1).single(),c.auth.getUser()]);
 if(g!==generation)return;
 if(record.error)throw record.error;
 if(!record.data?.content||typeof record.data.content!=="object")throw Error("저장 데이터 없음");
 data={...structuredClone(defaults),...record.data.content};render();ready=true;admin=!auth.error&&auth.data?.user?.id===ADMIN;edit.hidden=!admin;message("");
 }catch(e){if(g!==generation)return;console.warn("About load",e);message("저장된 기록을 불러오지 못했습니다. 기본 시안을 표시합니다.");}
}
trigger.onclick=()=>{if(dlg.open)return;dlg.showModal();dlg.scrollTop=0;data=structuredClone(defaults);render();endEdit();load();};
function close(){if(busy)return;if(draft&&!confirm("저장하지 않은 변경사항을 버릴까요?"))return;++generation;endEdit();dlg.close();trigger.focus()}
q(".about-back").onclick=close;dlg.addEventListener("cancel",e=>{e.preventDefault();close()});
function button(label,fn,parent){const b=el("button",label);b.type="button";b.onclick=fn;parent.append(b);return b}
function field(parent,label,value,change,multi=false){const l=el("label",label),i=el(multi?"textarea":"input");i.value=value??"";i.maxLength=multi?5000:500;i.oninput=()=>change(i.value);l.append(i);parent.append(l)}
function group(title,key,fields,blank){
 const box=el("section");box.append(el("h2",title));form.append(box);
 draft[key].forEach((item,i)=>{const f=el("fieldset");f.append(el("legend",`${title} ${i+1}`));fields.forEach(([k,label,multi])=>field(f,label,item[k],v=>item[k]=v,multi));const actions=el("div",null,"about-actions");f.append(actions);
 button("위로",()=>{[draft[key][i-1],draft[key][i]]=[draft[key][i],draft[key][i-1]];editor()},actions).disabled=i===0;
 button("아래로",()=>{[draft[key][i+1],draft[key][i]]=[draft[key][i],draft[key][i+1]];editor()},actions).disabled=i===draft[key].length-1;
 button("삭제",()=>{draft[key].splice(i,1);editor()},actions);box.append(f)});
 button("추가",()=>{draft[key].push({...blank});editor()},box);
}
function editor(){
 form.replaceChildren();const b=el("section");b.append(el("h2","기본 정보"));form.append(b);
 [["name","이름"],["major","전공"],["bio","자기소개",true],["interests","관심 분야",true]].forEach(([k,l,m])=>field(b,l,draft[k],v=>draft[k]=v,m));
 field(b,"태그 (쉼표로 구분)",draft.tags.join(", "),v=>draft.tags=v.split(",").map(x=>x.trim()).filter(Boolean));
 group("이력 및 활동","activities",[["date","날짜"],["title","활동명"],["description","설명",true],["url","관련 링크"]],{date:"",title:"",description:"",url:""});
 group("기술 및 도구","tools",[["label","분류"],["value","기술명"]],{label:"",value:""});
 group("추가 섹션","sections",[["title","제목"],["body","내용",true]],{title:"",body:""});
 const actions=el("div",null,"about-actions");form.append(actions);const save=el("button","변경사항 저장");save.type="submit";actions.append(save);button("취소",()=>{if(confirm("변경사항을 버릴까요?"))endEdit()},actions);
}
edit.onclick=()=>{if(!admin||!ready)return;draft=structuredClone(data);["tags","activities","tools","sections"].forEach(k=>draft[k]=arr(draft[k]));content.hidden=true;form.hidden=false;edit.hidden=true;editor()};
form.onsubmit=async e=>{e.preventDefault();if(!draft||!admin||busy)return;if(!draft.name.trim()){message("이름을 입력해 주세요.");return}busy=true;const controls=[...form.querySelectorAll("button,input,textarea")];controls.forEach(x=>x.disabled=true);message("저장 중…");try{const c=client(),a=await c.auth.getUser();if(a.error||a.data?.user?.id!==ADMIN)throw Error("관리자 인증 필요");const r=await c.from("captain_about").update({content:draft}).eq("id",1).select("id").single();if(r.error)throw r.error;data=structuredClone(draft);render();endEdit();message("저장했습니다.");}catch(e){console.warn("About save",e);message("저장 실패. 관리자 로그인과 SQL 설정을 확인해 주세요.");}finally{busy=false;if(draft)editor()}};
})();
