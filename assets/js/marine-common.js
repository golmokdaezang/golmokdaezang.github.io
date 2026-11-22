
/*
 * MARINE OS v2.0
 *
 * 전 페이지 공통 기밀 통신 서비스
 * marine-common.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    // =====================================
    // 01. 중복 실행 방지
    // =====================================

    if (window.MarineCommon) return;

    if (window.self !== window.top) return;

    // MARINE OS에서는 자체 알림 시스템 사용

    if (/^\/blog(?:\/|$)/.test(location.pathname)) {
        return;
    }


    let client = null;

    let running = false;

    let subscription = null;

    let queue = Promise.resolve();

    const scripts = new Map();


    // =====================================
    // 02. 라이브러리 불러오기
    // =====================================

    function loadScript(src) {

        if (scripts.has(src)) {

            return scripts.get(src);

        }

        const promise = new Promise(

            (resolve, reject) => {

                const script =
                    document.createElement("script");

                script.src = src;

                script.async = true;

                script.onload = resolve;

                script.onerror = () => {

                    script.remove();

                    reject(
                        new Error("파일 로딩 실패: " + src)
                    );

                };

                document.head.append(script);

            }

        ).catch(error => {

            scripts.delete(src);

            throw error;

        });

        scripts.set(src, promise);

        return promise;

    }


    // =====================================
    // 03. Supabase 연결
    // =====================================

    async function connect() {

        if (client) return client;


        if (

            !window.SUPABASE_URL

            || !window.SUPABASE_PUBLISHABLE_KEY

        ) {

            await loadScript(

                "/assets/js/supabase-config.js"

            );

        }


        if (!window.supabase?.createClient) {

            await loadScript(

                "https://cdn.jsdelivr.net/npm/"
                + "@supabase/supabase-js@2/"
                + "dist/umd/supabase.min.js"

            );

        }


        client = window.MarineClient

            || window.supabase.createClient(

                window.SUPABASE_URL,

                window.SUPABASE_PUBLISHABLE_KEY

            );


        window.MarineClient = client;

        return client;

    }


    // =====================================
    // 04. 실제 관리자 권한 확인
    // =====================================

    async function isAdmin() {

        if (!client) return false;


        const result = await client.auth.getUser();


        return (

            !result.error

            && result.data.user?.id === ADMIN_UID

        );

    }


    // =====================================
    // 05. 기밀 통신 종료
    // =====================================

    function stop() {

        running = false;

        window.MarineNotifications?.stop();

        window.MarineSimulation?.stop();

    }


    // =====================================
    // 06. 기밀 통신 화면 이동
    // =====================================

    function openMessages() {

        location.href = "/blog/?app=chat";

    }


    // =====================================
    // 07. 관리자 전용 서비스 실행
    // =====================================

    async function synchronize() {

        if (!(await isAdmin())) {

            stop();

            return;

        }


        if (running) return;


        // 관리자 확인 후에만
        // 알림 및 시뮬레이션 모듈 로딩

        if (!window.MarineNotifications) {

            await loadScript(

                "/assets/js/marine-notifications.js"

            );

        }


        if (!window.MarineSimulation) {

            await loadScript(

                "/assets/js/marine-simulation.js"

            );

        }


        // 로딩 도중 로그인 상태가
        // 변경되었는지 다시 확인

        if (!(await isAdmin())) {

            stop();

            return;

        }


        await window.MarineNotifications.start(

            client,

            {

                openApp: openMessages

            }

        );


        if (!(await isAdmin())) {

            stop();

            return;

        }


        window.MarineSimulation.start(client);

        running = true;

    }


    // =====================================
    // 08. 실행 순서 관리
    // =====================================

    function refresh() {

        queue = queue

            .then(synchronize)

            .catch(error => {

                stop();

                console.error(

                    "MARINE 공통 서비스 오류:",

                    error

                );

            });


        return queue;

    }


    // =====================================
    // 09. 로그인 상태 변경 감지
    // =====================================

    async function initialize() {

        try {

            await connect();


            const result =

                client.auth.onAuthStateChange(

                    (event, session) => {

                        if (

                            session?.user?.id

                            !== ADMIN_UID

                        ) {

                            stop();

                        }


                        // 인증 콜백 바깥에서
                        // 비동기 작업 실행

                        setTimeout(refresh, 0);

                    }

                );


            subscription =
                result.data.subscription;


            await refresh();


        } catch (error) {

            console.error(

                "MARINE 초기화 오류:",

                error

            );

        }

    }


    // =====================================
    // 10. 페이지 상태 관리
    // =====================================

    document.addEventListener(

        "visibilitychange",

        () => {

            if (!document.hidden) {

                refresh();

            }

        }

    );


    window.addEventListener(

        "pagehide",

        stop

    );


    window.addEventListener(

        "pageshow",

        event => {

            if (event.persisted) {

                refresh();

            }

        }

    );


    // =====================================
    // 11. 외부 인터페이스
    // =====================================

    window.MarineCommon = {

        refresh,

        stop,

        isRunning: () => running

    };


    // =====================================
    // 12. 공통 서비스 시작
    // =====================================

    if (document.readyState === "loading") {

        document.addEventListener(

            "DOMContentLoaded",

            initialize,

            { once: true }

        );

    } else {

        initialize();

    }

})();
