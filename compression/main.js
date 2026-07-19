/* COMPRESSION — one work, nine states of reveal
   One content atom morphs through canonical display patterns.
   The image persists; text layers reveal; the item multiplies. */

gsap.registerPlugin(Flip);

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DUR = REDUCED ? 0 : 0.75;

/* ---------------- content ---------------- */

const ITEMS = [
  {
    title: "Harbor, first light",
    blurb: "Painted in the twenty minutes before the ferries woke. The water held more color than the sky.",
  },
  {
    title: "A field, remembered",
    blurb: "Less a place than the feeling of one — pink heat, green shade, a sun refusing to set.",
  },
  {
    title: "Nocturne in umber",
    blurb: "Almost nothing: a dark sea, a darker sky, one patient light on the horizon.",
  },
  {
    title: "Cloud study no. 4",
    blurb: "Twelve minutes of weather, caught before it became a different painting.",
  },
  {
    title: "The green cove",
    blurb: "Where the land leans in and the water goes quiet. Painted from the rocks, knees wet.",
  },
  {
    title: "Lavender hour",
    blurb: "The eight minutes after sunset when every shadow agrees on a color.",
  },
];

const PARAS = [
  "A painting doesn't change size; the attention around it does. This page treats layout the same way — the work stays still while the frame breathes.",
  "Compression is not loss. The icon state knows everything the article knows. It has simply chosen what to say first.",
  "Reveal is a promise kept slowly. Each state answers one more question than the last, and never two.",
];

const STATES = [
  { key: "icon",     hint: "everything, held in 76 pixels", dwell: 1.0 },
  { key: "label",    hint: "a name attaches",               dwell: 1.1 },
  { key: "snippet",  hint: "context arrives",               dwell: 1.2 },
  { key: "card",     hint: "the unit of attention",         dwell: 1.6 },
  { key: "list",     hint: "it learns to repeat",           dwell: 1.3 },
  { key: "grid",     hint: "it learns to tile",             dwell: 1.3 },
  { key: "carousel", hint: "it learns to flow",             dwell: 1.4 },
  { key: "hero",     hint: "one thing, fully",              dwell: 1.5 },
  { key: "article",  hint: "fully decompressed",            dwell: 2.6 },
];

const N = ITEMS.length;

/* ---------------- painterly artwork ---------------- */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* each palette: sky / far / near bands + optional sun */
const PALETTES = [
  { // harbor, first light — blues, teal water, gold sun
    bg: ["#8fb3d9", "#33567e"],
    bands: [
      { y0: 0.00, y1: 0.42, colors: ["#7fa8d9", "#a9c6e8", "#5d82b3", "#c9dcf0"], angle: 0.1, drift: 0.5 },
      { y0: 0.38, y1: 0.70, colors: ["#274690", "#2e6f8e", "#3a7ca5", "#1d3a6e"], angle: 0.0, drift: 0.2 },
      { y0: 0.66, y1: 1.00, colors: ["#2e6f5e", "#1f4d42", "#3d8a70", "#173a52"], angle: 0.15, drift: 0.4 },
    ],
    sun: { x: 0.30, y: 0.30, r: 0.10, color: "#f2c14e" },
  },
  { // a field, remembered — pink sky, orange sun, green field
    bg: ["#f4a8bd", "#e0764e"],
    bands: [
      { y0: 0.00, y1: 0.50, colors: ["#f49bb5", "#f7b8c9", "#ef7fa5", "#f58f5d"], angle: 0.05, drift: 0.6 },
      { y0: 0.45, y1: 0.72, colors: ["#f58f5d", "#e86a4a", "#f7a96e", "#d95a8a"], angle: 0.0, drift: 0.3 },
      { y0: 0.68, y1: 1.00, colors: ["#2e8b57", "#1e6e42", "#48a06b", "#175c38"], angle: 0.35, drift: 0.7 },
    ],
    sun: { x: 0.52, y: 0.40, r: 0.15, color: "#f9d423" },
  },
  { // nocturne in umber — dark sea, moon glint
    bg: ["#2b2d38", "#16171e"],
    bands: [
      { y0: 0.00, y1: 0.55, colors: ["#23252f", "#2f3140", "#3a3347", "#1b1c24"], angle: 0.05, drift: 0.3 },
      { y0: 0.50, y1: 1.00, colors: ["#16171e", "#232838", "#2c2530", "#101116"], angle: 0.0, drift: 0.15 },
    ],
    sun: { x: 0.68, y: 0.52, r: 0.045, color: "#e8e2cf" },
  },
  { // cloud study — cobalt & white
    bg: ["#3b5ba5", "#26406e"],
    bands: [
      { y0: 0.00, y1: 0.55, colors: ["#f2f4f7", "#d7e0ee", "#b9c9e2", "#4a6ab0"], angle: 0.2, drift: 0.9 },
      { y0: 0.45, y1: 1.00, colors: ["#3b5ba5", "#2c4a8c", "#54719f", "#22386a"], angle: 0.1, drift: 0.5 },
    ],
    sun: null,
  },
  { // the green cove — greens, pink sky, yellow
    bg: ["#f2b8c6", "#2e7d5b"],
    bands: [
      { y0: 0.00, y1: 0.38, colors: ["#f2b8c6", "#f6d0da", "#e895ae", "#f0c983"], angle: 0.05, drift: 0.5 },
      { y0: 0.34, y1: 0.68, colors: ["#2e8b6e", "#3ba97e", "#1f6e52", "#7fc9a0"], angle: 0.3, drift: 0.6 },
      { y0: 0.64, y1: 1.00, colors: ["#1d5c46", "#174a38", "#2e7d5b", "#0f3a2c"], angle: 0.1, drift: 0.3 },
    ],
    sun: { x: 0.46, y: 0.24, r: 0.09, color: "#f6d365" },
  },
  { // lavender hour — lavender, plum, peach
    bg: ["#b3a5d6", "#6e5a8e"],
    bands: [
      { y0: 0.00, y1: 0.48, colors: ["#9b8bc4", "#b8abda", "#8672ae", "#e8b4a0"], angle: 0.08, drift: 0.5 },
      { y0: 0.44, y1: 0.75, colors: ["#6e5a8e", "#8672ae", "#5a4676", "#c4938f"], angle: 0.0, drift: 0.3 },
      { y0: 0.70, y1: 1.00, colors: ["#4a3a62", "#3a2d4e", "#5a4676", "#2e2440"], angle: 0.12, drift: 0.35 },
    ],
    sun: { x: 0.74, y: 0.38, r: 0.06, color: "#f5c9a4" },
  },
];

function makeArt(pal, seed) {
  const W = 640, H = 480;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  const rnd = mulberry32(seed);

  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.bg[0]);
  g.addColorStop(1, pal.bg[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  x.lineCap = "round";

  // sun / moon under the strokes
  if (pal.sun) {
    const s = pal.sun;
    const rg = x.createRadialGradient(s.x * W, s.y * H, 2, s.x * W, s.y * H, s.r * W * 2.6);
    rg.addColorStop(0, s.color);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    x.globalAlpha = 0.9;
    x.fillStyle = rg;
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
  }

  // banded impressionist strokes
  for (const band of pal.bands) {
    const count = 620;
    for (let i = 0; i < count; i++) {
      const px = rnd() * W;
      const py = (band.y0 + rnd() * (band.y1 - band.y0)) * H;
      const wob = Math.sin(px * 0.013 + py * 0.021 + seed) * band.drift;
      const a = band.angle + wob * 0.8 + (rnd() - 0.5) * 0.25;
      const len = 12 + rnd() * 34;
      const col = band.colors[(rnd() * band.colors.length) | 0];
      x.strokeStyle = col;
      x.globalAlpha = 0.35 + rnd() * 0.55;
      x.lineWidth = 4 + rnd() * 9;
      x.beginPath();
      x.moveTo(px - Math.cos(a) * len / 2, py - Math.sin(a) * len / 2);
      x.lineTo(px + Math.cos(a) * len / 2, py + Math.sin(a) * len / 2);
      x.stroke();
    }
  }

  // repaint the sun disc over the strokes, roughly
  if (pal.sun) {
    const s = pal.sun;
    for (let i = 0; i < 60; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * s.r * W * 0.8;
      x.strokeStyle = s.color;
      x.globalAlpha = 0.5 + rnd() * 0.4;
      x.lineWidth = 5 + rnd() * 8;
      const px = s.x * W + Math.cos(a) * d;
      const py = s.y * H + Math.sin(a) * d * 0.9;
      const len = 6 + rnd() * 14;
      x.beginPath();
      x.moveTo(px - len / 2, py);
      x.lineTo(px + len / 2, py);
      x.stroke();
    }
  }

  // grain
  x.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = rnd() > 0.5 ? "#fff" : "#000";
    x.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  x.globalAlpha = 1;

  return c.toDataURL("image/jpeg", 0.86);
}

const ARTS = PALETTES.map((p, i) => makeArt(p, 1000 + i * 977));

/* ---------------- state rendering ---------------- */

let atom = 0;      // which item is the focused atom
let stateIdx = 3;  // start at CARD — the unit of attention

const idx = (k) => (atom + k + N) % N;
const item = (k) => ITEMS[idx(k)];

const art = (k, cls, clickable) =>
  `<img class="fl art ${cls}" data-flip-id="img-${idx(k)}" src="${ARTS[idx(k)]}" alt="${item(k).title}"${clickable ? ` data-item="${idx(k)}"` : ""}>`;
const ttl = (k, cls) =>
  `<h2 class="fl ttl ${cls}" data-flip-id="ttl-${idx(k)}">${item(k).title}</h2>`;
const bod = (k, cls) =>
  `<p class="fl bod ${cls}" data-flip-id="bod-${idx(k)}">${item(k).blurb}</p>`;
const cta = (k, cls) =>
  `<button class="fl cta ${cls}" data-flip-id="cta-${idx(k)}" data-item="${idx(k)}">Learn more</button>`;

const RENDER = {
  icon: () => `<div class="lay lay-icon">${art(0, "a-icon")}</div>`,

  label: () => `<div class="lay lay-label">${art(0, "a-label")}<div class="meta">${ttl(0, "t-label")}</div></div>`,

  snippet: () => `<div class="lay lay-snippet">${art(0, "a-snippet")}
    <div class="meta">${ttl(0, "t-snippet")}${bod(0, "b-snippet")}${cta(0, "c-md")}</div></div>`,

  card: () => `<div class="lay lay-card">
    <div class="fl surface srf-card" data-flip-id="srf-${idx(0)}">${art(0, "a-card")}
      <div class="meta">${ttl(0, "t-card")}${bod(0, "b-card")}${cta(0, "c-md")}</div></div></div>`,

  list: () => `<div class="lay lay-list">${[0, 1, 2].map((k) =>
    `<div class="fl surface srf-row" data-flip-id="srf-${idx(k)}">${art(k, "a-row", true)}
      <div class="meta">${ttl(k, "t-row")}${cta(k, "c-sm")}</div></div>`).join("")}</div>`,

  grid: () => `<div class="lay lay-grid">${[0, 1, 2, 3].map((k) =>
    `<div class="fl surface srf-cell" data-flip-id="srf-${idx(k)}">${art(k, "a-cell", true)}
      <div class="meta">${ttl(k, "t-cell")}${cta(k, "c-sm")}</div></div>`).join("")}</div>`,

  carousel: () => `<div class="lay lay-carousel">${[-2, -1, 0, 1, 2].map((k) =>
    `<div class="car-cell">${art(k, "a-carousel", true)}${ttl(k, "t-carousel")}${cta(k, "c-sm")}</div>`).join("")}</div>`,

  hero: () => `<div class="lay lay-hero">${art(0, "a-hero")}${ttl(0, "t-hero")}</div>`,

  article: () => `<div class="lay lay-article"><div class="article">
    ${ttl(0, "t-headline")}
    ${bod(0, "lead")}
    ${art(0, "a-artfull")}
    <p class="para">${PARAS[0]}</p>
    <p class="para">${PARAS[1]}</p>
    <div class="pair">${art(1, "a-pair", true)}${art(2, "a-pair", true)}</div>
    <p class="para">${PARAS[2]}</p>
  </div></div>`,
};

/* ---------------- transitions ---------------- */

const stage = document.getElementById("stage");
const ghosts = document.getElementById("ghosts");

function goTo(next, rotate = 0) {
  const prevEls = [...stage.querySelectorAll(".fl")];
  const flipState = prevEls.length
    ? Flip.getState(prevEls, { props: "borderRadius,fontSize" })
    : null;
  const oldRects = new Map(prevEls.map((el) => [el.dataset.flipId, el.getBoundingClientRect()]));

  atom = (atom + rotate + N) % N;
  stateIdx = next;
  stage.innerHTML = RENDER[STATES[next].key]();

  const newIds = new Set([...stage.querySelectorAll(".fl")].map((el) => el.dataset.flipId));

  // elements that leave: ghost them out in place
  if (!REDUCED) {
    for (const el of prevEls) {
      const id = el.dataset.flipId;
      if (newIds.has(id)) continue;
      // skip children of a leaving surface that ghosts as a whole
      const parentSrf = el.parentElement?.closest(".fl");
      if (parentSrf && !newIds.has(parentSrf.dataset.flipId)) continue;
      const r = oldRects.get(id);
      const g = el.cloneNode(true);
      g.querySelectorAll(".fl").forEach((c) => c.classList.remove("fl"));
      g.classList.add("ghost");
      g.style.cssText += `;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;`;
      ghosts.appendChild(g);
      gsap.to(g, { opacity: 0, filter: "blur(6px)", duration: 0.32, ease: "power1.out", onComplete: () => g.remove() });
    }
  }

  if (flipState) {
    Flip.from(flipState, {
      targets: "#stage .fl",
      duration: DUR,
      ease: "power3.inOut",
      absolute: true,
      nested: true,
      props: "borderRadius,fontSize",
      onEnter: (els) =>
        gsap.fromTo(els,
          { opacity: 0, y: 14, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: REDUCED ? 0 : 0.55, delay: DUR * 0.35, stagger: 0.05, ease: "power2.out", clearProps: "filter" }),
    });
  }

  // article paragraphs are not flipped — soft cascade
  const paras = stage.querySelectorAll(".para");
  if (paras.length && !REDUCED) {
    gsap.fromTo(paras, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: DUR * 0.4, stagger: 0.08, ease: "power2.out" });
  }

  updateHUD();
}

const next = () => (stateIdx === STATES.length - 1 ? goTo(0, +1) : goTo(stateIdx + 1));
const prev = () => (stateIdx === 0 ? goTo(STATES.length - 1, -1) : goTo(stateIdx - 1));

/* promote an item to atom and jump to a state */
function promote(itemIdx, target) {
  goTo(target, (itemIdx - atom + N) % N);
}

/* ---------------- HUD ---------------- */

const stepper = document.getElementById("stepper");
const readout = document.getElementById("readout");

STATES.forEach((s, i) => {
  const b = document.createElement("button");
  b.className = "step";
  b.textContent = s.key;
  b.addEventListener("click", () => { stopAuto(); goTo(i); });
  stepper.appendChild(b);
});

function updateHUD() {
  [...stepper.children].forEach((b, i) => b.classList.toggle("active", i === stateIdx));
  const pct = Math.round(((STATES.length - 1 - stateIdx) / (STATES.length - 1)) * 100);
  readout.innerHTML = `<b>${STATES[stateIdx].key}</b> — ${STATES[stateIdx].hint} · ${pct}%`;
}

/* ---------------- controls ---------------- */

document.getElementById("next").addEventListener("click", () => { stopAuto(); next(); });
document.getElementById("prev").addEventListener("click", () => { stopAuto(); prev(); });

addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { stopAuto(); next(); }
  if (e.key === "ArrowLeft") { stopAuto(); prev(); }
});

stage.addEventListener("click", (e) => {
  const t = e.target;
  if (!t.dataset || t.dataset.item === undefined) return;
  stopAuto();
  const i = +t.dataset.item;
  if (t.classList.contains("cta")) promote(i, 8);       // learn more = decompress
  else if (t.classList.contains("art")) promote(i, 3);  // pick a work = its card
});

/* auto loop — opt-in, like the reference film */
const autoBtn = document.getElementById("auto");
let autoCall = null;

function schedule() {
  autoCall = gsap.delayedCall(STATES[stateIdx].dwell + DUR, () => { next(); schedule(); });
}
function startAuto() {
  autoBtn.setAttribute("aria-pressed", "true");
  schedule();
}
function stopAuto() {
  if (!autoCall) return;
  autoCall.kill();
  autoCall = null;
  autoBtn.setAttribute("aria-pressed", "false");
}
autoBtn.addEventListener("click", () => (autoCall ? stopAuto() : startAuto()));

/* ---------------- boot ---------------- */

stage.innerHTML = RENDER[STATES[stateIdx].key]();
updateHUD();
