/* ============================================================
   The Quarry House — Gallery (faithful rebuild)
   Arc wheel decoded from the live site:
     center = (50vw, vh + 584rem), radius = 1419rem, step = 24deg
     card center rides the circle, card rotated by its angle.
     rem = innerWidth / --sw  (1px @ 1920w desktop)
   ============================================================ */

const ROOMS = [
  { name: "Kitchen",      alt: "KITCHEN",      url: "https://images.prismic.io/quarry-house/7afb62d4-7906-4367-801f-625cb6cff6fd_QUARRY_+Kitchen_final-min-min.jpg" },
  { name: "Lounge",       alt: "LOUNGE",       url: "https://images.prismic.io/quarry-house/65f0b482-a242-401f-8e0d-51f6a962546f_QUARRY_Living+room_final-min-min.jpg" },
  { name: "Storeroom",    alt: "STOREROOM",    url: "https://images.prismic.io/quarry-house/b0f527ae-bb1d-4778-be71-46a145440b64_QUARRY_Store+room+1_final_2-min-min.jpg" },
  { name: "Quarry House", alt: "QUARRY HOUSE", url: "https://images.prismic.io/quarry-house/3cb49b3d-b9fc-42fe-af1e-4c1f5762a33e_QUARRY_Exterior_final-min-min.jpg" },
  { name: "Storeroom",    alt: "STOREROOM",    url: "https://images.prismic.io/quarry-house/b94fa754-ad0b-41f5-872f-7e62b051ffae_QUARRY_Store+room+2_final_3-min-min.jpg" },
];
// tile the full wheel: 15 slots x 24deg = 360deg (seamless symmetric loop)
const CARDS = [...ROOMS, ...ROOMS, ...ROOMS];

const STEP = 24;                 // degrees between cards
const N = CARDS.length;          // 15
const imgParam = "?auto=compress,format&rect=0,0,2048,1365&w=1100&h=1375&fit=crop";

/* ---------- rem scaling (matches the original's --sw system) ---------- */
function setScale() {
  const sw = parseFloat(getComputedStyle(document.body).getPropertyValue("--sw")) || 1920;
  document.documentElement.style.fontSize = (window.innerWidth / sw) + "px";
  document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
}
setScale();
window.addEventListener("resize", setScale);

const rem = () => parseFloat(document.documentElement.style.fontSize) || 1;

/* ---------- geometry ----------
   Original desktop formula: center=(50vw, vh+584rem), radius=1419rem.
   On very tall/narrow viewports the vw-scaled radius would push the top
   card off-screen, so we clamp the wheel down to keep it clear of the top. */
function geom() {
  const r = rem();
  const vh = window.innerHeight, vw = window.innerWidth;
  const R = 1419 * r;
  let cy = vh + 584 * r;
  const cardHalf = (vw <= 414 ? 133.5 : vw <= 1024 ? 228 : 285) * r;
  const minTop = cardHalf + 0.05 * vh;     // keep top card below the header
  if (cy - R < minTop) cy = R + minTop;
  return { cx: vw / 2, cy, R };
}

/* ============================================================
   Build the wheel
   ============================================================ */
const wheel = document.getElementById("wheel");
const cardEls = [];

CARDS.forEach((room, i) => {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.index = i;
  const inner = document.createElement("div");
  inner.className = "card-inner";
  const img = document.createElement("img");
  img.src = room.url + imgParam;
  img.alt = room.alt;
  img.draggable = false;
  inner.appendChild(img);
  card.appendChild(inner);
  wheel.appendChild(card);
  cardEls.push(card);
});

/* ============================================================
   Wheel state — rotation in degrees.
   active card index = rotation / STEP  (rounded)
   each card screen-angle = i*STEP - rotation
   ============================================================ */
let rotation = 0;        // current
let target = 0;          // snap target
let velocity = 0;        // deg/frame for inertia
let dragging = false;
let lastActive = -1;

function normIndex(i) { return ((i % N) + N) % N; }

function render() {
  const { cx, cy, R } = geom();
  for (let k = 0; k < N; k++) {
    // pick the nearest visual copy of card k around the wheel so it wraps seamlessly
    let baseDeg = k * STEP;
    let theta = baseDeg - rotation;
    // wrap into [-180,180]
    theta = ((theta + 180) % 360 + 360) % 360 - 180;
    const card = cardEls[k];
    // hide cards on the far/back side of the wheel
    if (Math.abs(theta) > 132) { card.style.display = "none"; continue; }
    card.style.display = "block";
    const rad = theta * Math.PI / 180;
    const x = cx + R * Math.sin(rad);
    const y = cy - R * Math.cos(rad);
    card.style.transform = `translate3d(${x}px,${y}px,0) rotate(${theta}deg)`;
    // depth cue: subtle fade toward the edges
    const fade = 1 - Math.min(Math.abs(theta) / 150, 1) * 0.15;
    card.style.opacity = fade.toFixed(3);
    card.style.zIndex = String(1000 - Math.round(Math.abs(theta)));
  }
  updateActive();
}

function updateActive() {
  const idx = normIndex(Math.round(rotation / STEP));
  if (idx !== lastActive) {
    lastActive = idx;
    swapTitle(CARDS[idx].alt);
    const pct = Math.round((idx / N) * 100);
    progressEl.textContent = String(pct).padStart(2, "0") + "%";
  }
}

/* ---------- animation loop ----------
   Everything drives a single `target`; rotation eases toward it each frame
   (smooth glide), then snaps to the nearest card when input settles. */
const EASE = 0.085;               // lerp speed toward target (smooth + responsive)
function tick() {
  if (!dragging) {
    rotation += (target - rotation) * EASE;
    if (Math.abs(target - rotation) < 0.001) rotation = target;
  }
  render();
  requestAnimationFrame(tick);
}

/* ============================================================
   Title swap (fade out / in)
   ============================================================ */
const titleWrap = document.getElementById("galleryTitle");
const roomNameEl = document.getElementById("roomName");
const progressEl = document.getElementById("progress");
let titleTO;
function swapTitle(text) {
  if (roomNameEl.textContent === text) return;
  titleWrap.classList.add("swap");
  clearTimeout(titleTO);
  titleTO = setTimeout(() => {
    roomNameEl.textContent = text;
    titleWrap.classList.remove("swap");
  }, 240);
}

/* ============================================================
   Drag interaction (pointer) + wheel + keys
   ============================================================ */
const carousel = document.getElementById("carousel");
let startX = 0, lastX = 0, startRot = 0, moved = 0, downTime = 0;
const DRAG_SENS = 0.14;        // px -> deg while dragging
const SCROLL_SENS = 0.18;      // deltaY -> deg (gentle, smoothed by the lerp)
const FLICK_PROJECT = 5;       // how far a release flick coasts (frames-ish)

function pointerDown(e) {
  if (viewer.classList.contains("open")) return;
  dragging = true;
  velocity = 0;
  startX = lastX = e.clientX ?? e.touches[0].clientX;
  startRot = rotation;
  moved = 0;
  downTime = performance.now();
  cursorEl.classList.add("press");
}
function pointerMove(e) {
  const x = e.clientX ?? (e.touches && e.touches[0].clientX);
  if (x == null) return;
  if (dragging) {
    const dx = x - startX;
    moved = Math.abs(dx);
    rotation = startRot - dx * DRAG_SENS;   // drag right -> previous
    velocity = -(x - lastX) * DRAG_SENS;
    lastX = x;
  }
  moveCursor(x, e.clientY ?? (e.touches && e.touches[0].clientY));
}
function pointerUp(e) {
  if (!dragging) return;
  dragging = false;
  cursorEl.classList.remove("press");
  // project the release flick a little, then snap to the nearest card
  const cur = Math.round(rotation / STEP);
  let t = Math.round((rotation + velocity * FLICK_PROJECT) / STEP);
  t = Math.max(cur - 5, Math.min(cur + 5, t));   // cap a hard fling
  target = t * STEP;
  velocity = 0;
  // treat a still pointer as a click on the center card
  const dt = performance.now() - downTime;
  if (moved < 6 && dt < 400) {
    const upX = (e.clientX ?? (e.changedTouches && e.changedTouches[0].clientX));
    maybeOpenViewer(upX);
  }
}

carousel.addEventListener("pointerdown", pointerDown);
window.addEventListener("pointermove", pointerMove);
window.addEventListener("pointerup", pointerUp);

let scrollSnapTO;
window.addEventListener("wheel", (e) => {
  if (viewer.classList.contains("open")) return;
  // gentle, clamped accumulation -> rotation eases toward it smoothly
  const d = Math.max(-45, Math.min(45, e.deltaY || e.deltaX));
  target += d * SCROLL_SENS;
  // snap to the nearest card once scrolling settles
  clearTimeout(scrollSnapTO);
  scrollSnapTO = setTimeout(() => {
    target = Math.round(target / STEP) * STEP;
  }, 150);
}, { passive: true });

window.addEventListener("keydown", (e) => {
  if (viewer.classList.contains("open")) {
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowRight") stepViewer(1);
    if (e.key === "ArrowLeft") stepViewer(-1);
    return;
  }
  if (e.key === "ArrowRight") { target += STEP; }
  if (e.key === "ArrowLeft") { target -= STEP; }
});

/* ============================================================
   Viewer (fullscreen) — expand center card, prev / next, close
   ============================================================ */
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewerImg");
let viewerIndex = 0;

function buildViewerImg(idx) {
  viewerImg.innerHTML = "";
  const img = document.createElement("img");
  img.src = CARDS[idx].url + "?auto=compress,format&w=2200";
  img.alt = CARDS[idx].alt;
  viewerImg.appendChild(img);
}

function maybeOpenViewer(clientX) {
  // only open if the click is near the centered (upright) card
  const activeIdx = normIndex(Math.round(rotation / STEP));
  if (clientX != null) {
    const { cx } = geom();
    const half = 227 * rem();
    if (Math.abs(clientX - cx) > half) return; // clicked a side card -> ignore
  }
  openViewer(activeIdx);
}

function openViewer(idx) {
  viewerIndex = idx;
  buildViewerImg(idx);
  // start sized like the card, then expand
  requestAnimationFrame(() => {
    viewer.classList.add("open");
  });
  document.body.classList.add("viewing");
}
function closeViewer() {
  viewer.classList.remove("open");
}
function stepViewer(dir) {
  viewerIndex = normIndex(viewerIndex + dir);
  // simple cross-reveal
  const old = viewerImg.querySelector("img");
  buildViewerImg(viewerIndex);
  const nu = viewerImg.querySelector("img");
  nu.style.opacity = "0";
  nu.style.transition = "opacity .6s var(--ease)";
  if (old && old !== nu) old.style.position = "absolute";
  requestAnimationFrame(() => { nu.style.opacity = "1"; });
  // keep wheel in sync
  target = Math.round(rotation / STEP) * STEP + dir * STEP;
}

document.getElementById("viewerClose").addEventListener("click", closeViewer);
document.getElementById("vNext").addEventListener("click", () => stepViewer(1));
document.getElementById("vPrev").addEventListener("click", () => stepViewer(-1));

/* ============================================================
   Custom cursor
   ============================================================ */
const cursorEl = document.getElementById("cursor");
let curX = window.innerWidth / 2, curY = window.innerHeight / 2;
let renderX = curX, renderY = curY;
function moveCursor(x, y) { if (x != null) curX = x; if (y != null) curY = y; }
window.addEventListener("pointermove", (e) => moveCursor(e.clientX, e.clientY));
(function cursorLoop() {
  renderX += (curX - renderX) * 0.2;
  renderY += (curY - renderY) * 0.2;
  cursorEl.style.transform = `translate3d(${renderX}px,${renderY}px,0)`;
  requestAnimationFrame(cursorLoop);
})();
document.querySelectorAll("button, a, .hamburger").forEach((el) => {
  el.addEventListener("pointerenter", () => cursorEl.classList.add("hover"));
  el.addEventListener("pointerleave", () => cursorEl.classList.remove("hover"));
});

/* ============================================================
   Preloader  -> reveal -> gallery entrance
   ============================================================ */
const preloader = document.getElementById("preloader");
const arc = document.getElementById("progressArc");
const countEl = document.getElementById("plCount");
const header = document.getElementById("header");

let pct = 0;
function preloadTick() {
  pct += Math.random() * 7 + 2;
  if (pct >= 100) pct = 100;
  arc.setAttribute("stroke-dashoffset", String(100 - pct));
  countEl.textContent = String(Math.floor(pct)).padStart(3, "0");
  if (pct < 100) {
    setTimeout(preloadTick, 90);
  } else {
    setTimeout(reveal, 500);
  }
}

function reveal() {
  preloader.classList.add("reveal");
  // stagger the card mask-reveal
  cardEls.forEach((c, i) => setTimeout(() => c.classList.add("in"), 200 + i * 60));
  setTimeout(() => {
    preloader.classList.add("hide");
    header.classList.add("show");
  }, 700);
  swapTitle(CARDS[0].alt);
}

// kick things off
roomNameEl.textContent = "";
render();
tick();
// start preloader after fonts settle
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => setTimeout(preloadTick, 250));
} else {
  setTimeout(preloadTick, 250);
}
