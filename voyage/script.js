
const startButton = document.querySelector(".start-button");

startButton.addEventListener("click", () => {
    // 중복 클릭 방지
    startButton.disabled = true;

    // 항해 애니메이션 시작
    document.body.classList.add("sailing");

    // 움직임 최소화 설정 확인
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const delay = reducedMotion ? 0 : 2000;

    // 애니메이션 종료 후 다음 페이지로 이동
    setTimeout(() => {
        window.location.href = "/blog/";
    }, delay);
});
