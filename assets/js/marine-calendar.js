
/*
 * MARINE OS v2.0
 * 해군 통합 일정 관리 시스템
 * marine-calendar.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    // =========================================
    // 공통 함수
    // =========================================

    function node(tag, text, cls) {

        const element =
            document.createElement(tag);

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

        const m = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const d = String(
            date.getDate()
        ).padStart(2, "0");

        return `${y}-${m}-${d}`;

    }


    // =========================================
    // 일정 관리 화면
    // =========================================

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


        // =====================================
        // 데이터베이스 일정 조회
        // =====================================

        async function load() {

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

            events = check(

                await client

                    .from("marine_events")

                    .select("*")

                    .eq("user_id", ADMIN_UID)

                    .gte(
                        "starts_at",
                        start.toISOString()
                    )

                    .lt(
                        "starts_at",
                        end.toISOString()
                    )

                    .order("starts_at")

            );

            render();

        }


        // =====================================
        // 달력 화면 생성
        // =====================================

        function render() {

            root.replaceChildren();

            const shell = node(
                "div", null, "marine-calendar"
            );

            const toolbar = node("div");

            Object.assign(toolbar.style, {

                display: "flex",

                alignItems: "center",

                justifyContent: "space-between",

                gap: "10px"

            });


            const prev = node("button", "이전");

            const next = node("button", "다음");

            const today = node("button", "오늘");


            const title = node(

                "h2",

                `${current.getFullYear()}년 `
                + `${current.getMonth() + 1}월`

            );


            prev.onclick = () => {

                current = new Date(

                    current.getFullYear(),

                    current.getMonth() - 1,

                    1

                );

                selected = dateKey(current);

                safeLoad();

            };


            next.onclick = () => {

                current = new Date(

                    current.getFullYear(),

                    current.getMonth() + 1,

                    1

                );

                selected = dateKey(current);

                safeLoad();

            };


            today.onclick = () => {

                current = new Date();

                selected = dateKey(current);

                safeLoad();

            };


            toolbar.append(
                prev, title, next, today
            );

            shell.append(toolbar);


            // =============================
            // 달력 그리드
            // =============================

            const grid = node("div");

            Object.assign(grid.style, {

                display: "grid",

                gridTemplateColumns:
                    "repeat(7, minmax(0, 1fr))",

                gap: "4px",

                margin: "15px 0"

            });


            const weekdays = [
                "일", "월", "화", "수",
                "목", "금", "토"
            ];


            weekdays.forEach(day => {

                const label = node(
                    "strong", day
                );

                label.style.textAlign =
                    "center";

                grid.append(label);

            });


            const first = new Date(

                current.getFullYear(),

                current.getMonth(),

                1

            ).getDay();


            const last = new Date(

                current.getFullYear(),

                current.getMonth() + 1,

                0

            ).getDate();


            // 첫째 주 빈 칸

            for (let i = 0; i < first; i++) {

                grid.append(node("div"));

            }


            // 날짜별 셀

            for (let day = 1; day <= last; day++) {

                const date = new Date(

                    current.getFullYear(),

                    current.getMonth(),

                    day

                );

                const key = dateKey(date);


                const daily = events.filter(

                    event =>

                        dateKey(
                            new Date(event.starts_at)
                        ) === key

                        && event.status !== "cancelled"

                );


                const button = node(
                    "button", String(day)
                );


                Object.assign(button.style, {

                    minHeight: "55px",

                    padding: "6px",

                    overflow: "hidden",

                    textAlign: "left",

                    cursor: "pointer",

                    outline: selected === key

                        ? "2px solid var(--accent, #698CAE)"

                        : "none"

                });


                if (key === dateKey(new Date())) {

                    button.style.fontWeight =
                        "bold";

                }


                if (daily.length) {

                    const count = node(

                        "small",

                        `일정 ${daily.length}건`

                    );

                    count.style.display =
                        "block";

                    count.style.marginTop =
                        "5px";

                    button.append(count);

                }


                button.onclick = () => {

                    selected = key;

                    render();

                };


                grid.append(button);

            }


            shell.append(grid);


            // =============================
            // 선택된 날짜의 일정
            // =============================

            const details = node("section");

            details.append(

                node(
                    "h3",
                    selected + " 일정"
                )

            );


            const daily = events.filter(

                event =>

                    dateKey(
                        new Date(event.starts_at)
                    ) === selected

            );


            if (!daily.length) {

                details.append(

                    node(
                        "p",
                        "등록된 일정이 없습니다."
                    )

                );

            }


            daily.forEach(event => {

                details.append(
                    renderEvent(event)
                );

            });


            shell.append(details);


            // 일정 추가 버튼

            const add = node(
                "button", "새 일정 등록"
            );

            add.onclick = () => {

                renderForm(shell);

            };

            shell.append(add);

            root.append(shell);

        }


        // =====================================
        // 개별 일정 및 참석 투표
        // =====================================

        function renderEvent(event) {

            const card = node("article");

            Object.assign(card.style, {

                border: "1px solid #8885",

                padding: "12px",

                marginBottom: "10px",

                borderRadius: "4px"

            });


            const time = new Date(

                event.starts_at

            ).toLocaleTimeString(

                "ko-KR",

                {
                    hour: "2-digit",
                    minute: "2-digit"
                }

            );


            const labels = {

                meeting: "업무 회의",

                dinner: "식사 모임",

                report: "업무 보고",

                personal: "개인 일정"

            };


            card.append(

                node(

                    "small",

                    labels[event.event_type]
                        || "기타 일정"

                ),

                node("h3", event.title),

                node(

                    "p",

                    `${time} · `
                    + (event.location || "장소 미정")

                ),

                node(

                    "p",

                    "주관: " + event.organizer

                ),

                node(

                    "p",

                    event.description || ""

                )

            );


            if (event.status === "cancelled") {

                card.append(
                    node("strong", "취소된 일정")
                );

                return card;

            }


            // 참석 여부 선택

            const responses = [

                ["accepted", "참석"],

                ["declined", "불참"],

                ["tentative", "미정"]

            ];


            const actions = node("div");

            actions.style.display = "flex";

            actions.style.gap = "8px";

            actions.style.flexWrap = "wrap";


            const status = node(

                "p",

                "현재 응답: " + (

                    responses.find(
                        item => item[0] === event.response
                    )?.[1] || "응답 대기"

                )

            );


            for (const [value, label] of responses) {

                const button = node(
                    "button", label
                );

                button.disabled =
                    event.response === value;


                button.onclick = async () => {

                    button.disabled = true;

                    try {

                        check(

                            await client

                                .from("marine_events")

                                .update({
                                    response: value
                                })

                                .eq("id", event.id)

                                .eq(
                                    "user_id",
                                    ADMIN_UID
                                )

                        );

                        await load();

                    } catch (error) {

                        status.textContent =
                            "저장 오류: "
                            + error.message;

                        button.disabled = false;

                    }

                };


                actions.append(button);

            }


            card.append(status, actions);


            // =============================
            // 일정 스티커 메모 등록
            // =============================

            const pin = node(

                "button",

                "바탕화면 메모에 추가"

            );

            pin.style.marginTop = "10px";


            pin.onclick = async () => {

                pin.disabled = true;

                try {

                    const noteContent = [

                        "일정: " + event.title,

                        "시간: " + new Date(
                            event.starts_at
                        ).toLocaleString("ko-KR"),

                        "장소: " + (
                            event.location || "미정"
                        ),

                        "주관: " + event.organizer

                    ].join("\n");


                    // 같은 일정의 메모가 있는지 확인

                    const existing = check(

                        await client

                            .from("marine_notes")

                            .select("id")

                            .eq(
                                "user_id",
                                ADMIN_UID
                            )

                            .eq(
                                "content",
                                noteContent
                            )

                            .limit(1)

                    );


                    if (!existing.length) {

                        check(

                            await client

                                .from("marine_notes")

                                .insert({

                                    user_id: ADMIN_UID,

                                    title: event.title,

                                    content: noteContent,

                                    pinned: true,

                                    due_at: event.starts_at

                                })

                        );

                    }


                    pin.textContent =
                        "메모 등록 완료";


                    document.dispatchEvent(

                        new CustomEvent(
                            "marine:notes-changed"
                        )

                    );


                } catch (error) {

                    status.textContent =
                        "메모 등록 실패: "
                        + error.message;

                    pin.disabled = false;

                }

            };


            card.append(pin);

            return card;

        }


        // =====================================
        // 새 일정 등록 화면
        // =====================================

        function renderForm(shell) {

            if (
                shell.querySelector(
                    ".marine-event-form"
                )
            ) {
                return;
            }


            const form = node(

                "form",

                null,

                "marine-event-form"

            );


            Object.assign(form.style, {

                display: "grid",

                gap: "10px",

                padding: "15px",

                border: "1px solid #8885",

                marginTop: "15px"

            });


            form.append(
                node("h3", "새 일정 등록")
            );


            function field(
                label,
                type,
                value = ""
            ) {

                const wrapper = node(
                    "label", label
                );

                const input = node("input");

                input.type = type;

                input.value = value;

                input.style.width = "100%";

                wrapper.append(input);

                form.append(wrapper);

                return input;

            }


            const title = field(
                "일정 제목", "text"
            );

            title.required = true;


            const organizer = field(

                "주관자",

                "text",

                "해군 본부"

            );


            const location = field(
                "장소", "text"
            );


            const starts = field(

                "시작 시간",

                "datetime-local",

                selected + "T14:00"

            );

            starts.required = true;


            const type = node("select");


            const types = [

                ["meeting", "업무 회의"],

                ["dinner", "식사 모임"],

                ["report", "업무 보고"],

                ["personal", "개인 일정"]

            ];


            for (const [key, label] of types) {

                const option = node(
                    "option", label
                );

                option.value = key;

                type.append(option);

            }


            form.append(
                node("label", "일정 분류"),
                type
            );


            const description = node(
                "textarea"
            );

            description.placeholder =
                "일정 상세 내용";

            form.append(description);


            const notify = node("input");

            notify.type = "checkbox";

            notify.checked = true;


            const notifyLabel = node("label");

            notifyLabel.append(

                notify,

                document.createTextNode(
                    " 메신저에도 일정 안내 보내기"
                )

            );

            form.append(notifyLabel);


            const save = node(
                "button", "일정 저장"
            );

            save.type = "submit";


            const cancel = node(
                "button", "닫기"
            );

            cancel.type = "button";

            cancel.onclick = () => form.remove();


            const status = node("p", "");


            form.append(save, cancel, status);


            // =============================
            // 새 일정 저장
            // =============================

            form.onsubmit = async e => {

                e.preventDefault();

                save.disabled = true;

                let saved = false;

                try {

                    const startDate =
                        new Date(starts.value);

                    const event = check(

                        await client

                            .from("marine_events")

                            .insert({

                                user_id: ADMIN_UID,

                                title: title.value.trim(),

                                organizer:
                                    organizer.value.trim()
                                    || "해군 본부",

                                location:
                                    location.value.trim(),

                                starts_at:
                                    startDate.toISOString(),

                                event_type: type.value,

                                description:
                                    description.value.trim()

                            })

                            .select()

                            .single()

                    );

                    saved = true;


                    // 메신저 일정 안내 예약

                    if (notify.checked) {

                        const headquarters = check(

                            await client

                                .from("marine_rooms")

                                .select("id")

                                .eq(
                                    "room_key",
                                    "headquarters"
                                )

                                .maybeSingle()

                        );


                        check(

                            await client

                                .from("marine_messages")

                                .insert({

                                    user_id: ADMIN_UID,

                                    room_id:
                                        headquarters?.id
                                        || null,

                                    sender:
                                        event.organizer,

                                    direction: "incoming",

                                    content:

                                        "[일정 안내]\n"

                                        + event.title

                                        + "\n시간: "

                                        + startDate.toLocaleString(
                                            "ko-KR"
                                        )

                                        + "\n장소: "

                                        + (
                                            event.location
                                            || "미정"
                                        ),

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

                    }


                    current = startDate;

                    selected = dateKey(startDate);

                    await load();


                } catch (error) {

                    status.textContent = saved

                        ? "일정은 저장됐지만 후속 처리 실패: "
                            + error.message

                        : "저장 실패: "
                            + error.message;

                    save.disabled = saved;

                }

            };


            shell.append(form);

        }


        // =====================================
        // 안전한 새로고침
        // =====================================

        async function safeLoad() {

            try {

                await load();

            } catch (error) {

                root.replaceChildren(

                    node(

                        "p",

                        "일정 조회 실패: "
                        + error.message

                    )

                );

            }

        }


        await safeLoad();

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineCalendar = {

        mount

    };

})();
