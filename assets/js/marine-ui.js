
/* ============================================
   MARINE OS v2.1
   System UI Controller
   ============================================ */

(function () {

    "use strict";


    const $ = id =>
        document.getElementById(id);


    const wait = ms =>
        new Promise(resolve => setTimeout(resolve, ms));


    let progressBar = null;

    let progressText = null;

    let bootPanel = null;

    let toastTimer = null;


    /* ========================================
       01. 부팅 진행률 초기화
       ======================================== */

    function prepareBoot() {

        if (bootPanel) {
            bootPanel.remove();
        }

        bootPanel = document.createElement("div");

        bootPanel.className = "mui-boot-panel";

        bootPanel.innerHTML = `

            <div class="mui-boot-heading">

                <span>
                    SYSTEM INITIALIZATION
                </span>

                <strong class="mui-progress-text">
                    0%
                </strong>

            </div>

            <div class="mui-progress-track"
                 role="progressbar"
                 aria-label="시스템 초기화"
                 aria-valuemin="0"
                 aria-valuemax="100"
                 aria-valuenow="0">

                <div class="mui-progress-fill"></div>

            </div>

            <div class="mui-boot-caption">
                업무 환경을 준비하고 있습니다.
            </div>

        `;

        $("logs").before(bootPanel);

        progressBar = bootPanel.querySelector(
            ".mui-progress-fill"
        );

        progressText = bootPanel.querySelector(
            ".mui-progress-text"
        );

    }


    /* ========================================
       02. 진행률 변경
       ======================================== */

    function setProgress(value, message) {

        if (!bootPanel) {
            prepareBoot();
        }

        const percent = Math.min(
            100,
            Math.max(0, Number(value) || 0)
        );

        progressBar.style.width =
            percent + "%";

        progressText.textContent =
            Math.round(percent) + "%";

        bootPanel.querySelector(
            ".mui-progress-track"
        ).setAttribute(
            "aria-valuenow",
            String(percent)
        );

        if (message) {

            bootPanel.querySelector(
                ".mui-boot-caption"
            ).textContent = message;

        }

    }


    /* ========================================
       03. 부팅 화면 초기화
       ======================================== */

    function resetBoot() {

        if (bootPanel) {
            bootPanel.remove();
        }

        bootPanel = null;

        progressBar = null;

        progressText = null;

        $("gate")?.classList.remove(
            "mui-leaving"
        );

    }


    /* ========================================
       04. 화면 전환
       ======================================== */

    async function finishBoot() {

        setProgress(
            100,
            "시스템 준비가 완료되었습니다."
        );

        await wait(700);

        $("gate").classList.add(
            "mui-leaving"
        );

        await wait(450);

    }


    /* ========================================
       05. 시스템 알림
       ======================================== */

    function notify(options = {}) {

        document.querySelector(
            ".mui-toast"
        )?.remove();

        clearTimeout(toastTimer);


        const toast = document.createElement("div");

        toast.className = "mui-toast";

        toast.setAttribute("role", "status");


        const symbol = document.createElement("div");

        symbol.className = "mui-toast-icon";

        symbol.innerHTML = `

            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">

                <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/>

                <path d="m8.5 12 2.5 2.5 4.5-5"/>

            </svg>

        `;


        const content = document.createElement("div");

        content.className = "mui-toast-content";


        const label = document.createElement("div");

        label.className = "mui-toast-label";

        label.textContent =
            options.label || "SYSTEM NOTIFICATION";


        const title = document.createElement("div");

        title.className = "mui-toast-title";

        title.textContent =
            options.title || "시스템 알림";


        const message = document.createElement("div");

        message.className = "mui-toast-message";

        message.textContent =
            options.message || "";


        content.append(label, title, message);


        const close = document.createElement("button");

        close.type = "button";

        close.className = "mui-toast-close";

        close.setAttribute("aria-label", "알림 닫기");

        close.textContent = "×";


        function dismiss() {

            clearTimeout(toastTimer);

            toast.classList.add(
                "mui-toast-leaving"
            );

            setTimeout(() => {

                toast.remove();

            }, 240);

        }


        close.addEventListener(
            "click",
            dismiss
        );


        const timer = document.createElement("div");

        timer.className = "mui-toast-timer";

        const duration = Number(
            options.duration || 6000
        );

        timer.style.animationDuration =
            duration + "ms";


        toast.append(
            symbol,
            content,
            close,
            timer
        );

        document.body.append(toast);

        toastTimer = setTimeout(
            dismiss,
            duration
        );

    }


    /* ========================================
       06. 접속 환영 메시지
       ======================================== */

    function welcome(profile, personnel) {

        const name =
            profile?.nickname || "사용자";

        const rank =
            personnel?.rank || "";

        const branch =
            personnel?.branch || "";

        const department =
            personnel?.department || "";


        const identity = [

            branch,

            department,

            rank,

            name

        ].filter(Boolean).join(" · ");


        notify({

            label: "MARINE OS · SYSTEM ACCESS",

            title: "전산망 접속을 환영합니다.",

            message:
                identity
                + "\n사용자 인증 및 작업 환경 초기화 완료.",

            duration: 6000

        });

    }


    /* ========================================
       07. 외부 모듈 연결
       ======================================== */

    window.MarineUI = {

        prepareBoot,

        setProgress,

        finishBoot,

        resetBoot,

        notify,

        welcome

    };

})();

/* ============================================
   MARINE OS v2.1
   Presentation Mode Controller
   ============================================ */

(function () {

    "use strict";


    const $ = id =>

        document.getElementById(id);


    function syncDisplay(settings) {

        const desktop = $("desktop");

        if (!desktop) return;


        const normal = Boolean(

            settings.normalMode

        );


        desktop.dataset.normalMode =

            String(normal);


        desktop.dataset.showPortrait =

            String(settings.showPortrait !== false);


        desktop.dataset.showAffiliation =

            String(settings.showAffiliation !== false);


        desktop.dataset.showJustice =

            String(settings.showJustice !== false);


        desktop.dataset.uiMode =

            settings.mode || "light";


        // 시스템 이름 변경

        const title = document.querySelector(

            "#systemHeader .system-title"

        );


        if (title) {

            title.textContent = normal

                ? "PERSONAL WORKSPACE"

                : "MARINE OS v2.1";

        }


        const department = $("departmentTop");


        if (department) {

            if (normal) {

                department.textContent =

                    "개인 문서 및 업무 관리";

            }

        }


        // 세계관 관련 프로그램 찾기

        const themedApps = [

            "내부 메신저",

            "기밀 통신",

            "수배 관리",

            "진급 관리",

            "해군 조직도",

            "인사 기록부",

            "명령 프롬프트"

        ];


        document.querySelectorAll(

            "#work .md-icon"

        ).forEach(icon => {

            const label = icon.querySelector(

                ".md-icon-label"

            );


            icon.classList.toggle(

                "mui-world-icon",

                themedApps.includes(

                    label?.textContent.trim()

                )

            );

        });


        // 일반 모드에서는 기밀 통신 알림 중지

        if (normal) {

            window.MarineNotifications?.stop();

            document.querySelector(

                ".mui-toast"

            )?.remove();

        }

    }


    window.addEventListener(

        "marine:theme-changed",

        event => {

            syncDisplay(event.detail || {});

        }

    );


    // 일반 모드에 맞는 환영 문구

    const originalWelcome =

        window.MarineUI.welcome;


    window.MarineUI.welcome = function (

        profile,

        personnel

    ) {

        const settings =

            window.MarineDesktop?.getSettings()

            || {};


        if (settings.showWelcome === false) {

            return;

        }


        if (settings.normalMode) {

            window.MarineUI.notify({

                label: "PERSONAL WORKSPACE",

                title: "작업 공간에 오신 것을 환영합니다.",

                message:

                    "사용자 인증 및 작업 환경 초기화 완료.",

                duration: 6000

            });


            return;

        }


        originalWelcome(profile, personnel);

    };

})();

