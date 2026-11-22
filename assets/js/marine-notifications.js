
/*
 * MARINE OS v2.0
 *
 * 해군 본부 기밀 통신 알림 시스템
 * marine-notifications.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";

    const STORAGE_KEY =
        "marine-notified-messages-v2";

    const CHECK_INTERVAL = 5000;

    const DISPLAY_TIME = 15000;


    let client = null;

    let options = {};

    let timer = null;

    let subscription = null;

    let notification = null;

    let hideTimer = null;

    let running = false;

    let busy = false;

    let generation = 0;

    let notifiedIds = new Set();

    let unreadCount = 0;


    // =========================================
    // 01. 공통 함수
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


    // =========================================
    // 02. 이미 표시한 알림 기록
    // =========================================

    function loadNotified() {

        try {

            const saved = JSON.parse(

                localStorage.getItem(STORAGE_KEY)

            );

            return new Set(

                Array.isArray(saved) ? saved : []

            );

        } catch {

            return new Set();

        }

    }


    function saveNotified() {

        try {

            const ids = [...notifiedIds].slice(-2000);

            notifiedIds = new Set(ids);

            localStorage.setItem(

                STORAGE_KEY,

                JSON.stringify(ids)

            );

        } catch (error) {

            console.warn(

                "알림 기록 저장 실패",

                error

            );

        }

    }


    window.addEventListener("storage", event => {

        if (event.key === STORAGE_KEY) {

            notifiedIds = loadNotified();

        }

    });


    // =========================================
    // 03. 관리자 인증 확인
    // =========================================

    async function isAdmin() {

        if (!client) {

            return false;

        }

        try {

            const result =
                await client.auth.getUser();

            if (result.error) {

                return false;

            }

            return result.data.user?.id
                === ADMIN_UID;

        } catch {

            return false;

        }

    }


    // =========================================
    // 04. 알림창 CSS
    // =========================================

    function installStyles() {

        if (

            document.getElementById(

                "marine-notification-style"

            )

        ) {

            return;

        }


        const style = node("style");

        style.id = "marine-notification-style";


        style.textContent = `

            #marine-secret-notification {

                position: fixed;

                right: 24px;

                bottom: 65px;

                width: min(340px, calc(100vw - 32px));

                padding: 17px;

                box-sizing: border-box;

                background: #111E2B;

                color: #E1E8EF;

                border: 1px solid #61758A;

                border-left: 3px solid
                    var(--accent, #6385A3);

                border-radius: 3px;

                box-shadow: 0 8px 30px #0006;

                font-family:
                    "Malgun Gothic",
                    "Noto Sans KR",
                    sans-serif;

                z-index: 2147483000;

                animation:
                    marine-notification-enter
                    0.25s ease-out;

            }


            @keyframes marine-notification-enter {

                from {

                    opacity: 0;

                    transform: translateY(12px);

                }

                to {

                    opacity: 1;

                    transform: translateY(0);

                }

            }


            .mn-header {

                display: flex;

                align-items: center;

                gap: 9px;

                padding-bottom: 12px;

                border-bottom: 1px solid #ffffff20;

                color: #A8BACB;

                font-size: 10px;

                letter-spacing: 1px;

            }


            .mn-header-label {

                flex: 1;

            }


            .mn-icon {

                display: inline-flex;

                width: 18px;

                height: 18px;

                flex-shrink: 0;

            }


            .mn-title {

                font-size: 15px;

                font-weight: 600;

                margin: 17px 0 8px;

            }


            .mn-description {

                font-size: 12px;

                line-height: 1.7;

                color: #AABACA;

            }


            .mn-actions {

                display: flex;

                justify-content: flex-end;

                gap: 8px;

                margin-top: 17px;

            }


            #marine-secret-notification button {

                font-family: inherit;

                font-size: 12px;

                cursor: pointer;

                border-radius: 2px;

            }


            .mn-dismiss {

                background: transparent;

                color: #ABBCCC;

                border: 0;

                padding: 7px 10px;

            }


            .mn-open {

                background: #2A4158;

                color: #FFFFFF;

                border: 1px solid #698098;

                padding: 7px 12px;

            }


            .mn-close {

                color: #AABACA;

                background: transparent;

                border: none;

                padding: 0;

                width: 20px;

                height: 20px;

            }


            .mn-open:hover {

                background: #3B536B;

            }


            .mn-dismiss:hover,

            .mn-close:hover {

                color: #FFFFFF;

            }


            @media (max-width: 600px) {

                #marine-secret-notification {

                    right: 16px;

                    bottom: 24px;

                }

            }


            @media (prefers-reduced-motion: reduce) {

                #marine-secret-notification {

                    animation: none;

                }

            }

        `;


        document.head.append(style);

    }


    // =========================================
    // 05. SVG 보안 아이콘
    // =========================================

    function lockIcon() {

        const icon = node(

            "span",

            null,

            "mn-icon"

        );


        icon.innerHTML = `

            <svg

                viewBox="0 0 24 24"

                width="18"

                height="18"

                fill="none"

                stroke="currentColor"

                stroke-width="1.5"

                aria-hidden="true"

            >

                <rect

                    x="5" y="10"

                    width="14" height="11"

                    rx="1"

                />

                <path d="M8 10 V6 A4 4 0 0 1 16 6 V10"/>

                <circle cx="12" cy="15" r="1"/>

                <path d="M12 16 V18"/>

            </svg>

        `;


        return icon;

    }


    // =========================================
    // 06. 알림 닫기
    // =========================================

    function hide() {

        clearTimeout(hideTimer);

        hideTimer = null;


        if (notification) {

            notification.remove();

            notification = null;

        }

    }


    // =========================================
    // 07. 기밀 통신 열람
    // =========================================

    async function openMessages() {

        if (!(await isAdmin())) {

            stop();

            return;

        }

        hide();


        // MARINE OS 내부에서 호출된 경우

        if (

            typeof options.openApp

            === "function"

        ) {

            options.openApp("chat");

            return;

        }


        // 선실이나 책장에서 호출된 경우

        location.href = "/blog/?app=chat";

    }


    // =========================================
    // 08. 기밀 통신 알림 표시
    // =========================================

    function show() {

        if (

            !running

            || document.hidden

        ) {

            return false;

        }

        hide();

        installStyles();


        notification = node("aside");

        notification.id =
            "marine-secret-notification";

        notification.setAttribute(

            "role",

            "status"

        );


        notification.setAttribute(

            "aria-live",

            "polite"

        );


        // 보안 통신 헤더

        const header = node(

            "div",

            null,

            "mn-header"

        );


        const label = node(

            "span",

            "SECURE COMMUNICATION",

            "mn-header-label"

        );


        const close = node(

            "button",

            "×",

            "mn-close"

        );


        close.type = "button";

        close.title = "알림 닫기";

        close.setAttribute(

            "aria-label",

            "알림 닫기"

        );


        close.onclick = hide;


        header.append(

            lockIcon(),

            label,

            close

        );


        // 발신자와 본문은 표시하지 않음

        const title = node(

            "div",

            "기밀 통신이 도착했습니다.",

            "mn-title"

        );


        const description = node(

            "div",

            "인가된 사용자 전용 통신입니다.",

            "mn-description"

        );


        // 알림 하단 버튼

        const actions = node(

            "div",

            null,

            "mn-actions"

        );


        const dismiss = node(

            "button",

            "나중에",

            "mn-dismiss"

        );


        dismiss.type = "button";

        dismiss.onclick = hide;


        const open = node(

            "button",

            "통신 열람",

            "mn-open"

        );


        open.type = "button";

        open.onclick = openMessages;


        actions.append(dismiss, open);


        notification.append(

            header,

            title,

            description,

            actions

        );


        document.body.append(notification);


        // 15초 후 자동으로 숨김

        hideTimer = setTimeout(

            hide,

            DISPLAY_TIME

        );

        return true;

    }


    // =========================================
    // 09. 미확인 통신 개수 전달
    // =========================================

    function publishUnread(count) {

        unreadCount = count;


        window.dispatchEvent(

            new CustomEvent(

                "marine:unread-changed",

                {

                    detail: {

                        count: unreadCount

                    }

                }

            )

        );

    }


    // =========================================
    // 10. 새 메시지 조회
    // =========================================

    async function checkMessages() {

        if (

            !running

            || busy

            || document.hidden

            || !client

        ) {

            return;

        }


        busy = true;

        const currentGeneration = generation;


        try {

            // 요청 전 관리자 계정 재검증

            if (!(await isAdmin())) {

                if (currentGeneration === generation) {

                    stop();

                }

                return;

            }


            const now = new Date().toISOString();


            // 수신한 미확인 메시지만 조회
            // 알림에 필요 없는 본문과 발신자는 조회하지 않음

            const result = await client

                .from("marine_messages")

                .select(

                    "id,deliver_at",

                    { count: "exact" }

                )

                .eq("user_id", ADMIN_UID)

                .eq("direction", "incoming")

                .is("read_at", null)

                .lte("deliver_at", now)

                .order(

                    "deliver_at",

                    { ascending: false }

                )

                .limit(200);


            if (result.error) {

                throw result.error;

            }


            // 조회 도중 로그아웃되었는지 확인

            if (

                !running

                || currentGeneration !== generation

            ) {

                return;

            }


            const messages = result.data || [];


            publishUnread(

                result.count ?? messages.length

            );


            notifiedIds = loadNotified();


            const fresh = messages.filter(

                message =>

                    !notifiedIds.has(message.id)

            );


            if (!fresh.length) {

                return;

            }


            // 실제 알림 표시 직전 인증 재확인

            if (!(await isAdmin())) {

                if (currentGeneration === generation) {

                    stop();

                }

                return;

            }


            if (

                !running

                || currentGeneration !== generation

            ) {

                return;

            }


            // 같은 시간에 여러 메시지가 와도
            // 기밀 통신 알림 하나로 묶어서 표시

            if (show()) {

                fresh.forEach(message => {

                    notifiedIds.add(message.id);

                });

                saveNotified();

            }


        } catch (error) {

            console.warn(

                "기밀 통신 조회 실패:",

                error.message

            );

        } finally {

            busy = false;

        }

    }


    // =========================================
    // 11. 알림 시스템 시작
    // =========================================

    async function start(

        supabaseClient,

        config = {}

    ) {

        stop();


        client = supabaseClient;

        options = config;

        const currentGeneration = generation;


        // 일반 방문자는 여기에서 종료

        if (!(await isAdmin())) {

            return false;

        }


        if (currentGeneration !== generation) {

            return false;

        }


        notifiedIds = loadNotified();

        running = true;

        installStyles();


        // 로그인 상태 변경 감시

        const result = client.auth.onAuthStateChange(

            (event, session) => {

                if (

                    event === "SIGNED_OUT"

                    || session?.user?.id !== ADMIN_UID

                ) {

                    stop();

                }

            }

        );


        subscription = result.data.subscription;


        // 5초마다 새로운 통신 확인

        timer = setInterval(

            checkMessages,

            CHECK_INTERVAL

        );


        document.addEventListener(

            "visibilitychange",

            onVisibilityChange

        );


        window.addEventListener(

            "marine:simulation",

            checkMessages

        );


        // 관리자 최초 접속 시 미확인 통신 확인

        await checkMessages();

        return true;

    }


    // =========================================
    // 12. 다른 탭에서 복귀했을 때
    // =========================================

    function onVisibilityChange() {

        if (!document.hidden) {

            checkMessages();

        }

    }


    // =========================================
    // 13. 시스템 중단
    // =========================================

    function stop() {

        generation++;

        running = false;


        clearInterval(timer);

        timer = null;


        hide();


        if (subscription) {

            subscription.unsubscribe();

            subscription = null;

        }


        document.removeEventListener(

            "visibilitychange",

            onVisibilityChange

        );


        window.removeEventListener(

            "marine:simulation",

            checkMessages

        );


        publishUnread(0);

    }


    // 페이지 이동 시 기존 감시 중단

    window.addEventListener(

        "pagehide",

        stop

    );


    // 뒤로 가기로 페이지가 복원되었을 때

    window.addEventListener("pageshow", event => {

        if (event.persisted && client) {

            start(client, options);

        }

    });


    // =========================================
    // 14. 외부 연결 인터페이스
    // =========================================

    window.MarineNotifications = {

        start,

        stop,

        hide,

        refresh: checkMessages,

        openMessages,

        getUnreadCount() {

            return unreadCount;

        },

        isRunning() {

            return running;

        }

    };

})();
