
/*
 * MARINE OS v2.0
 * 해군 조직도 및 인물 관계 관리
 * marine-organization.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    const rankOrder = [

        "원수",
        "대장",
        "중장",
        "소장",
        "준장",
        "대령",
        "중령",
        "소령",
        "대위",
        "중위",
        "소위",
        "준위",
        "상사",
        "준사",
        "하사",
        "일등병",
        "이등병",
        "삼등병",
        "잡일꾼"

    ];


    const commanderColors = {

        akainu: "#B64940",

        kizaru: "#B99B38",

        aokiji: "#4787B4"

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


    function safeImage(value) {

        try {

            const url = new URL(
                value,
                location.origin
            );

            return url.protocol === "https:"
                ? url.href
                : "";

        } catch {

            return "";

        }

    }


    // =========================================
    // 조직도 실행
    // =========================================

    async function mount(root, client) {

        const auth = check(
            await client.auth.getUser()
        );

        if (auth.user?.id !== ADMIN_UID) {

            throw new Error("접근 권한 없음");

        }


        let characters = [];

        let relationships = [];

        let person = null;


        // =====================================
        // 데이터 조회
        // =====================================

        async function load() {

            root.replaceChildren(

                node(
                    "p",
                    "해군 본부 인사 자료 조회 중..."
                )

            );


            try {

                const results = await Promise.all([

                    client
                        .from("marine_characters")
                        .select("*"),

                    client
                        .from("marine_relationships")
                        .select("*"),

                    client
                        .from("marine_personnel")
                        .select("*")
                        .eq("user_id", ADMIN_UID)
                        .single()

                ]);


                characters = check(results[0]);

                relationships = check(results[1]);

                person = check(results[2]);


                render("organization");


            } catch (error) {

                root.replaceChildren(

                    node(
                        "p",
                        "조회 실패: " + error.message
                    )

                );

            }

        }


        // =====================================
        // 기본 화면
        // =====================================

        function render(tab) {

            root.replaceChildren();


            root.append(

                node(
                    "h2",
                    "해군 본부 통합 조직 관리"
                ),

                node(
                    "small",
                    "MARINE ORGANIZATION SYSTEM"
                )

            );


            const toolbar = node("div");

            Object.assign(toolbar.style, {

                display: "flex",

                flexWrap: "wrap",

                gap: "8px",

                margin: "15px 0"

            });


            const tabs = [

                ["organization", "조직도"],

                ["academy", "사관학교 기수"],

                ["relations", "인물 관계"],

                ["personnel", "나의 소속"]

            ];


            for (const [key, label] of tabs) {

                const button = node(
                    "button", label
                );

                button.disabled = tab === key;

                button.onclick =
                    () => render(key);

                toolbar.append(button);

            }


            root.append(toolbar);


            switch (tab) {

                case "organization":

                    renderOrganization();
                    break;

                case "academy":

                    renderAcademy();
                    break;

                case "relations":

                    renderRelationships();
                    break;

                case "personnel":

                    renderPersonnel();
                    break;

            }

        }


        // =====================================
        // 캐릭터 카드
        // =====================================

        function characterCard(character) {

            const card = node("button");

            Object.assign(card.style, {

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                gap: "7px",

                padding: "12px",

                width: "100%",

                borderTop:

                    "3px solid " +

                    (
                        commanderColors[
                            character.character_key
                        ] || "#8493A0"
                    ),

                textAlign: "center",

                cursor: "pointer"

            });


            const photo = node("div");

            Object.assign(photo.style, {

                width: "80px",

                height: "90px",

                background: "#8882",

                overflow: "hidden",

                display: "grid",

                placeItems: "center"

            });


            const url = character.avatar_url

                ? safeImage(character.avatar_url)

                : "";


            if (url) {

                const img = node("img");

                img.src = url;

                img.alt = character.name;

                Object.assign(img.style, {

                    width: "100%",

                    height: "100%",

                    objectFit: "cover"

                });


                img.onerror = () => {

                    photo.replaceChildren(

                        node("small", "NO PHOTO")

                    );

                };


                photo.append(img);

            } else {

                photo.append(

                    node("small", "NO PHOTO")

                );

            }


            card.append(

                photo,

                node("strong", character.name),

                node(

                    "small",

                    [
                        character.alias,
                        character.rank
                    ].filter(Boolean).join(" · ")

                ),

                node(
                    "small",
                    character.department
                )

            );


            card.onclick = () =>
                detail(character);


            return card;

        }


        // =====================================
        // 카드 그리드
        // =====================================

        function gridOf(items) {

            const grid = node("div");

            Object.assign(grid.style, {

                display: "grid",

                gridTemplateColumns:

                    "repeat(auto-fit, minmax(125px, 1fr))",

                gap: "12px",

                marginBottom: "20px"

            });


            for (const character of items) {

                grid.append(
                    characterCard(character)
                );

            }

            return grid;

        }


        // =====================================
        // 계급별 조직도
        // =====================================

        function renderOrganization() {

            const groups = [

                ["해군 최고 지휘부", ["원수"]],

                ["해군 삼대장", ["대장"]],

                [
                    "장성급 장교",
                    ["중장", "소장", "준장"]
                ],

                [
                    "영관급 장교",
                    ["대령", "중령", "소령"]
                ],

                [
                    "위관급 장교",
                    ["대위", "중위", "소위"]
                ]

            ];


            const used = new Set();


            for (const [label, ranks] of groups) {

                const items = characters.filter(

                    c => ranks.includes(c.rank)

                );


                if (!items.length) {
                    continue;
                }


                items.forEach(

                    c => used.add(c.character_key)

                );


                root.append(

                    node("h3", label),

                    gridOf(items)

                );

            }


            const others = characters.filter(

                c => !used.has(c.character_key)

            );


            if (others.length) {

                root.append(

                    node("h3", "기타 부서 및 인원"),

                    gridOf(others)

                );

            }

        }


        // =====================================
        // 해군사관학교 기수
        // =====================================

        function renderAcademy() {

            const classes = [

                ...new Set(

                    characters

                        .map(c => c.academy_class)

                        .filter(c => c != null)

                )

            ].sort((a, b) => a - b);


            for (const number of classes) {

                const items = characters.filter(

                    c => c.academy_class === number

                );


                root.append(

                    node(
                        "h3",
                        `해군사관학교 ${number}기`
                    ),

                    gridOf(items)

                );

            }


            const unknown = characters.filter(

                c => c.academy_class == null

            );


            if (unknown.length) {

                root.append(

                    node("h3", "기수 미등록"),

                    gridOf(unknown)

                );

            }

        }


        // =====================================
        // 인물 관계
        // =====================================

        function renderRelationships() {

            root.append(
                node("h3", "해군 인물 관계 기록")
            );


            for (const relation of relationships) {

                const a = characters.find(

                    c => c.character_key
                        === relation.character_a

                );


                const b = characters.find(

                    c => c.character_key
                        === relation.character_b

                );


                if (!a || !b) {
                    continue;
                }


                const row = node("article");

                Object.assign(row.style, {

                    padding: "12px",

                    border: "1px solid #8885",

                    marginBottom: "10px"

                });


                row.append(

                    node(

                        "strong",

                        `${a.name} ↔ ${b.name}`

                    ),

                    node(

                        "p",

                        "관계: " + relation.relationship

                    ),

                    node(

                        "small",

                        relation.description || ""

                    )

                );


                root.append(row);

            }

        }


        // =====================================
        // 개인 소속 정보
        // =====================================

        function renderPersonnel() {

            const commander = characters.find(

                c => c.character_key
                    === person.commander

            );


            root.append(

                node("h3", "나의 소속"),

                node("p", "해군 본부"),

                node("p", "↓"),

                node(

                    "p",

                    (
                        commander?.alias
                        || commander?.name
                        || "미지정"
                    ) + " 대장 소속"

                ),

                node("p", "↓"),

                node("h3", person.branch),

                node("p", person.department),

                node("p", "현재 계급: " + person.rank),

                node("p", "담당 업무: " + person.assignment)

            );


            const index = rankOrder.indexOf(

                person.rank

            );


            root.append(

                node(

                    "small",

                    "다음 진급 계급: "

                    + (

                        index > 0

                            ? rankOrder[index - 1]

                            : "없음"

                    )

                )

            );

        }


        // =====================================
        // 인물 상세 정보
        // =====================================

        function detail(character) {

            root.replaceChildren();


            const back = node(
                "button", "조직도로 돌아가기"
            );

            back.onclick = () =>
                render("organization");


            const photo = characterCard(character);

            photo.onclick = null;


            photo.style.maxWidth = "200px";


            root.append(back, photo);


            const fields = [

                ["이름", character.name],

                ["별칭", character.alias],

                ["계급", character.rank],

                ["소속", character.department],

                [
                    "사관학교",
                    character.academy_class

                        ? character.academy_class + "기"

                        : "미등록"
                ],

                ["정의관", character.justice],

                ["성격", character.personality],

                ["말투", character.speech_style],

                ["등록 상태", character.status]

            ];


            for (const [label, value] of fields) {

                root.append(

                    node("strong", label),

                    node("p", value || "미등록")

                );

            }


            // 관련 인물

            root.append(
                node("h3", "관련 인물")
            );


            const related = relationships.filter(

                relation =>

                    relation.character_a
                        === character.character_key

                    || relation.character_b
                        === character.character_key

            );


            for (const relation of related) {

                const key =

                    relation.character_a
                        === character.character_key

                        ? relation.character_b

                        : relation.character_a;


                const other = characters.find(

                    c => c.character_key === key

                );


                if (!other) {
                    continue;
                }


                const button = node(

                    "button",

                    other.name
                        + " · "
                        + relation.relationship

                );


                button.onclick = () =>
                    detail(other);


                root.append(button);

            }


            // 프로필 이미지 설정

            root.append(
                node("h3", "인물 이미지 설정")
            );


            const input = node("input");

            input.value = character.avatar_url || "";

            input.placeholder = "이미지 URL 또는 경로";

            input.style.width = "100%";


            const save = node(
                "button", "이미지 저장"
            );


            const status = node("p", "");


            save.onclick = async () => {

                try {

                    const value = input.value.trim();


                    if (value && !safeImage(value)) {

                        throw new Error(

                            "유효한 HTTPS 이미지 경로를 입력하세요."

                        );

                    }


                    check(

                        await client

                            .from("marine_characters")

                            .update({

                                avatar_url: value || null,

                                updated_at:

                                    new Date().toISOString()

                            })

                            .eq(

                                "character_key",

                                character.character_key

                            )

                    );


                    character.avatar_url = value || null;

                    detail(character);


                } catch (error) {

                    status.textContent =
                        error.message;

                }

            };


            root.append(input, save, status);

        }


        await load();

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineOrganization = {

        mount

    };

})();
