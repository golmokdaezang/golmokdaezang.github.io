
const startButton = document.querySelector("#start-screen .start-button");
const startScreen = document.getElementById("start-screen");
const nameScreen = document.getElementById("name-screen");
const greetingScreen = document.getElementById("greeting-screen");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("visitor-name");
const greetingMessage = document.getElementById("greeting-message");

startButton.addEventListener("click", () => {
    startScreen.hidden = true;
    nameScreen.hidden = false;
    nameInput.focus();
});

nameForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) return;

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
});
