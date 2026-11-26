/*
 * MARINE OS v2.0
 *
 * 해군 본부 기밀 통신망
 * marine-chat.js
 *
 * 개인 통신 / 단체 통신
 * 자동 답장 / 일정 초대
 * 메시지 고정 / 스티커 메모
 */

(() => {

    "use strict";

    const uid =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    // =========================================
    // 01. 공통 함수
    // =========================================

    const node = (tag, text, cls) => {

        const n = document.createElement(tag);

        if (text != null) {

            n.textContent = text;

        }

        if (cls) {

            n.className = cls;

        }

        return n;

    };


    const ok = r => {

        if (r.error) {

            throw r.error;

        }

        return r.data;

    };


    // =========================================
    // 02. 메신저 디자인
    // =========================================

    function styles() {

        if (

            document.getElementById(
                "marine-chat-style"
            )

        ) {

            return;

        }


        const s = node("style");

        s.id = "marine-chat-style";


        s.textContent = `

            .mc-shell {

                display: grid;

                grid-template-columns:
                    minmax(145px, 29%)
                    minmax(0, 1fr);

                height: 100%;
                min-height: 320px;

                background: #111B27;
                color: #DCE5EE;

                font: 13px/1.6
                    "Malgun Gothic",
                    "Noto Sans KR",
                    sans-serif;

            }


            .mc-side,
            .mc-main {

                min-height: 0;
                min-width: 0;

                display: flex;
                flex-direction: column;

            }


            .mc-side {

                background: #192634;

                border-right: 1px solid #425365;

                padding: 10px;

                gap: 7px;

            }


            .mc-contacts {

                overflow: auto;
                flex: 1;

            }


            .mc-shell h3 {

                font-size: 11px;
                color: #A9BBCD;

                margin: 14px 0 6px;

            }


            .mc-shell button {

                background: #293B4E;
                color: #E4EDF5;

                border: 1px solid #526577;

                border-radius: 3px;

                padding: 6px 9px;

                cursor: pointer;

            }


            .mc-shell button:hover {

                background: #3B5065;

            }


            .mc-contacts button {

                display: flex;

                align-items: center;

                gap: 8px;

                width: 100%;

                text-align: left;

                margin: 3px 0;

                border-color: transparent;

                background: transparent;

                overflow-wrap: anywhere;

            }


            .mc-contacts button.mc-active {

                background: #34495D;

                border-color:
                    var(--accent, #7493AE);

            }


            .mc-avatar {

                width: 30px;
                height: 30px;

                flex: none;

                border-radius: 50%;

                object-fit: cover;

                background: #41566C;

                display: grid;

                place-items: center;

            }


            .mc-main > header {

                padding: 12px;

                border-bottom:
                    1px solid #425365;

                background: #233448;

                display: flex;

                gap: 8px;

                align-items: center;

                flex-wrap: wrap;

            }


            .mc-log {

                flex: 1;

                overflow: auto;

                padding: 14px;

                min-height: 0;

            }


            .mc-message {

                display: flex;

                gap: 8px;

                margin: 12px 0;

                align-items: flex-start;

            }


            .mc-message.mc-out {

                justify-content: flex-end;

            }


            .mc-bubble {

                max-width: 85%;
                min-width: 0;

                background: #263747;

                padding: 9px 12px;

                border-radius: 7px;

                overflow-wrap: anywhere;

            }


            .mc-out .mc-bubble {

                background: #36516B;

            }


            .mc-bubble p {

                white-space: pre-wrap;

                margin: 5px 0;

            }


            .mc-shell small {

                color: #AFC0D0;

                font-size: 11px;

            }


            .mc-actions {

                display: flex;

                gap: 5px;

                flex-wrap: wrap;

                margin-top: 5px;

            }


            .mc-actions button {

                font-size: 11px;

                padding: 3px 6px;

            }


            .mc-form {

                display: flex;

                gap: 8px;

                padding: 10px;

                border-top:
                    1px solid #425365;

            }


            .mc-shell input {

                min-width: 0;

                background: #101B28;

                color: #EDF3FA;

                border: 1px solid #526577;

                padding: 8px;

            }


            .mc-form input {

                flex: 1;

            }


            .mc-status,
            .mc-reply {

                padding: 4px 12px;

            }


            .mc-reply {

                background: #263747;

            }


            .mc-shell button:disabled {

                opacity: .5;

                cursor: default;

            }


            .mc-shell [hidden] {

                display: none !important;

            }


            @media (max-width: 550px) {

                .mc-shell {

                    grid-template-columns:
                        115px minmax(0, 1fr);

                }

                .mc-side {

                    padding: 5px;

                }

                .mc-avatar {

                    width: 22px;
                    height: 22px;

                }

                .mc-log {

                    padding: 7px;

                }

            }

        `;


        document.head.append(s);

    }


    // =========================================
    // 03. 메신저 실행 및 관리자 인증
    // =========================================

    async function mount(root, client) {

        const auth = async () => {

            const user = ok(

                await client.auth.getUser()

            ).user;


            if (user?.id !== uid) {

                throw new Error(
                    "접근 권한 없음"
                );

            }

        };


        await auth();

        let templates = [];
        async function loadTemplates(){templates=ok(await client.from("marine_dialogue_templates").select("*"));}
        await loadTemplates();
        styles();

        root.replaceChildren();


        // =====================================
        // 04. 기본 화면 구성
        // =====================================

        const shell = node(

            "div", null, "mc-shell"

        );


        const side = node(

            "aside", null, "mc-side"

        );


        const main = node(

            "section", null, "mc-main"

        );


        // 연락처 검색

        const search = node("input");

        search.placeholder = "통신망 검색";

        search.type = "search";


        const contactsBox = node(

            "div", null, "mc-contacts"

        );


        side.append(

            search,

            contactsBox

        );


        // 채팅방 상단

        const header = node("header");


        const heading = node(

            "strong",

            "기밀 통신"

        );


        const mute = node(

            "button",

            "알림 음소거"

        );


        header.append(

            heading,

            mute

        );


        const reset = node("button", "대화 초기화");
        reset.type = "button";
        const scenarioButton = node("button", "시나리오 관리");
        scenarioButton.type = "button";
        scenarioButton.onclick = () => {
            if (!window.MarineWindows?.open) return alert("창 관리 기능을 불러오지 못했습니다.");
            window.MarineWindows.open({id:"marine-scenario-manager", title:"해군 통신 시나리오 관리", url:"/blog/admin/?scenario=1&v=6", width:900, height:650});
        };
        const editorButton = node("button", "통합 대사 관리");
        editorButton.type="button"; editorButton.onclick=()=>action(openDialogueEditor);
        header.append(editorButton, scenarioButton, reset);
        reset.onclick = async () => {
            if (busy || stopped || reset.disabled) return;
            if (!confirm("모든 대화방의 메시지를 삭제할까요? 직접 보낸 메시지와 캐릭터 메시지, 예약 메시지도 삭제되며 복구할 수 없습니다.")) return;
            reset.disabled = true;
            busy = true;
            try {
                const {data, error} = await client.auth.getUser();
                if (error) throw error;
                if (data.user?.id !== uid) throw new Error("관리자만 초기화할 수 있습니다.");
                const result = ok(await client.rpc("marine_clear_messages"));
                rows = [];
                replyTo(null);
                last = "";
                actionStatus = "대화 기록 초기화 완료 (" + result + "개 삭제)";
                render();
                status.textContent = actionStatus;
            } catch (error) {
                status.textContent = "초기화 실패: " + error.message;
            } finally {
                busy = false;
                reset.disabled = false;
                await refresh();
            }
        };

        // 채팅 기록

        const log = node(

            "div", null, "mc-log"

        );


        const status = node(

            "small", "", "mc-status"

        );


        // 답장 대상 표시 영역

        const replyBar = node(

            "div", null, "mc-reply"

        );


        replyBar.hidden = true;


        // 메시지 입력 영역

        const form = node(

            "form", null, "mc-form"

        );


        const input = node("input");

        input.placeholder = "기밀 통신 입력...";

        input.maxLength = 2000;


        const send = node(

            "button",

            "전송"

        );


        send.type = "submit";


        form.append(

            input,

            send

        );


        main.append(

            header,

            log,

            status,

            replyBar,

            form

        );


        shell.append(side, main);

        root.append(shell);


        // =====================================
        // 05. 채팅방 및 캐릭터 조회
        // =====================================

        const [rooms, chars] = await Promise.all([

            client

                .from("marine_rooms")

                .select("*")

                .eq("archived", false)

                .order("created_at")

                .then(ok),


            client

                .from("marine_characters")

                .select("*")

                .order("name")

                .then(ok)

        ]);


        // =====================================
        // 06. 연락처 목록 구성
        // =====================================

        const contacts = [

            // 개인 연락처

            ...chars.map(c => ({

                key: c.character_key,

                name: c.alias || c.name,

                aliases: [

                    c.name,

                    c.character_key,

                    c.alias

                ].filter(Boolean),

                avatar: c.avatar_url,

                character: true

            })),


            // 행정 부서

            ...[

                "인사관리과",

                "중앙 기록국"

            ].map(name => ({

                key: name,

                name,

                aliases: [name]

            })),


            // 단체 채팅방

            ...rooms.map(r => ({

                key: r.id,

                name: r.name,

                room: true,

                muted: r.muted

            }))

        ];


        let active = contacts[0];

        let rows = [];

        let events = {};

        let busy = false;

        let timer;

        let last = "";
        let quickChoice=null;

        let replying = null;

        let stopped = false;

        let actionStatus = "";


        // =====================================
        // 07. 메시지와 연락처 연결
        // =====================================

        const matches = (m, c) =>

            c.room

                ? m.room_id === c.key

                : !m.room_id && (

                    c.aliases.includes(m.sender)

                    || m.metadata?.contact === c.key

                    || m.metadata?.character_key === c.key

                );


        // =====================================
        // 08. 캐릭터 프로필 사진
        // =====================================

        const avatar = (name, url) => {

            const fallback = node(

                "span",

                name.slice(0, 1),

                "mc-avatar"

            );


            if (

                url

                && /^https:\/\//i.test(url)

            ) {

                const img = node(

                    "img",

                    null,

                    "mc-avatar"

                );


                img.src = url;

                img.alt = "";


                img.onerror = () =>

                    img.replaceWith(fallback);


                return img;

            }


            return fallback;

        };


        // =====================================
        // 09. 메시지 답장 기능
        // =====================================

        function replyTo(m) {

            replying = m;


            if (!m) {

                replyBar.hidden = true;

                replyBar.replaceChildren();

                return;

            }


            replyBar.replaceChildren(

                node(

                    "small",

                    `${m.sender}: ${m.content.slice(0, 90)}`

                )

            );


            const cancel = node(

                "button",

                "취소"

            );


            cancel.onclick = () =>

                replyTo(null);


            replyBar.append(cancel);

            replyBar.hidden = false;

            input.focus();

        }


        // =====================================
        // 10. 왼쪽 연락처 목록
        // =====================================

        function renderSide() {

            contactsBox.replaceChildren();


            const keyword =

                search.value

                    .trim()

                    .toLowerCase();


            for (const group of [false, true]) {

                contactsBox.append(

                    node(

                        "h3",

                        group

                            ? "단체 통신"

                            : "개인 통신"

                    )

                );


                const filtered = contacts.filter(

                    c => Boolean(c.room) === group

                );


                for (const c of filtered) {

                    const names = [

                        c.name,

                        ...(c.aliases || [])

                    ].join(" ").toLowerCase();


                    if (

                        keyword

                        && !names.includes(keyword)

                    ) {

                        continue;

                    }


                    // 미확인 메시지 개수

                    const count = rows.filter(m =>

                        matches(m, c)

                        && m.direction === "incoming"

                        && !m.read_at

                    ).length;


                    const b = node(

                        "button",

                        null,

                        c === active

                            ? "mc-active"

                            : ""

                    );


                    let label = c.name;


                    if (c.muted) {

                        label += " · 음소거";

                    }


                    if (count) {

                        label += ` (${count})`;

                    }


                    b.append(

                        avatar(c.name, c.avatar),

                        node("span", label)

                    );


                    b.onclick = () => {

                        active = c;

                        last = "";

                        replyTo(null);

                        render();

                        refresh();

                    };


                    contactsBox.append(b);

                }

            }

        }


        search.oninput = renderSide;


        // =====================================
        // 11. 공통 버튼 및 오류 처리
        // =====================================

        async function action(fn) {

            try {

                await auth();

                await fn();

            } catch (e) {

                status.textContent = e.message;

            }

        }


        function button(text, fn) {

            const b = node("button", text);

            b.type = "button";


            b.onclick = () => action(async () => {

                b.disabled = true;


                try {

                    await fn();

                } finally {

                    b.disabled = false;

                }

            });


            return b;

        }


        // =====================================
        // 12. 채팅 기록 화면 표시
        // =====================================

async function openDialogueEditor(){
 const dialog=document.createElement("dialog"); dialog.className="marine-dialogue-center";
 const style=document.createElement("style");style.textContent=`
 .marine-dialogue-center{width:min(1080px,94vw);height:min(780px,88vh);max-width:94vw;max-height:88vh;padding:0;border:1px solid #a99b91;border-radius:9px;background:#f5f3f1;color:#243247;font-family:Pretendard, sans-serif;overflow:hidden}
 .marine-dialogue-center[open]{display:flex;flex-direction:column}.marine-dialogue-center *{box-sizing:border-box}.marine-dialogue-center::backdrop{background:#20151499}
 .marine-dialogue-center .md-head{display:flex;align-items:center;justify-content:space-between;background:#512c29;color:white;padding:14px 20px;flex-shrink:0}.md-head h2{font-size:19px;margin:0;color:inherit}.marine-dialogue-center .md-layout{display:flex;flex:1;min-height:0}.marine-dialogue-center .md-nav{width:190px;flex-shrink:0;padding:12px 8px;background:#eae5e1;border-right:1px solid #d4ccc5;overflow:auto}.marine-dialogue-center .md-nav button{display:block;width:100%;text-align:left;margin:3px 0;background:transparent;border-color:transparent}.marine-dialogue-center .md-nav button[aria-current=true]{background:#512c29;color:white}.marine-dialogue-center .md-main{flex:1;min-width:0;display:flex;flex-direction:column}.marine-dialogue-center .md-toolbar{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #ded8d2;background:#fff}.marine-dialogue-center .md-list{overflow:auto;padding:12px 18px;flex:1;min-height:0}.marine-dialogue-center .md-status{margin:0;padding:8px 18px;min-height:32px;font-size:13px;color:#405773}.marine-dialogue-center button{font:inherit;font-size:13px;padding:7px 11px;border:1px solid #b6bdc6;border-radius:5px;background:#f5f6f7;color:#243247;cursor:pointer;margin:3px 5px 3px 0}.marine-dialogue-center button:hover{filter:brightness(.95)}.marine-dialogue-center .md-save{background:#405773;color:white;border-color:#405773}.marine-dialogue-center input:not([type=checkbox]),.marine-dialogue-center textarea,.marine-dialogue-center select{font:inherit;font-size:14px;padding:7px 9px;border:1px solid #c4cbd2;border-radius:5px;background:white;color:#243247}.marine-dialogue-center textarea{min-height:44px;resize:vertical}.marine-dialogue-center section{background:white}.marine-dialogue-center h3{font-size:16px;margin:0 0 12px}.marine-dialogue-center details{border:1px solid #d5dbe3;border-radius:6px;margin:8px 0;background:#fff}.marine-dialogue-center summary{cursor:pointer;padding:10px 12px;font-size:14px;overflow-wrap:anywhere}.marine-dialogue-center .md-choice-body{padding:0 12px 10px}.marine-dialogue-center .md-sub{border-left:2px solid #cbd3df;padding-left:9px;margin-top:5px}.marine-dialogue-center .md-actions{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}.marine-dialogue-center .md-list section>label{margin-right:12px}.marine-dialogue-center .md-list section>button{margin-top:10px}.marine-dialogue-center .md-danger{color:#963e35}.marine-dialogue-center .md-empty{color:#677485;font-size:12px;margin:5px 0}.marine-dialogue-center .md-head button{background:transparent;color:white;border-color:#ae928c;margin:0}@media(max-width:650px){.marine-dialogue-center .md-layout{flex-direction:column}.marine-dialogue-center .md-nav{width:100%;display:flex;overflow:auto;flex-shrink:0;border-right:0;border-bottom:1px solid #d4ccc5;padding:5px}.marine-dialogue-center .md-nav button{width:auto;white-space:nowrap}.marine-dialogue-center .md-toolbar,.marine-dialogue-center .md-list{padding:9px}}
 `;dialog.append(style);document.body.append(dialog);dialog.addEventListener("close",()=>dialog.remove());
 const head=node("div",null,"md-head");head.append(node("h2","통합 대사 관리"));const close=node("button","닫기");close.onclick=()=>dialog.close();head.append(close);dialog.append(head);
 const layout=node("div",null,"md-layout"),nav=node("nav",null,"md-nav"),main=node("div",null,"md-main"),toolbar=node("div",null,"md-toolbar");const scopes=document.createElement("select"),list=node("div",null,"md-list"),msg=node("p",null,"md-status"),heading=node("strong");msg.setAttribute("role","status");
 const menus=[["dialogues","기본 대사"],["quick","먼저 연락하기"],["auto","자동 연락 대사"],["reports","보고서 알림"],["promotion","진급 및 인사"],["scenarios","개인·단체 시나리오"],["conditions","자동 연락 조건"]];let selected="quick";const navButtons=[];
 for(const [v,l] of menus){const button=node("button",l);button.type="button";button.onclick=()=>{selected=v;draw();};navButtons.push([v,button]);nav.append(button);}
 scopes.add(new Option("공통 설정","*")); for(const c of chars)scopes.add(new Option(c.name,c.character_key));toolbar.append(heading,scopes);main.append(toolbar,list,msg);layout.append(nav,main);dialog.append(layout);
 const events={quick:"먼저 연락하기",lunch:"점심",dinner:"저녁",work:"업무 확인",daily:"일상",post_create:"보고서 작성",post_update:"보고서 수정",promotion:"진급 축하",promotion_notice:"인사 발령"};
 const field=(label,value,multi=false)=>{const wrap=node("label",label);wrap.style.cssText="display:block;margin:8px 0";const input=document.createElement(multi?"textarea":"input");input.value=value??"";input.style.cssText="display:block;width:100%;box-sizing:border-box";if(multi)input.rows=2;wrap.append(input);return [wrap,input];};
 function validateChoices(a,depth=0){if(!Array.isArray(a)||depth>12)throw Error("선택지 배열 형식 오류");for(const x of a){if(typeof x==="string")continue;if(!x||typeof x.label!=="string"||!x.label.trim()||(x.response!==undefined&&typeof x.response!=="string"))throw Error("선택지에는 label과 response 문자열을 사용하세요");if(x.choices!==undefined)validateChoices(x.choices,depth+1);}return a;}
 function choiceEditor(initial){
 const host=node("div"); const values=structuredClone(initial||[]);
 function paint(parent,items,depth){parent.replaceChildren();items.forEach((raw,i)=>{const x=typeof raw==="string"?{label:raw}:raw;items[i]=x;const box=node("details");box.open=i===0;const summary=node("summary",`선택지 ${i+1} · ${x.label||x.text||"새 선택지"}`);const body=node("div",null,"md-choice-body");box.append(summary,body);const [lw,l]=field("내 답장",x.label??x.text??"");const [rw,r]=field("캐릭터 후속 답장",x.response??"",true);l.oninput=()=>{x.label=l.value;summary.textContent=`선택지 ${i+1} · ${l.value||"새 선택지"}`;};r.oninput=()=>{x.response=r.value;};if(!x.label)x.label=x.text??"";body.append(lw,rw);if(!x.response)body.append(node("p","빈 답장은 기존 응답 로직에 맡길 수 있습니다.","md-empty"));const del=node("button","선택지 삭제","md-danger");del.onclick=()=>{if(confirm("후속 선택지도 삭제할까요?")){items.splice(i,1);paint(parent,items,depth);}};body.append(del);if(depth<11){const sub=node("div",null,"md-sub");if(!Array.isArray(x.choices))x.choices=[];paint(sub,x.choices,depth+1);body.append(sub);}parent.append(box);});if(depth<12){const add=node("button",depth?"+ 후속 선택지 추가":"+ 선택지 추가");add.onclick=()=>{items.push({label:"",response:"",choices:[]});paint(parent,items,depth);const last=Array.from(parent.children).filter(e=>e.tagName==="DETAILS").pop();if(last){last.open=true;last.querySelector("input")?.focus();}};parent.append(add);}}
 paint(host,values,0);return [host,()=>validateChoices(values)];
 }
 async function drawConditions(){const rows=ok(await client.from("marine_auto_rules").select("*").order("priority"));for(const r of rows){const box=node("section");box.style.cssText="border:1px solid #c4ccd5;padding:12px;margin:10px 0";box.append(node("h3",events[r.event_key]||r.event_key));const en=document.createElement("input");en.type="checkbox";en.checked=r.enabled;const el=node("label","자동 연락 활성화 ");el.append(en);box.append(el);const sender=document.createElement("select");for(const [v,l] of [["@commander","담당 상관"],["@random","무작위 캐릭터"],...chars.map(c=>[c.character_key,c.name])])sender.add(new Option(l,v));sender.value=r.sender_key;const sl=node("label","발신자 ");sl.append(sender);box.append(sl);const inputs={};for(const [k,l,type] of [["start_time","시작 시간 (한국)","time"],["end_time","종료 시간 (한국, 동일하면 하루 종일)","time"],["probability","시간당 발생 확률 (%)","number"],["daily_limit","하루 최대 횟수","number"],["cooldown_minutes","최소 간격 (분)","number"],["inactive_days","보고서 미작성 기간 (일, 업무 확인만)","number"]]){const [w,i]=field(l,type==="time"?String(r[k]).slice(0,5):r[k]);i.type=type;inputs[k]=i;box.append(w);}const save=node("button","조건 저장","md-save");save.onclick=async()=>{try{const data={enabled:en.checked,sender_key:sender.value};for(const [k,i] of Object.entries(inputs)){if(!i.value)throw Error("모든 조건을 입력하세요.");data[k]=i.type==="number"?Number(i.value):i.value;}ok(await client.from("marine_auto_rules").update(data).eq("event_key",r.event_key));msg.textContent="조건 저장 완료";}catch(e){msg.textContent=e.message;}};box.append(save);list.append(box);}}
 async function drawKeywords(key){
 const title=node("h3","키워드 자동 응답");list.append(title,node("p","캐릭터 전용 규칙 우선 · 숫자가 작은 우선순위부터 적용 · 쉼표로 키워드 구분. 공통 규칙은 모든 캐릭터에 적용됩니다.","md-empty"));
 const rows=ok(await client.from("marine_keyword_rules").select("*").eq("character_key",key).order("priority"));
 const host=node("div");list.append(host);
 function rule(r){const box=node("section");box.style.cssText="border:1px solid #c4ccd5;border-radius:6px;padding:12px;margin:10px 0";
 const [tw,t]=field("대화 분류 이름",r.title),[kw,k]=field("반응 키워드 (쉼표 구분)",(r.keywords||[]).join(", ")),[pw,p]=field("우선순위 (작을수록 먼저)",r.priority??100);p.type="number";
 const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=r.enabled!==false;const en=node("label","활성화 ");en.append(enabled);box.append(tw,kw,pw,en);
 const responses=node("div"),editors=[];box.append(responses);
 function addResponse(raw={content:"",choices:[]}){const d=node("details");d.open=true;const summary=node("summary",raw.content||"새 답장");const body=node("div",null,"md-choice-body");const [cw,c]=field("캐릭터 답장",raw.content,true),[jw,read]=choiceEditor(raw.choices||[]);c.oninput=()=>summary.textContent=c.value||"새 답장";const item={c,read};editors.push(item);const rm=node("button","답장 삭제","md-danger");rm.onclick=()=>{editors.splice(editors.indexOf(item),1);d.remove();};body.append(cw,jw,rm);d.append(summary,body);responses.append(d);}
 for(const x of r.responses||[])addResponse(x);if(!editors.length)addResponse();const add=node("button","+ 랜덤 답장 추가");add.onclick=()=>addResponse();box.append(add);
 const save=node("button","키워드 규칙 저장","md-save");save.onclick=async()=>{try{const keywords=[...new Set(k.value.split(/[,，\n]+/).map(x=>x.trim()).filter(Boolean))];const priority=Number(p.value);const data={character_key:key,title:t.value.trim(),keywords,priority,enabled:enabled.checked,responses:editors.map(x=>({content:x.c.value.trim(),choices:x.read()}))};if(!data.title||!keywords.length||!p.value||!Number.isSafeInteger(priority)||!data.responses.length||data.responses.some(x=>!x.content))throw Error("분류, 키워드, 정수 우선순위와 답장을 입력하세요.");if(r.id)ok(await client.from("marine_keyword_rules").update(data).eq("id",r.id));else ok(await client.from("marine_keyword_rules").insert(data));await draw();msg.textContent="키워드 규칙 저장 완료";}catch(e){msg.textContent=e.message;}};box.append(save);
 const del=node("button","규칙 삭제","md-danger");del.onclick=async()=>{if(!confirm("이 규칙을 삭제할까요?"))return;try{if(r.id)ok(await client.from("marine_keyword_rules").delete().eq("id",r.id));box.remove();msg.textContent="삭제 완료";}catch(e){msg.textContent=e.message;}};box.append(del);host.append(box);}
 for(const r of rows)rule(r);const add=node("button","+ 키워드 대화 분류 추가");add.onclick=()=>rule({});list.append(add);
 }
 async function draw(){list.replaceChildren();msg.textContent="";try{
 const mode=["quick","auto","reports","promotion"].includes(selected)?"templates":selected; const key=scopes.value;heading.textContent=menus.find(x=>x[0]===selected)[1];for(const [v,b] of navButtons)b.setAttribute("aria-current",String(v===selected));scopes.hidden=mode==="scenarios"||mode==="conditions"; scopes.disabled=mode==="scenarios"||mode==="conditions";
 if(mode==="conditions"){await drawConditions();return;}
 if(mode==="scenarios"){const b=node("button","기존 시나리오 편집기 열기");b.onclick=()=>{dialog.close();scenarioButton.click();};list.append(b);return;}
 if(mode==="templates"){await loadTemplates();for(const [event,label] of Object.entries(events)){if(!({quick:["quick"],auto:["lunch","dinner","work","daily"],reports:["post_create","post_update"],promotion:["promotion","promotion_notice"]}[selected]||[]).includes(event))continue;const own=templates.find(t=>t.character_key===key&&t.event_key===event);const base=own||templates.find(t=>t.character_key==="*"&&t.event_key===event);if(base)card(base,label,mode,key,!!own);} }
 else {try{await drawKeywords(key);}catch(e){list.append(node("p","키워드 설정 조회 실패: "+e.message));}if(key==="*"){return;}list.append(node("h3","기존 기본 대사"));const rows=ok(await client.from("marine_dialogues").select("*").eq("character_key",key).order("category"));for(const r of rows)card(r,r.category,mode,key,true);const b=node("button","기본 대사 추가");b.onclick=()=>card({category:"default",content:"",choices:[],enabled:true},"새 대사",mode,key,false);list.append(b);}
 }catch(e){msg.textContent=e.message;}}
 function card(r,label,mode,key,own){const box=node("section");box.style.cssText="border:1px solid #c4ccd5;border-radius:6px;padding:12px;margin:12px 0";box.append(node("h3",label+(own?"":" · 공통값 상속")));const [cw,content]=field("대사 ({title}: 보고서 제목, {original}: 기존 알림)",r.content,true);const [jw,readChoices]=choiceEditor(r.choices||[]);const [kw,category]=field("분류",r.category||"default");const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=r.enabled!==false;const el=node("label","활성화 ");el.append(enabled);if(mode==="dialogues")box.append(kw);box.append(cw,jw,el);const save=node("button","변경사항 저장","md-save");save.onclick=async()=>{try{const data={content:content.value,choices:readChoices(),enabled:enabled.checked};if(mode==="templates")ok(await client.from("marine_dialogue_templates").upsert({...data,character_key:key,event_key:r.event_key}));else if(r.id)ok(await client.from("marine_dialogues").update({...data,category:category.value}).eq("id",r.id));else ok(await client.from("marine_dialogues").insert({...data,character_key:key,category:category.value}));await draw();last="";render();msg.textContent="저장 완료";}catch(e){msg.textContent=e.message;}};box.append(save);if(own&&(mode==="dialogues"||key!=="*")){const del=node("button",mode==="templates"?"공통 설정으로 복원":"삭제");del.onclick=async()=>{if(!confirm("이 설정을 삭제할까요?"))return;try{if(mode==="templates")ok(await client.from("marine_dialogue_templates").delete().eq("character_key",key).eq("event_key",r.event_key));else if(r.id)ok(await client.from("marine_dialogues").delete().eq("id",r.id));await draw();last="";render();}catch(e){msg.textContent=e.message;}};box.append(del);}list.append(box);}
 scopes.onchange=draw;dialog.showModal();await draw();
}

function renderQuickReplies(shown) {

    let panel = root.querySelector(
        ".mc-quick-replies"
    );

    if (!panel) {

        panel = node(
            "section",
            null,
            "mc-quick-replies"
        );

        form.insertAdjacentElement(
            "beforebegin",
            panel
        );

    }

    panel.replaceChildren();


    // 가장 최근에 받은 메시지

    const latest = [...shown]
        .reverse()
        .find(m => m.direction === "incoming");


    const choices = Array.isArray(latest?.choices)
        ? latest.choices
        : [];


    // 이미 답장했는지 확인

    const answered = latest && shown
        .slice(shown.indexOf(latest) + 1)
        .some(m => m.direction === "outgoing");


    if (!latest || !choices.length || answered) {

        if(active?.character && !active.room) {
            panel.hidden=false;
            panel.append(node("small","먼저 연락하기","mc-quick-title"));
            const buttons=node("div",null,"mc-quick-buttons");
            const template=templates.find(t=>t.event_key==="quick"&&t.character_key===active.key)||templates.find(t=>t.event_key==="quick"&&t.character_key==="*");
            for(const choice of template?.enabled ? template.choices : []) {const label=choice.label; if(!label)continue; const b=node("button",label);b.type="button";b.onclick=()=>{replyTo(null);quickChoice=choice;input.value=label;form.requestSubmit();};buttons.append(b);}
            panel.append(buttons);
        } else panel.hidden=true;
        return;

    }


    panel.hidden = false;


    panel.append(
        node(
            "small",
            "추천 답장",
            "mc-quick-title"
        )
    );


    const buttons = node(
        "div",
        null,
        "mc-quick-buttons"
    );


    for (const choice of choices) {

        const label =
            typeof choice === "string"
                ? choice
                : choice?.label || choice?.text;


        if (
            typeof label !== "string"
            || !label.trim()
        ) {
            continue;
        }


        const b = node("button", label);

        b.type = "button";


        b.onclick = () => {

            replyTo(latest);

            input.value = label;

            form.requestSubmit();

        };


        buttons.append(b);

    }


    panel.append(buttons);

    panel.hidden = !buttons.children.length;

}

        function render() {

            renderSide();


            if (!active) {

                return;

            }


            heading.textContent = active.name;


            mute.hidden = !active.room;


            mute.textContent = active.muted

                ? "음소거 해제"

                : "알림 음소거";


            const shown = rows.filter(

                m => matches(m, active)

            );
renderQuickReplies(shown);

            const signature = JSON.stringify([

                active.key,

                shown.map(m => [

                    m.id,

                    m.pinned

                ]),

                events

            ]);


            if (signature === last) {

                return;

            }


            const bottom =

                !last

                || log.scrollHeight

                    - log.scrollTop

                    - log.clientHeight < 80;


            last = signature;

            log.replaceChildren();


            // =================================
            // 개별 메시지 표시
            // =================================

            for (const m of shown) {

                const outgoing =

                    m.direction === "outgoing";


                const wrap = node(

                    "article",

                    null,

                    "mc-message"

                    + (outgoing ? " mc-out" : "")

                );


                const body = node(

                    "div",

                    null,

                    "mc-bubble"

                );


                const c = chars.find(x =>

                    x.character_key

                        === m.metadata?.character_key

                    || x.name === m.sender

                    || x.alias === m.sender

                );


                if (!outgoing) {

                    wrap.append(

                        avatar(

                            c?.alias || m.sender,

                            c?.avatar_url

                        )

                    );

                }


                const senderName = outgoing

                    ? "나"

                    : c?.alias || m.sender;


                body.append(

                    node(

                        "small",

                        senderName

                        + (m.pinned ? " · 고정됨" : "")

                    )

                );


                // 이전 메시지 인용

                if (m.reply_to) {

                    const original = rows.find(

                        x => x.id === m.reply_to

                    );


                    body.append(

                        node(

                            "small",

                            " ↳ "

                            + (

                                original?.content.slice(0, 90)

                                || "이전 메시지"

                            )

                        )

                    );

                }


                // 메시지 본문 및 도착 시간

                body.append(

                    node("p", m.content),

                    node(

                        "small",

                        new Date(

                            m.deliver_at

                        ).toLocaleString("ko-KR")

                    )

                );


                const actions = node(

                    "div",

                    null,

                    "mc-actions"

                );


                // =================================
                // 13. 답장 버튼
                // =================================

                actions.append(

                    button(

                        "답장",

                        () => replyTo(m)

                    )

                );


                // =================================
                // 14. 중요 메시지 고정
                // =================================

                actions.append(

                    button(

                        m.pinned

                            ? "고정 해제"

                            : "고정",

                        async () => {

                            ok(

                                await client

                                    .from("marine_messages")

                                    .update({

                                        pinned: !m.pinned

                                    })

                                    .eq("id", m.id)

                                    .eq("user_id", uid)

                            );


                            m.pinned = !m.pinned;

                            last = "";

                            render();

                        }

                    )

                );


                // =================================
                // 15. 메시지를 스티커 메모로 저장
                // =================================

                actions.append(

                    button(

                        "메모 저장",

                        async () => {

                            ok(

                                await client

                                    .from("marine_notes")

                                    .insert({

                                        user_id: uid,

                                        title:

                                            "기밀 통신 · "

                                            + m.sender,

                                        content: m.content,

                                        pinned: true

                                    })

                            );


                            window.dispatchEvent(

                                new CustomEvent(

                                    "marine:notes-changed"

                                )

                            );


                            actionStatus =

                                "스티커 메모로 저장했습니다.";


                            status.textContent =

                                actionStatus;

                        }

                    )

                );


                // =================================
                // 16. 일정 초대 및 참석 여부
                // =================================

                const event =

                    events[m.metadata?.event_id];


                if (event) {

                    body.append(

                        node(

                            "p",

                            `${event.title}\n`

                            + `${new Date(event.starts_at).toLocaleString("ko-KR")}\n`

                            + `${event.location || ""}`

                        )

                    );


                    const responses = [

                        ["accepted", "참석"],

                        ["declined", "불참"],

                        ["tentative", "미정"]

                    ];


                    for (

                        const [value, label]

                        of responses

                    ) {

                        const b = button(

                            label

                            + (

                                event.response === value

                                    ? " ✓"

                                    : ""

                            ),

                            async () => {

                                ok(

                                    await client

                                        .from("marine_events")

                                        .update({

                                            response: value

                                        })

                                        .eq("id", event.id)

                                        .eq("user_id", uid)

                                );


                                event.response = value;

                                last = "";

                                render();

                            }

                        );


                        actions.append(b);

                    }

                }


                // =================================
                // 17. 선택형 답장
                // =================================

                body.append(actions);

                wrap.append(body);

                log.append(wrap);

            }


            // 대화 기록이 없는 경우

            if (!shown.length) {

                log.append(

                    node(

                        "p",

                        "아직 통신 기록이 없습니다."

                    )

                );

            }


            if (bottom) {

                log.scrollTop = log.scrollHeight;

            }

        }


        // =====================================
        // 18. 채팅방 음소거
        // =====================================

        mute.onclick = () => action(async () => {

            const c = active;


            if (!c?.room) {

                return;

            }


            ok(

                await client

                    .from("marine_rooms")

                    .update({

                        muted: !c.muted

                    })

                    .eq("id", c.key)

            );


            c.muted = !c.muted;


            render();

        });


        // =====================================
        // 19. 메시지 자동 조회
        // =====================================

        async function refresh() {

            // 메신저 창이 닫힌 경우 조회 중단

            if (!root.isConnected) {

                stopped = true;

                clearInterval(timer);

                return;

            }


            if (

                busy

                || stopped

                || document.hidden

            ) {

                return;

            }


            busy = true;


            try {

                await auth();


                // 실제 도착 시간이 지난 메시지만 조회

                rows = ok(

                    await client

                        .from("marine_messages")

                        .select("*")

                        .eq("user_id", uid)

                        .lte(

                            "deliver_at",

                            new Date().toISOString()

                        )

                        .order(

                            "deliver_at",

                            { ascending: false }

                        )

                        .limit(500)

                ).reverse();


                // 일정 초대 메시지 조회

                const ids = [

                    ...new Set(

                        rows.map(

                            m => m.metadata?.event_id

                        ).filter(Boolean)

                    )

                ];


                if (ids.length) {

                    const eventRows = ok(

                        await client

                            .from("marine_events")

                            .select("*")

                            .eq("user_id", uid)

                            .in("id", ids)

                    );


                    events = Object.fromEntries(

                        eventRows.map(

                            e => [e.id, e]

                        )

                    );


                } else {

                    events = {};

                }


                if (!root.isConnected) {

                    return;

                }


                render();


                // =================================
                // 20. 메시지 읽음 처리
                // =================================

                if (

                    active

                    && root.getClientRects().length

                ) {

                    const unread = rows.filter(m =>

                        matches(m, active)

                        && m.direction === "incoming"

                        && !m.read_at

                    );


                    if (unread.length) {

                        const now =

                            new Date().toISOString();


                        ok(

                            await client

                                .from("marine_messages")

                                .update({

                                    read_at: now

                                })

                                .eq("user_id", uid)

                                .in(

                                    "id",

                                    unread.map(m => m.id)

                                )

                        );


                        unread.forEach(m => {

                            m.read_at = now;

                        });


                        renderSide();


                        // 작업 표시줄 알림 개수 갱신

                        window.MarineNotifications

                            ?.refresh();

                    }

                }


                status.textContent =

                    actionStatus

                    || "기밀 통신망 연결됨";


            } catch (e) {

                status.textContent =

                    "조회 오류: " + e.message;


            } finally {

                busy = false;

            }

        }


        // =====================================
        // 21. 메시지 전송
        // =====================================

        form.onsubmit = async e => {

            e.preventDefault();


            const content = input.value.trim();

            const c = active;

            const parent = replying;
            const chosenQuick=quickChoice; quickChoice=null;


            if (

                !content

                || !c

                || send.disabled

            ) {

                return;

            }


            send.disabled = true;

            actionStatus = "";


            try {

                await auth();


                // 보낸 메시지 데이터베이스 저장

                const m = ok(

                    await client

                        .from("marine_messages")

                        .insert({

                            user_id: uid,

                            room_id:

                                c.room ? c.key : null,

                            sender: "나",

                            direction: "outgoing",

                            content,

                            reply_to:

                                parent?.id || null,

                            metadata: {

                                contact: c.key

                            }

                        })

                        .select("id")

                        .single()

                );


                input.value = "";

                replyTo(null);

                last = "";


                await refresh();


                // =================================
                // 22. 캐릭터별 자동 답장 연동
                // =================================

                try {

                    const selected = (chosenQuick?.label===content && chosenQuick.response ? chosenQuick : null) || (Array.isArray(parent?.choices) && parent.choices.find(x=>typeof x === "object" && (x.label || x.text)===content && x.response));
                    if(selected) {
                        ok(await client.from("marine_messages").insert({user_id:uid,room_id:c.room?c.key:null,sender:parent?.sender || chars.find(x=>x.character_key===c.key)?.name || c.name,direction:"incoming",content:selected.response,choices:Array.isArray(selected.choices)?selected.choices:[],reply_to:m.id,metadata:parent?.metadata||{character_key:c.key},deliver_at:new Date(Date.now()+3000).toISOString()}));
                    } else
                    // 단체 채팅방 메시지

                    if (c.room) {

                        await window.MarineReplies

                            .groupReply(

                                client,

                                c.key,

                                content,

                                m.id

                            );


                    // 개인 메시지

                    } else if (c.character) {

                        await window.MarineReplies

                            .reply(

                                client,

                                c.key,

                                content,

                                null,

                                m.id

                            );

                    }


                } catch (e) {

                    actionStatus =

                        "전송 완료 · 자동 답장 예약 실패: "

                        + e.message;


                    status.textContent =

                        actionStatus;

                }


            } catch (e) {

                status.textContent =

                    "전송 오류: " + e.message;


            } finally {

                send.disabled = false;

            }

        };


        // =====================================
        // 23. 최초 실행 및 자동 갱신
        // =====================================

        if (!active) {

            status.textContent =

                "등록된 연락처가 없습니다.";

            return;

        }


        await refresh();


        // 3초마다 수신 메시지 확인

        timer = setInterval(

            refresh,

            3000

        );

    }


    // =========================================
    // 24. MARINE OS 외부 연결
    // =========================================

    window.MarineChat = {

        mount

    };


})();
