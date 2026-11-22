
/*
 * MARINE OS v2.0
 * 해군 본부 수배 통합 시스템
 * marine-wanted.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


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


    function money(value) {

        return BigInt(value || 0)
            .toLocaleString("en-US");

    }


    function safeImage(value) {

        if (!value) {
            return "";
        }

        try {

            const url = new URL(
                value,
                location.origin
            );

            if (url.protocol === "https:") {
                return url.href;
            }

            if (
                url.origin === location.origin
                && url.protocol === "http:"
            ) {
                return url.href;
            }

        } catch {}

        return "";

    }


    // =========================================
    // 수배 시스템 실행
    // =========================================

    async function mount(root, client) {

        const auth = check(
            await client.auth.getUser()
        );

        if (auth.user?.id !== ADMIN_UID) {
            throw new Error("접근 권한 없음");
        }


        let records = [];

        let keyword = "";

        let sortType = "bounty";

        let profile = null;


        // =====================================
        // 데이터 조회
        // =====================================

        async function load() {

            records = check(

                await client

                    .from("marine_wanted")

                    .select("*")

                    .order(
                        "created_at",
                        { ascending: false }
                    )

            );

            render();

        }


        // =====================================
        // 수배 대상 필터링
        // =====================================

        function filteredRecords() {

            const search =
                keyword.trim().toLowerCase();


            const rows = records.filter(

                item => [

                    item.name,

                    item.crew,

                    item.era,

                    item.description

                ].some(

                    text => String(text || "")

                        .toLowerCase()

                        .includes(search)

                )

            );


            if (sortType === "bounty") {

                rows.sort((a, b) => {

                    const x = BigInt(a.bounty || 0);
                    const y = BigInt(b.bounty || 0);

                    return x === y
                        ? 0
                        : x > y ? -1 : 1;

                });

            }


            if (sortType === "name") {

                rows.sort(

                    (a, b) => a.name.localeCompare(
                        b.name,
                        "ko"
                    )

                );

            }


            if (sortType === "recent") {

                rows.sort(

                    (a, b) =>

                        new Date(b.created_at)
                        - new Date(a.created_at)

                );

            }

            return rows;

        }


        // =====================================
        // 기본 화면
        // =====================================

        function render() {

            root.replaceChildren();


            const title = node(
                "h2",
                "해군 본부 수배 통합 시스템"
            );


            const subtitle = node(

                "p",

                "MARINE CENTRAL WANTED DATABASE"

            );

            subtitle.style.opacity = "0.6";


            const toolbar = node("div");

            Object.assign(toolbar.style, {

                display: "flex",

                flexWrap: "wrap",

                gap: "8px",

                marginBottom: "15px"

            });


            const search = node("input");

            search.placeholder =
                "이름 또는 해적단 검색";

            search.value = keyword;

            search.style.flex = "1";


            const sort = node("select");


            const options = [

                ["bounty", "현상금 높은 순"],

                ["name", "이름순"],

                ["recent", "최근 등록순"]

            ];


            for (const [value, label] of options) {

                const option = node(
                    "option",
                    label
                );

                option.value = value;

                sort.append(option);

            }


            sort.value = sortType;


            const add = node(
                "button",
                "수배서 등록"
            );


            const undercover = node(
                "button",
                "위장 신분 등록"
            );


            toolbar.append(

                search,

                sort,

                add,

                undercover

            );


            const count = node("p");

            const grid = node("div");


            Object.assign(grid.style, {

                display: "grid",

                gridTemplateColumns:
                    "repeat(auto-fill, minmax(175px, 1fr))",

                gap: "16px"

            });


            function updateGrid() {

                grid.replaceChildren();

                const rows = filteredRecords();

                count.textContent =
                    `검색 결과: ${rows.length}건`;


                if (!rows.length) {

                    grid.append(

                        node(

                            "p",

                            "등록된 수배 기록이 없습니다."

                        )

                    );

                }


                for (const item of rows) {

                    grid.append(
                        poster(item)
                    );

                }

            }


            search.oninput = () => {

                keyword = search.value;

                updateGrid();

            };


            sort.onchange = () => {

                sortType = sort.value;

                updateGrid();

            };


            add.onclick = () => {

                editForm();

            };


            undercover.onclick = () => {

                editForm({

                    name: "UNKNOWN",

                    crew: "소속 불명",

                    bounty: 50000000,

                    description:
                        "잠입수사 목적의 가상 위장 신분",

                    era: "정상전쟁 이전",

                    profile_linked: true

                });

            };


            root.append(

                title,

                subtitle,

                toolbar,

                count,

                grid

            );

            updateGrid();

        }


        // =====================================
        // 수배서 디자인
        // =====================================

        function poster(item) {

            const card = node("button");

            card.type = "button";


            Object.assign(card.style, {

                backgroundColor: "#dfc69b",

                backgroundImage:

                    "radial-gradient(ellipse at center,"
                    + "#f4e3b9 0%, #d4b27f 100%)",

                color: "#352719",

                border: "3px double #80613d",

                padding: "12px",

                textAlign: "center",

                cursor: "pointer",

                boxShadow: "2px 4px 9px #0003",

                overflow: "hidden"

            });


            const wanted = node(
                "div",
                "WANTED"
            );


            Object.assign(wanted.style, {

                fontFamily: "Georgia, serif",

                fontWeight: "900",

                fontSize: "32px",

                letterSpacing: "1px"

            });


            const photo = node("div");

            Object.assign(photo.style, {

                aspectRatio: "4 / 3",

                background: "#b9a17d",

                border: "2px solid #735b3e",

                overflow: "hidden",

                display: "grid",

                placeItems: "center"

            });


            const imageURL = safeImage(

                item.profile_linked

                    ? profile?.avatar_url
                        || item.image_url

                    : item.image_url

            );


            if (imageURL) {

                const img = node("img");

                img.src = imageURL;

                img.alt = item.name;

                img.loading = "lazy";

                Object.assign(img.style, {

                    width: "100%",

                    height: "100%",

                    objectFit: "cover"

                });


                img.onerror = () => {

                    photo.replaceChildren(

                        node("span", "NO IMAGE")

                    );

                };


                photo.append(img);

            } else {

                photo.append(
                    node("span", "NO IMAGE")
                );

            }


            const label = node(
                "div",
                "DEAD OR ALIVE"
            );

            label.style.fontFamily =
                "Georgia, serif";

            label.style.fontWeight = "bold";

            label.style.marginTop = "8px";


            const name = node(

                "div",

                item.name.toUpperCase()

            );


            Object.assign(name.style, {

                fontFamily: "Georgia, serif",

                fontWeight: "900",

                fontSize: "17px",

                margin: "5px 0",

                overflowWrap: "anywhere"

            });


            const bounty = node(

                "div",

                "฿ " + money(item.bounty)

            );


            Object.assign(bounty.style, {

                fontFamily: "Georgia, serif",

                fontWeight: "bold",

                fontSize: "19px"

            });


            const marine = node(
                "small",
                "MARINE"
            );


            card.append(

                wanted,

                photo,

                label,

                name,

                bounty,

                marine

            );


            card.onclick = () => {

                detail(item);

            };


            return card;

        }


        // =====================================
        // 수배 상세 정보
        // =====================================

        async function detail(item) {

            root.replaceChildren();


            const back = node(
                "button", "목록으로"
            );

            back.onclick = render;


            const layout = node("div");

            Object.assign(layout.style, {

                display: "flex",

                flexWrap: "wrap",

                gap: "20px",

                marginTop: "15px"

            });


            const left = node("div");

            left.style.width = "230px";

            left.append(
                poster(item)
            );


            const right = node("section");

            right.style.flex = "1";

            right.style.minWidth = "180px";


            right.append(

                node("h2", item.name),

                node(
                    "p",
                    "소속: " + (item.crew || "불명")
                ),

                node(

                    "p",

                    "현상금: ฿ " + money(item.bounty)

                ),

                node(

                    "p",

                    "기록 시점: " + item.era

                ),

                node("hr"),

                node("h3", "수배 대상 정보"),

                node(
                    "p",
                    item.description || "기록 없음"
                )

            );


            layout.append(left, right);

            root.append(back, layout);


            // =============================
            // 잠입수사 기밀 기록
            // =============================

            if (item.profile_linked) {

                const secret = node("section");

                Object.assign(secret.style, {

                    border: "1px solid #aa5555",

                    padding: "15px",

                    margin: "15px 0"

                });


                secret.append(

                    node(

                        "h3",

                        "기밀 기록 - 위장 신분"

                    )

                );


                try {

                    const person = check(

                        await client

                            .from("marine_personnel")

                            .select("*")

                            .eq("user_id", ADMIN_UID)

                            .single()

                    );


                    const fields = [

                        "신분: 가상 잠입수사 요원",

                        "실제 계급: " + person.rank,

                        "실제 소속: " + person.branch,

                        "부서: " + person.department,

                        "담당 업무: " + person.assignment,

                        "열람 권한: 관리자 전용"

                    ];


                    fields.forEach(text => {

                        secret.append(
                            node("p", text)
                        );

                    });


                } catch (error) {

                    secret.append(

                        node(
                            "p",
                            "인사 정보 조회 실패"
                        )

                    );

                }


                root.append(secret);

            }


            const edit = node(
                "button", "수배 기록 수정"
            );

            edit.onclick = () => editForm(item);


            const remove = node(
                "button", "수배 기록 삭제"
            );


            remove.onclick = () => {

                remove.disabled = true;

                const confirmation = node("div");


                confirmation.append(

                    node(
                        "p",
                        "수배 기록을 삭제하시겠습니까?"
                    )

                );


                const yes = node(
                    "button", "삭제 확인"
                );

                const no = node(
                    "button", "취소"
                );


                yes.onclick = async () => {

                    yes.disabled = true;

                    try {

                        check(

                            await client

                                .from("marine_wanted")

                                .delete()

                                .eq("id", item.id)

                        );

                        await load();

                    } catch (error) {

                        confirmation.append(

                            node(
                                "p",
                                error.message
                            )

                        );

                        yes.disabled = false;

                    }

                };


                no.onclick = () => {

                    confirmation.remove();

                    remove.disabled = false;

                };


                confirmation.append(yes, no);

                root.append(confirmation);

            };


            root.append(edit, remove);

        }


        // =====================================
        // 수배 기록 등록 및 수정
        // =====================================

        function editForm(item = {}) {

            root.replaceChildren();


            root.append(

                node(

                    "h2",

                    item.id

                        ? "수배 기록 수정"

                        : "새 수배 기록 등록"

                )

            );


            const form = node("form");

            Object.assign(form.style, {

                display: "grid",

                gap: "12px",

                maxWidth: "600px"

            });


            function field(label, value = "") {

                const wrapper = node("label");

                wrapper.append(
                    node("span", label)
                );


                const input = node("input");

                input.value = value ?? "";

                Object.assign(input.style, {

                    display: "block",

                    width: "100%"

                });


                wrapper.append(input);

                form.append(wrapper);

                return input;

            }


            const name = field(
                "수배 대상 이름",
                item.name
            );

            name.required = true;


            const crew = field(
                "소속 해적단",
                item.crew
            );


            const bounty = field(
                "현상금",
                item.bounty || 0
            );

            bounty.inputMode = "numeric";

            bounty.pattern = "[0-9]+";

            bounty.required = true;


            const era = field(

                "기록 시점",

                item.era || "정상전쟁 이전"

            );


            const image = field(

                "프로필 이미지 URL 또는 경로",

                item.image_url

            );


            const description = node("textarea");

            description.value =
                item.description || "";

            description.placeholder =
                "수배 대상 상세 기록";

            description.rows = 5;


            form.append(

                node("label", "상세 기록"),

                description

            );


            const linked = node("input");

            linked.type = "checkbox";

            linked.checked =
                Boolean(item.profile_linked);


            const linkedLabel = node("label");

            linkedLabel.append(

                linked,

                document.createTextNode(
                    " 내 가상 잠입수사 신분으로 등록"
                )

            );


            const status = node("p", "");


            const save = node(
                "button", "수배 기록 저장"
            );

            save.type = "submit";


            const cancel = node(
                "button", "취소"
            );

            cancel.type = "button";

            cancel.onclick = render;


            form.append(

                linkedLabel,

                save,

                cancel,

                status

            );


            form.onsubmit = async e => {

                e.preventDefault();

                save.disabled = true;


                try {

                    if (!name.value.trim()) {

                        throw new Error(
                            "이름을 입력하세요."
                        );

                    }


                    const amount = BigInt(
                        bounty.value || "0"
                    );


                    if (

                        amount < 0n

                        || amount > 9223372036854775807n

                    ) {

                        throw new Error(
                            "현상금 범위 오류"
                        );

                    }


                    if (
                        image.value.trim()
                        && !safeImage(
                            image.value.trim()
                        )
                    ) {

                        throw new Error(
                            "유효한 이미지 경로를 입력하세요."
                        );

                    }


                    const values = {

                        name: name.value.trim(),

                        crew: crew.value.trim(),

                        bounty: amount.toString(),

                        era: era.value.trim(),

                        image_url:
                            image.value.trim()
                            || null,

                        description:
                            description.value.trim(),

                        profile_linked:
                            linked.checked

                    };


                    if (item.id) {

                        check(

                            await client

                                .from("marine_wanted")

                                .update(values)

                                .eq("id", item.id)

                        );

                    } else {

                        check(

                            await client

                                .from("marine_wanted")

                                .insert(values)

                        );

                    }


                    await load();


                } catch (error) {

                    status.textContent =
                        "저장 실패: " + error.message;

                    save.disabled = false;

                }

            };


            root.append(form);

        }


        // =====================================
        // 프로필 정보 연결
        // =====================================

        async function setProfile(data) {

            profile = data || null;

            render();

        }


        await load();

        return {
            setProfile
        };

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineWanted = {

        mount

    };

})();
