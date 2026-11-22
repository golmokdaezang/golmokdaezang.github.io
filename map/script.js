
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
    "name": "웹해킹",
    "href": "/web/",
    "x": 2.861,
    "y": 12.431,
    "width": 11.5,
    "height": 43.6
  },
  {
    "name": "A&D",
    "href": "/ad/",
    "x": 12.5,
    "y": 45.692,
    "width": 12.778,
    "height": 47.846
  },
  {
    "name": "시스템 해킹",
    "href": "/pwn/",
    "x": 25.701,
    "y": 7.462,
    "width": 4.153,
    "height": 44.308
  },
  {
    "name": "디지털 포렌식",
    "href": "/forensics/",
    "x": 31.229,
    "y": 23.462,
    "width": 13.097,
    "height": 58.462
  },
  {
    "name": "리버싱",
    "href": "/reversing/",
    "x": 45.375,
    "y": 10.808,
    "width": 7.028,
    "height": 35.462
  },
  {
    "name": "임베디드",
    "href": "/embedded/",
    "x": 49.367,
    "y": 63.815,
    "width": 4.6,
    "height": 22.369
  },
  {
    "name": "암호학",
    "href": "/crypto/",
    "x": 57.917,
    "y": 28.038,
    "width": 6.389,
    "height": 35.462
  },
  {
    "name": "Misc",
    "href": "/misc/",
    "x": 66.215,
    "y": 63.992,
    "width": 4.792,
    "height": 22.015
  },
  {
    "name": "네트워크",
    "href": "/network/",
    "x": 70.215,
    "y": 17.492,
    "width": 7.347,
    "height": 27.323
  },
  {
    "name": "IoT",
    "href": "/iot/",
    "x": 80.05,
    "y": 58.192,
    "width": 4.344,
    "height": 21.308
  },
  {
    "name": "CTF",
    "href": "/ctf/",
    "x": 88.472,
    "y": 26.492,
    "width": 6.389,
    "height": 30.862
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

const mini=document.getElementById('mini'); const marker=document.getElementById('marker'); function syncMini(){marker.style.width=100*viewport.clientWidth/viewport.scrollWidth+'%';marker.style.left=100*viewport.scrollLeft/viewport.scrollWidth+'%';mini.value=100*viewport.scrollLeft/Math.max(1,viewport.scrollWidth-viewport.clientWidth);} viewport.addEventListener('scroll',syncMini); window.addEventListener('resize',syncMini); mapImage.addEventListener('load',syncMini); mini.addEventListener('input',()=>{viewport.scrollLeft=Number(mini.value)/100*(viewport.scrollWidth-viewport.clientWidth)});syncMini();
