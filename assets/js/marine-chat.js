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
        header.append(scenarioButton, reset);
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

        panel.hidden = true;

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

            input.focus();

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
