/* ========================================
   MARINE OS - 해군 통신 시나리오 관리
   ======================================== */

(() => {
    "use strict";

    let db;
    let scenarios = [];
    let rooms = [];
    let characters = [];
    let members = [];
    let draft = null;
    let originalKey = null;
    let dirty = false;
    let busy = false;
    let loaded = false;

    const $ = id => document.getElementById(id);

    function check(result) {
        if (result.error) throw result.error;
        return result.data;
    }

    function el(tag, text = "", className = "") {
        const node = document.createElement(tag);
        node.textContent = text;
        node.className = className;
        return node;
    }

    function btn(text, handler, className = "") {
        const node = el("button", text, className);
        node.type = "button";
        node.onclick = handler;
        return node;
    }

    function status(message) {
        $("ms-status").textContent = message;
    }

    function changed() {
        dirty = true;
        status("저장하지 않은 변경사항이 있습니다.");
    }

    function canLeave() {
        return !busy && (
            !dirty ||
            confirm("저장하지 않은 변경사항이 있습니다. 계속할까요?")
        );
    }

    async function act(handler) {
        if (busy) return;

        busy = true;

        const controls = [
            ...$("marine-scenario-window").querySelectorAll(
                "button, input, select, textarea"
            )
        ];

        const previous = controls.map(node => node.disabled);
        controls.forEach(node => node.disabled = true);

        try {
            await handler();
        } catch (error) {
            status("오류: " + error.message);
            console.error(error);
        } finally {
            busy = false;
            controls.forEach((node, index) => {
                node.disabled = previous[index];
            });
        }
    }

    /* ========================================
       1. 관리 창 생성
       ======================================== */

    function createWindow() {
        if ($("marine-scenario-window")) return;

        const win = document.createElement("div");

        win.id = "marine-scenario-window";
        win.hidden = true;
        win.setAttribute("role", "dialog");
        win.setAttribute("aria-labelledby", "ms-window-title");

        win.innerHTML = `
            <div class="ms-titlebar">
                <div class="ms-window-title"
                     id="ms-window-title">
                    해군 통신 시나리오 관리
                </div>

                <div class="ms-window-controls">
                    <button id="ms-minimize"
                            title="최소화"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 8h10"/></svg></button>
                    <button id="ms-maximize"
                            title="최대화"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 3h10v10H3z"/></svg></button>
                    <button id="ms-close"
                            title="닫기"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
                </div>
            </div>

            <div class="ms-layout">

                <aside class="ms-sidebar">
                    <h2>시나리오 목록</h2>

                    <div id="ms-scenario-list"
                         class="ms-scenario-list">
                    </div>

                    <button id="ms-new"
                            class="ms-add-scenario">
                        + 추가
                    </button>
                </aside>

                <div class="ms-editor"
                     id="ms-editor">
                </div>

            </div>

            <div class="ms-footer">
                <span id="ms-status"
                      class="ms-status"
                      role="status">
                </span>

                <button id="ms-delete"
                        class="ms-danger">
                    삭제
                </button>

                <button id="ms-preview">
                    미리보기
                </button>

                <button id="ms-run">
                    수동 실행
                </button>

                <button id="ms-save"
                        class="ms-primary">
                    저장
                </button>
            </div>
        `;

        document.body.appendChild(win);
        // Same-origin admin iframe: inherit the desktop theme live.
        function syncTheme() {
            try {
                const desktop = window.parent.document.getElementById("desktop");
                if (!desktop) return;
                const parentStyle = window.parent.getComputedStyle(window.parent.document.documentElement);
                for (const [source, destination] of [["--ui-font", "--ms-font"], ["--ui-font-size", "--ms-font-size"], ["--ui-font-weight", "--ms-font-weight"]]) {
                    const value = parentStyle.getPropertyValue(source).trim();
                    if (value) document.documentElement.style.setProperty(destination, value);
                }
                const mode = desktop.dataset.uiMode || "light";
                document.documentElement.dataset.scenarioMode = mode;
                const bar = desktop.querySelector(".mw-titlebar");
                if (bar) document.documentElement.style.setProperty("--ms-title-bg", window.parent.getComputedStyle(bar).backgroundColor);
            } catch (error) { console.warn("Theme sync:", error); }
        }
        syncTheme();
        const themeTimer = window.setInterval(syncTheme, 400);
        window.addEventListener("pagehide", () => clearInterval(themeTimer), {once:true});
        try {
            const desktop = window.parent.document.getElementById("desktop");
            if (desktop) {
                const observer = new MutationObserver(syncTheme);
                observer.observe(desktop, {attributes: true});
                let ancestor = desktop.parentElement;
                while (ancestor) { observer.observe(ancestor, {attributes: true}); ancestor = ancestor.parentElement; }
                window.addEventListener("pagehide", () => observer.disconnect(), {once:true});
            }
        } catch (error) { console.warn(error); }


        $("ms-close").onclick = close;

        $("ms-minimize").onclick = () => {
            win.classList.remove("ms-maximized");
            win.classList.toggle("ms-minimized");
        };

        $("ms-maximize").onclick = () => {
            win.classList.remove("ms-minimized");
            win.classList.toggle("ms-maximized");
        };

        $("ms-new").onclick = newScenario;
        $("ms-save").onclick = () => act(saveScenario);
        $("ms-delete").onclick = () => act(deleteScenario);
        $("ms-preview").onclick = previewScenario;
        $("ms-run").onclick = () => act(runScenario);
    }

    /* ========================================
       2. Supabase 데이터 불러오기
       ======================================== */

    async function loadData() {
        status("데이터 불러오는 중...");

        const results = await Promise.all([
            db.from("marine_scenarios")
                .select("*")
                .order("title"),

            db.from("marine_rooms")
                .select("id, room_key, name")
                .eq("archived", false)
                .eq("room_type", "group")
                .order("name"),

            db.from("marine_characters")
                .select("character_key, name, alias")
                .order("name"),
            db.from("marine_room_members").select("room_id,character_key")
        ]);

        scenarios = check(results[0]);
        rooms = check(results[1]);
        characters = check(results[2]);
        members = check(results[3]);

        loaded = true;

        renderList();

        if (scenarios.length > 0) {
            selectScenario(scenarios[0].scenario_key);
        } else {
            renderEditor();
        }

        status("시나리오 불러오기 완료");
    }

    /* ========================================
       3. 왼쪽 시나리오 목록
       ======================================== */

    function renderList() {
        const root = $("ms-scenario-list");

        root.replaceChildren();

        for (const scenario of scenarios) {
            const item = btn(
                scenario.title,
                () => {
                    if (canLeave()) {
                        selectScenario(scenario.scenario_key);
                    }
                },
                "ms-scenario-item"
            );

            if (originalKey === scenario.scenario_key) {
                item.classList.add("active");
            }

            root.appendChild(item);
        }

        if (draft && !originalKey) {
            root.appendChild(
                el(
                    "div",
                    draft.title || "새 시나리오",
                    "ms-scenario-item active"
                )
            );
        }
    }

    function selectScenario(key) {
        const scenario = scenarios.find(
            item => item.scenario_key === key
        );

        if (!scenario) return;

        originalKey = key;
        draft = structuredClone(scenario);
        dirty = false;

        renderList();
        renderEditor();
        status("");
    }

    /* ========================================
       4. 새 시나리오 생성
       ======================================== */

    function newScenario() {
        if (!canLeave()) return;

        originalKey = null;

        draft = {
            scenario_key: "scenario_" +
                crypto.randomUUID().replaceAll("-", ""),

            title: "새 시나리오",
            room_key: rooms[0]?.room_key || "",
            trigger_type: "random",
            enabled: true,
            dialogue: []
        };

        dirty = true;

        renderList();
        renderEditor();

        status("새 시나리오를 작성하세요.");
    }

    /* ========================================
       5. 오른쪽 편집 영역
       ======================================== */

    function renderEditor() {
        const root = $("ms-editor");

        root.replaceChildren();

        if (!draft) {
            root.appendChild(
                el("p", "시나리오를 선택하거나 추가하세요.")
            );
            updateButtons();
            return;
        }

        const heading = el(
            "h2",
            draft.title,
            "ms-editor-heading"
        );

        root.appendChild(heading);

        // 시나리오 제목

        const titleLabel = el("label", "시나리오 제목");
        titleLabel.htmlFor = "ms-title";

        const titleInput = document.createElement("input");

        titleInput.id = "ms-title";
        titleInput.value = draft.title;

        titleInput.oninput = () => {
            draft.title = titleInput.value;
            heading.textContent = draft.title;
            changed();
        };

        root.append(titleLabel, titleInput);

        // 대화방 선택

        const roomLabel = el("label", "대화방");
        roomLabel.htmlFor = "ms-room";

        const roomSelect = document.createElement("select");
        roomSelect.id = "ms-room";

        fillOptions(
            roomSelect,
            rooms,
            "room_key",
            draft.room_key
        );

        roomSelect.options[0].textContent = "개인 통신 (대사 발신 캐릭터)";
        roomSelect.onchange = () => {
            draft.room_key = roomSelect.value || null;
            changed();
        };

        root.append(roomLabel, roomSelect);

        // 자동 실행 활성화

        const enabledLabel = el("label", "", "ms-enabled");

        const enabledInput = document.createElement("input");

        enabledInput.type = "checkbox";
        enabledInput.checked = draft.enabled;

        enabledInput.onchange = () => {
            draft.enabled = enabledInput.checked;
            changed();
        };

        enabledLabel.append(
            enabledInput,
            el("span", "자동 실행 활성화")
        );

        root.appendChild(enabledLabel);
        const trigger = document.createElement("select");
        for (const [value,label] of [["random","자동 연락"],["manual","수동 실행"]]) {const o=el("option",label);o.value=value;trigger.append(o);}
        trigger.value=draft.trigger_type; trigger.onchange=()=>{draft.trigger_type=trigger.value;changed();}; root.append(el("label","실행 방식"),trigger);
        if(originalKey) root.append(btn("실행 기록 초기화",()=>act(async()=>{if(!confirm("이 시나리오 실행 기록만 초기화할까요?"))return; const user=check(await db.auth.getUser()).user;check(await db.from("marine_simulation_log").delete().eq("user_id",user.id).eq("scenario_key",originalKey));status("초기화 완료");})));

        // 대화 순서

        const dialogueSection = el(
            "div",
            "",
            "ms-dialogue-section"
        );

        dialogueSection.appendChild(
            el("h3", "대화 순서")
        );

        const dialogueList = el(
            "div",
            "",
            "ms-dialogue-list"
        );

        draft.dialogue.forEach((line, index) => {
            dialogueList.appendChild(
                createDialogueCard(line, index)
            );
        });

        dialogueSection.appendChild(dialogueList);

        const addButton = btn("+ 대사 추가", () => {
            const previous = draft.dialogue.at(-1);

            draft.dialogue.push({
                sender: availableCharacters()[0]?.character_key || "",
                text: "",
                delay: previous
                    ? Math.min(Number(previous.delay) + 5, 59)
                    : 0
            });

            changed();
            renderEditor();
        });

        addButton.style.width = "100%";
        addButton.style.marginTop = "14px";

        dialogueSection.appendChild(addButton);
        root.appendChild(dialogueSection);

        updateButtons();
    }

    function fillOptions(select, items, key, current) {
        const placeholder = el("option", "선택하세요");
        placeholder.value = "";
        select.appendChild(placeholder);

        for (const item of items) {
            const option = el("option", item.name);

            option.value = item[key];

            select.appendChild(option);
        }

        // 기존 데이터의 알 수 없는 값을 보존
        if (current && !items.some(item => item[key] === current)) {
            const option = el("option", current);
            option.value = current;
            select.appendChild(option);
        }

        select.value = current || "";
    }

    /* ========================================
       6. 개별 대사 편집 카드
       ======================================== */

    function createDialogueCard(line, index) {
        const card = el(
            "div",
            "",
            "ms-dialogue-card"
        );

        const header = el(
            "div",
            "",
            "ms-dialogue-header"
        );

        const controls = el("div");

        const up = btn("↑", () => {
            moveDialogue(index, -1);
        }, "ms-icon-button");

        const down = btn("↓", () => {
            moveDialogue(index, 1);
        }, "ms-icon-button");

        up.disabled = index === 0;
        down.disabled = index === draft.dialogue.length - 1;

        controls.append(
            up,
            down,
            btn("삭제", () => {
                if (!confirm("이 대사를 삭제할까요?")) return;

                draft.dialogue.splice(index, 1);

                changed();
                renderEditor();
            }, "ms-icon-button")
        );

        header.append(
            el("span", "#" + (index + 1)),
            controls
        );

        // 캐릭터 선택

        const senderSelect = document.createElement("select");

        senderSelect.setAttribute("aria-label", "발신 캐릭터");

        fillOptions(
            senderSelect,
            availableCharacters(),
            "character_key",
            line.sender
        );

        senderSelect.onchange = () => {
            line.sender = senderSelect.value;
            changed();
        };

        // 대사 입력

        const message = document.createElement("textarea");

        message.value = line.text || "";
        message.placeholder = "대사를 입력하세요.";
        message.setAttribute("aria-label", "대사");

        message.oninput = () => {
            line.text = message.value;
            changed();
        };

        // 발송 시간

        const delayRow = el("div", "", "ms-delay-row");

        const delay = document.createElement("input");

        delay.type = "number";
        delay.className = "ms-delay-input";
        delay.min = "0";
        delay.max = "59";
        delay.step = "1";
        delay.value = line.delay ?? 0;
        delay.setAttribute("aria-label", "시작 후 발송 시간");

        delay.oninput = () => {
            line.delay = delay.value === ""
                ? null
                : Number(delay.value);

            changed();
        };

        delayRow.append(
            el("span", "시작 후"),
            delay,
            el("span", "초에 발송")
        );

        card.append(
            header,
            senderSelect,
            message,
            delayRow
        );

        const choices = document.createElement("textarea");
        choices.placeholder = "선택지 | 응답 (한 줄에 하나)";
        choices.value = (line.choices || []).map(c => typeof c === "string" ? c : `${c.label || c.text || ""} | ${c.response || ""}`).join("\n");
        choices.oninput = () => { line.choices = choices.value.split("\n").filter(x => x.trim()).map(x => {const [label,...response]=x.split("|"); return {label:label.trim(),response:response.join("|").trim()};}); changed(); };
        card.append(el("label","추천 답장 및 응답"),choices);
        return card;
    }

    /* ========================================
       7. 대사 순서 변경
       ======================================== */

    function moveDialogue(index, direction) {
        const nextIndex = index + direction;

        if (
            nextIndex < 0 ||
            nextIndex >= draft.dialogue.length
        ) return;

        [
            draft.dialogue[index],
            draft.dialogue[nextIndex]
        ] = [
            draft.dialogue[nextIndex],
            draft.dialogue[index]
        ];

        changed();
        renderEditor();
    }

    /* ========================================
       8. 입력값 검증
       ======================================== */

    function availableCharacters() {
        if (!draft?.room_key) return characters;
        const room = rooms.find(r=>r.room_key===draft.room_key);
        return characters.filter(c=>members.some(m=>m.room_id===room?.id && m.character_key===c.character_key));
    }

    function validateScenario() {
        if (!draft) {
            throw new Error("선택된 시나리오가 없습니다.");
        }

        if (!draft.title.trim()) {
            throw new Error("시나리오 제목을 입력하세요.");
        }

        if (draft.room_key && !rooms.some(r => r.room_key === draft.room_key)) {
            throw new Error("올바른 대화방을 선택하세요.");
        }

        if (!draft.dialogue.length) {
            throw new Error("대사를 한 개 이상 추가하세요.");
        }

        let previousDelay = -1;

        draft.dialogue.forEach((line, index) => {
            const number = index + 1;

            if (!availableCharacters().some(
                c => c.character_key === line.sender
            )) {
                throw new Error(
                    number + "번 대사의 캐릭터를 선택하세요."
                );
            }

            if (!line.text?.trim()) {
                throw new Error(
                    number + "번 대사의 내용을 입력하세요."
                );
            }

            if (
                !Number.isInteger(line.delay) ||
                line.delay < 0 ||
                line.delay > 59
            ) {
                throw new Error(
                    number + "번 발송 시간은 0~59초여야 합니다."
                );
            }

            if (line.delay < previousDelay) {
                throw new Error(
                    "발송 시간은 대화 순서대로 설정하세요."
                );
            }

            previousDelay = line.delay;
        });
    }

    /* ========================================
       9. 시나리오 저장
       ======================================== */

    async function saveScenario() {
        validateScenario();

        const payload = {
            scenario_key: draft.scenario_key,
            title: draft.title.trim(),
            room_key: draft.room_key || null,
            trigger_type: draft.trigger_type,
            dialogue: draft.dialogue,
            enabled: draft.enabled
        };

        let result;

        if (originalKey) {
            result = await db
                .from("marine_scenarios")
                .update(payload)
                .eq("scenario_key", originalKey)
                .select()
                .single();
        } else {
            result = await db
                .from("marine_scenarios")
                .insert(payload)
                .select()
                .single();
        }

        const saved = check(result);

        const index = scenarios.findIndex(
            item => item.scenario_key === saved.scenario_key
        );

        if (index === -1) {
            scenarios.push(saved);
        } else {
            scenarios[index] = saved;
        }

        scenarios.sort(
            (a, b) => a.title.localeCompare(b.title, "ko")
        );

        originalKey = saved.scenario_key;
        draft = structuredClone(saved);
        dirty = false;

        renderList();
        renderEditor();

        status("시나리오 저장 완료");
    }

    /* ========================================
       10. 시나리오 삭제
       ======================================== */

    async function deleteScenario() {
        if (!draft) return;

        if (!confirm(
            "'" + draft.title + "' 시나리오를 삭제할까요?"
        )) return;

        if (originalKey) {
            check(await db
                .from("marine_scenarios")
                .delete()
                .eq("scenario_key", originalKey)
                .select("scenario_key")
                .single()
            );

            scenarios = scenarios.filter(
                item => item.scenario_key !== originalKey
            );
        }

        draft = null;
        originalKey = null;
        dirty = false;

        if (scenarios.length) {
            selectScenario(scenarios[0].scenario_key);
        } else {
            renderList();
            renderEditor();
        }

        status("시나리오 삭제 완료");
    }

    /* ========================================
       11. 대화 미리보기
       ======================================== */

    function previewScenario() {
        if (!draft || busy) return;

        const dialog = document.createElement("dialog");

        Object.assign(dialog.style, {
            width: "min(600px, 90vw)",
            maxHeight: "80vh",
            background: "var(--ms-surface, #ffffff)",
            color: "var(--ms-text, #181818)",
            border: "1px solid var(--ms-border, #d3d3d3)",
            borderRadius: "12px",
            padding: "24px",
            fontFamily: 'var(--ms-font, "Noto Sans KR", sans-serif)',
            fontSize: "var(--ms-font-size, 14px)",
            fontWeight: "var(--ms-font-weight, 400)"
        });

        dialog.appendChild(
            el("h2", draft.title + " · 미리보기")
        );

        for (const line of draft.dialogue) {
            const character = characters.find(
                item => item.character_key === line.sender
            );

            const block = el("div");

            Object.assign(block.style, {
                padding: "14px",
                margin: "12px 0",
                border: "1px solid var(--ms-border, #dedede)",
                borderRadius: "10px"
            });

            const name = el(
                "strong",
                (character?.name || line.sender)
                    + " · " + line.delay + "초"
            );

            const text = el("p", line.text);

            text.style.whiteSpace = "pre-wrap";
            text.style.overflowWrap = "anywhere";

            block.append(name, text);
            dialog.appendChild(block);
        }

        const closeButton = btn("닫기", () => dialog.close());

        Object.assign(closeButton.style, {
            color: "var(--ms-text, #181818)",
            background: "var(--ms-surface, #ffffff)",
            border: "1px solid var(--ms-border, #d3d3d3)",
            borderRadius: "8px",
            padding: "8px 16px"
        });

        dialog.appendChild(closeButton);

        dialog.addEventListener("close", () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    /* ========================================
       12. 시나리오 수동 실행
       ======================================== */

    async function runScenario() {
        if (!draft || !originalKey) {
            throw new Error("먼저 시나리오를 저장하세요.");
        }

        if (dirty) {
            throw new Error("변경사항을 먼저 저장하세요.");
        }

        if (!confirm(
            "'" + draft.title + "' 대화를 실행할까요?"
        )) return;

        status("시나리오 실행 중...");

        const result = check(await db.rpc(
            "marine_run_scenario",
            {
                p_scenario_key: originalKey
            }
        ));

        console.log("시나리오 실행 결과:", result);

        status("수동 실행 요청 완료. 결과는 콘솔에서 확인하세요.");
    }

    /* ========================================
       13. 버튼 상태 관리
       ======================================== */

    function updateButtons() {
        $("ms-save").disabled = !draft;
        $("ms-delete").disabled = !draft;
        $("ms-preview").disabled = !draft;
        $("ms-run").disabled = !originalKey;
    }

    /* ========================================
       14. 관리 창 열기 및 닫기
       ======================================== */

    async function open(supabaseClient) {
        db = supabaseClient;

        createWindow();

        const win = $("marine-scenario-window");

        win.hidden = false;
        win.classList.remove("ms-minimized");

        if (!loaded) {
            await act(loadData);
        }
    }

    function close() {
        if (!canLeave()) return;

        if (dirty) {
            draft = null;
            originalKey = null;
            dirty = false;
            loaded = false;
            renderList();
            renderEditor();
        }

        $("marine-scenario-window").hidden = true;
    }

    window.MarineScenarios = {
        open,
        close
    };

})();