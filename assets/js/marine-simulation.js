
/*
 * MARINE OS v2.0
 * 캐릭터 자동 대화 엔진
 */

(() => {
    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";

    let client = null;
    let timer = null;
    let running = false;
    let enabled = true;


    // 자동 대화 요청
    async function run() {

        if (!client || running || !enabled) {
            return;
        }

        if (document.hidden) {
            return;
        }

        running = true;

        try {

            const { data: auth, error: authError } =
                await client.auth.getUser();

            if (
                authError ||
                auth.user?.id !== ADMIN_UID
            ) {
                return;
            }

            const { data, error } =
                await client.rpc("marine_simulate");

            if (error) {
                throw error;
            }

            if (data?.status === "success") {

                document.dispatchEvent(
                    new CustomEvent(
                        "marine:simulation",
                        { detail: data }
                    )
                );

            }

        } catch (error) {

            console.error(
                "[MARINE] 자동 대화 오류:",
                error.message
            );

        } finally {

            running = false;

        }

    }


    // 시뮬레이션 시작
    function start(supabaseClient) {

        stop();

        client = supabaseClient;

        const preference =
            localStorage.getItem(
                "marine-simulation-enabled"
            );

        enabled = preference !== "false";

        run();

        // 1분마다 새로운 상황 발생 여부 확인
        timer = setInterval(run, 60000);

    }


    // 시뮬레이션 종료
    function stop() {

        if (timer !== null) {

            clearInterval(timer);
            timer = null;

        }

    }


    // 자동 대화 활성화 및 비활성화
    function setEnabled(value) {

        enabled = Boolean(value);

        localStorage.setItem(
            "marine-simulation-enabled",
            String(enabled)
        );

        if (enabled) {
            run();
        }

    }


    // 외부 프로그램에서 사용할 인터페이스
    window.MarineSimulation = {

        start,
        stop,
        run,
        setEnabled,

        isEnabled() {
            return enabled;
        }

    };


    // 페이지 종료 시 타이머 정리
    window.addEventListener("pagehide", stop);

})();
