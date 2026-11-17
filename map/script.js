
"use strict";

/*
  섬 설정

  x, y: 이미지 왼쪽 위 기준 좌표 (%)
  width, height: 클릭 영역 크기 (%)

  href: 이동할 페이지 주소

  나중에 섬 위치를 수정하고 싶으면
  이 배열의 숫자만 변경하면 됩니다.
*/

const ISLANDS = [
  {
    name: "웹해킹",
    x: 4,
    y: 12,
    width: 17,
    height: 35,
    href: "/web/"
  },
  {
    name: "A&D",
    x: 22,
    y: 7,
    width: 17,
    height: 31,
    href: "/ad/"
  },
  {
    name: "시스템 해킹",
    x: 3,
    y: 52,
    width: 21,
    height: 34,
    href: "/pwn/"
  },
  {
    name: "디지털 포렌식",
    x: 30,
    y: 23,
    width: 28,
    height: 51,
    href: "/forensics/"
  },
  {
    name: "기타",
    x: 49,
    y: 5,
    width: 19,
    height: 30,
    href: "/other/"
  },
  {
    name: "Misc",
    x: 66,
    y: 27,
    width: 18,
    height: 26,
    href: "/misc/"
  },
  {
    name: "IoT",
    x: 81,
    y: 8,
    width: 18,
    height: 29,
    href: "/iot/"
  },
  {
    name: "IoT · 통신",
    x: 80,
    y: 42,
    width: 19,
    height: 26,
    href: "/iot/"
  },
  {
    name: "임베디드",
    x: 56,
    y: 49,
    width: 18,
    height: 30,
    href: "/embedded/"
  },
  {
    name: "미지의 섬",
    x: 70,
    y: 63,
    width: 18,
    height: 25,
    href: "/other/"
  }
];

const viewport = document.getElementById("mapViewport");
const mapContent = document.getElementById("mapContent");
const mapImage = document.getElementById("mapImage");

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
let dragging = false;
let startX = 0;
let startScroll = 0;
let moved = false;
let activePointerId = null;
let suppressClick = false;

viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  dragging = true;
  moved = false;
  suppressClick = false;

  activePointerId = event.pointerId;
  startX = event.clientX;
  startScroll = viewport.scrollLeft;

  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!dragging || event.pointerId !== activePointerId) {
    return;
  }

  const distance = event.clientX - startX;

  if (Math.abs(distance) > 6) {
    moved = true;
    viewport.classList.add("dragging");
  }

  if (moved) {
    viewport.scrollLeft = startScroll - distance;
  }
});

function finishDrag(event) {
  if (!dragging || event.pointerId !== activePointerId) {
    return;
  }

  dragging = false;
  viewport.classList.remove("dragging");

  suppressClick = moved;

  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  activePointerId = null;
}

viewport.addEventListener("pointerup", finishDrag);
viewport.addEventListener("pointercancel", finishDrag);

/* 드래그 직후 섬이 클릭되지 않도록 방지 */
viewport.addEventListener("click", (event) => {
  if (!suppressClick) return;

  event.preventDefault();
  event.stopPropagation();

  suppressClick = false;
}, true);

/* 지도 로딩 후 중앙에서 시작 */
function centerMap() {
  const maxScroll =
    viewport.scrollWidth - viewport.clientWidth;

  viewport.scrollLeft = Math.max(0, maxScroll / 2);
}

createIslands();

if (mapImage.complete && mapImage.naturalWidth > 0) {
  centerMap();
} else {
  mapImage.addEventListener("load", centerMap, {
    once: true
  });
}

window.addEventListener("resize", centerMap);
