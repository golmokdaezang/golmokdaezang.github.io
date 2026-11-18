
"use strict";

/* ==========================
   설정
========================== */

const ZOOM = 1.5;

/* 돋보기 이미지의 렌즈 중심 */
const LENS_X = 0.395;
const LENS_Y = 0.355;

/* 섬 목록 */
const ISLANDS = [
  {
    name: "웹해킹",
    x: 4, y: 12, width: 17, height: 35,
    href: "/web/"
  },
  {
    name: "시스템 해킹",
    x: 22, y: 7, width: 17, height: 31,
    href: "/pwn/"
  },
  {
    name: "A&D",
    x: 3, y: 52, width: 21, height: 34,
    href: "/ad/"
  },
  {
    name: "디지털 포렌식",
    x: 30, y: 23, width: 28, height: 51,
    href: "/forensics/"
  },
  {
    name: "리버싱",
    x: 49, y: 5, width: 19, height: 30,
    href: "/reversing/"
  },
  {
    name: "암호학",
    x: 66, y: 27, width: 18, height: 26,
    href: "/crypto/"
  },
  {
    name: "IoT",
    x: 81, y: 8, width: 18, height: 29,
    href: "/iot/"
  },
  {
    name: "네트워크",
    x: 80, y: 42, width: 19, height: 26,
    href: "/network/"
  },
  {
    name: "임베디드",
    x: 56, y: 49, width: 18, height: 30,
    href: "/embedded/"
  },
  {
    name: "Misc",
    x: 70, y: 63, width: 18, height: 25,
    href: "/misc/"
  }
];

/* ==========================
   요소 가져오기
========================== */

const viewport = document.getElementById("mapViewport");
const mapContent = document.getElementById("mapContent");
const mapImage = document.getElementById("mapImage");

const magnifier = document.getElementById("magnifier");
const lens = document.getElementById("magnifierLens");
const zoomImage = document.getElementById("magnifierMap");
const label = document.getElementById("magnifierLabel");

/* ==========================
   섬 클릭 영역 생성
========================== */

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

    mapContent.appendChild(link);
  });
}

/* ==========================
   마우스 추적
========================== */

let mouseX = 0;
let mouseY = 0;
let pointerVisible = false;

function updateMagnifier(x, y) {
  mouseX = x;
  mouseY = y;

  const width = magnifier.offsetWidth;
  const height = magnifier.offsetHeight;

  const centerX = width * LENS_X;
  const centerY = height * LENS_Y;

  /* 지연 없이 마우스를 따라 이동 */
  magnifier.style.transform =
    `translate3d(${x - centerX}px, ${y - centerY}px, 0)`;

  magnifier.classList.add("visible");

  updateZoom();
  updateIslandLabel();
}

/* ==========================
   지도 확대
========================== */

function updateZoom() {
  const rect = mapImage.getBoundingClientRect();

  const insideMap =
    mouseX >= rect.left &&
    mouseX <= rect.right &&
    mouseY >= rect.top &&
    mouseY <= rect.bottom;

  magnifier.classList.toggle("over-map", insideMap);

  if (!insideMap) return;

  const relativeX = mouseX - rect.left;
  const relativeY = mouseY - rect.top;

  const lensSize = lens.offsetWidth;

  const zoomWidth = rect.width * ZOOM;
  const zoomHeight = rect.height * ZOOM;

  zoomImage.style.width = zoomWidth + "px";
  zoomImage.style.height = zoomHeight + "px";

  zoomImage.style.left =
    (lensSize / 2 - relativeX * ZOOM) + "px";

  zoomImage.style.top =
    (lensSize / 2 - relativeY * ZOOM) + "px";
}

/* ==========================
   섬 이름 표시
========================== */

function updateIslandLabel() {
  const rect = mapImage.getBoundingClientRect();

  const x = ((mouseX - rect.left) / rect.width) * 100;
  const y = ((mouseY - rect.top) / rect.height) * 100;

  const island = ISLANDS.find((item) => {
    return (
      x >= item.x &&
      x <= item.x + item.width &&
      y >= item.y &&
      y <= item.y + item.height
    );
  });

  if (island) {
    label.textContent = island.name;
    label.classList.add("show");
  } else {
    label.textContent = "";
    label.classList.remove("show");
  }
}

/* ==========================
   마우스 이동 이벤트
========================== */

document.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;

  pointerVisible = true;

  updateMagnifier(event.clientX, event.clientY);
}, { passive: true });

document.addEventListener("pointerleave", () => {
  pointerVisible = false;
  magnifier.classList.remove("visible");
});

window.addEventListener("blur", () => {
  pointerVisible = false;
  magnifier.classList.remove("visible");
});

/* ==========================
   지도 드래그
========================== */

let dragging = false;
let moved = false;
let activePointerId = null;

let startX = 0;
let startScroll = 0;

viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  dragging = true;
  moved = false;

  activePointerId = event.pointerId;
  startX = event.clientX;
  startScroll = viewport.scrollLeft;
});

viewport.addEventListener("pointermove", (event) => {
  if (!dragging || event.pointerId !== activePointerId) {
    return;
  }

  const distance = event.clientX - startX;

  if (Math.abs(distance) > 6) {
    moved = true;
    viewport.classList.add("dragging");

    if (!viewport.hasPointerCapture(event.pointerId)) {
      viewport.setPointerCapture(event.pointerId);
    }
  }

  if (moved) {
    viewport.scrollLeft = startScroll - distance;

    if (pointerVisible) {
      updateZoom();
      updateIslandLabel();
    }
  }
});

function finishDrag(event) {
  if (!dragging || event.pointerId !== activePointerId) {
    return;
  }

  dragging = false;
  viewport.classList.remove("dragging");

  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  activePointerId = null;
}

viewport.addEventListener("pointerup", finishDrag);
viewport.addEventListener("pointercancel", finishDrag);

/* 드래그 후 클릭 방지 */
viewport.addEventListener("click", (event) => {
  if (!moved) return;

  event.preventDefault();
  event.stopPropagation();

  moved = false;
}, true);

/* ==========================
   지도 처음 위치
========================== */

function centerMap() {
  const maxScroll =
    viewport.scrollWidth - viewport.clientWidth;

  viewport.scrollLeft = Math.max(0, maxScroll / 2);

  if (pointerVisible) {
    updateZoom();
    updateIslandLabel();
  }
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

viewport.addEventListener("scroll", () => {
  if (pointerVisible) {
    updateZoom();
    updateIslandLabel();
  }
}, { passive: true });
