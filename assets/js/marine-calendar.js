
/* ============================================
   MARINE OS v2.1
   Schedule Management System
   ============================================ */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    const types = {

        meeting: "업무 회의",

        dinner: "식사 모임",

        report: "업무 보고",

        personal: "개인 일정"

    };


    const responses = {

        accepted: "참석",

        declined: "불참",

        tentative: "미정",

        pending: "응답 대기"

    };


    /* ========================================
       01. 공통 함수
       ======================================== */

    function node(tag, text, cls) {

        const element = document.createElement(tag);

        if (text != null) {

            element.textContent = text;

        }

        if (cls) {

            element.className = cls;

        }

        return element;

    }


    function check(result) {

        if (result.error) {

            throw result.error;

        }

        return result.data;

    }


    function dateKey(date) {

        const y = date.getFullYear();

        const m = String(date.getMonth() + 1)
            .padStart(2, "0");

        const d = String(date.getDate())
            .padStart(2, "0");

        return `${y}-${m}-${d}`;

    }


    function timeText(value) {

        return new Date(value).toLocaleTimeString(

            "ko-KR",

            {

                hour: "2-digit",

                minute: "2-digit",

                hour12: false

            }

        );

    }


    function icon(name) {

        const paths = {

            prev: `
                <path d="m15 6-6 6 6 6"/>
            `,

            next: `
                <path d="m9 6 6 6-6 6"/>
            `,

            add: `
                <path d="M12 5v14M5 12h14"/>
            `,

            calendar: `
                <rect x="3" y="5" width="18"
                      height="16" rx="2"/>
                <path d="M7 3v5M17 3v5M3 10h18"/>
            `,

            pin: `
                <path d="m9 3 6 0 0 6 4 4H5l4-4z"/>
                <path d="M12 13v9"/>
            `,

            clock: `
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v5l3 2"/>
            `,

            location: `
                <path d="M20 10c0 6-8 11-8 11S4 16 4 10
                         a8 8 0 1 1 16 0z"/>
                <circle cx="12" cy="10" r="2.5"/>
            `

        };


        const element = node(

            "span",

            null,

            "ms-icon"

        );


        element.innerHTML = `

            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.7"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-hidden="true">

                ${paths[name] || paths.calendar}

            </svg>

        `;

        return element;

    }


    function button(text, action, cls, symbol) {

        const b = node(

            "button",

            null,

            cls || "ms-button"

        );

        b.type = "button";

        if (symbol) {

            b.append(icon(symbol));

        }

        if (text) {

            b.append(node("span", text));

        }

        b.onclick = action;

        return b;

    }


    /* ========================================
       02. 일정 관리 초기화
       ======================================== */

    async function mount(root, client) {

        const auth = check(

            await client.auth.getUser()

        );

        if (auth.user?.id !== ADMIN_UID) {

            throw new Error("접근 권한 없음");

        }


        let current = new Date();

        let selected = dateKey(current);

        let events = [];

        let requestNumber = 0;

        let formOpen = false;

        let feedback = "";


        /* ====================================
           03. 일정 조회
           ==================================== */

        async function load() {

            const request = ++requestNumber;

            const start = new Date(

                current.getFullYear(),

                current.getMonth(),

                1

            );

            const end = new Date(

                current.getFullYear(),

                current.getMonth() + 1,

                1

            );


            const rows = check(

                await client

                    .from("marine_events")

                    .select("*")

                    .eq("user_id", ADMIN_UID)

                    .gte("starts_at", start.toISOString())

                    .lt("starts_at", end.toISOString())

                    .order("starts_at")

            );


            if (request !== requestNumber) {

                return;

            }


            events = rows || [];

            render();

        }


        async function safeLoad() {

            try {

                await load();

            } catch (error) {

                root.replaceChildren(

                    node(

                        "p",

                        "일정 조회 실패: " + error.message,

                        "ms-error"

                    ),

                    button("다시 조회", safeLoad)

                );

            }

        }


        function dailyEvents(key) {

            return events.filter(event =>

                dateKey(new Date(event.starts_at)) === key

            );

        }


        /* ====================================
           04. 월간 통계
           ==================================== */

        function statistics() {

            const active = events.filter(

                event => event.status !== "cancelled"

            );


            const accepted = active.filter(

                event => event.response === "accepted"

            );


            const pending = active.filter(

                event =>

                    event.response === "pending"

                    || !event.response

            );


            const grid = node(

                "div",

                null,

                "ms-stat-grid"

            );


            const data = [

                ["이번 달 일정", active.length],

                ["참석 응답", accepted.length],

                ["응답 대기", pending.length]

            ];


            for (const [label, value] of data) {

                const card = node(

                    "div",

                    null,

                    "ms-stat"

                );


                card.append(

                    node("span", label, "ms-muted"),

                    node("strong", value + "건")

                );


                grid.append(card);

            }


            return grid;

        }


        /* ====================================
           05. 월 이동
           ==================================== */

        function moveMonth(amount) {

            if (formOpen) return;

            current = new Date(

                current.getFullYear(),

                current.getMonth() + amount,

                1

            );


            selected = dateKey(current);

            safeLoad();

        }


        /* ====================================
           06. 달력 그리드
           ==================================== */

        function renderCalendar() {

            const card = node(

                "section",

                null,

                "ms-card ms-calendar-card"

            );


            const toolbar = node(

                "div",

                null,

                "ms-toolbar"

            );


            const navigation = node(

                "div",

                null,

                "ms-navigation"

            );


            const prev = button(

                "",

                () => moveMonth(-1),

                "ms-arrow",

                "prev"

            );

            prev.setAttribute("aria-label", "이전 달");


            const next = button(

                "",

                () => moveMonth(1),

                "ms-arrow",

                "next"

            );

            next.setAttribute("aria-label", "다음 달");


            const month = node(

                "h3",

                `${current.getFullYear()}년 `

                    + `${current.getMonth() + 1}월`

            );


            navigation.append(prev, month, next);


            const today = button(

                "오늘",

                () => {

                    if (formOpen) return;

                    current = new Date();

                    selected = dateKey(current);

                    safeLoad();

                }

            );


            toolbar.append(navigation, today);

            card.append(toolbar);


            const weekdays = node(

                "div",

                null,

                "ms-weekdays"

            );


            ["일", "월", "화", "수", "목", "금", "토"]

                .forEach((day, index) => {

                    const label = node("span", day);

                    if (index === 0) {

                        label.classList.add("ms-sunday");

                    }

                    if (index === 6) {

                        label.classList.add("ms-saturday");

                    }

                    weekdays.append(label);

                });


            card.append(weekdays);


            const grid = node(

                "div",

                null,

                "ms-calendar-grid"

            );


            const year = current.getFullYear();

            const monthIndex = current.getMonth();


            const first = new Date(

                year, monthIndex, 1

            ).getDay();


            const last = new Date(

                year, monthIndex + 1, 0

            ).getDate();


            const cells = Math.ceil(

                (first + last) / 7

            ) * 7;


            for (let i = 0; i < cells; i++) {

                const day = i - first + 1;


                if (day < 1 || day > last) {

                    grid.append(

                        node("div", null, "ms-blank")

                    );

                    continue;

                }


                const date = new Date(

                    year, monthIndex, day

                );

                const key = dateKey(date);


                const daily = dailyEvents(key).filter(

                    event => event.status !== "cancelled"

                );


                const cell = button(

                    "",

                    () => {

                        if (formOpen) return;

                        selected = key;

                        render();

                    },

                    "ms-day"

                );


                cell.setAttribute(

                    "aria-label",

                    `${key}, 일정 ${daily.length}건`

                );


                cell.setAttribute(

                    "aria-pressed",

                    String(selected === key)

                );


                if (selected === key) {

                    cell.classList.add("ms-selected");

                }


                if (key === dateKey(new Date())) {

                    cell.classList.add("ms-today");

                }


                if (date.getDay() === 0) {

                    cell.classList.add("ms-sunday");

                }


                if (date.getDay() === 6) {

                    cell.classList.add("ms-saturday");

                }


                cell.append(

                    node(

                        "span",

                        String(day),

                        "ms-day-number"

                    )

                );


                daily.slice(0, 2).forEach(event => {

                    const tag = node(

                        "span",

                        event.title,

                        "ms-event-tag"

                    );


                    tag.dataset.type =

                        event.event_type;

                    tag.title = event.title;

                    cell.append(tag);

                });


                if (daily.length > 2) {

                    cell.append(

                        node(

                            "small",

                            `+${daily.length - 2}건`,

                            "ms-more"

                        )

                    );

                }


                grid.append(cell);

            }


            card.append(grid);


            const legend = node(

                "div",

                null,

                "ms-legend"

            );


            for (const [key, label] of Object.entries(types)) {

                const item = node(

                    "span",

                    label,

                    "ms-legend-item"

                );

                item.dataset.type = key;

                legend.append(item);

            }


            card.append(legend);

            return card;

        }


        /* ====================================
           07. 개별 일정 카드
           ==================================== */

        function renderEvent(event) {

            const card = node(

                "article",

                null,

                "ms-event-card"

            );


            card.dataset.type = event.event_type;


            const category = node(

                "span",

                types[event.event_type] || "기타 일정",

                "ms-category"

            );


            card.append(

                category,

                node("h3", event.title)

            );


            const meta = node(

                "div",

                null,

                "ms-event-meta"

            );


            function metaRow(symbol, text) {

                const row = node("div");

                row.append(

                    icon(symbol),

                    node("span", text)

                );

                return row;

            }


            meta.append(

                metaRow("clock", timeText(event.starts_at)),

                metaRow(

                    "location",

                    event.location || "장소 미정"

                )

            );


            card.append(

                meta,

                node(

                    "p",

                    "주관: " + event.organizer,

                    "ms-muted"

                )

            );


            if (event.description) {

                card.append(

                    node(

                        "p",

                        event.description,

                        "ms-description"

                    )

                );

            }


            if (event.status === "cancelled") {

                card.append(

                    node("p", "취소된 일정", "ms-muted")

                );

                return card;

            }


            const status = node(

                "p",

                "현재 응답: "

                    + (responses[event.response] || "응답 대기"),

                "ms-muted"

            );


            const actions = node(

                "div",

                null,

                "ms-response-actions"

            );


            for (const value of [

                "accepted",

                "declined",

                "tentative"

            ]) {

                const b = button(

                    responses[value],

                    async () => {

                        actions.querySelectorAll("button")

                            .forEach(item => item.disabled = true);


                        try {

                            check(

                                await client

                                    .from("marine_events")

                                    .update({ response: value })

                                    .eq("id", event.id)

                                    .eq("user_id", ADMIN_UID)

                            );


                            event.response = value;

                            render();


                        } catch (error) {

                            status.textContent =

                                "저장 실패: " + error.message;


                            actions.querySelectorAll("button")

                                .forEach(item => item.disabled = false);

                        }

                    },

                    "ms-response"

                );


                b.dataset.response = value;

                b.setAttribute(

                    "aria-pressed",

                    String(event.response === value)

                );

                actions.append(b);

            }


            const pin = button(

                "바탕화면 메모에 추가",

                async () => {

                    pin.disabled = true;


                    try {

                        const content = [

                            "일정: " + event.title,

                            "시간: " + new Date(

                                event.starts_at

                            ).toLocaleString("ko-KR"),

                            "장소: " + (event.location || "미정"),

                            "주관: " + event.organizer

                        ].join("\n");


                        const existing = check(

                            await client

                                .from("marine_notes")

                                .select("id")

                                .eq("user_id", ADMIN_UID)

                                .eq("content", content)

                                .limit(1)

                        );


                        if (!existing.length) {

                            check(

                                await client

                                    .from("marine_notes")

                                    .insert({

                                        user_id: ADMIN_UID,

                                        title: event.title,

                                        content,

                                        pinned: true,

                                        due_at: event.starts_at

                                    })

                            );

                        }


                        pin.textContent = "메모 등록 완료";


                        document.dispatchEvent(

                            new CustomEvent(

                                "marine:notes-changed"

                            )

                        );


                    } catch (error) {

                        pin.disabled = false;

                        status.textContent =

                            "메모 등록 실패: " + error.message;

                    }

                },

                "ms-pin-button",

                "pin"

            );


            card.append(status, actions, pin);

            return card;

        }


        /* ====================================
           08. 선택 날짜의 일정
           ==================================== */

        function renderDetails() {

            const section = node(

                "section",

                null,

                "ms-details"

            );


            const date = new Date(

                selected + "T12:00:00"

            );


            const items = dailyEvents(selected);


            const heading = node(

                "div",

                null,

                "ms-details-heading"

            );


            heading.append(

                node(

                    "h3",

                    date.toLocaleDateString("ko-KR", {

                        month: "long",

                        day: "numeric",

                        weekday: "long"

                    })

                ),

                node(

                    "span",

                    items.length + "건",

                    "ms-muted"

                )

            );


            section.append(heading);


            if (!items.length) {

                const empty = node(

                    "div",

                    null,

                    "ms-card ms-empty"

                );


                empty.append(

                    icon("calendar"),

                    node("strong", "등록된 일정이 없습니다."),

                    node(

                        "p",

                        "필요한 일정을 자유롭게 등록하세요.",

                        "ms-muted"

                    )

                );


                section.append(empty);

            } else {

                items.forEach(event => {

                    section.append(renderEvent(event));

                });

            }


            return section;

        }


        /* ====================================
           09. 전체 화면
           ==================================== */

        function render() {

            const shell = node(

                "div",

                null,

                "ms-page"

            );


            const heading = node(

                "header",

                null,

                "ms-heading"

            );


            const title = node("div");


            title.append(

                node(

                    "span",

                    "MARINE SCHEDULE SYSTEM",

                    "ms-eyebrow"

                ),

                node("h2", "업무 일정")

            );


            const add = button(

                "일정 등록",

                () => renderForm(shell),

                "ms-add ui-primary",

                "add"

            );


            heading.append(title, add);


            shell.append(

                heading,

                statistics(),

                renderCalendar(),

                renderDetails()

            );


            if (feedback) {

                shell.prepend(

                    node("p", feedback, "ms-feedback")

                );

            }


            root.replaceChildren(shell);

        }


        /* ====================================
           10. 새 일정 등록
           ==================================== */

        function renderForm(shell) {

            if (formOpen) return;

            formOpen = true;


            const form = node(

                "form",

                null,

                "ms-card ms-form"

            );


            form.append(

                node("h3", "새 일정 등록"),

                node(

                    "p",

                    "시작 시간과 일정 내용을 입력하세요.",

                    "ms-muted"

                )

            );


            function field(label, type, value = "") {

                const wrapper = node(

                    "label",

                    label,

                    "ms-field"

                );


                const input = node("input");

                input.type = type;

                input.value = value;

                wrapper.append(input);

                form.append(wrapper);

                return input;

            }


            const title = field("일정 제목", "text");

            title.required = true;

            title.maxLength = 150;


            const organizer = field(

                "주관자",

                "text",

                "해군 본부"

            );


            const location = field("장소", "text");


            const starts = field(

                "시작 시간",

                "datetime-local",

                selected + "T14:00"

            );

            starts.required = true;


            const typeLabel = node(

                "label",

                "일정 분류",

                "ms-field"

            );


            const type = node("select");


            for (const [key, label] of Object.entries(types)) {

                const option = node("option", label);

                option.value = key;

                type.append(option);

            }


            typeLabel.append(type);

            form.append(typeLabel);


            const descriptionLabel = node(

                "label",

                "상세 내용",

                "ms-field"

            );


            const description = node("textarea");

            description.rows = 4;

            description.placeholder = "일정에 필요한 내용을 작성하세요.";


            descriptionLabel.append(description);

            form.append(descriptionLabel);


            const notifyLabel = node(

                "label",

                null,

                "ms-notify-field"

            );


            const notify = node("input");

            notify.type = "checkbox";

            notify.checked = true;


            notifyLabel.append(

                notify,

                node("span", "메신저에도 일정 안내 보내기")

            );


            const actions = node(

                "div",

                null,

                "ms-form-actions"

            );


            const save = node(

                "button",

                "일정 저장",

                "ui-primary"

            );

            save.type = "submit";


            const cancel = button(

                "취소",

                () => {

                    formOpen = false;

                    form.remove();

                }

            );


            const status = node(

                "p",

                "",

                "ms-feedback"

            );


            actions.append(cancel, save);

            form.append(notifyLabel, actions, status);


            shell.append(form);

            form.scrollIntoView({ block: "nearest" });

            title.focus();


            /* ================================
               11. 데이터베이스 저장
               ================================ */

            form.onsubmit = async e => {

                e.preventDefault();

                save.disabled = true;

                cancel.disabled = true;

                status.textContent = "저장 중...";


                let saved = false;


                try {

                    const startDate = new Date(starts.value);


                    if (!title.value.trim()) {

                        throw new Error("일정 제목을 입력하세요.");

                    }


                    if (Number.isNaN(startDate.getTime())) {

                        throw new Error("날짜와 시간을 확인하세요.");

                    }


                    const event = check(

                        await client

                            .from("marine_events")

                            .insert({

                                user_id: ADMIN_UID,

                                title: title.value.trim(),

                                organizer:

                                    organizer.value.trim()

                                    || "해군 본부",

                                location: location.value.trim(),

                                starts_at: startDate.toISOString(),

                                event_type: type.value,

                                description: description.value.trim()

                            })

                            .select()

                            .single()

                    );


                    saved = true;

                    feedback = "일정이 저장되었습니다.";


                    /* 메신저 안내는 별도 처리 */

                    if (notify.checked) {

                        try {

                            const room = check(

                                await client

                                    .from("marine_rooms")

                                    .select("id")

                                    .eq("room_key", "headquarters")

                                    .maybeSingle()

                            );


                            check(

                                await client

                                    .from("marine_messages")

                                    .insert({

                                        user_id: ADMIN_UID,

                                        room_id: room?.id || null,

                                        sender: event.organizer,

                                        direction: "incoming",

                                        content: [

                                            "[일정 안내]",

                                            event.title,

                                            "시간: " + startDate

                                                .toLocaleString("ko-KR"),

                                            "장소: " + (

                                                event.location || "미정"

                                            )

                                        ].join("\n"),

                                        message_type: "event",

                                        deliver_at: new Date(

                                            Date.now() + 5000

                                        ).toISOString(),

                                        metadata: {

                                            event_id: event.id,

                                            automatic: true

                                        }

                                    })

                            );


                        } catch (error) {

                            feedback =

                                "일정은 저장되었지만 메신저 안내 실패: "

                                + error.message;

                        }

                    }


                    current = startDate;

                    selected = dateKey(startDate);

                    formOpen = false;

                    await safeLoad();


                } catch (error) {

                    status.textContent =

                        "저장 실패: " + error.message;

                    save.disabled = saved;

                    cancel.disabled = false;

                }

            };

        }


        root.replaceChildren(

            node("p", "일정 조회 중...", "ms-muted")

        );


        await safeLoad();

    }


    window.MarineCalendar = {

        mount

    };

})();
