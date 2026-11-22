
/*
 * MARINE OS v2.0
 * 통합 윈도우 관리 시스템
 * marine-windows.js
 */

(() => {

    "use strict";

    const STORAGE_KEY = "marine-window-layout-v2";

    let desktop = null;

    let taskbar = null;

    let zIndex = 100;

    const windows = new Map();


    // =====================================
    // 공통 함수
    // =====================================

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


    function readLayout() {

        try {

            return JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};

        } catch {

            return {};

        }

    }


    function saveLayout(app) {

        if (app.maximized || app.minimized) {
            return;
        }

        const layout = readLayout();

        layout[app.id] = {

            x: app.window.offsetLeft,

            y: app.window.offsetTop,

            width: app.window.offsetWidth,

            height: app.window.offsetHeight

        };

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(layout)
            );

        } catch {}

    }


    // =====================================
    // 시스템 초기화
    // =====================================

    function init(options) {

        desktop = options.desktop;

        taskbar = options.taskbar;

        if (!desktop || !taskbar) {

            throw new Error(
                "바탕화면 또는 작업 표시줄이 없습니다."
            );

        }

        if (
            getComputedStyle(desktop).position
            === "static"
        ) {

            desktop.style.position = "relative";

        }

        desktop.style.overflow = "hidden";

        installStyles();

    }


    // =====================================
    // 창 기본 디자인
    // =====================================

    function installStyles() {

        if (
            document.getElementById(
                "marine-window-style"
            )
        ) {
            return;
        }

        const style = node("style");

        style.id = "marine-window-style";

        style.textContent = `

            .mw-window {

                position: absolute;
                display: flex;
                flex-direction: column;

                background: var(--window-bg, #f4f5f7);
                color: var(--window-text, #20252b);

                border: 1px solid #77818a;
                box-shadow: 0 8px 28px #0005;

                box-sizing: border-box;
                overflow: hidden;

                font-family:
                    "Malgun Gothic",
                    "Noto Sans KR",
                    sans-serif;

            }

            .mw-window[hidden] {
                display: none !important;
            }

            .mw-window.mw-active {

                border-color:
                    var(--accent, #496b8b);

            }

            .mw-titlebar {

                display: flex;

                align-items: center;

                height: 34px;

                flex-shrink: 0;

                background:
                    var(--titlebar-bg, #26394d);

                color: #fff;

                cursor: move;

                user-select: none;

                touch-action: none;

            }

            .mw-title {

                flex: 1;

                padding: 0 12px;

                font-size: 12px;

                white-space: nowrap;

                overflow: hidden;

                text-overflow: ellipsis;

            }

            .mw-controls {

                display: flex;

                height: 100%;

            }

            .mw-controls button {

                display: grid;

                place-items: center;

                width: 40px;

                height: 100%;

                margin: 0;

                padding: 0;

                border: none;

                border-radius: 0;

                background: transparent;

                color: inherit;

                cursor: pointer;

            }

            .mw-controls button:hover {

                background: #ffffff20;

            }

            .mw-controls .mw-close:hover {

                background: #ad3636;

            }

            .mw-content {

                flex: 1;

                min-height: 0;

                min-width: 0;

                overflow: auto;

                position: relative;

                box-sizing: border-box;

                padding: 14px;

            }

            .mw-content iframe {

                display: block;

                width: 100%;

                height: 100%;

                border: 0;

            }

            .mw-resizer {

                position: absolute;

                z-index: 20;

                touch-action: none;

            }

            .mw-task {

                background: transparent;

                color: inherit;

                padding: 7px 12px;

                border: none;

                border-bottom: 2px solid transparent;

                border-radius: 0;

                font-size: 12px;

                white-space: nowrap;

                cursor: pointer;

            }

            .mw-task.mw-active {

                background: #ffffff18;

                border-bottom-color:
                    var(--accent, #779ab8);

            }

            .mw-confirm-overlay {

                position: absolute;

                inset: 0;

                background: #0007;

                display: grid;

                place-items: center;

                z-index: 90000;

            }

            .mw-confirm {

                width: min(360px, 90%);

                padding: 20px;

                box-sizing: border-box;

                background:
                    var(--window-bg, #f4f5f7);

                color:
                    var(--window-text, #20252b);

                border: 1px solid #77818a;

                box-shadow: 0 8px 28px #0005;

            }

            .mw-confirm-actions {

                display: flex;

                justify-content: flex-end;

                gap: 10px;

                margin-top: 20px;

            }

        `;

        document.head.append(style);

    }


    // =====================================
    // SVG 제어 버튼 아이콘
    // =====================================

    function controlIcon(type) {

        const paths = {

            minimize:
                '<path d="M3 8 H13"/>',

            maximize:
                '<rect x="3" y="3" width="10" height="10"/>',

            restore:
                '<path d="M5 3 H13 V11 M3 5 H11 V13 H3 Z"/>',

            close:
                '<path d="M4 4 L12 12 M12 4 L4 12"/>'

        };

        const span = node("span");

        // 고정된 SVG 아이콘만 삽입

        span.innerHTML = `

            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
                aria-hidden="true"
            >

                ${paths[type] || ""}

            </svg>

        `;

        return span;

    }


    // =====================================
    // 활성 창 전환
    // =====================================

    function focus(id) {

        const app = windows.get(id);

        if (!app || app.minimized) {
            return;
        }

        for (const other of windows.values()) {

            other.window.classList.remove(
                "mw-active"
            );

            other.task.classList.remove(
                "mw-active"
            );

        }

        app.window.style.zIndex = ++zIndex;

        app.window.classList.add("mw-active");

        app.task.classList.add("mw-active");

    }


    // =====================================
    // 창 위치 및 크기 제한
    // =====================================

    function geometry(app, rect) {

        const dw = desktop.clientWidth;

        const dh = desktop.clientHeight;

        const width = Math.min(

            dw,

            Math.max(
                Math.min(320, dw),
                Number(rect.width) || 700
            )

        );

        const height = Math.min(

            dh,

            Math.max(
                Math.min(220, dh),
                Number(rect.height) || 480
            )

        );

        const x = Math.max(

            0,

            Math.min(
                Number(rect.x) || 0,
                dw - width
            )

        );

        const y = Math.max(

            0,

            Math.min(
                Number(rect.y) || 0,
                dh - height
            )

        );

        Object.assign(app.window.style, {

            left: x + "px",

            top: y + "px",

            width: width + "px",

            height: height + "px"

        });

    }


    function getRect(app) {

        return {

            x: app.window.offsetLeft,

            y: app.window.offsetTop,

            width: app.window.offsetWidth,

            height: app.window.offsetHeight

        };

    }


    // =====================================
    // 창 최소화
    // =====================================

    function minimize(id) {

        const app = windows.get(id);

        if (!app) {
            return;
        }

        app.minimized = true;

        app.window.hidden = true;

        app.task.classList.remove("mw-active");

        focusTopWindow();

    }


    // =====================================
    // 창 복원
    // =====================================

    function restore(id) {

        const app = windows.get(id);

        if (!app) {
            return;
        }

        app.minimized = false;

        app.window.hidden = false;

        focus(id);

    }


    // =====================================
    // 최대화 및 원래 크기 복원
    // =====================================

    function maximize(id) {

        const app = windows.get(id);

        if (!app) {
            return;
        }

        restore(id);

        if (app.maximized) {

            app.maximized = false;

            geometry(
                app,
                app.previousRect
            );

            app.maxButton.replaceChildren(
                controlIcon("maximize")
            );

            app.maxButton.title = "최대화";

            saveLayout(app);

        } else {

            app.previousRect = getRect(app);

            saveLayout(app);

            app.maximized = true;

            Object.assign(app.window.style, {

                left: "0",

                top: "0",

                width: "100%",

                height: "100%"

            });

            app.maxButton.replaceChildren(
                controlIcon("restore")
            );

            app.maxButton.title = "원래 크기로";

        }

    }


    // =====================================
    // 다음 활성 창 찾기
    // =====================================

    function focusTopWindow() {

        const visible = [

            ...windows.values()

        ].filter(

            app => !app.minimized

        ).sort(

            (a, b) =>

                Number(b.window.style.zIndex)

                - Number(a.window.style.zIndex)

        );

        if (visible.length) {

            focus(visible[0].id);

        }

    }


    // =====================================
    // 사용자 정의 확인창
    // =====================================

    function confirm(message) {

        return new Promise(resolve => {

            const overlay = node(

                "div",

                null,

                "mw-confirm-overlay"

            );

            const box = node(

                "section",

                null,

                "mw-confirm"

            );

            box.setAttribute("role", "dialog");

            box.setAttribute("aria-modal", "true");

            const actions = node(

                "div",

                null,

                "mw-confirm-actions"

            );

            const yes = node("button", "확인");

            const no = node("button", "취소");

            function finish(value) {

                overlay.remove();

                resolve(value);

            }

            yes.onclick = () => finish(true);

            no.onclick = () => finish(false);

            actions.append(no, yes);

            box.append(

                node("strong", "MARINE OS"),

                node("p", message),

                actions

            );

            overlay.append(box);

            desktop.append(overlay);

            no.focus();

        });

    }


    // =====================================
    // 창 닫기
    // =====================================

    async function close(id) {

        const app = windows.get(id);

        if (!app || app.closing) {
            return;
        }

        app.closing = true;

        try {

            const dirty =

                typeof app.isDirty === "function"

                    ? await app.isDirty()

                    : app.dirty;

            if (dirty) {

                const accepted = await confirm(

                    "저장하지 않은 내용이 있습니다. "

                    + "창을 닫으시겠습니까?"

                );

                if (!accepted) {
                    return;
                }

            }

            if (
                typeof app.beforeClose === "function"
            ) {

                await app.beforeClose();

            }

            saveLayout(app);

            app.window.remove();

            app.task.remove();

            windows.delete(id);

            focusTopWindow();

        } catch (error) {

            await confirm(
                "종료 처리 오류: " + error.message
            );

        } finally {

            app.closing = false;

        }

    }


    // =====================================
    // 창 드래그
    // =====================================

    function attachDrag(app, header) {

        header.onpointerdown = event => {

            if (

                event.button !== 0

                || event.target.closest("button")

                || app.maximized

            ) {

                return;

            }

            focus(app.id);

            const startX = event.clientX;

            const startY = event.clientY;

            const rect = getRect(app);

            header.setPointerCapture(

                event.pointerId

            );

            header.onpointermove = move => {

                geometry(app, {

                    ...rect,

                    x: rect.x + move.clientX - startX,

                    y: rect.y + move.clientY - startY

                });

            };

            function finish() {

                header.onpointermove = null;

                header.onpointerup = null;

                header.onpointercancel = null;

                saveLayout(app);

            }

            header.onpointerup = finish;

            header.onpointercancel = finish;

        };


        header.ondblclick = event => {

            if (!event.target.closest("button")) {

                maximize(app.id);

            }

        };

    }


    // =====================================
    // 8방향 창 크기 조절
    // =====================================

    function attachResize(app) {

        const positions = {

            n: {

                top: "0",
                left: "6px",
                right: "6px",
                height: "5px"

            },

            s: {

                bottom: "0",
                left: "6px",
                right: "6px",
                height: "5px"

            },

            e: {

                right: "0",
                top: "6px",
                bottom: "6px",
                width: "5px"

            },

            w: {

                left: "0",
                top: "6px",
                bottom: "6px",
                width: "5px"

            },

            ne: {

                top: "0",
                right: "0",
                width: "9px",
                height: "9px"

            },

            nw: {

                top: "0",
                left: "0",
                width: "9px",
                height: "9px"

            },

            se: {

                bottom: "0",
                right: "0",
                width: "9px",
                height: "9px"

            },

            sw: {

                bottom: "0",
                left: "0",
                width: "9px",
                height: "9px"

            }

        };

        for (

            const [direction, position]

            of Object.entries(positions)

        ) {

            const handle = node(

                "div",

                null,

                "mw-resizer"

            );

            Object.assign(handle.style, position, {

                cursor: direction + "-resize"

            });

            handle.onpointerdown = event => {

                if (
                    app.maximized
                    || event.button !== 0
                ) {
                    return;
                }

                event.preventDefault();

                event.stopPropagation();

                focus(app.id);

                const rect = getRect(app);

                const startX = event.clientX;

                const startY = event.clientY;

                handle.setPointerCapture(

                    event.pointerId

                );

                handle.onpointermove = move => {

                    const dx = move.clientX - startX;

                    const dy = move.clientY - startY;

                    const minW = Math.min(
                        320,
                        desktop.clientWidth
                    );

                    const minH = Math.min(
                        220,
                        desktop.clientHeight
                    );

                    let left = rect.x;

                    let top = rect.y;

                    let right = rect.x + rect.width;

                    let bottom = rect.y + rect.height;

                    if (direction.includes("e")) {

                        right = Math.min(

                            desktop.clientWidth,

                            Math.max(left + minW, right + dx)

                        );

                    }

                    if (direction.includes("s")) {

                        bottom = Math.min(

                            desktop.clientHeight,

                            Math.max(top + minH, bottom + dy)

                        );

                    }

                    if (direction.includes("w")) {

                        left = Math.max(

                            0,

                            Math.min(right - minW, left + dx)

                        );

                    }

                    if (direction.includes("n")) {

                        top = Math.max(

                            0,

                            Math.min(bottom - minH, top + dy)

                        );

                    }

                    geometry(app, {

                        x: left,

                        y: top,

                        width: right - left,

                        height: bottom - top

                    });

                };

                function finish() {

                    handle.onpointermove = null;

                    handle.onpointerup = null;

                    handle.onpointercancel = null;

                    saveLayout(app);

                }

                handle.onpointerup = finish;

                handle.onpointercancel = finish;

            };

            app.window.append(handle);

        }

    }


    // =====================================
    // 새 프로그램 실행
    // =====================================

    function open(options) {

        const id = options.id;

        if (!desktop || !taskbar) {

            throw new Error(
                "창 관리 시스템이 초기화되지 않았습니다."
            );

        }

        // 이미 실행 중인 프로그램

        if (windows.has(id)) {

            restore(id);

            return windows.get(id);

        }


        const win = node(

            "section",

            null,

            "mw-window"

        );

        const header = node(

            "header",

            null,

            "mw-titlebar"

        );

        const title = node(

            "div",

            options.title || id,

            "mw-title"

        );

        const controls = node(

            "div",

            null,

            "mw-controls"

        );


        function makeControl(icon, label, action) {

            const button = node("button");

            button.type = "button";

            button.title = label;

            button.setAttribute(
                "aria-label",
                label
            );

            button.append(controlIcon(icon));

            button.onclick = action;

            return button;

        }


        const minButton = makeControl(

            "minimize",

            "최소화",

            () => minimize(id)

        );

        const maxButton = makeControl(

            "maximize",

            "최대화",

            () => maximize(id)

        );

        const closeButton = makeControl(

            "close",

            "닫기",

            () => close(id)

        );

        closeButton.classList.add("mw-close");

        controls.append(

            minButton,

            maxButton,

            closeButton

        );

        header.append(title, controls);


        const content = node(

            "div",

            null,

            "mw-content"

        );

        const task = node(

            "button",

            options.title || id,

            "mw-task"

        );


        const app = {

            id,

            window: win,

            content,

            title,

            task,

            maxButton,

            minimized: false,

            maximized: false,

            dirty: false,

            closing: false,

            isDirty: options.isDirty,

            beforeClose: options.beforeClose,

            setDirty(value) {

                app.dirty = Boolean(value);

            }

        };


        win.append(header, content);

        desktop.append(win);

        taskbar.append(task);

        windows.set(id, app);


        const saved = readLayout()[id];

        geometry(

            app,

            saved || {

                x: 60 + windows.size * 18,

                y: 30 + windows.size * 18,

                width: options.width || 760,

                height: options.height || 520

            }

        );


        win.addEventListener(

            "pointerdown",

            () => focus(id)

        );

        task.onclick = () => {

            if (app.minimized) {

                restore(id);

            } else if (

                app.window.classList.contains(
                    "mw-active"
                )

            ) {

                minimize(id);

            } else {

                focus(id);

            }

        };


        attachDrag(app, header);

        attachResize(app);

        focus(id);


        // 기존 블로그 프로그램 연결

        if (options.url) {

            const iframe = node("iframe");

            iframe.src = options.url;

            iframe.title = options.title || id;

            content.style.padding = "0";

            content.append(iframe);


        } else if (

            typeof options.mount === "function"

        ) {

            Promise.resolve()

                .then(() => {

                    return options.mount(
                        content,
                        app
                    );

                })

                .catch(error => {

                    content.replaceChildren(

                        node(

                            "p",

                            "프로그램 실행 실패: "

                            + error.message

                        )

                    );

                });

        }

        return app;

    }


    // =====================================
    // 화면 크기가 바뀌었을 때
    // =====================================

    window.addEventListener("resize", () => {

        if (!desktop) {
            return;
        }

        for (const app of windows.values()) {

            if (
                !app.maximized
                && !app.minimized
            ) {

                geometry(
                    app,
                    getRect(app)
                );

            }

        }

    });


    // =====================================
    // 외부 연결 인터페이스
    // =====================================

    window.MarineWindows = {

        init,

        open,

        close,

        minimize,

        maximize,

        restore,

        focus,

        confirm,

        get(id) {

            return windows.get(id);

        }

    };

})();
