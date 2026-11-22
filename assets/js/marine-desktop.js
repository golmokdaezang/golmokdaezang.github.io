
/*
 * MARINE OS v2.0
 * 바탕화면 및 환경 설정 시스템
 *
 * marine-desktop.js
 */

(() => {

    "use strict";

    const STORAGE_KEY = "marine-desktop-v2";


    // =========================================
    // 1. 대장별 테마
    // =========================================

    const themes = {

        akainu: {

            name: "아카이누",
            justice: "철저한 정의",
            background: "#432525",
            accent: "#B64D42",
            titlebar: "#652F2D"

        },

        kizaru: {

            name: "키자루",
            justice: "애매한 정의",
            background: "#494027",
            accent: "#B99B38",
            titlebar: "#64542A"

        },

        aokiji: {

            name: "아오키지",
            justice: "해이한 정의",
            background: "#203E58",
            accent: "#4787B4",
            titlebar: "#294A66"

        }

    };


    // =========================================
    // 2. 기본 환경 설정
    // =========================================

    const defaults = {

        leader: "akainu",

        mode: "light",

normalMode: false,

showPortrait: true,

showAffiliation: true,

showJustice: true,

showWelcome: true,

uiFont: "Noto Sans KR",

uiFontSize: 14,

uiFontWeight: "400",

        wallpaper: "",

        wallpaperFit: "cover",

        wallpaperPosition: "center center",

        brightness: 85,

        logo: true,

        logoOpacity: 15,

        logoSize: 65,

        logoColor: "#FFFFFF",

        iconColor: "#FFFFFF",

        iconSize: 38,

        portraitSize: 85,

        portraits: {},

        positions: {},

        locked: false

    };


    let desktop = null;

    let client = null;

    let options = {};

    let settings = readSettings();

    let wallpaperLayer = null;

    let logoLayer = null;

    let portraitLayer = null;

    let iconLayer = null;

    let menu = null;

    let observer = null;


    // =========================================
    // 3. 해군 SVG 로고
    // =========================================

    function marineLogo(color = "currentColor") {

        const safeColor = /^#[0-9a-f]{6}$/i.test(color)

            ? color

            : "currentColor";


        return `

            <svg

                xmlns="http://www.w3.org/2000/svg"

                viewBox="0 0 400 225"

                width="100%"

                height="100%"

                aria-label="MARINE"

            >

                <g fill="${safeColor}">

                    <path d="

                        M20 110

                        C20 5 155 -22 200 80

                        C245 -22 380 5 380 110

                        C358 15 226 0 205 138

                        H195

                        C174 0 42 15 20 110

                        Z

                    "/>

                    <path d="

                        M130 113

                        H270

                        V121

                        H130

                        Z

                    "/>

                    <path d="

                        M105 102

                        A20 20 0 1 1 105 131

                        A16 16 0 1 0 105 102

                        Z

                        M295 102

                        A20 20 0 1 0 295 131

                        A16 16 0 1 1 295 102

                        Z

                    "/>

                    <text

                        x="200"

                        y="207"

                        font-size="78"

                        textLength="360"

                        lengthAdjust="spacingAndGlyphs"

                        text-anchor="middle"

                        font-family="Times New Roman, serif"

                    >

                        MARINE

                    </text>

                </g>

            </svg>

        `;

    }


    // =========================================
    // 4. 프로그램 목록
    // =========================================

    const defaultApps = [

        ["write", "보고서 작성"],

        ["folder", "기록물 관리"],

        ["books", "분류 체계"],

        ["order", "문서 편철"],

        ["read", "기록 열람"],

        ["chat", "내부 메신저"],

        ["personnel", "인사 기록부"],

        ["promotion", "진급 관리"],

        ["calendar", "업무 일정표"],

        ["notes", "메모장"],

        ["wanted", "수배 관리"],

        ["organization", "해군 조직도"],

        ["terminal", "명령 프롬프트"],

        ["settings", "환경 설정"]

    ];


    // =========================================
    // 5. SVG 프로그램 아이콘
    // =========================================

    const icons = {

        write:

            '<path d="M5 3 H15 L19 7 V21 H5 Z M15 3 V7 H19 M8 12 H16 M8 16 H14"/>',

        folder:

            '<path d="M3 6 H10 L13 9 H21 V20 H3 Z"/>',

        books:

            '<rect x="3" y="4" width="5" height="17"/><rect x="10" y="4" width="5" height="17"/><path d="M17 5 L21 4 L23 20 L19 21 Z"/>',

        order:

            '<path d="M8 6 H21 M8 12 H21 M8 18 H21 M3 6 H5 M3 12 H5 M3 18 H5"/>',

        read:

            '<path d="M12 6 Q7 2 2 5 V19 Q7 16 12 20 Q17 16 22 19 V5 Q17 2 12 6 V20"/>',

        chat:

            '<path d="M3 3 H21 V16 H10 L5 21 V16 H3 Z M7 8 H17 M7 12 H15"/>',

        personnel:

            '<rect x="3" y="4" width="18" height="16"/><circle cx="8" cy="10" r="2.5"/><path d="M4 17 Q8 11 12 17 M14 9 H18 M14 13 H18"/>',

        promotion:

            '<path d="M4 12 L12 5 L20 12 M4 19 L12 12 L20 19"/>',

        calendar:

            '<rect x="3" y="5" width="18" height="16"/><path d="M3 10 H21 M7 2 V8 M17 2 V8 M7 14 H10 M14 14 H17 M7 18 H10"/>',

        notes:

            '<path d="M4 3 H20 V15 L14 21 H4 Z M14 21 V15 H20 M8 8 H16 M8 12 H14"/>',

        wanted:

            '<rect x="3" y="2" width="18" height="20"/><circle cx="12" cy="9" r="3"/><path d="M6 16 Q12 9 18 16 M7 19 H17"/>',

        organization:

            '<rect x="9" y="2" width="6" height="5"/><rect x="2" y="16" width="6" height="5"/><rect x="9" y="16" width="6" height="5"/><rect x="16" y="16" width="6" height="5"/><path d="M12 7 V12 H5 V16 M12 12 V16 M12 12 H19 V16"/>',

        terminal:

            '<rect x="2" y="3" width="20" height="18"/><path d="M6 8 L10 12 L6 16 M13 16 H18"/>',

        settings:

            '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1 V4 M12 20 V23 M1 12 H4 M20 12 H23 M4 4 L6 6 M18 18 L20 20 M4 20 L6 18 M18 6 L20 4"/>'

    };


    function appIcon(id) {

        return `

            <svg

                viewBox="0 0 24 24"

                width="100%"

                height="100%"

                fill="none"

                stroke="currentColor"

                stroke-width="1.35"

                stroke-linecap="round"

                stroke-linejoin="round"

                aria-hidden="true"

            >

                ${icons[id] || icons.folder}

            </svg>

        `;

    }


    // =========================================
    // 6. 공통 함수
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


    function clamp(value, min, max) {

        return Math.min(

            Math.max(min, Number(value) || 0),

            Math.max(min, max)

        );

    }


    function readSettings() {

        try {

            const saved = JSON.parse(

                localStorage.getItem(STORAGE_KEY)

            ) || {};


            return {

                ...defaults,

                ...saved,

                portraits: {

                    ...defaults.portraits,

                    ...saved.portraits

                },

                positions: {

                    ...defaults.positions,

                    ...saved.positions

                }

            };

        } catch {

            return JSON.parse(

                JSON.stringify(defaults)

            );

        }

    }


    function saveSettings() {

        try {

            localStorage.setItem(

                STORAGE_KEY,

                JSON.stringify(settings)

            );

            return true;

        } catch (error) {

            console.warn(

                "환경 설정 저장 실패:",

                error

            );

            window.dispatchEvent(

                new CustomEvent(

                    "marine:settings-error",

                    {

                        detail:
                            "저장 공간이 부족합니다."

                    }

                )

            );

            return false;

        }

    }


    function update(values) {

        settings = {

            ...settings,

            ...values

        };

        const saved = saveSettings();

        applyTheme();

        return saved;

    }


    function safeImage(value) {

        if (!value) {

            return "";

        }


        if (

            /^data:image\/(png|jpeg|webp);base64,/i

                .test(value)

        ) {

            return value;

        }


        try {

            const url = new URL(

                value,

                location.origin

            );

            if (url.protocol === "https:") {

                return url.href;

            }

        } catch {}

        return "";

    }


    // =========================================
    // 7. 이미지 파일 압축
    // =========================================

    async function imageFile(file, maxSize = 1600) {

        if (!file) {

            throw new Error("파일이 없습니다.");

        }


        if (

            !["image/png", "image/jpeg", "image/webp"]

                .includes(file.type)

        ) {

            throw new Error(

                "PNG, JPG, WEBP 이미지만 사용할 수 있습니다."

            );

        }


        if (file.size > 10 * 1024 * 1024) {

            throw new Error(

                "10MB 이하 이미지를 선택하세요."

            );

        }


        const bitmap = await createImageBitmap(file);


        try {

            const scale = Math.min(

                1,

                maxSize / Math.max(

                    bitmap.width,

                    bitmap.height

                )

            );


            const canvas = node("canvas");

            canvas.width = Math.max(

                1,

                Math.round(bitmap.width * scale)

            );

            canvas.height = Math.max(

                1,

                Math.round(bitmap.height * scale)

            );


            const ctx = canvas.getContext("2d");

            if (!ctx) {

                throw new Error("이미지 변환 실패");

            }


            ctx.fillStyle = "#FFFFFF";

            ctx.fillRect(

                0,

                0,

                canvas.width,

                canvas.height

            );


            ctx.drawImage(

                bitmap,

                0,

                0,

                canvas.width,

                canvas.height

            );


            return canvas.toDataURL(

                "image/jpeg",

                0.82

            );

        } finally {

            bitmap.close();

        }

    }


    // =========================================
    // 8. CSS 설치
    // =========================================

    function installStyles() {

        if (

            document.getElementById(

                "marine-desktop-style"

            )

        ) {

            return;

        }


        const style = node("style");

        style.id = "marine-desktop-style";


        style.textContent = `

            .md-desktop {

                position: relative;

                isolation: isolate;

                overflow: hidden;

                font-family:

                    "Malgun Gothic",

                    "Noto Sans KR",

                    sans-serif;

            }

            .md-wallpaper {

                position: absolute;

                inset: 0;

                z-index: -3;

                pointer-events: none;

                background-repeat: no-repeat;

            }

            .md-logo {

                position: absolute;

                top: 50%;

                left: 50%;

                transform: translate(-50%, -50%);

                z-index: -2;

                pointer-events: none;

            }

            .md-icons {

                position: absolute;

                inset: 0;

                z-index: 1;

                pointer-events: none;

            }

            .md-icon {

                position: absolute;

                display: flex;

                align-items: center;

                flex-direction: column;

                justify-content: center;

                gap: 6px;

                width: 110px;

                height: 78px;

                color: var(--desktop-icon-color);

                background: transparent;

                border: 1px solid transparent;

                border-radius: 2px;

                cursor: default;

                user-select: none;

                touch-action: none;

                pointer-events: auto;

                padding: 3px;

                box-sizing: border-box;

            }

            .md-icon:hover,

            .md-icon:focus-visible {

                background: #ffffff15;

                border-color: #ffffff35;

            }

            .md-icon.md-selected {

                background: #ffffff25;

                border-color: #ffffff55;

            }

            .md-icon-symbol {

                width: var(--desktop-icon-size);

                height: var(--desktop-icon-size);

                flex-shrink: 0;

            }

            .md-icon-label {

                font-size: 12px;

                white-space: nowrap;

                text-align: center;

            }

            .md-portrait {

                position: absolute;

                top: 18px;

                right: 20px;

                z-index: 2;

                display: flex;

                flex-direction: column;

                align-items: center;

                gap: 6px;

                pointer-events: none;

                color: var(--desktop-icon-color);

            }

            .md-portrait-photo {

                overflow: hidden;

                border: 1px solid var(--accent);

                background: #14191e55;

                display: grid;

                place-items: center;

            }

            .md-portrait-photo img {

                width: 100%;

                height: 100%;

                object-fit: cover;

            }

            .md-context {

                position: absolute;

                z-index: 80000;

                min-width: 180px;

                padding: 4px;

                background: var(--window-bg);

                color: var(--window-text);

                border: 1px solid #8888;

                box-shadow: 4px 6px 15px #0004;

            }

            .md-context button {

                display: block;

                width: 100%;

                text-align: left;

                padding: 9px 12px;

                background: transparent;

                color: inherit;

                border: none;

                border-radius: 0;

                cursor: pointer;

                font-size: 12px;

            }

            .md-context button:hover {

                background: #8883;

            }

            .md-settings {

                max-width: 760px;

                margin: auto;

                font-size: 13px;

            }

            .md-settings-section {

                padding: 15px 0;

                border-bottom: 1px solid #8884;

            }

            .md-settings-row {

                display: flex;

                align-items: center;

                justify-content: space-between;

                gap: 15px;

                margin: 12px 0;

            }

            .md-settings input[type="range"] {

                width: 160px;

                accent-color: var(--accent);

            }

            .md-settings button,

            .md-settings select {

                border: 1px solid #8886;

                border-radius: 2px;

                padding: 7px 12px;

                background: transparent;

                color: inherit;

            }

            .md-settings option {

                color: var(--window-text);

                background: var(--window-bg);

            }

            .md-settings button {

                cursor: pointer;

            }

            .md-settings button:hover {

                background: #8882;

            }

        `;


        document.head.append(style);

    }


    // =========================================
    // 9. 바탕화면 초기화
    // =========================================

    async function init(config) {

        options = config || {};

        desktop = options.desktop;

        client = options.client || null;


        if (!desktop) {

            throw new Error(

                "바탕화면 요소가 없습니다."

            );

        }


        installStyles();

        desktop.classList.add("md-desktop");


        // 기존 모듈 레이어 제거

        desktop.querySelectorAll(

            ":scope > .md-wallpaper, " +

            ":scope > .md-logo, " +

            ":scope > .md-icons, " +

            ":scope > .md-portrait"

        ).forEach(element => element.remove());


        wallpaperLayer = node(

            "div",

            null,

            "md-wallpaper"

        );


        logoLayer = node(

            "div",

            null,

            "md-logo"

        );


        iconLayer = node(

            "div",

            null,

            "md-icons"

        );


        portraitLayer = node(

            "div",

            null,

            "md-portrait"

        );


        desktop.prepend(

            wallpaperLayer,

            logoLayer,

            iconLayer,

            portraitLayer

        );


        desktop.oncontextmenu = event => {

            if (

                event.target.closest(

                    ".mw-window, .marine-sticky-note"

                )

            ) {

                return;

            }

            event.preventDefault();

            showContextMenu(

                event.clientX,

                event.clientY

            );

        };


        desktop.addEventListener(

            "pointerdown",

            event => {

                if (

                    !event.target.closest(".md-context")

                ) {

                    closeMenu();

                }

            }

        );


        if (observer) {

            observer.disconnect();

        }


        observer = new ResizeObserver(() => {

            repositionIcons();

        });


        observer.observe(desktop);


        renderIcons();

        applyTheme();

    }


    // =========================================
    // 10. 테마 적용
    // =========================================

    function applyTheme() {

        if (!desktop) {

            return;

        }


        const theme =

            themes[settings.leader]

            || themes.akainu;


        const dark = settings.mode === "dark";


        const target =

            options.themeRoot

            || document.documentElement;


        const variables = {

            "--accent": theme.accent,

            "--titlebar-bg": theme.titlebar,

            "--window-bg":
                dark ? "#20252B" : "#F4F5F7",

            "--window-text":
                dark ? "#E4E8ED" : "#20252B",

            "--taskbar-bg":
                dark ? "#12171D" : "#E5E8EC",

            "--taskbar-text":
                dark ? "#FFFFFF" : "#20252B",

            "--desktop-icon-color":
                settings.iconColor,

            "--desktop-icon-size":
                settings.iconSize + "px"

        };


        for (

            const [key, value]

            of Object.entries(variables)

        ) {

            target.style.setProperty(key, value);

        }


        desktop.dataset.theme = settings.leader;

        desktop.dataset.mode = settings.mode;

// v2.1 공통 화면 설정

const shell = document.getElementById("desktop");

if (shell) {

    shell.dataset.uiMode = settings.mode;

    shell.dataset.normalMode =

        settings.normalMode ? "true" : "false";

}


const supportedFonts = [

    "Noto Sans KR",

    "Pretendard",

    "SUIT",

    "Malgun Gothic"

];


const selectedFont =

    supportedFonts.includes(settings.uiFont)

        ? settings.uiFont

        : "Noto Sans KR";


target.style.setProperty(

    "--ui-font",

    `"${selectedFont}", "Malgun Gothic", sans-serif`

);


target.style.setProperty(

    "--ui-font-size",

    clamp(settings.uiFontSize, 12, 20) + "px"

);


target.style.setProperty(

    "--ui-font-weight",

    settings.uiFontWeight === "500"

        ? "500"

        : "400"

);

        // =====================================
        // 배경화면
        // =====================================

        wallpaperLayer.style.backgroundColor =

            theme.background;


        const image = safeImage(

            settings.wallpaper

        );


        wallpaperLayer.style.backgroundImage =

            image

                ? `url(${JSON.stringify(image)})`

                : "none";


        wallpaperLayer.style.backgroundSize =

            settings.wallpaperFit === "original"

                ? "auto"

                : settings.wallpaperFit;


        wallpaperLayer.style.backgroundPosition =

            settings.wallpaperPosition;


        wallpaperLayer.style.filter =

            `brightness(${clamp(settings.brightness, 20, 100)}%)`;


        // =====================================
        // 해군 로고 워터마크
        // =====================================

        logoLayer.innerHTML = marineLogo(

            settings.logoColor

        );


        logoLayer.style.display =

            settings.logo ? "block" : "none";


        logoLayer.style.width =

            clamp(settings.logoSize, 20, 100) + "%";


        logoLayer.style.maxWidth = "850px";


        logoLayer.style.opacity =

            clamp(settings.logoOpacity, 0, 100) / 100;


        renderPortrait();


        window.dispatchEvent(

            new CustomEvent(

                "marine:theme-changed",

                {

                    detail: {

                        ...settings,

                        theme

                    }

                }

            )

        );

    }


    // =========================================
    // 11. 대장 초상화
    // =========================================

    function renderPortrait() {

        if (!portraitLayer) {

            return;

        }


        portraitLayer.replaceChildren();


        const theme =

            themes[settings.leader]

            || themes.akainu;


        const photo = node(

            "div",

            null,

            "md-portrait-photo"

        );


        const size = clamp(

            settings.portraitSize,

            40,

            180

        );


        Object.assign(photo.style, {

            width: size + "px",

            height: size * 1.2 + "px"

        });


        const src = safeImage(

            settings.portraits[settings.leader]

        );


        if (src) {

            const img = node("img");

            img.src = src;

            img.alt = theme.name;


            img.onerror = () => {

                photo.replaceChildren(

                    node("small", "NO PHOTO")

                );

            };


            photo.append(img);

        } else {

            const logo = node("div");

            logo.style.width = "85%";

            logo.innerHTML = marineLogo();


            photo.append(logo);

        }


        const label = node(

            "strong",

            theme.name + " 대장 소속"

        );


        label.style.fontSize = "12px";


        const justice = node(

            "small",

            theme.justice

        );


        justice.style.opacity = "0.7";


        portraitLayer.append(

            photo,

            label,

            justice

        );

    }


    // =========================================
    // 12. 프로그램 실행
    // =========================================

    function openApp(id) {

        if (

            typeof options.openApp === "function"

        ) {

            options.openApp(id);

        }

    }


    // =========================================
    // 13. 기본 아이콘 배치
    // =========================================

    function getDefaultPosition(index) {

        const rows = Math.max(

            1,

            Math.floor(

                (desktop.clientHeight - 24) / 88

            )

        );


        return {

            x: 12 + Math.floor(index / rows) * 115,

            y: 12 + (index % rows) * 88

        };

    }


    function setIconPosition(icon, position) {

        icon.style.left = clamp(

            position.x,

            0,

            desktop.clientWidth - 110

        ) + "px";


        icon.style.top = clamp(

            position.y,

            0,

            desktop.clientHeight - 78

        ) + "px";

    }


    function repositionIcons() {

        if (!iconLayer) {

            return;

        }


        const children = [

            ...iconLayer.children

        ];


        children.forEach((icon, index) => {

            const id = icon.dataset.appId;


            setIconPosition(

                icon,

                settings.positions[id]

                || getDefaultPosition(index)

            );

        });

    }


    // =========================================
    // 14. 아이콘 생성
    // =========================================

    function renderIcons() {

        iconLayer.replaceChildren();


        const apps =

            options.apps || defaultApps;


        apps.forEach(([id, title], index) => {

            const button = node(

                "button",

                null,

                "md-icon"

            );


            button.type = "button";

            button.dataset.appId = id;

            button.title = title;

            button.setAttribute("aria-label", title);


            const symbol = node(

                "div",

                null,

                "md-icon-symbol"

            );


            symbol.innerHTML = appIcon(id);


            const label = node(

                "span",

                title,

                "md-icon-label"

            );


            button.append(symbol, label);

            iconLayer.append(button);


            setIconPosition(

                button,

                settings.positions[id]

                || getDefaultPosition(index)

            );


            button.onclick = () => {

                iconLayer.querySelectorAll(

                    ".md-selected"

                ).forEach(element => {

                    element.classList.remove(

                        "md-selected"

                    );

                });


                button.classList.add(

                    "md-selected"

                );

            };


            button.ondblclick = () => {

                openApp(id);

            };


            button.onkeydown = event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    openApp(id);

                }

            };


            button.oncontextmenu = event => {

                event.preventDefault();

                event.stopPropagation();

                showContextMenu(

                    event.clientX,

                    event.clientY,

                    id

                );

            };


            attachIconDrag(button, id);

        });

    }


    // =========================================
    // 15. 아이콘 자유 이동
    // =========================================

    function attachIconDrag(icon, id) {

        let lastDrag = 0;


        icon.addEventListener(

            "dblclick",

            event => {

                if (Date.now() - lastDrag < 400) {

                    event.stopImmediatePropagation();

                }

            },

            true

        );


        icon.onpointerdown = event => {

            if (

                event.button !== 0

                || settings.locked

            ) {

                return;

            }


            const startX = event.clientX;

            const startY = event.clientY;


            const original = {

                x: icon.offsetLeft,

                y: icon.offsetTop

            };


            let moved = false;


            icon.setPointerCapture(

                event.pointerId

            );


            icon.onpointermove = move => {

                const dx = move.clientX - startX;

                const dy = move.clientY - startY;


                if (

                    Math.abs(dx)

                    + Math.abs(dy) > 5

                ) {

                    moved = true;

                }


                if (!moved) {

                    return;

                }


                setIconPosition(icon, {

                    x: original.x + dx,

                    y: original.y + dy

                });

            };


            function finish() {

                icon.onpointermove = null;

                icon.onpointerup = null;

                icon.onpointercancel = null;


                if (moved) {

                    lastDrag = Date.now();


                    settings.positions[id] = {

                        x: icon.offsetLeft,

                        y: icon.offsetTop

                    };


                    saveSettings();

                }

            }


            icon.onpointerup = finish;

            icon.onpointercancel = finish;

        };

    }


    // =========================================
    // 16. 아이콘 자동 정렬
    // =========================================

    function arrangeIcons() {

        settings.positions = {};

        repositionIcons();

        saveSettings();

    }


    // =========================================
    // 17. 우클릭 메뉴
    // =========================================

    function closeMenu() {

        if (menu) {

            menu.remove();

            menu = null;

        }

    }


    function showContextMenu(x, y, appId = null) {

        closeMenu();


        menu = node(

            "div",

            null,

            "md-context"

        );


        function item(text, action) {

            const button = node(

                "button",

                text

            );


            button.onclick = () => {

                closeMenu();

                action();

            };


            menu.append(button);

        }


        if (appId) {

            item("열기", () => {

                openApp(appId);

            });


            item("아이콘 위치 초기화", () => {

                delete settings.positions[appId];

                saveSettings();

                repositionIcons();

            });


            menu.append(node("hr"));

        }


        item("새로 고침", () => {

            renderIcons();

            applyTheme();

        });


        item("아이콘 자동 정렬", arrangeIcons);


        item(

            settings.locked

                ? "아이콘 잠금 해제"

                : "아이콘 위치 잠금",

            () => {

                update({

                    locked: !settings.locked

                });

            }

        );


        item("스티커 메모 복원", async () => {

            if (window.MarineNotes && client) {

                try {

                    await MarineNotes.restoreDesktop(

                        desktop,

                        client

                    );

                } catch (error) {

                    console.error(error);

                }

            }

        });


        menu.append(node("hr"));


        item("개인 설정", () => {

            openApp("settings");

        });


        desktop.append(menu);


        const rect = desktop.getBoundingClientRect();


        menu.style.left = clamp(

            x - rect.left,

            0,

            desktop.clientWidth - menu.offsetWidth

        ) + "px";


        menu.style.top = clamp(

            y - rect.top,

            0,

            desktop.clientHeight - menu.offsetHeight

        ) + "px";

    }


    // =========================================
    // 18. 환경 설정 화면
    // =========================================

    function mountSettings(root) {

        root.replaceChildren();


        const panel = node(

            "div",

            null,

            "md-settings"

        );


        panel.append(

            node("h2", "환경 설정"),

            node(

                "p",

                "MARINE OS PERSONALIZATION"

            )

        );


        const status = node("p", "");

        status.setAttribute("role", "status");


        function change(values) {

            const saved = update(values);


            status.textContent = saved

                ? "환경 설정이 저장되었습니다."

                : "저장 공간이 부족합니다. 일부 설정은 새로고침 후 유지되지 않을 수 있습니다.";

        }


        function section(title) {

            const area = node(

                "section",

                null,

                "md-settings-section"

            );


            area.append(node("h3", title));

            panel.append(area);

            return area;

        }


        function row(parent, title, control) {

            const line = node(

                "label",

                null,

                "md-settings-row"

            );


            line.append(

                node("span", title),

                control

            );


            parent.append(line);

        }


        function select(parent, title, key, choices) {

            const input = node("select");


            choices.forEach(([value, label]) => {

                const option = node(

                    "option",

                    label

                );


                option.value = value;

                input.append(option);

            });


            input.value = settings[key];


            input.onchange = () => {

                change({

                    [key]: input.value

                });

            };


            row(parent, title, input);

        }


        function range(

            parent,

            title,

            key,

            min,

            max,

            suffix = "%"

        ) {

            const wrapper = node("div");


            const input = node("input");

            input.type = "range";

            input.min = min;

            input.max = max;

            input.value = settings[key];


            const value = node(

                "span",

                settings[key] + suffix

            );


            value.style.marginLeft = "8px";


            input.oninput = () => {

                value.textContent =

                    input.value + suffix;


                settings[key] = Number(input.value);

                applyTheme();

            };


            input.onchange = () => {

                change({

                    [key]: Number(input.value)

                });

            };


            wrapper.append(input, value);

            row(parent, title, wrapper);

        }


        function checkbox(parent, title, key) {

            const input = node("input");

            input.type = "checkbox";

            input.checked = Boolean(settings[key]);


            input.onchange = () => {

                change({

                    [key]: input.checked

                });

            };


            row(parent, title, input);

        }


        function color(parent, title, key) {

            const input = node("input");

            input.type = "color";

            input.value = settings[key];


            input.onchange = () => {

                change({

                    [key]: input.value

                });

            };


            row(parent, title, input);

        }


        // =====================================
        // 19. 대장 테마 선택
        // =====================================

// =====================================
// v2.1 화면 및 표시 설정
// =====================================

const displaySection = section(

    "00. 화면 및 표시 설정"

);


checkbox(

    displaySection,

    "일반 모드 (업무 공간)",

    "normalMode"

);


checkbox(

    displaySection,

    "대장 프로필 사진 표시",

    "showPortrait"

);


checkbox(

    displaySection,

    "대장 소속 문구 표시",

    "showAffiliation"

);


checkbox(

    displaySection,

    "정의관 표시",

    "showJustice"

);


checkbox(

    displaySection,

    "접속 환영 알림 표시",

    "showWelcome"

);


const fontSection = section(

    "글꼴 및 텍스트"

);


select(

    fontSection,

    "시스템 글꼴",

    "uiFont",

    [

        ["Noto Sans KR", "Noto Sans KR"],

        ["Pretendard", "Pretendard"],

        ["SUIT", "SUIT"],

        ["Malgun Gothic", "맑은 고딕"]

    ]

);


range(

    fontSection,

    "기본 글자 크기",

    "uiFontSize",

    12,

    20,

    "px"

);


select(

    fontSection,

    "글자 굵기",

    "uiFontWeight",

    [

        ["400", "보통"],

        ["500", "중간"]

    ]

);


const fontPreview = node("div");

fontPreview.className = "mui-font-preview";


fontPreview.append(

    node("h3", "시스템 글꼴 미리보기"),

    node("p", "전산망 접속을 환영합니다."),

    node("p", "ABCDEFGHIJKLMN"),

    node("p", "0123456789")

);


fontSection.append(fontPreview);

        const themeSection = section(

            "01. 대장별 테마"

        );


        const themeGrid = node("div");

        Object.assign(themeGrid.style, {

            display: "grid",

            gridTemplateColumns:

                "repeat(auto-fit, minmax(120px, 1fr))",

            gap: "10px"

        });


        for (

            const [key, theme]

            of Object.entries(themes)

        ) {

            const button = node("button");


            Object.assign(button.style, {

                background: theme.background,

                color: "#FFFFFF",

                padding: "15px",

                minHeight: "100px",

                border:

                    settings.leader === key

                        ? "2px solid " + theme.accent

                        : "1px solid #8886"

            });


            button.append(

                node("strong", theme.name),

                node("p", theme.justice)

            );


            button.onclick = async () => {

                button.disabled = true;


                try {

                    // 실제 인사 기록의 소속 대장도 변경

                    if (client) {

                        const auth =

                            await client.auth.getUser();


                        if (auth.error) {

                            throw auth.error;

                        }


                        const uid = auth.data.user?.id;


                        if (!uid) {

                            throw new Error(

                                "로그인이 필요합니다."

                            );

                        }


                        const result = await client

                            .from("marine_personnel")

                            .update({

                                commander: key

                            })

                            .eq("user_id", uid)

                            .select("user_id")

                            .single();


                        if (result.error) {

                            throw result.error;

                        }

                    }


                    change({

                        leader: key

                    });


                    mountSettings(root);


                } catch (error) {

                    status.textContent =

                        "소속 변경 실패: " + error.message;


                } finally {

                    button.disabled = false;

                }

            };


            themeGrid.append(button);

        }


        themeSection.append(themeGrid);


        select(

            themeSection,

            "화면 모드",

            "mode",

            [

                ["light", "라이트 모드"],

                ["dark", "다크 모드"]

            ]

        );


        // =====================================
        // 20. 배경화면 설정
        // =====================================

        const wall = section(

            "02. 배경화면"

        );


        const wallpaperInput = node("input");

        wallpaperInput.type = "file";

        wallpaperInput.accept =

            "image/png,image/jpeg,image/webp";


        wallpaperInput.onchange = async () => {

            try {

                const image = await imageFile(

                    wallpaperInput.files[0]

                );


                change({

                    wallpaper: image

                });


            } catch (error) {

                status.textContent = error.message;

            }

        };


        row(

            wall,

            "배경화면 이미지",

            wallpaperInput

        );


        const resetWall = node(

            "button",

            "기본 배경화면으로 복원"

        );


        resetWall.onclick = () => {

            change({

                wallpaper: ""

            });

        };


        wall.append(resetWall);


        select(

            wall,

            "이미지 배치",

            "wallpaperFit",

            [

                ["cover", "채우기"],

                ["contain", "맞춤"],

                ["original", "원본 크기"],

                ["100% 100%", "늘이기"]

            ]

        );


        select(

            wall,

            "이미지 위치",

            "wallpaperPosition",

            [

                ["center center", "가운데"],

                ["center top", "상단"],

                ["center bottom", "하단"],

                ["left center", "왼쪽"],

                ["right center", "오른쪽"]

            ]

        );


        range(

            wall,

            "밝기",

            "brightness",

            20,

            100

        );


        // =====================================
        // 21. 해군 로고 설정
        // =====================================

        const logo = section(

            "03. 해군 로고"

        );


        const preview = node("div");


        Object.assign(preview.style, {

            width: "200px",

            margin: "15px auto",

            color: "var(--accent)"

        });


        preview.innerHTML = marineLogo();


        logo.append(preview);


        checkbox(

            logo,

            "해군 로고 표시",

            "logo"

        );


        range(

            logo,

            "로고 투명도",

            "logoOpacity",

            0,

            100

        );


        range(

            logo,

            "로고 크기",

            "logoSize",

            20,

            100

        );


        color(

            logo,

            "로고 색상",

            "logoColor"

        );


        const logoButtons = node("div");


        for (

            const [text, value]

            of [

                ["기본 파란색", "#2446A0"],

                ["흰색", "#FFFFFF"],

                ["검은색", "#000000"]

            ]

        ) {

            const button = node("button", text);


            button.onclick = () => {

                change({

                    logoColor: value

                });

                mountSettings(root);

            };


            logoButtons.append(button);

        }


        logo.append(logoButtons);


        // =====================================
        // 22. 바탕화면 아이콘
        // =====================================

        const icon = section(

            "04. 바탕화면 아이콘"

        );


        color(

            icon,

            "아이콘 및 글자 색상",

            "iconColor"

        );


        range(

            icon,

            "아이콘 크기",

            "iconSize",

            28,

            50,

            "px"

        );


        checkbox(

            icon,

            "아이콘 위치 잠금",

            "locked"

        );


        const arrange = node(

            "button",

            "아이콘 자동 정렬"

        );


        arrange.onclick = arrangeIcons;

        icon.append(arrange);


        // =====================================
        // 23. 대장별 사진 설정
        // =====================================

        const portrait = section(

            "05. 지휘관 초상화"

        );


        for (

            const [key, theme]

            of Object.entries(themes)

        ) {

            const input = node("input");

            input.type = "file";

            input.accept =

                "image/png,image/jpeg,image/webp";


            input.onchange = async () => {

                try {

                    const image = await imageFile(

                        input.files[0],

                        500

                    );


                    change({

                        portraits: {

                            ...settings.portraits,

                            [key]: image

                        }

                    });


                } catch (error) {

                    status.textContent = error.message;

                }

            };


            row(

                portrait,

                theme.name + " 대장 사진",

                input

            );


            const remove = node(

                "button",

                theme.name + " 사진 제거"

            );


            remove.onclick = () => {

                const images = {

                    ...settings.portraits

                };


                delete images[key];


                change({

                    portraits: images

                });

            };


            portrait.append(remove);

        }


        range(

            portrait,

            "초상화 크기",

            "portraitSize",

            40,

            180,

            "px"

        );


        // =====================================
        // 24. 초기화
        // =====================================

        const system = section(

            "06. 시스템 설정 초기화"

        );


        const reset = node(

            "button",

            "화면 설정 초기화"

        );


        reset.onclick = async () => {

            if (!window.MarineWindows) {

                status.textContent =

                    "창 관리 시스템 연결이 필요합니다.";

                return;

            }


            const accepted =

                await MarineWindows.confirm(

                    "배경화면과 아이콘 배치를 기본 설정으로 되돌리시겠습니까?"

                );


            if (!accepted) {

                return;

            }


            // 인사 기록상의 대장 소속은 유지

            const currentLeader = settings.leader;


            settings = JSON.parse(

                JSON.stringify(defaults)

            );


            settings.leader = currentLeader;


            saveSettings();

            applyTheme();

            renderIcons();

            mountSettings(root);

        };


        system.append(reset);


        panel.append(status);

        root.append(panel);

    }


    // =========================================
    // 25. 외부 연결 인터페이스
    // =========================================

    window.MarineDesktop = {

        init,

        mountSettings,

        applyTheme,

        arrangeIcons,

        marineLogo,

        appIcon,

        openApp,

        update,

        getSettings() {

            return JSON.parse(

                JSON.stringify(settings)

            );

        },

        themes,

        apps: defaultApps

    };

})();
