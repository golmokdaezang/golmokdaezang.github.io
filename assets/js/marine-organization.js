
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


        root.classList.add("mo-page");
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

        function renderCreate() {
            root.replaceChildren(node("h2", "새 캐릭터 등록"));
            const form = node("div", null, "mch-body");
            const fields = {};
            for (const [key, label] of Object.entries({character_key:"캐릭터 키 (영문 소문자)",name:"이름",alias:"별칭",rank:"계급",department:"소속",academy_class:"사관학교 기수",justice:"정의관",personality:"성격",speech_style:"말투",status:"현재 상태",avatar_url:"프로필 이미지 HTTPS 주소"})) {
                const wrap = node("label", null, "mch-field");
                const input = node(["personality","speech_style"].includes(key)?"textarea":"input");
                fields[key] = input;
                wrap.append(node("span", label), input); form.append(wrap);
            }
            const status = node("p"); status.setAttribute("role","status");
            const back = node("button", "취소"); back.onclick = () => render("organization");
            const save = node("button", "등록", "ui-primary");
            save.onclick = async () => {
                save.disabled = true;
                try {
                    const v = Object.fromEntries(Object.entries(fields).map(([k,i])=>[k,i.value.trim()]));
                    if (!/^[a-z][a-z0-9_]{1,39}$/.test(v.character_key)) throw new Error("캐릭터 키는 영문 소문자로 시작하는 2~40자여야 합니다.");
                    if (!v.name || !v.rank || !v.department) throw new Error("이름, 계급, 소속을 입력하세요.");
                    if (characters.some(c=>c.character_key===v.character_key || [c.name,c.alias].filter(Boolean).some(n=>n===v.name || n===v.alias))) throw new Error("이미 등록된 키 또는 이름입니다.");
                    if (v.academy_class && (!/^\d+$/.test(v.academy_class) || Number(v.academy_class)<1)) throw new Error("기수를 확인하세요.");
                    v.academy_class = v.academy_class ? Number(v.academy_class) : null;
                    if(v.avatar_url && !safeImage(v.avatar_url)) throw new Error("HTTPS 이미지 주소를 입력하세요.");
                    v.avatar_url = v.avatar_url || null;
                    check(await client.from("marine_characters").insert(v).select("character_key").single());
                    await load();
                } catch(e) { status.textContent = "등록 실패: " + e.message; } finally { save.disabled = false; }
            };
            root.append(form, save, back, status);
        }

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


            const toolbar = node("div", null, "mo-tabs");

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

                ["personnel", "나의 소속"],
                ["rooms", "대화방 관리"]

            ];


            for (const [key, label] of tabs) {

                const button = node(
                    "button", label
                );

                button.disabled = tab === key;
                button.classList.toggle("mo-selected", tab === key);

                button.onclick =
                    () => render(key);

                toolbar.append(button);

            }


            const add = node("button", "캐릭터 추가", "ui-primary");
            add.onclick = renderCreate;
            toolbar.append(add);
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

                case "rooms":
                    renderRooms();
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

            const card = node("button", null, "mo-character");

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


            const photo = node("div", null, "mo-photo");

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

            const grid = node("div", null, "mo-grid");

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

        function characterSelect(value = "") {
            const select = node("select");
            for (const c of characters) {
                const o = node("option", c.name + (c.alias ? " (" + c.alias + ")" : ""));
                o.value = c.character_key; select.append(o);
            }
            if (value) select.value = value;
            return select;
        }

        async function renderRooms() {
            const panel = node("section", null, "mch-body");
            root.append(panel);
            try {
                const [rooms, members] = await Promise.all([
                    client.from("marine_rooms").select("*").order("name").then(check),
                    client.from("marine_room_members").select("*").then(check)
                ]);
                if (!panel.isConnected) return;
                const picker = node("select");
                const fresh = node("option", "새 단체 통신방"); fresh.value = ""; picker.append(fresh);
                for (const r of rooms.filter(r => r.room_type === "group")) {
                    const o = node("option", r.name + (r.archived ? " (보관됨)" : "")); o.value=r.id; picker.append(o);
                }
                const editor = node("div", null, "mch-body");
                panel.append(node("h3", "단체 통신방 관리"), picker, editor);
                function edit() {
                    editor.replaceChildren();
                    const r = rooms.find(r => r.id === picker.value);
                    const name = node("input"); name.value = r?.name || ""; name.placeholder = "대화방 이름";
                    const desc = node("textarea"); desc.value = r?.description || ""; desc.placeholder = "대화방 설명";
                    const archived = node("input"); archived.type = "checkbox"; archived.checked = !!r?.archived;
                    const archiveLabel = node("label"); archiveLabel.append(archived, document.createTextNode(" 대화방 보관 (기존 메시지 유지)"));
                    editor.append(node("p", "이름"), name, node("p", "설명"), desc, archiveLabel, node("h3", "참여 인물"));
                    const picks = characters.map(c => {
                        const input = node("input"); input.type = "checkbox";
                        input.checked = members.some(m => m.room_id === r?.id && m.character_key === c.character_key);
                        const label = node("label"); label.style.display = "block"; label.append(input, document.createTextNode(" " + c.name)); editor.append(label);
                        return [c.character_key, input];
                    });
                    const save = node("button", "변경 사항 저장", "ui-primary"); const status = node("p");
                    save.onclick = async () => {
                        save.disabled = true;
                        try {
                            check(await client.rpc("marine_manage_room", {p_room_id:r?.id || null,p_name:name.value.trim(),p_description:desc.value.trim(),p_members:picks.filter(x=>x[1].checked).map(x=>x[0]),p_archived:archived.checked}));
                            panel.remove(); await renderRooms();
                        } catch(e) {status.textContent="저장 실패: "+e.message;} finally {save.disabled=false;}
                    };
                    editor.append(save,status);
                }
                picker.onchange=edit; edit();
            } catch(e) {panel.textContent="대화방 조회 실패: "+e.message;}
        }

        function relationshipEditor(parent, relation = null) {
            const a=characterSelect(relation?.character_a), b=characterSelect(relation?.character_b);
            const type=node("input"), desc=node("textarea"), status=node("p");
            type.value=relation?.relationship || ""; type.placeholder="관계 (예: 동기)";
            desc.value=relation?.description || ""; desc.placeholder="관계 설명";
            const save=node("button",relation?"관계 수정":"관계 추가","ui-primary");
            save.onclick=async()=>{
                save.disabled=true;
                try {
                    if(a.value===b.value || !type.value.trim()) throw new Error("서로 다른 인물과 관계를 입력하세요.");
                    const values={character_a:a.value,character_b:b.value,relationship:type.value.trim(),description:desc.value.trim()};
                    if(relationships.some(x=>x.id!==relation?.id && ((x.character_a===a.value&&x.character_b===b.value)||(x.character_a===b.value&&x.character_b===a.value)))) throw new Error("이미 등록된 관계입니다.");
                    check(await (relation?client.from("marine_relationships").update(values).eq("id",relation.id):client.from("marine_relationships").insert(values)).select("id").single());
                    await load(); render("relations");
                }catch(e){status.textContent="저장 실패: "+e.message;}finally{save.disabled=false;}
            };
            parent.append(a,b,type,desc,save,status);
            if(relation){const del=node("button","관계 삭제");del.onclick=async()=>{if(!confirm("이 관계를 삭제할까요?"))return;try{check(await client.from("marine_relationships").delete().eq("id",relation.id).select("id").single());await load();render("relations");}catch(e){status.textContent=e.message;}};parent.append(del);}
        }

        function renderRelationships() {

            root.append(
                node("h3", "해군 인물 관계 기록")
            );


            const addRelation=node("section",null,"mch-body"); relationshipEditor(addRelation); root.append(addRelation);
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


                const row = node("article", null, "mo-relation");

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


                relationshipEditor(row, relation);
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


            const select = characterSelect(person.commander);
            const save = node("button", "담당 상관 변경", "ui-primary");
            const status = node("p");
            save.onclick = async () => { try { check(await client.from("marine_personnel").update({commander:select.value}).eq("user_id",ADMIN_UID).select("user_id").single()); await load(); render("personnel"); } catch(e) {status.textContent=e.message;} };
            root.append(select,save,status);
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

            const editCharacter = node(
                "button",
                "캐릭터 및 대사 편집",
                "ui-primary"
            );

            editCharacter.onclick = async () => {
                try {
                    await window.MarineCharacters.mount(
                        root,
                        client,
                        character,
                        {
                            back: () => detail(character)
                        }
                    );
                } catch (error) {
                    root.append(
                        node("p", "편집 화면 오류: " + error.message)
                    );
                }
            };

            root.append(editCharacter);


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

            window.MarineImages.attach(
                input,
                client,
                "characters"
            );

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
