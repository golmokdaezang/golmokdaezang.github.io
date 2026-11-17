
/* =========================
   Grand Security Line
   방문자 입장 및 기록 저장
========================= */

const startButton =
  document.querySelector("#start-screen .start-button");

const startScreen =
  document.getElementById("start-screen");

const nameScreen =
  document.getElementById("name-screen");

const greetingScreen =
  document.getElementById("greeting-screen");

const nameForm =
  document.getElementById("name-form");

const nameInput =
  document.getElementById("visitor-name");

const greetingMessage =
  document.getElementById("greeting-message");

const visitConsent =
  document.getElementById("visit-consent");

const leaderboardConsent =
  document.getElementById("leaderboard-consent");

const saveStatus =
  document.getElementById("save-status");

const enterButton =
  document.getElementById("enter-button");

/* Supabase 방문 기록 저장 함수 */

const VISIT_API =
  "https://zdgopdrehbphshdptjjr.supabase.co/functions/v1/clever-handler";

/* =========================
   첫 화면 → 닉네임 입력
========================= */

startButton.addEventListener("click", () => {
  startScreen.hidden = true;
  nameScreen.hidden = false;
  nameInput.focus();
});


/* =========================
   체크박스 연결
========================= */

function updateConsentState() {
  const enabled = visitConsent.checked;

  leaderboardConsent.disabled = !enabled;

  if (!enabled) {
    leaderboardConsent.checked = false;
  }
}

/* 첫 번째 체크박스를 변경했을 때 */
visitConsent.addEventListener("change", updateConsentState);

/* 페이지가 처음 열릴 때도 상태 확인 */
updateConsentState();

/* 브라우저 뒤로 가기로 돌아왔을 때도 확인 */
window.addEventListener("pageshow", updateConsentState);


/* =========================
   방문 기록 저장
========================= */

async function saveVisit(name, publicConsent) {
  const response = await fetch(VISIT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      nickname: name,
      consent: true,
      leaderboard_consent: publicConsent
    })
  });

  if (!response.ok) {
    throw new Error(
      "방문 기록 저장 실패: HTTP " + response.status
    );
  }

  return response;
}

/* =========================
   환영 화면 및 이동
========================= */

function enterBlog(name) {
  const greeting =
    name.toLowerCase() === "golmokdaezang"
      ? "항해자님, 반가워요!"
      : `${name}님, 반가워요!`;

  greetingMessage.textContent = greeting;

  nameScreen.hidden = true;
  greetingScreen.hidden = false;

  setTimeout(() => {
    document.body.classList.add("sailing");

    setTimeout(() => {
      window.location.href = "/blog/";
    }, 2000);
  }, 1500);
}

/* =========================
   항해 시작 버튼
========================= */

nameForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  if (enterButton.disabled) {
    return;
  }

  enterButton.disabled = true;

  const wantsToSave = visitConsent.checked;
  const wantsToPublish =
    wantsToSave && leaderboardConsent.checked;

  /* 방문 기록 저장 동의하지 않은 경우 */
  if (!wantsToSave) {
    enterBlog(name);
    return;
  }

  /* 방문 기록 저장 동의한 경우 */
  saveStatus.textContent =
    "항해 기록을 저장하는 중입니다...";

  try {
    await saveVisit(name, wantsToPublish);

    saveStatus.textContent =
      "항해 기록이 저장되었습니다!";

    enterBlog(name);

  } catch (error) {
    console.error("방문 기록 저장 오류:", error);

    saveStatus.textContent =
      "방문 기록을 저장하지 못했습니다. 블로그 입장은 가능합니다.";

    enterButton.disabled = false;

    // 저장 실패를 숨기지 않고 화면에 표시.
    // 다시 항해 시작을 누르면 저장을 재시도할 수 있음.
  }
});
