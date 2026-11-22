
/*
 * MARINE OS v2.0
 * 메모장 및 바탕화면 스티커 메모
 * marine-notes.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";

    const timers = new Map();

    const pending = new Map();

    const hiddenNotes = new Set();

    const colors = [

        "#E8DCA0",
        "#BBD5E8",
        "#C7DEC4",
        "#E7BFCB",
        "#D5C8E8",
        "#EEEEEE"

    ];


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


    async function authorize(client) {

        const auth = check(
            await client.auth.getUser()
        );

        if (auth.user?.id !== ADMIN_UID) {

            throw new Error("접근 권한 없음");

        }

    }


    function changed() {

        document.dispatchEvent(

            new CustomEvent(
                "marine:notes-changed"
            )

        );

    }


    // =========================================
    // 메모 조회
    // =========================================

    async function load(client) {

        await authorize(client);

        return check(

            await client

                .from("marine_notes")

                .select("*")

                .eq("user_id", ADMIN_UID)

                .order(
                    "updated_at",
                    { ascending: false }
                )

        );

    }


    // =========================================
    // 새 메모 생성
    // =========================================

    async function create(client) {

        const note = check(

            await client

                .from("marine_notes")

                .insert({

                    user_id: ADMIN_UID,

                    title: "새 메모",

                    content: "",

                    pinned: false,

                    position_x: 60,

                    position_y: 40,

                    width: 280,

                    height: 260,

                    color: colors[0],

                    opacity: 1,

                    checklist: []

                })

                .select()

                .single()

        );

        changed();

        return note;

    }


    // =========================================
    // 메모 저장
    // =========================================

    async function save(client, id, values) {

        return check(

            await client

                .from("marine_notes")

                .update({

                    ...values,

                    updated_at:
                        new Date().toISOString()

                })

                .eq("id", id)

                .eq("user_id", ADMIN_UID)

        );

    }


    // =========================================
    // 자동 저장
    // =========================================

    function autoSave(
        client,
        id,
        values,
        status
    ) {

        const old = pending.get(id) || {};

        pending.set(id, {
            ...old,
            ...values
        });

        clearTimeout(timers.get(id));

        if (status) {
            status.textContent = "저장 중...";
        }


        timers.set(

            id,

            setTimeout(async () => {

                try {

                    const data =
                        pending.get(id);

                    pending.delete(id);

                    timers.delete(id);


                    await save(
                        client,
                        id,
                        data
                    );


                    if (status) {

                        status.textContent =
                            "자동 저장 완료";

                    }

                } catch (error) {

                    if (status) {

                        status.textContent =
                            "저장 실패: "
                            + error.message;

                    }

                }

            }, 700)

        );

    }


    // =========================================
    // 대기 중인 저장 처리
    // =========================================

    async function flush(client, id) {

        clearTimeout(timers.get(id));

        timers.delete(id);

        const values = pending.get(id);

        if (!values) {
            return;
        }

        await save(client, id, values);

        pending.delete(id);

    }


    // =========================================
    // TXT 내보내기
    // =========================================

    function exportNote(title, content, items) {

        const checklist = items.map(

            item =>

                (item.done ? "[x] " : "[ ] ")
                + item.text

        ).join("\n");


        const blob = new Blob(

            [
                "\uFEFF",
                title,
                "\n\n",
                content,
                "\n\n",
                checklist
            ],

            {
                type: "text/plain;charset=utf-8"
            }

        );


        const url = URL.createObjectURL(blob);

        const a = node("a");

        a.href = url;

        a.download =

            (title || "메모")

                .replace(
                    /[\\/:*?"<>|]/g,
                    "_"
                )

            + ".txt";


        document.body.append(a);

        a.click();

        a.remove();


        setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );

    }


    // =========================================
    // 체크리스트 편집기
    // =========================================

    function checklistEditor(items, onChange) {

        const wrap = node("div");

        wrap.style.display = "grid";

        wrap.style.gap = "5px";


        function render() {

            wrap.replaceChildren();

            items.forEach((item, index) => {

                const row = node("div");

                Object.assign(row.style, {

                    display: "flex",

                    alignItems: "center",

                    gap: "5px"

                });


                const checkBox = node("input");

                checkBox.type = "checkbox";

                checkBox.checked = item.done;


                const text = node("input");

                text.value = item.text;

                text.style.flex = "1";

                text.style.minWidth = "0";

                text.style.textDecoration =

                    item.done
                        ? "line-through"
                        : "none";


                checkBox.onchange = () => {

                    item.done = checkBox.checked;

                    text.style.textDecoration =

                        item.done
                            ? "line-through"
                            : "none";

                    onChange(items);

                };


                text.oninput = () => {

                    item.text = text.value;

                    onChange(items);

                };


                const remove = node(
                    "button", "×"
                );

                remove.onclick = () => {

                    items.splice(index, 1);

                    onChange(items);

                    render();

                };


                row.append(
                    checkBox,
                    text,
                    remove
                );

                wrap.append(row);

            });


            const add = node(
                "button",
                "+ 체크리스트 항목"
            );

            add.onclick = () => {

                items.push({

                    text: "",

                    done: false

                });

                onChange(items);

                render();

            };

            wrap.append(add);

        }


        render();

        return wrap;

    }


    // =========================================
    // 일반 메모장
    // =========================================

    async function mount(root, client) {

        await authorize(client);

        let notes = await load(client);

        let selected = null;


        root.replaceChildren();


        const shell = node("div");

        Object.assign(shell.style, {

            display: "flex",

            height: "100%",

            minHeight: "300px",

            gap: "12px"

        });


        const side = node("aside");

        Object.assign(side.style, {

            width: "170px",

            flexShrink: "0",

            overflowY: "auto",

            borderRight: "1px solid #8885",

            paddingRight: "10px"

        });


        const editor = node("section");

        Object.assign(editor.style, {

            flex: "1",

            minWidth: "0",

            overflowY: "auto"

        });


        shell.append(side, editor);

        root.append(shell);


        // 메모 목록

        function renderList() {

            side.replaceChildren();


            const add = node(
                "button",
                "+ 새 메모"
            );

            add.style.width = "100%";


            add.onclick = async () => {

                try {

                    if (selected) {

                        await flush(
                            client,
                            selected.id
                        );

                    }

                    const note =
                        await create(client);

                    notes.unshift(note);

                    openNote(note);

                    renderList();

                } catch (error) {

                    editor.append(
                        node("p", error.message)
                    );

                }

            };

            side.append(add);


            for (const note of notes) {

                const button = node(

                    "button",

                    (note.pinned ? "[고정] " : "")

                    + (note.title || "제목 없음")

                );


                Object.assign(button.style, {

                    display: "block",

                    width: "100%",

                    textAlign: "left",

                    marginTop: "6px",

                    overflowWrap: "anywhere"

                });

button.className = "mn-list-item";

button.classList.toggle(

    "mn-active",

    selected?.id === note.id

);

button.setAttribute(

    "aria-pressed",

    String(selected?.id === note.id)

);
                button.onclick = async () => {

                    try {

                        if (selected) {

                            await flush(
                                client,
                                selected.id
                            );

                        }

                        openNote(note);

                    } catch (error) {

                        editor.append(
                            node("p", error.message)
                        );

                    }

                };

                side.append(button);

            }

        }


        // 메모 편집 화면

        function openNote(note) {

            selected = note;

renderList();

            editor.replaceChildren();


            const title = node("input");

            title.value = note.title;

            title.placeholder = "메모 제목";

            title.style.width = "100%";

            title.style.fontSize = "20px";


            const content = node("textarea");

            content.value = note.content;

            content.placeholder = "메모를 작성하세요.";

            Object.assign(content.style, {

                width: "100%",

                minHeight: "200px",

                resize: "vertical",

                boxSizing: "border-box",

                marginTop: "10px"

            });

            // Ruled paper: align the background with each text line.
            Object.assign(content.style, {
                lineHeight: "24px",
                paddingTop: "8px",
                paddingBottom: "8px",
                backgroundImage: "linear-gradient(to bottom, transparent 23px, color-mix(in srgb, currentColor 16%, transparent) 23px)",
                backgroundSize: "100% 24px",
                backgroundPosition: "0 8px",
                backgroundAttachment: "local",
                backgroundRepeat: "repeat"
            });


            const status = node(
                "small",
                "저장 완료"
            );


            title.oninput = () => {

                note.title = title.value;

                autoSave(

                    client,

                    note.id,

                    { title: note.title },

                    status

                );

                renderList();

            };


            content.oninput = () => {

                note.content = content.value;

                autoSave(

                    client,

                    note.id,

                    { content: note.content },

                    status

                );

            };


            editor.append(
                title,
                content,
                status
            );


            // 체크리스트

            editor.append(
                node("h3", "체크리스트")
            );


            const items = Array.isArray(
                note.checklist
            )

                ? note.checklist

                : [];


            note.checklist = items;


            editor.append(

                checklistEditor(items, values => {

                    autoSave(

                        client,

                        note.id,

                        { checklist: values },

                        status

                    );

                })

            );


            // 스티커 메모 설정

            editor.append(
                node("h3", "스티커 메모 설정")
            );


            const toolbar = node("div");

            Object.assign(toolbar.style, {

                display: "flex",

                flexWrap: "wrap",

                gap: "8px"

            });


            const pin = node(

                "button",

                note.pinned

                    ? "바탕화면 고정 해제"

                    : "바탕화면에 고정"

            );


            pin.onclick = async () => {

                pin.disabled = true;

                try {

                    await flush(
                        client,
                        note.id
                    );

                    await save(

                        client,

                        note.id,

                        { pinned: !note.pinned }

                    );

                    note.pinned = !note.pinned;

                    hiddenNotes.delete(note.id);

                    renderList();

                    openNote(note);

                    changed();

                } catch (error) {

                    status.textContent =
                        error.message;

                    pin.disabled = false;

                }

            };


            const exportButton = node(
                "button",
                "TXT 내보내기"
            );

            exportButton.onclick = () => {

                exportNote(

                    title.value,

                    content.value,

                    items

                );

            };


            toolbar.append(
                pin,
                exportButton
            );

            editor.append(toolbar);


            // 메모 색상

            const palette = node("div");

            Object.assign(palette.style, {

                display: "flex",

                gap: "8px",

                margin: "12px 0"

            });


            function stickyCards() {
                return [...document.querySelectorAll('.marine-sticky-note')]
                    .filter(card => card.dataset.noteId === String(note.id));
            }

            function highlightColor() {
                for (const button of palette.querySelectorAll('button')) {
                    const active = button.title.toUpperCase() ===
                        (note.color || colors[0]).toUpperCase();
                    button.style.outline = active ? '2px solid #333' : 'none';
                    button.style.outlineOffset = '2px';
                    button.setAttribute('aria-pressed', String(active));
                }
            }

            for (const color of colors) {
                const button = node('button');
                button.type = 'button';
                button.title = color;
                Object.assign(button.style, {
                    background: color,
                    width: '30px', height: '30px',
                    border: '1px solid #777', cursor: 'pointer'
                });
                button.onclick = async () => {
                    const previous = note.color;
                    const buttons = [...palette.querySelectorAll('button')];
                    buttons.forEach(b => b.disabled = true);
                    note.color = color;
                    stickyCards().forEach(card => card.style.background = color);
                    highlightColor();
                    try {
                        await save(client, note.id, { color });
                        status.textContent = '색상 저장 완료';
                    } catch (error) {
                        note.color = previous;
                        stickyCards().forEach(card => card.style.background = previous || colors[0]);
                        highlightColor();
                        status.textContent = '저장 실패: ' + error.message;
                    } finally {
                        buttons.forEach(b => b.disabled = false);
                    }
                };
                palette.append(button);
            }
            highlightColor();

            editor.append(
                node("p", "메모 색상"),
                palette
            );


            // 투명도

            const opacity = node("input");

            opacity.type = "range";

            opacity.min = "0.4";

            opacity.max = "1";

            opacity.step = "0.05";

            opacity.value = note.opacity || 1;


            opacity.oninput = () => {
                stickyCards().forEach(card => card.style.opacity = opacity.value);
            };
            opacity.onchange = async () => {
                const previous = note.opacity || 1;
                const value = Number(opacity.value);
                opacity.disabled = true;
                try {
                    await save(client, note.id, { opacity: value });
                    note.opacity = value;
                    status.textContent = '투명도 저장 완료';
                } catch (error) {
                    opacity.value = previous;
                    stickyCards().forEach(card => card.style.opacity = String(previous));
                    status.textContent = '저장 실패: ' + error.message;
                } finally {
                    opacity.disabled = false;
                }
            };

            editor.append(
                node("p", "메모 투명도"),
                opacity
            );


            // 메모 삭제

            const remove = node(
                "button",
                "메모 삭제"
            );


            remove.onclick = () => {

                const confirmBox = node("div");

                confirmBox.append(

                    node(
                        "p",
                        "이 메모를 삭제하시겠습니까?"
                    )

                );


                const yes = node(
                    "button",
                    "삭제"
                );

                const no = node(
                    "button",
                    "취소"
                );


                yes.onclick = async () => {

                    yes.disabled = true;

                    try {

                        await flush(
                            client,
                            note.id
                        );

                        check(

                            await client

                                .from("marine_notes")

                                .delete()

                                .eq("id", note.id)

                                .eq(
                                    "user_id",
                                    ADMIN_UID
                                )

                        );


                        notes = notes.filter(

                            item => item.id !== note.id

                        );

                        selected = null;

                        editor.replaceChildren();

                        renderList();

                        changed();

                    } catch (error) {

                        status.textContent =
                            error.message;

                        yes.disabled = false;

                    }

                };


                no.onclick = () =>
                    confirmBox.remove();


                confirmBox.append(yes, no);

                remove.after(confirmBox);

                remove.disabled = true;

                no.addEventListener(
                    "click",
                    () => remove.disabled = false
                );

            };


            editor.append(
                node("hr"),
                remove
            );

        }


        renderList();


        if (notes.length) {

            openNote(notes[0]);

        } else {

            editor.append(

                node(
                    "p",
                    "새 메모를 작성해 주세요."
                )

            );

        }

    }


    // =========================================
    // 바탕화면 스티커 메모
    // =========================================

    async function renderDesktop(
        desktop,
        client,
        animate = false
    ) {

        const notes = await load(client);


        // 기존 스티커의 대기 중인 저장 처리

        const existing = desktop.querySelectorAll(
            ".marine-sticky-note"
        );

        for (const element of existing) {

            await flush(
                client,
                element.dataset.noteId
            );

            element.remove();

        }


        const pinned = notes.filter(

            note =>

                note.pinned

                && !hiddenNotes.has(note.id)

        );


        // 저장된 메모를 다시 조회

        const latest = pinned.length

            ? await load(client)

            : [];


        latest.filter(

            note =>

                note.pinned

                && !hiddenNotes.has(note.id)

        ).forEach((note, index) => {


            const card = node(

                "article",

                null,

                "marine-sticky-note"

            );

            card.dataset.noteId = note.id;


            // 바탕화면 범위를 벗어나지 않도록 제한

            const width = Math.min(

                Number(note.width) || 280,

                desktop.clientWidth || 280

            );


            const height = Math.min(

                Number(note.height) || 240,

                desktop.clientHeight || 240

            );


            const x = Math.max(

                0,

                Math.min(

                    Number(note.position_x) || 0,

                    desktop.clientWidth - width

                )

            );


            const y = Math.max(

                0,

                Math.min(

                    Number(note.position_y) || 0,

                    desktop.clientHeight - height

                )

            );


            Object.assign(card.style, {

                position: "absolute",

                left: x + "px",

                top: y + "px",

                width: width + "px",

                height: height + "px",

                minWidth: "180px",

                minHeight: "150px",

                background: note.color || colors[0],

                color: "#292929",

                opacity: animate
                    ? "0"
                    : String(note.opacity || 1),

                zIndex: note.always_on_top
                    ? "90"
                    : "5",

                resize: "both",

                overflow: "hidden",

                display: "flex",

                flexDirection: "column",

                boxShadow:
                    "2px 5px 16px #0003",

                transition:
                    "opacity 350ms ease",

                boxSizing: "border-box"

            });


            // 상단 제목 표시줄

            const header = node("header");

            Object.assign(header.style, {

                display: "flex",

                alignItems: "center",

                padding: "7px",

                background: "#00000012",

                cursor: "move",

                touchAction: "none",

                userSelect: "none"

            });


            const title = node(
                "strong",
                note.title
            );

            title.style.flex = "1";


            const close = node(
                "button", "×"
            );

            close.title = "이번 접속에서 숨기기";

            close.onclick = async () => {

                try {

                    await flush(
                        client,
                        note.id
                    );

                    hiddenNotes.add(note.id);

                    observer.disconnect();

                    card.remove();

                } catch (error) {

                    status.textContent =
                        error.message;

                }

            };


            header.append(title, close);

            card.append(header);


            // 메모 내용

            const body = node("textarea");

            body.value = note.content;


            Object.assign(body.style, {

                background: "transparent",

                color: "#292929",

                border: "none",

                outline: "none",

                padding: "10px",

                flex: "1",

                minHeight: "35px",

                resize: "none",

                fontSize: "13px",

                boxSizing: "border-box"

            });

            // Ruled paper: align the background with each text line.
            Object.assign(body.style, {
                lineHeight: "24px",
                paddingTop: "8px",
                paddingBottom: "8px",
                backgroundImage: "linear-gradient(to bottom, transparent 23px, color-mix(in srgb, #292929 16%, transparent) 23px)",
                backgroundSize: "100% 24px",
                backgroundPosition: "0 8px",
                backgroundAttachment: "local",
                backgroundRepeat: "repeat"
            });


            const status = node("small", "");

            status.style.padding = "4px 8px";


            body.oninput = () => {

                autoSave(

                    client,

                    note.id,

                    { content: body.value },

                    status

                );

            };


            card.append(body);


            // 체크리스트

            const items = Array.isArray(
                note.checklist
            )

                ? note.checklist

                : [];


            const list = node("div");

            Object.assign(list.style, {

                maxHeight: "40%",

                overflowY: "auto",

                padding: "4px 8px"

            });


            items.forEach(item => {

                const label = node("label");

                label.style.display = "flex";

                label.style.gap = "5px";


                const checkbox = node("input");

                checkbox.type = "checkbox";

                checkbox.checked = item.done;


                const text = node(
                    "span",
                    item.text
                );

                text.style.fontSize = "12px";

                text.style.textDecoration =

                    item.done
                        ? "line-through"
                        : "none";


                checkbox.onchange = () => {

                    item.done = checkbox.checked;

                    text.style.textDecoration =

                        item.done
                            ? "line-through"
                            : "none";


                    autoSave(

                        client,

                        note.id,

                        { checklist: items },

                        status

                    );

                };


                label.append(checkbox, text);

                list.append(label);

            });


            card.append(list, status);


            // =============================
            // 메모 드래그 이동
            // =============================

            header.onpointerdown = e => {

                if (
                    e.button !== 0
                    || e.target.closest("button")
                ) {
                    return;
                }


                const startX = e.clientX;

                const startY = e.clientY;

                const left = card.offsetLeft;

                const top = card.offsetTop;


                header.setPointerCapture(
                    e.pointerId
                );


                header.onpointermove = move => {

                    const newX = Math.max(

                        0,

                        Math.min(

                            left + move.clientX - startX,

                            desktop.clientWidth
                                - card.offsetWidth

                        )

                    );


                    const newY = Math.max(

                        0,

                        Math.min(

                            top + move.clientY - startY,

                            desktop.clientHeight
                                - card.offsetHeight

                        )

                    );


                    card.style.left =
                        newX + "px";

                    card.style.top =
                        newY + "px";

                };


                const finish = () => {

                    header.onpointermove = null;

                    header.onpointerup = null;

                    header.onpointercancel = null;


                    autoSave(

                        client,

                        note.id,

                        {

                            position_x:
                                card.offsetLeft,

                            position_y:
                                card.offsetTop

                        },

                        status

                    );

                };


                header.onpointerup = finish;

                header.onpointercancel = finish;

            };


            // =============================
            // 메모 크기 저장
            // =============================

            let previousWidth = width;

            let previousHeight = height;


            const observer = new ResizeObserver(

                () => {

                    if (!card.isConnected) {

                        observer.disconnect();

                        return;

                    }


                    const w = card.offsetWidth;

                    const h = card.offsetHeight;


                    if (

                        w === previousWidth

                        && h === previousHeight

                    ) {
                        return;
                    }


                    previousWidth = w;

                    previousHeight = h;


                    autoSave(

                        client,

                        note.id,

                        {
                            width: w,
                            height: h
                        },

                        status

                    );

                }

            );


            desktop.append(card);

            observer.observe(card);


            // 접속 시 메모 순차 등장

            if (animate) {

                setTimeout(() => {

                    card.style.opacity =
                        note.opacity || 1;

                }, index * 250 + 150);

            }

        });

    }


    // =========================================
    // 숨겨진 스티커 다시 표시
    // =========================================

    async function restoreDesktop(
        desktop,
        client
    ) {

        hiddenNotes.clear();

        await renderDesktop(
            desktop,
            client,
            true
        );

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineNotes = {

        mount,

        load,

        save,

        flush,

        renderDesktop,

        restoreDesktop

    };

})();
