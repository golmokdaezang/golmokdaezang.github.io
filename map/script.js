
"use strict";

/* ==========================
   설정
========================== */

const ZOOM = 1.65;

/* 돋보기 이미지의 렌즈 중심 */
const LENS_X = 0.5;
const LENS_Y = 0.5;

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

let mouseX = 0, mouseY = 0, pointerVisible = false;
let frame = 0, geometry = null;
const toggle = document.getElementById('magnifierToggle');
let enabled = true;
try { enabled = localStorage.getItem('map-magnifier') !== 'off'; } catch {}
function hideLens() {
  magnifier.classList.remove('visible');
  document.body.classList.remove('lens-active');
}
function blocked() { return !enabled || dragging || document.hidden || !!document.querySelector('dialog[open]'); }
function schedule() {
  if (!pointerVisible || blocked()) { hideLens(); return; }
  if (!frame) frame = requestAnimationFrame(renderLens);
}
function renderLens() {
  frame = 0;
  if (!pointerVisible || blocked()) { hideLens(); return; }
  if (!geometry) {
    const r = mapImage.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    geometry = {left:r.left+viewport.scrollLeft, top:r.top, width:r.width,height:r.height,v,w:magnifier.offsetWidth,h:magnifier.offsetHeight,l:lens.offsetWidth};
    zoomImage.style.width = r.width*ZOOM+'px';
    zoomImage.style.height = r.height*ZOOM+'px';
  }
  const g=geometry, x=mouseX-g.left+viewport.scrollLeft, y=mouseY-g.top;
  const target=document.elementFromPoint(mouseX,mouseY);
  const control=!!target?.closest('.back-link,.chart-mini,.magnifier-toggle');
  const inside=!control && mouseX>=g.v.left && mouseX<=g.v.right && mouseY>=g.v.top && mouseY<=g.v.bottom && x>=0 && x<=g.width && y>=0 && y<=g.height;
  magnifier.classList.toggle('over-map',inside);
  magnifier.classList.toggle('over-control',control);
  if(control){hideLens();return;}
  magnifier.style.transform=`translate3d(${mouseX-g.w*LENS_X}px,${mouseY-g.h*LENS_Y}px,0)`;
  magnifier.classList.add('visible');
  document.body.classList.toggle('lens-active',inside);
  if(inside) zoomImage.style.transform=`translate3d(${g.l/2-x*ZOOM}px,${g.l/2-y*ZOOM}px,0)`;
}
function syncToggle(){toggle.setAttribute('aria-pressed',String(enabled));toggle.querySelector('span').textContent=enabled?'돋보기 ON':'돋보기 OFF';document.body.classList.toggle('magnifier-disabled',!enabled);if(!enabled){if(frame)cancelAnimationFrame(frame);frame=0;hideLens();geometry=null;}else schedule();}
toggle.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('map-magnifier',enabled?'on':'off')}catch{}syncToggle();});
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouseX=e.clientX;mouseY=e.clientY;pointerVisible=true;schedule();},{passive:true});
function leave(){pointerVisible=false;hideLens();if(frame)cancelAnimationFrame(frame);frame=0;}
document.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);document.addEventListener('visibilitychange',leave);
new ResizeObserver(()=>{geometry=null;schedule()}).observe(viewport);
new ResizeObserver(()=>{geometry=null;schedule()}).observe(mapImage);
new MutationObserver(()=>{if(blocked())hideLens();else schedule();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});

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
  hideLens();
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

    hideLens();
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
  schedule();
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

  geometry = null;
  schedule();
}

syncToggle();
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
  schedule();
}, { passive: true });

const mini=document.getElementById('mini'); const marker=document.getElementById('marker'); function syncMini(){marker.style.width=100*viewport.clientWidth/viewport.scrollWidth+'%';marker.style.left=100*viewport.scrollLeft/viewport.scrollWidth+'%';mini.value=100*viewport.scrollLeft/Math.max(1,viewport.scrollWidth-viewport.clientWidth);} viewport.addEventListener('scroll',syncMini); window.addEventListener('resize',syncMini); mapImage.addEventListener('load',syncMini); mini.addEventListener('input',()=>{viewport.scrollLeft=Number(mini.value)/100*(viewport.scrollWidth-viewport.clientWidth)});syncMini();
