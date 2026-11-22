
(() => {
    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";

    const categories = {
        greeting: "인사",
        submitted: "보고서 제출 완료",
        missing: "보고서 미확인",
        working: "업무 진행 중",
        daily: "일상 대화",
        joke: "장난 및 실없는 소리",
        apology: "사과",
        compliment: "칭찬",
        question: "질문",
        food: "식사",
        rest: "휴식",
        default: "기본 응답"
    };

    function node(tag, text, cls) {
        const n = document.createElement(tag);
        if (text != null) n.textContent = text;
        if (cls) n.className = cls;
        return n;
    }

    function check(result) {
        if (result.error) throw result.error;
        return result.data;
    }

    function button(text, action, cls) {
        const b = node("button", text, cls);
        b.type = "button";
        b.onclick = action;
        return b;
    }

    function field(label, value, multiline = false) {
        const wrapper = node("label", null, "mch-field");
        const input = node(multiline ? "textarea" : "input");

        input.value = value ?? "";

        if (multiline) input.rows = 3;

        wrapper.append(node("span", label), input);

        return { wrapper, input };
    }

    async function mount(root, client, character, options = {}) {
        const auth = check(await client.auth.getUser());

        if (auth.user?.id !== ADMIN_UID) {
            throw new Error("접근 권한 없음");
        }

        root.replaceChildren();

        const page = node("section", null, "mch-page");
        const header = node("header", null, "mch-header");
        const name = node("h2", character.name);
        const subtitle = node(
            "p",
            `${character.alias} · ${character.rank}`
        );

        header.append(
            node("small", "CHARACTER MANAGEMENT"),
            name,
            subtitle
        );

        if (options.back) {
            header.append(
                button("인물 상세로 돌아가기", options.back)
            );
        }

        const tabs = node("div", null, "mch-tabs");
        const body = node("section", null, "mch-body");
        const status = node("p", "", "mch-status");

        status.setAttribute("role", "status");

        page.append(header, tabs, status, body);
        root.append(page);

        let currentTab = "info";
        let category = "default";

        async function execute(control, action, message) {
            control.disabled = true;
            status.textContent = "처리 중...";

            try {
                await action();
                status.textContent = message;
            } catch (error) {
                status.textContent = "오류: " + error.message;
            } finally {
                control.disabled = false;
            }
        }

        // 기본 정보 편집

        function renderInfo() {
            body.replaceChildren();

            const fields = [
                ["name", "이름", false],
                ["alias", "별칭", false],
                ["rank", "계급", false],
                ["department", "소속", false],
                ["academy_class", "사관학교 기수", false],
                ["justice", "정의관", false],
                ["personality", "성격", true],
                ["speech_style", "말투", true],
                ["status", "등록 상태", false]
            ];

            const inputs = {};

            for (const [key, label, multiline] of fields) {
                const item = field(
                    label, character[key], multiline
                );

                inputs[key] = item.input;
                body.append(item.wrapper);

                if (key === "academy_class") {
                    item.input.type = "number";
                    item.input.min = "1";
                    item.input.step = "1";
                }
            }

            const save = button(
                "기본 정보 저장",
                () => execute(save, async () => {
                    const values = {};

                    for (const key of Object.keys(inputs)) {
                        values[key] = inputs[key].value.trim();
                    }

                    if (!values.name) {
                        throw new Error("이름을 입력하세요.");
                    }

                    const academy = values.academy_class;

                    if (academy && (
                        !Number.isInteger(Number(academy)) ||
                        Number(academy) < 1
                    )) {
                        throw new Error("기수를 확인하세요.");
                    }

                    values.academy_class =
                        academy ? Number(academy) : null;

                    values.updated_at = new Date().toISOString();

                    check(await client
                        .from("marine_characters")
                        .update(values)
                        .eq("character_key", character.character_key)
                        .select("character_key")
                        .single()
                    );

                    Object.assign(character, values);

                    name.textContent = character.name;
                    subtitle.textContent =
                        `${character.alias} · ${character.rank}`;

                }, "캐릭터 정보 저장 완료"),
                "ui-primary"
            );

            body.append(save);
        }

        // 추천 답장 파싱
        // 한 줄에 하나씩 입력

        function parseChoices(value) {
            const choices = value
                .split(/\r?\n/)
                .map(text => text.trim())
                .filter(Boolean);

            if (choices.length > 8) {
                throw new Error("선택지는 최대 8개입니다.");
            }

            if (choices.some(text => text.length > 200)) {
                throw new Error("선택지는 각각 200자 이하로 입력하세요.");
            }

            return choices;
        }

        function validateContent(value) {
            const content = value.trim();

            if (!content || content.length > 2000) {
                throw new Error("대사는 1~2000자로 입력하세요.");
            }

            return content;
        }

        // 대사 관리

        async function renderDialogues() {
            body.replaceChildren();

            const select = node("select");

            for (const [key, label] of Object.entries(categories)) {
                const option = node("option", label);
                option.value = key;
                select.append(option);
            }

            select.value = category;

            select.onchange = () => {
                category = select.value;
                renderDialogues();
            };

            const selectedCategory = category;

            const list = node("div", null, "mch-dialogues");

            body.append(
                node("h3", "상황별 자동응답"),
                select,
                list
            );

            list.textContent = "대사 조회 중...";

            try {
                const rows = check(await client
                    .from("marine_dialogues")
                    .select("*")
                    .eq("character_key", character.character_key)
                    .eq("category", selectedCategory)
                    .order("created_at")
                );

                if (!list.isConnected ||
                    currentTab !== "dialogue" ||
                    category !== selectedCategory) {
                    return;
                }

                list.replaceChildren();

                list.append(
                    node("small", `등록된 대사 ${rows.length}개`)
                );

                if (!rows.length) {
                    list.append(
                        node("p", "사용자 등록 대사가 없습니다.")
                    );
                }

                for (const row of rows) {
                    list.append(dialogueCard(row));
                }

                list.append(newDialogueCard(selectedCategory));

            } catch (error) {
                list.textContent = "조회 실패: " + error.message;
            }
        }

        // 기존 대사 수정

        function dialogueCard(row) {
            const card = node("article", null, "mch-dialogue");

            const content = field("캐릭터 대사", row.content, true);

            const choices = field(
                "추천 답장 — 한 줄에 하나씩",
                Array.isArray(row.choices)
                    ? row.choices.join("\n")
                    : "",
                true
            );

            const enabled = node("input");
            enabled.type = "checkbox";
            enabled.checked = row.enabled;

            const toggle = node("label", null, "mch-toggle");

            toggle.append(
                enabled,
                document.createTextNode(" 대사 활성화")
            );

            const actions = node("div", null, "mch-actions");

            const save = button(
                "수정 저장",
                () => execute(save, async () => {
                    check(await client
                        .from("marine_dialogues")
                        .update({
                            content: validateContent(content.input.value),
                            choices: parseChoices(choices.input.value),
                            enabled: enabled.checked
                        })
                        .eq("id", row.id)
                        .select("id")
                        .single()
                    );
                }, "대사 수정 완료")
            );

            const remove = button("삭제", () => {
                remove.disabled = true;

                const confirmBox = node(
                    "div", null, "mch-confirm"
                );

                const confirm = button(
                    "삭제 확인",
                    () => execute(confirm, async () => {
                        check(await client
                            .from("marine_dialogues")
                            .delete()
                            .eq("id", row.id)
                            .select("id")
                            .single()
                        );

                        await renderDialogues();

                    }, "대사 삭제 완료"),
                    "mch-danger"
                );

                confirmBox.append(
                    node("span", "이 대사를 삭제할까요?"),
                    confirm,
                    button("취소", () => {
                        confirmBox.remove();
                        remove.disabled = false;
                    })
                );

                card.append(confirmBox);

            }, "mch-danger");

            actions.append(save, remove);

            card.append(
                content.wrapper,
                choices.wrapper,
                toggle,
                actions
            );

            return card;
        }

        // 새로운 대사 추가

        function newDialogueCard(selectedCategory) {
            const card = node("article", null, "mch-dialogue");

            const content = field("새로운 대사", "", true);
            const choices = field("추천 답장 — 한 줄에 하나씩", "", true);

            content.input.placeholder =
                "캐릭터가 보낼 메시지를 입력하세요.";

            choices.input.placeholder =
                "알겠습니다.\n농담이었습니다.";

            const add = button(
                "+ 대사 추가",
                () => execute(add, async () => {
                    check(await client
                        .from("marine_dialogues")
                        .insert({
                            character_key: character.character_key,
                            category: selectedCategory,
                            content: validateContent(content.input.value),
                            choices: parseChoices(choices.input.value),
                            enabled: true
                        })
                    );

                    if (currentTab === "dialogue" &&
                        category === selectedCategory) {
                        await renderDialogues();
                    }

                }, "새로운 대사 등록 완료"),
                "ui-primary"
            );

            card.append(
                node("h3", "대사 신규 등록"),
                content.wrapper,
                choices.wrapper,
                add
            );

            return card;
        }

        // 탭 전환

        const infoTab = button("기본 정보", () => switchTab("info"));

        const dialogueTab = button(
            "자동응답 대사",
            () => switchTab("dialogue")
        );

        function switchTab(tab) {
            currentTab = tab;

            infoTab.classList.toggle("mch-selected", tab === "info");

            dialogueTab.classList.toggle(
                "mch-selected", tab === "dialogue"
            );

            status.textContent = "";

            if (tab === "info") {
                renderInfo();
            } else {
                renderDialogues();
            }
        }

        tabs.append(infoTab, dialogueTab);

        switchTab("info");
    }

    window.MarineCharacters = {
        mount,
        categories
    };

})();
