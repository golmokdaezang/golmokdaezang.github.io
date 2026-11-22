
/*
 * MARINE OS v2.0
 * 인사 기록부 및 진급 관리
 * marine-personnel.js
 */

(() => {

    "use strict";


    // =========================================
    // 기본 설정
    // =========================================

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


    // =========================================
    // 공통 함수
    // =========================================

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

        return new Date(value)
            .toLocaleString("ko-KR");

    }


    // =========================================
    // 인사 기록 조회
    // =========================================

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


    // =========================================
    // 인사 기록부
    // =========================================

    async function mount(root, client) {

        root.replaceChildren(
            node("p", "인사 정보 조회 중...")
        );


        try {

            const person =
                await loadPersonnel(client);


            root.replaceChildren();


            const title = node(
                "h2",
                "해군 인사 기록부"
            );


            const subtitle = node(
                "p",
                "MARINE PERSONNEL RECORD"
            );

            subtitle.style.opacity = "0.6";


            const table = node("table");

            table.style.width = "100%";


            const fields = [

                [
                    "인사 식별 코드",
                    person.personnel_code
                ],

                [
                    "현재 계급",
                    person.rank
                ],

                [
                    "소속 지부",
                    person.branch
                ],

                [
                    "소속 부서",
                    person.department
                ],

                [
                    "소속 지휘관",
                    (
                        commanders[person.commander]
                        || "미지정"
                    ) + " 대장"
                ],

                [
                    "담당 업무",
                    person.assignment
                ],

                [
                    "임용 일자",
                    formatDate(person.enlisted_at)
                ],

                [
                    "근무 형태",
                    person.undercover
                        ? "잠입수사 요원"
                        : "일반 근무"
                ],

                [
                    "공적 점수",
                    person.merit_points + " P"
                ]

            ];


            for (const [label, value] of fields) {

                const tr = node("tr");

                tr.append(

                    node("th", label),

                    node("td", value)

                );

                table.append(tr);

            }


            const promotionButton = node(
                "button",
                "진급 관리 열기"
            );


            promotionButton.onclick = () => {

                promotion(root, client);

            };


            root.append(

                title,

                subtitle,

                table,

                node("br"),

                promotionButton

            );


        } catch (error) {

            root.replaceChildren(

                node(
                    "p",
                    "조회 실패: " + error.message
                )

            );

        }

    }


    // =========================================
    // 진급 관리 화면
    // =========================================

    async function promotion(root, client) {

        root.replaceChildren(
            node("p", "공적 심사 자료 조회 중...")
        );


        try {

            const person =
                await loadPersonnel(client);


            const index =
                ranks.indexOf(person.rank);


            const nextRank =
                index >= 0

                    ? ranks[index + 1]

                    : null;


            const required =
                Number(person.promotion_threshold)
                > 0

                    ? Number(
                        person.promotion_threshold
                    )

                    : 100;


            const points =
                person.merit_points;


            const percent = Math.min(

                100,

                points / required * 100

            );


            root.replaceChildren();


            root.append(

                node("h2", "해군 진급 관리"),

                node(
                    "p",
                    "현재 계급 : " + person.rank
                ),

                node(
                    "p",
                    "다음 계급 : "
                    + (nextRank || "진급 대상 없음")
                ),

                node(
                    "h3",
                    `${points} / ${required} P`
                )

            );


            // 진급 진행률

            const bar = node("div");

            Object.assign(bar.style, {

                height: "12px",

                borderRadius: "3px",

                background: "#aab3bc55",

                overflow: "hidden"

            });


            const fill = node("div");

            Object.assign(fill.style, {

                width: percent + "%",

                height: "100%",

                background: "var(--accent)"

            });


            bar.append(fill);

            root.append(bar);


            const message = node(

                "p",

                !nextRank

                    ? "추가 진급 대상이 아닙니다."

                    : points >= required

                        ? "진급 심사 기준을 충족했습니다."

                        : `${required - points} P가 더 필요합니다.`

            );


            const button = node(
                "button",
                "진급 신청"
            );

            button.disabled =

                points < required

                || !nextRank;


            root.append(message, button);


            // 진급 신청

            button.onclick = async () => {

                button.disabled = true;

                try {

                    const result = check(

                        await client.rpc(
                            "marine_promote"
                        )

                    );


                    if (result.status === "success") {

                        await promotion(
                            root,
                            client
                        );

                        root.prepend(

                            node(
                                "p",
                                `${result.new_rank} 진급 승인 완료`
                            )

                        );

                    } else {

                        message.textContent =
                            "진급 불가: " + result.status;

                        button.disabled = false;

                    }


                } catch (error) {

                    message.textContent =
                        "진급 오류: " + error.message;

                    button.disabled = false;

                }

            };


            // 진급 이력 및 공적 기록

            await renderHistory(root, client);

            await renderActivity(root, client);


            const back = node(
                "button",
                "인사 기록부로 돌아가기"
            );

            back.onclick = () => {

                mount(root, client);

            };

            root.append(back);


        } catch (error) {

            root.replaceChildren(

                node(
                    "p",
                    "조회 오류: " + error.message
                )

            );

        }

    }


    // =========================================
    // 진급 이력
    // =========================================

    async function renderHistory(root, client) {

        const rows = check(

            await client

                .from("marine_promotions")

                .select("*")

                .eq("user_id", ADMIN_UID)

                .order(
                    "promoted_at",
                    { ascending: false }
                )

        );


        root.append(
            node("h3", "인사 발령 이력")
        );


        for (const item of rows) {

            const card = node("article");

            card.append(

                node(

                    "strong",

                    item.previous_rank

                        ? item.previous_rank
                            + " → "
                            + item.new_rank

                        : item.new_rank + " 최초 임용"

                ),

                node("p", item.reason),

                node(
                    "small",
                    formatDate(item.promoted_at)
                )

            );

            root.append(card);

        }

    }


    // =========================================
    // 공적 활동 기록
    // =========================================

    async function renderActivity(root, client) {

        const rows = check(

            await client

                .from("marine_activity")

                .select("*")

                .eq("user_id", ADMIN_UID)

                .order(
                    "created_at",
                    { ascending: false }
                )

                .limit(30)

        );


        root.append(

            node("h3", "최근 공적 활동"),

            node(
                "small",
                "최근 30건의 활동 기록"
            )

        );


        if (!rows.length) {

            root.append(

                node(
                    "p",
                    "아직 등록된 공적이 없습니다."
                )

            );

        }


        for (const item of rows) {

            const card = node("article");

            card.append(

                node(
                    "strong",
                    item.title
                ),

                node(
                    "p",
                    item.description || item.activity_type
                ),

                node(
                    "div",
                    `공적 점수 : +${item.points} P`
                ),

                node(
                    "small",
                    formatDate(item.created_at)
                )

            );

            root.append(card);

        }

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarinePersonnel = {

        mount,

        promotion,

        loadPersonnel,

        ranks

    };

})();

