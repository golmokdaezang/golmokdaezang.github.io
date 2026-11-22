
/* ============================================
   MARINE OS v2.1
   Personnel & Promotion Dashboard
   ============================================ */

(() => {

    "use strict";


    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    const ranks = [

        "잡일꾼",
        "삼등병",
        "이등병",
        "일등병",
        "하사",
        "준사",
        "상사",
        "준위",
        "소위",
        "중위",
        "대위",
        "소령",
        "중령",
        "대령",
        "준장",
        "소장",
        "중장",
        "대장",
        "원수"

    ];


    const commanders = {

        akainu: "아카이누",

        kizaru: "키자루",

        aokiji: "아오키지"

    };


    /* ========================================
       01. 기본 유틸리티
       ======================================== */

    function node(tag, text, cls) {

        const n = document.createElement(tag);

        if (text != null) {

            n.textContent = text;

        }

        if (cls) {

            n.className = cls;

        }

        return n;

    }


    function check(result) {

        if (result.error) {

            throw result.error;

        }

        return result.data;

    }


    function formatDate(value) {

        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {

            return "-";

        }

        return date.toLocaleDateString(

            "ko-KR",

            {

                year: "numeric",

                month: "long",

                day: "numeric"

            }

        );

    }


    function number(value) {

        return Number(value || 0)

            .toLocaleString("ko-KR");

    }


    function serviceDays(value) {

        if (!value) return 0;

        const start = new Date(value);

        if (Number.isNaN(start.getTime())) {

            return 0;

        }

        const today = new Date();

        const a = Date.UTC(

            start.getFullYear(),

            start.getMonth(),

            start.getDate()

        );

        const b = Date.UTC(

            today.getFullYear(),

            today.getMonth(),

            today.getDate()

        );

        return Math.max(

            0,

            Math.floor((b - a) / 86400000) + 1

        );

    }


    /* ========================================
       02. SVG 아이콘
       ======================================== */

    function icon(name) {

        const paths = {

            file: `
                <path d="M6 3h8l4 4v14H6z"/>
                <path d="M14 3v5h5"/>
                <path d="M9 12h6M9 16h6"/>
            `,

            award: `
                <circle cx="12" cy="8" r="5"/>
                <path d="m8 12-2 9 6-3 6 3-2-9"/>
            `,

            calendar: `
                <rect x="3" y="5" width="18"
                      height="16" rx="2"/>
                <path d="M7 3v5M17 3v5M3 10h18"/>
            `,

            arrow: `
                <path d="M5 12h14m-6-6 6 6-6 6"/>
            `,

            back: `
                <path d="M19 12H5m6-6-6 6 6 6"/>
            `,

            refresh: `
                <path d="M20 7v5h-5"/>
                <path d="M20 12a8 8 0 1 0-2 6"/>
            `,

            check: `
                <path d="m5 12 4 4L19 6"/>
            `

        };


        const wrapper = node(

            "span",

            null,

            "mp-icon"

        );


        wrapper.innerHTML = `

            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.7"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-hidden="true">

                ${paths[name] || paths.file}

            </svg>

        `;


        return wrapper;

    }


    /* ========================================
       03. 세계관용 계급장
       ======================================== */

    function insignia(rank) {

        const index = ranks.indexOf(rank);

        const wrapper = node(

            "div",

            null,

            "mp-insignia"

        );


        let marks = "";


        if (index <= 0) {

            marks = `

                <circle cx="40" cy="39"
                        r="6" fill="#D4B97D"/>

            `;

        } else if (index <= 6) {

            const count = index <= 3

                ? index

                : index - 3;


            for (let i = 0; i < count; i++) {

                const y = 22 + i * 13;

                marks += `

                    <path

                        d="M21 ${y + 10}
                           L40 ${y}
                           L59 ${y + 10}
                           V${y + 18}
                           L40 ${y + 8}
                           L21 ${y + 18}Z"

                        fill="#E0C58A"

                    />

                `;

            }

        } else {

            const count = Math.min(

                5,

                index >= 14

                    ? index - 13

                    : ((index - 7) % 3) + 1

            );


            for (let i = 0; i < count; i++) {

                const y = 18 + i * 10;

                marks += `

                    <path

                        d="M40 ${y}
                           l2 4 5 1 -3 3
                           1 5 -5-2 -5 2
                           1-5 -3-3 5-1Z"

                        fill="#E0C58A"

                    />

                `;

            }

        }


        wrapper.innerHTML = `

            <svg viewBox="0 0 80 90"
                 aria-hidden="true">

                <path

                    d="M10 5H70V55
                       L40 84L10 55Z"

                    fill="#263D56"

                    stroke="#B6A06F"

                    stroke-width="2"

                />

                <path

                    d="M15 10H65V53
                       L40 77L15 53Z"

                    fill="none"

                    stroke="#FFFFFF"

                    stroke-opacity=".15"

                />

                ${marks}

            </svg>

        `;


        wrapper.setAttribute(

            "aria-label",

            rank + " 계급장"

        );


        return wrapper;

    }


    /* ========================================
       04. 버튼 및 카드
       ======================================== */

    function button(text, symbol, handler, primary) {

        const b = node(

            "button",

            null,

            primary

                ? "mp-button ui-primary"

                : "mp-button"

        );

        b.type = "button";

        if (symbol) {

            b.append(icon(symbol));

        }

        b.append(node("span", text));

        b.onclick = handler;

        return b;

    }


    function card(title) {

        const section = node(

            "section",

            null,

            "mp-card"

        );

        if (title) {

            section.append(

                node("h3", title, "mp-card-title")

            );

        }

        return section;

    }


    function field(label, value) {

        const row = node(

            "div",

            null,

            "mp-field"

        );

        row.append(

            node("span", label),

            node("strong", value || "-")

        );

        return row;

    }


    function metric(label, value, symbol) {

        const box = node(

            "div",

            null,

            "mp-metric"

        );

        if (symbol) {

            box.append(icon(symbol));

        }

        box.append(

            node("span", label, "mp-muted"),

            node("strong", value, "mp-number")

        );

        return box;

    }


    function page(title, subtitle) {

        const panel = node(

            "div",

            null,

            "mp-page"

        );


        const heading = node(

            "header",

            null,

            "mp-heading"

        );


        heading.append(

            node("div", subtitle, "mp-eyebrow"),

            node("h2", title)

        );


        panel.append(heading);

        return panel;

    }


    /* ========================================
       05. 인사 기록 조회
       ======================================== */

    async function loadPersonnel(client) {

        const auth = check(

            await client.auth.getUser()

        );


        if (auth.user?.id !== ADMIN_UID) {

            throw new Error("접근 권한 없음");

        }


        return check(

            await client

                .from("marine_personnel")

                .select("*")

                .eq("user_id", ADMIN_UID)

                .single()

        );

    }


    /* ========================================
       06. 진급 진행률 계산
       ======================================== */

    function promotionInfo(person) {

        const index = ranks.indexOf(person.rank);

        const next = index >= 0

            ? ranks[index + 1] || null

            : null;


        const required =

            Number(person.promotion_threshold) > 0

                ? Number(person.promotion_threshold)

                : 100;


        const points = Math.max(

            0,

            Number(person.merit_points) || 0

        );


        const percent = Math.min(

            100,

            points / required * 100

        );


        return {

            next,

            required,

            points,

            percent,

            remaining: Math.max(

                0,

                required - points

            ),

            eligible: Boolean(

                next && points >= required

            )

        };

    }


    function progressCard(person) {

        const info = promotionInfo(person);

        const box = card("진급 진행 현황");


        const header = node(

            "div",

            null,

            "mp-progress-heading"

        );


        header.append(

            node("strong", "다음 진급까지"),

            node(

                "strong",

                Math.round(info.percent) + "%",

                "mp-percent"

            )

        );


        const labels = node(

            "div",

            null,

            "mp-progress-labels"

        );


        labels.append(

            node("span", person.rank),

            node("span", info.next || "최종 계급")

        );


        const track = node(

            "div",

            null,

            "mp-progress-track"

        );


        track.setAttribute("role", "progressbar");

        track.setAttribute("aria-label", "진급 진행률");

        track.setAttribute("aria-valuemin", "0");

        track.setAttribute("aria-valuemax", "100");

        track.setAttribute(

            "aria-valuenow",

            String(Math.round(info.percent))

        );


        const fill = node(

            "div",

            null,

            "mp-progress-fill"

        );


        fill.style.width = info.percent + "%";

        track.append(fill);


        const description = !info.next

            ? "추가 진급 대상이 아닙니다."

            : info.eligible

                ? "진급 기준을 충족했습니다."

                : number(info.remaining)
                    + " P가 더 필요합니다.";


        box.append(

            header,

            labels,

            track,

            node(

                "p",

                `${number(info.points)} / ${number(info.required)} P`,

                "mp-point-label"

            ),

            node("p", description, "mp-muted")

        );


        return box;

    }


    /* ========================================
       07. 활동 통계
       ======================================== */

    async function countRows(query) {

        try {

            const result = await query;

            if (result.error) {

                throw result.error;

            }

            return number(result.count) + "건";

        } catch (error) {

            console.error(error);

            return "조회 불가";

        }

    }


    async function loadStats(client) {

        const start = new Date();

        start.setHours(0, 0, 0, 0);

        const end = new Date(start);

        end.setDate(end.getDate() + 1);


        return Promise.all([

            countRows(

                client

                    .from("posts")

                    .select("id", {

                        count: "exact",

                        head: true

                    })

            ),

            countRows(

                client

                    .from("marine_activity")

                    .select("id", {

                        count: "exact",

                        head: true

                    })

                    .eq("user_id", ADMIN_UID)

            ),

            countRows(

                client

                    .from("marine_events")

                    .select("id", {

                        count: "exact",

                        head: true

                    })

                    .eq("user_id", ADMIN_UID)

                    .gte("starts_at", start.toISOString())

                    .lt("starts_at", end.toISOString())

                    .neq("status", "cancelled")

            )

        ]);

    }


    /* ========================================
       08. 인사 기록부 화면
       ======================================== */

    async function mount(root, client) {

        root.replaceChildren(

            node("p", "인사 정보 조회 중...", "mp-loading")

        );


        try {

            const person = await loadPersonnel(client);

            const stats = await loadStats(client);


            const panel = page(

                "나의 복무 현황",

                "MARINE PERSONNEL SYSTEM"

            );


            const hero = card();

            hero.classList.add("mp-hero");


            const identity = node(

                "div",

                null,

                "mp-identity"

            );


            const details = node("div");


            details.append(

                node("span", "현재 계급", "mp-muted"),

                node("h1", person.rank, "mp-rank"),

                node(

                    "p",

                    `${person.branch} · ${person.department}`

                ),

                node(

                    "p",

                    (commanders[person.commander] || "미지정")

                        + " 대장 소속",

                    "mp-commander mp-muted"

                )

            );


            identity.append(

                insignia(person.rank),

                details

            );


            const heroStats = node(

                "div",

                null,

                "mp-hero-stats"

            );


            const days = serviceDays(

                person.enlisted_at

            );


            heroStats.append(

                metric("복무 일수", "D+" + days),

                metric(

                    "보유 공적 점수",

                    number(person.merit_points) + " P"

                )

            );


            hero.append(

                identity,

                heroStats,

                node(

                    "p",

                    "최초 임용일 · "

                        + formatDate(person.enlisted_at),

                    "mp-muted"

                )

            );


            const statistics = node(

                "div",

                null,

                "mp-stat-grid"

            );


            statistics.append(

                metric("작성 기록", stats[0], "file"),

                metric("공적 활동", stats[1], "award"),

                metric("오늘 일정", stats[2], "calendar")

            );


            const information = card("인사 기본 정보");


            information.append(

                field("인사 식별 코드", person.personnel_code),

                field("소속 지부", person.branch),

                field("소속 부서", person.department),

                field("담당 업무", person.assignment),

                field(

                    "근무 형태",

                    person.undercover

                        ? "잠입수사 요원"

                        : "일반 근무"

                ),

                field(

                    "임용 일자",

                    formatDate(person.enlisted_at)

                )

            );


            const actions = node(

                "div",

                null,

                "mp-actions"

            );


            actions.append(

                button(

                    "진급 현황 확인",

                    "arrow",

                    () => promotion(root, client),

                    true

                ),

                button(

                    "새로고침",

                    "refresh",

                    () => mount(root, client)

                )

            );


            panel.append(

                hero,

                progressCard(person),

                statistics,

                information,

                actions

            );


            root.replaceChildren(panel);


        } catch (error) {

            root.replaceChildren(

                node(

                    "p",

                    "인사 정보 조회 실패: " + error.message,

                    "mp-error"

                )

            );

        }

    }


    /* ========================================
       09. 진급 계급 비교 카드
       ======================================== */

    function comparison(person, info) {

        const area = card("계급 현황");

        const row = node(

            "div",

            null,

            "mp-rank-comparison"

        );


        function rankBox(rank, label) {

            const box = node(

                "div",

                null,

                "mp-rank-box"

            );


            box.append(

                node("span", label, "mp-muted")

            );


            if (rank) {

                box.append(insignia(rank));

            }


            box.append(

                node(

                    "strong",

                    rank || "최종 계급"

                )

            );


            return box;

        }


        row.append(

            rankBox(person.rank, "현재 계급"),

            icon("arrow"),

            rankBox(info.next, "다음 계급")

        );


        area.append(row);

        return area;

    }


    /* ========================================
       10. 진급 관리 화면
       ======================================== */

    async function promotion(root, client, notice = "") {

        root.replaceChildren(

            node("p", "진급 자료 조회 중...", "mp-loading")

        );


        try {

            const person = await loadPersonnel(client);

            const info = promotionInfo(person);


            const panel = page(

                "진급 관리",

                "MARINE PROMOTION SYSTEM"

            );


            if (notice) {

                panel.append(

                    node("p", notice, "mp-success")

                );

            }


            const status = node(

                "p",

                info.eligible

                    ? "현재 진급 신청이 가능합니다."

                    : !info.next

                        ? "추가 진급 대상이 아닙니다."

                        : "진급 기준에 필요한 공적을 모으고 있습니다.",

                "mp-muted"

            );


            const apply = button(

                "진급 신청",

                "award",

                async () => {

                    apply.disabled = true;

                    status.textContent =

                        "인사 심사 요청 중...";


                    try {

                        const result = check(

                            await client.rpc("marine_promote")

                        );


                        if (result.status !== "success") {

                            throw new Error(result.status);

                        }


                        window.dispatchEvent(

                            new CustomEvent(

                                "marine:personnel-changed",

                                {

                                    detail: result

                                }

                            )

                        );


                        window.MarineUI?.notify({

                            label: "PERSONNEL SYSTEM",

                            title: "진급이 승인되었습니다.",

                            message: result.new_rank

                                + " 진급 발령 완료."

                        });


                        await promotion(

                            root,

                            client,

                            result.new_rank + " 진급 승인 완료"

                        );


                    } catch (error) {

                        status.textContent =

                            "진급 오류: " + error.message;

                        apply.disabled = false;

                    }

                },

                true

            );


            apply.disabled = !info.eligible;


            const request = card("진급 신청");

            request.append(status, apply);


            panel.append(

                comparison(person, info),

                progressCard(person),

                request

            );


            root.replaceChildren(panel);


            await Promise.all([

                renderHistory(panel, client),

                renderActivity(panel, client)

            ]);


            panel.append(

                button(

                    "인사 기록부로 돌아가기",

                    "back",

                    () => mount(root, client)

                )

            );


        } catch (error) {

            root.replaceChildren(

                node(

                    "p",

                    "진급 자료 조회 오류: " + error.message,

                    "mp-error"

                )

            );

        }

    }


    /* ========================================
       11. 인사 발령 타임라인
       ======================================== */

    async function renderHistory(root, client) {

        const box = card("인사 발령 이력");

        root.append(box);


        try {

            const rows = check(

                await client

                    .from("marine_promotions")

                    .select("*")

                    .eq("user_id", ADMIN_UID)

                    .order("promoted_at", {

                        ascending: false

                    })

            );


            if (!rows.length) {

                box.append(

                    node("p", "발령 기록이 없습니다.", "mp-empty")

                );

                return;

            }


            const timeline = node(

                "div",

                null,

                "mp-timeline"

            );


            for (const item of rows) {

                const row = node(

                    "article",

                    null,

                    "mp-timeline-item"

                );


                row.append(

                    node(

                        "small",

                        formatDate(item.promoted_at),

                        "mp-muted"

                    ),

                    node(

                        "strong",

                        item.previous_rank

                            ? item.previous_rank

                                + " → "

                                + item.new_rank

                            : item.new_rank + " 최초 임용"

                    ),

                    node("p", item.reason || "인사 발령")

                );


                timeline.append(row);

            }


            box.append(timeline);


        } catch (error) {

            box.append(

                node("p", error.message, "mp-error")

            );

        }

    }


    /* ========================================
       12. 공적 활동 이력
       ======================================== */

    async function renderActivity(root, client) {

        const box = card("최근 공적 활동");

        root.append(box);


        try {

            const rows = check(

                await client

                    .from("marine_activity")

                    .select("*")

                    .eq("user_id", ADMIN_UID)

                    .order("created_at", {

                        ascending: false

                    })

                    .limit(30)

            );


            if (!rows.length) {

                box.append(

                    node(

                        "p",

                        "아직 등록된 공적 활동이 없습니다.",

                        "mp-empty"

                    )

                );

                return;

            }


            for (const item of rows) {

                const activity = node(

                    "article",

                    null,

                    "mp-activity"

                );


                const content = node("div");


                content.append(

                    node("strong", item.title),

                    node(

                        "p",

                        item.description || item.activity_type,

                        "mp-muted"

                    ),

                    node(

                        "small",

                        formatDate(item.created_at),

                        "mp-muted"

                    )

                );


                const points = Number(item.points) || 0;


                activity.append(

                    content,

                    node(

                        "strong",

                        (points > 0 ? "+" : "")

                            + number(points) + " P",

                        "mp-activity-points"

                    )

                );


                box.append(activity);

            }


        } catch (error) {

            box.append(

                node("p", error.message, "mp-error")

            );

        }

    }


    /* ========================================
       13. 외부 모듈 연결
       ======================================== */

    window.MarinePersonnel = {

        mount,

        promotion,

        loadPersonnel,

        ranks

    };

})();
