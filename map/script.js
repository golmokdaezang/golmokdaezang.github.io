
"use strict";

/*
  지도 좌표는 이미지 전체 기준 백분율(%).

  x, y: 클릭 영역의 왼쪽 위 위치
  width, height: 클릭 영역의 크기
  href: 이동할 페이지

  실제 이미지에서 섬 위치를 확인하면서
  숫자를 조금씩 조정하면 됩니다.
*/

const ISLANDS = [
  {
    name: "웹해킹 섬",
    x: 3, y: 9,
    width: 17, height: 37,
    href: "/web/"
  },
  {
    name: "시스템 해킹 섬",
    x: 20, y: 3,
    width: 17, height: 31,
    href: "/pwn/"
  },
  {
    name: "디지털 포렌식 섬",
    x: 29, y: 22,
    width: 29, height: 50,
    href: "/forensics/"
  },
  {
    name: "리버싱 섬",
    x: 49, y: 4,
    width: 17, height: 31,
    href: "/reversing/"
  },
  {
    name: "암호학 섬",
    x: 66, y: 25,
    width: 16, height: 30,
    href: "/crypto/"
  },
  {
    name: "Web3 섬",
    x: 82, y: 3,
    width: 16, height: 30,
    href: "/web3/"
  },
  {
    name: "OSINT 섬",
    x: 80, y: 39,
    width: 17, height: 32,
    href: "/osint/"
  },
  {
    name: "IoT 섬",
    x: 54, y: 52,
    width: 19, height: 24,
    href: "/iot/"
  },
  {
    name: "A&D 섬",
    x: 3, y: 51,
    width: 19, height: 32,
    href: "/ad/"
  },
  {
    name: "Misc 섬",
    x: 69, y: 65,
    width: 16, height: 22,
    href: "/misc/"
  }
];

const viewport = document.getElementById("mapViewport");
const mapContent = document.getElementById("mapContent");
const mapImage = document.getElementById("mapImage");

// 섬 클릭 영역 생성
function createIslands() {
  for (const island of ISLANDS) {
    const link = document.createElement("a");

    link.className = "island";
    link.href = island.href;
    link.setAttribute("aria-label", island.name);

    link.style.left = `${island.x}%`;
    link.style.top = `${island.y}%`;
    link.style.width = `${island.width}%`;
    link.style.height = `${island.height}%`;

    const tooltip = document.createElement("span");
    tooltip.className = "island-tooltip";
    tooltip.textContent = island.name;

    link.appendChild(tooltip);
    mapContent.appendChild(link);
  }
}

// 드래그 관련 변수
let dragging = false;
let startX = 0;
let startScroll = 0;
let moved = false;
let pointerId = null;

// 마우스 버튼을 누르면 지도 잡기
viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  dragging = true;
  moved = false;
  pointerId = event.pointerId;
  startX = event.clientX;
  startScroll = viewport.scrollLeft;

  viewport.setPointerCapture(event.pointerId);
});

// 버튼을 누른 채 움직이면 지도 이동
viewport.addEventListener("pointermove", (event) => {
  if (!dragging || event.pointerId !== pointerId) {
    return;
  }

  const distance = event.clientX - startX;

  if (Math.abs(distance) > 5) {
    moved = true;
    viewport.classList.add("dragging");
  }

  if (moved) {
    viewport.scrollLeft = startScroll - distance;
  }
});

// 드래그 종료
function endDrag(event) {
  if (!dragging || event.pointerId !== pointerId) {
    return;
  }

  dragging = false;
  viewport.classList.remove("dragging");

  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  pointerId = null;
}

viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", endDrag);

// 드래그 직후 링크 클릭 차단
viewport.addEventListener("click", (event) => {
  if (!moved) return;

  event.preventDefault();
  event.stopPropagation();
  moved = false;
}, true);

// 클릭 없이 드래그가 끝난 경우를 대비해
// 다음 포인터 동작에서 이전 상태 초기화
viewport.addEventListener("pointerdown", () => {
  moved = false;
}, true);

// 이미지 로드 후 지도 중앙에서 시작
function centerMap() {
  const maxScroll = viewport.scrollWidth - viewport.clientWidth;
  viewport.scrollLeft = Math.max(0, maxScroll / 2);
}

createIslands();

if (mapImage.complete && mapImage.naturalWidth > 0) {
  centerMap();
} else {
  mapImage.addEventListener("load", centerMap, { once: true });
}
