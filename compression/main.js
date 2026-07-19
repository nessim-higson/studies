/* COMPRESSION — one work, nine states of reveal
   One content atom morphs through canonical display patterns.
   The image persists; text layers reveal; the item multiplies.

   Fluidity architecture:
   - every image / title / body / CTA / surface is ONE persistent node,
     reparented between states (no re-decode, no re-creation churn)
   - a single master timeline per transition; a new step snaps the
     previous one to its end before starting (interruption-safe)
   - only images + surfaces FLIP-morph; text morphs position but
     crossfades when its font-size jumps; no fontSize tweening
   - no blur filters on images (only on small text) */

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

  x.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = rnd() > 0.5 ? "#fff" : "#000";
    x.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  x.globalAlpha = 1;

  return c.toDataURL("image/jpeg", 0.86);
}

const ARTS = PALETTES.map((p, i) => makeArt(p, 1000 + i * 977));

/* ---------------- persistent nodes ---------------- */

function h(tag, cls, ...kids) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const k of kids) if (k != null) el.append(k);
  return el;
}

const bench = h("div");
bench.style.display = "none";
document.body.append(bench);

const NODES = ITEMS.map((it, i) => {
  const img = h("img", "art");
  img.src = ARTS[i];
  img.alt = it.title;
  img.dataset.flipId = `img-${i}`;
  img.dataset.item = i;
  img.draggable = false;

  const ttl = h("h2", "ttl", it.title);
  ttl.dataset.flipId = `ttl-${i}`;

  const bod = h("p", "bod", it.blurb);
  bod.dataset.flipId = `bod-${i}`;

  const cta = h("button", "cta", "Learn more");
  cta.dataset.flipId = `cta-${i}`;
  cta.dataset.item = i;

  const srf = h("div", "surface");
  srf.dataset.flipId = `srf-${i}`;

  const all = [img, ttl, bod, cta, srf];
  bench.append(...all);
  return { img, ttl, bod, cta, srf, all };
});

/* ---------------- state assembly ---------------- */

let atom = 0;      // which item is the focused atom
let stateIdx = 3;  // start at CARD — the unit of attention

const idx = (k) => (atom + k + N) % N;
const nd = (k) => NODES[idx(k)];

/* set a node's state class and return it */
const use = (el, cls) => { el.className = cls; return el; };

const img = (k, c) => use(nd(k).img, `art ${c}`);
const ttl = (k, c) => use(nd(k).ttl, `ttl ${c}`);
const bod = (k, c) => use(nd(k).bod, `bod ${c}`);
const cta = (k, c) => use(nd(k).cta, `cta ${c}`);

function srf(k, c, ...kids) {
  const s = use(nd(k).srf, `surface ${c}`);
  s.replaceChildren(...kids);
  return s;
}

const para = (t) => h("p", "para", t);

const BUILD = {
  icon: () => h("div", "lay lay-icon", img(0, "a-icon")),

  label: () => h("div", "lay lay-label",
    img(0, "a-label"),
    h("div", "meta", ttl(0, "t-label"))),

  snippet: () => h("div", "lay lay-snippet",
    img(0, "a-snippet"),
    h("div", "meta", ttl(0, "t-snippet"), bod(0, "b-snippet"), cta(0, "c-md"))),

  card: () => h("div", "lay lay-card",
    srf(0, "srf-card",
      img(0, "a-card"),
      h("div", "meta", ttl(0, "t-card"), bod(0, "b-card"), cta(0, "c-md")))),

  list: () => h("div", "lay lay-list",
    ...[0, 1, 2].map((k) =>
      srf(k, "srf-row",
        img(k, "a-row"),
        h("div", "meta", ttl(k, "t-row"), cta(k, "c-sm"))))),

  grid: () => h("div", "lay lay-grid",
    ...[0, 1, 2, 3].map((k) =>
      srf(k, "srf-cell",
        img(k, "a-cell"),
        h("div", "meta", ttl(k, "t-cell"), cta(k, "c-sm"))))),

  carousel: () => h("div", "lay lay-carousel",
    ...[-2, -1, 0, 1, 2].map((k) =>
      h("div", "car-cell", img(k, "a-carousel"), ttl(k, "t-carousel"), cta(k, "c-sm")))),

  hero: () => h("div", "lay lay-hero", img(0, "a-hero"), ttl(0, "t-hero")),

  article: () => h("div", "lay lay-article",
    h("div", "article",
      ttl(0, "t-headline"),
      bod(0, "lead"),
      img(0, "a-artfull"),
      para(PARAS[0]),
      para(PARAS[1]),
      h("div", "pair", img(1, "a-pair"), img(2, "a-pair")),
      para(PARAS[2]))),
};

/* ---------------- transitions ----------------
   Every transition runs in a fixed-position morph layer: the outgoing
   scene's elements are lifted out of layout at their measured viewport
   rects and tweened numerically to the incoming scene's measured rects.
   Layout never participates mid-flight, so nothing can wobble or snap.
   The real (static) layout mounts hidden and is revealed at landing. */

const stage = document.getElementById("stage");
const mlayer = document.getElementById("ghosts");

let activeTL = null;

function fixAt(n, r, z) {
  n.style.position = "fixed";
  n.style.left = r.left + "px";
  n.style.top = r.top + "px";
  n.style.width = r.width + "px";
  n.style.height = r.height + "px";
  n.style.margin = "0";
  n.style.zIndex = z;
}

const zOf = (n) => (n.classList.contains("surface") ? 1 : n.classList.contains("art") ? 2 : 3);

const unfix = (n) =>
  gsap.set(n, { clearProps: "position,left,top,width,height,margin,zIndex,opacity,transform,borderRadius,filter" });

function goTo(next, rotate = 0) {
  if (next === stateIdx && rotate === 0 && stage.firstChild) return;

  // interruption-safe: land the previous transition before starting
  if (activeTL) { activeTL.progress(1).kill(); activeTL = null; }

  // ---- capture the outgoing scene (rect, radius, font, class per node)
  const oldNodes = [...stage.querySelectorAll("[data-flip-id]")];
  const animate = oldNodes.length > 0 && !REDUCED;
  const oldRect = new Map(), oldRad = new Map(), oldFS = new Map(), oldCls = new Map();
  for (const n of oldNodes) {
    const cs = getComputedStyle(n);
    const id = n.dataset.flipId;
    oldRect.set(id, n.getBoundingClientRect());
    oldRad.set(id, parseFloat(cs.borderTopLeftRadius) || 0);
    oldFS.set(id, parseFloat(cs.fontSize));
    oldCls.set(id, n.className);
  }

  // free text (article paragraphs) leaves in place, faded
  const leaveExtras = [];
  if (animate) {
    for (const p of [...stage.querySelectorAll(".para")]) {
      const r = p.getBoundingClientRect();
      mlayer.append(p);
      fixAt(p, r, 3);
      leaveExtras.push(p);
    }
  }

  atom = (atom + rotate + N) % N;
  stateIdx = next;

  // ---- mount the incoming scene hidden, measure everything
  const lay = BUILD[STATES[next].key]();
  stage.replaceChildren(lay);
  if (animate) lay.style.visibility = "hidden";

  const newNodes = [...stage.querySelectorAll("[data-flip-id]")];
  const leaving = oldNodes.filter((n) => !stage.contains(n));

  if (!animate) {
    for (const it of NODES) for (const n of it.all) if (!stage.contains(n)) bench.append(n);
    mlayer.replaceChildren();
    updateHUD();
    return;
  }

  const morph = [], enter = [], xfades = [];
  const newRect = new Map(), newRad = new Map();
  for (const n of newNodes) {
    const id = n.dataset.flipId;
    newRect.set(id, n.getBoundingClientRect());
    newRad.set(id, parseFloat(getComputedStyle(n).borderTopLeftRadius) || 0);
    if (!oldRect.has(id)) { enter.push(n); continue; }
    const isBox = n.classList.contains("art") || n.classList.contains("surface");
    if (!isBox) {
      const a = oldFS.get(id), b = parseFloat(getComputedStyle(n).fontSize);
      // big type jumps read better as a crossfade than a snapped morph
      if (a && b && Math.max(a, b) / Math.min(a, b) > 1.25) {
        enter.push(n);
        const c = document.createElement(n.tagName);
        c.className = oldCls.get(id);
        c.textContent = n.textContent;
        xfades.push(c);
        mlayer.append(c);
        fixAt(c, oldRect.get(id), 3);
        continue;
      }
    }
    morph.push(n);
  }

  // ---- lift the players into the morph layer
  const placeholders = [];
  for (const n of [...morph, ...enter]) {
    const ph = document.createComment("slot");
    n.replaceWith(ph);
    placeholders.push([n, ph]);
    mlayer.append(n);
    const id = n.dataset.flipId;
    fixAt(n, morph.includes(n) ? oldRect.get(id) : newRect.get(id), zOf(n));
    if (morph.includes(n)) n.style.borderRadius = oldRad.get(id) + "px";
    else n.style.opacity = 0;
  }
  for (const n of leaving) {
    mlayer.append(n);
    fixAt(n, oldRect.get(n.dataset.flipId), zOf(n));
  }

  // ---- one timeline, viewport-space only
  const tl = gsap.timeline({ onComplete: () => { activeTL = null; } });

  for (const n of morph) {
    const id = n.dataset.flipId;
    const r = newRect.get(id);
    tl.to(n, {
      left: r.left, top: r.top, width: r.width, height: r.height,
      borderRadius: newRad.get(id),
      duration: DUR, ease: "power3.inOut",
    }, 0);
  }
  for (const n of [...leaving, ...xfades])
    tl.to(n, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0);
  for (const p of leaveExtras)
    tl.to(p, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0);

  const eBoxes = enter.filter((n) => n.classList.contains("art") || n.classList.contains("surface"));
  const eText = enter.filter((n) => !eBoxes.includes(n));
  if (eBoxes.length)
    tl.fromTo(eBoxes,
      { opacity: 0, y: 14, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" },
      DUR * 0.35);
  if (eText.length)
    tl.fromTo(eText,
      { opacity: 0, y: 10, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, stagger: 0.04, ease: "power2.out" },
      DUR * 0.42);

  // ---- land: reveal the real layout and slot everything home
  const paras = [...stage.querySelectorAll(".para")];
  paras.forEach((p) => (p.style.opacity = 0));

  tl.call(() => {
    lay.style.visibility = "";
    for (const [n, ph] of placeholders) { ph.replaceWith(n); unfix(n); }
    for (const n of leaving) { unfix(n); bench.append(n); }
    xfades.forEach((c) => c.remove());
    leaveExtras.forEach((p) => p.remove());
    mlayer.replaceChildren();
    for (const it of NODES) for (const n of it.all) if (!stage.contains(n)) bench.append(n);
  }, [], tl.duration());

  if (paras.length)
    tl.fromTo(paras,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", clearProps: "opacity,transform" },
      ">0.02");

  activeTL = tl;
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
  const i = +t.dataset.item;
  if (t.classList.contains("cta")) { stopAuto(); promote(i, 8); }        // learn more = decompress
  else if (t.classList.contains("art") && [4, 5, 6].includes(stateIdx)) { // pick a work = its card
    stopAuto(); promote(i, 3);
  }
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

goTo(stateIdx); // boot renders statically — no old scene, nothing animates
