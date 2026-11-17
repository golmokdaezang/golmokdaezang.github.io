
"use strict";

/*
  GRAND SECURITY LINE
  해적 지도 스크립트

  x, y, width, height는
  지도 전체 크기에 대한 백분율(%).

  섬 위치를 변경하려면
  ISLANDS 배열의 숫자를 수정하세요.
*/

const ISLANDS = [
  {
    name: "웹해킹 섬",
    x: 3,
    y: 9,
    width: 17,
    height: 37,
    href: "/web/"
  },
  {
    name: "시스템 해킹 섬",
    x: 20,
    y: 3,
    width: 17,
    height: 31,
    href: "/pwn/"
  },
  {
    name: "디지털 포렌식 섬",
    x: 29,
    y: 22,
    width: 29,
    height: 50,
    href: "/forensics/"
  },
  {
    name: "리버싱 섬",
    x: 49,
    y: 4,
    width: 17,
    height: 31,
    href: "/reversing/"
  },
  {
    name: "암호학 섬",
    x: 66,
    y: 25,
    width: 16,
    height: 30,
    href: "/crypto/"
  },
  {
    name: "Web3 섬",
    x: 82,
    y: 3,
    width: 16,
    height: 30,
    href: "/web3/"
  },
  {
    name: "OSINT 섬",
    x: 80,
    y: 39,
    width: 17,
    height: 32,
    href: "/osint/"
  },
  {
    name: "IoT 섬",
    x: 54,
    y: 52,
    width: 19,
    height: 24,
    href: "/iot/"
  },
  {
    name: "A&D 섬",
    x: 3,
    y: 51,
    width: 19,
    height: 32,
    href: "/ad/"
  },
  {
    name: "Misc 섬",
    x: 69,
    y: 65,
    width: 16,
    height: 22,
    href: "/misc/"
  }
];

/* HTML 요소 */
const viewport = document.getElementById("mapViewport");
const mapContent = document.getElementById("mapContent");
const mapImage = document.getElementById("mapImage");
const mapEntrance = document.getElementById("mapEntrance");

/* 섬 클릭 영역 생성 */
function createIslands() {
  ISLANDS.forEach((island) => {
    const link = document.createElement("a");

    link.className = "island";
    link.href = island.href;
    link.setAttribute("aria-label", island.name);

    link.style.left = island.x + "%";
    link.style.top = island.y + "%";
    link.style.width = island.width + "%";
    link.style.height = island.height + "%";

    const tooltip = document.createElement("span");

    tooltip.className = "island-tooltip";
    tooltip.textContent = island.name;

    link.appendChild(tooltip);
    mapContent.appendChild(link);
  });
}

/* 지도 드래그 */
let isDragging = false;
let pointerStartX = 0;
let scrollStartX = 0;
let hasMoved = false;
let activePointerId = null;

/* 마우스 버튼을 누르면 지도 잡기 */
viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  isDragging = true;
  hasMoved = false;

  activePointerId = event.pointerId;
  pointerStartX = event.clientX;
  scrollStartX = viewport.scrollLeft;

  viewport.setPointerCapture(event.pointerId);
});

/* 버튼을 누른 상태로 움직이면 지도 이동 */
viewport.addEventListener("pointermove", (event) => {
  if (!isDragging || event.pointerId !== activePointerId) {
    return;
  }

  const distance = event.clientX - pointerStartX;

  if (Math.abs(distance) > 5) {
    hasMoved = true;
    viewport.classList.add("dragging");
  }

  if (hasMoved) {
    viewport.scrollLeft = scrollStartX - distance;
  }
});

/* 드래그 종료 */
function finishDrag(event) {
  if (!isDragging || event.pointerId !== activePointerId) {
    return;
  }

  isDragging = false;
  viewport.classList.remove("dragging");

  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  activePointerId = null;
}

viewport.addEventListener("pointerup", finishDrag);
viewport.addEventListener("pointercancel", finishDrag);

/* 드래그한 경우 섬 클릭 방지 */
viewport.addEventListener(
  "click",
  (event) => {
    if (!hasMoved) return;

    event.preventDefault();
    event.stopPropagation();

    hasMoved = false;
  },
  true
);

/* 다음 드래그 시작 시 이전 상태 초기화 */
viewport.addEventListener(
  "pointerdown",
  () => {
    hasMoved = false;
  },
  true
);

/* 지도 중앙에서 시작 */
function centerMap() {
  const maxScroll =
    viewport.scrollWidth - viewport.clientWidth;

  viewport.scrollLeft = Math.max(0, maxScroll / 2);
}

/* 입장 애니메이션 종료 후 제거 */
if (mapEntrance) {
  mapEntrance.addEventListener("animationend", (event) => {
    if (event.target === mapEntrance) {
      mapEntrance.remove();
    }
  });
}

/* 실행 */
createIslands();

if (mapImage.complete && mapImage.naturalWidth > 0) {
  centerMap();
} else {
  mapImage.addEventListener("load", centerMap, {
    once: true
  });
}
