/* COMPRESSION 003 — ALTITUDE
   Semantic zoom over an editorial terrain. One continuous zoom scalar
   z ∈ [0,5] spans six altitude bands:

     0 FIELD    six works as icons, scattered
     1 LABELS   names decode in beneath them
     2 GRID     surfaces form, the field organizes
     3 CARD     the aimed work commits; siblings fall to a rail
     4 HERO     one thing, fully
     5 ARTICLE  street level

   Every band is typeset naturally and measured at boot; the frame is a
   pure function of z — geometry lerped between measured rects, presence
   handled by decode/fade windows — so the scrub is exact both ways.
   Scroll or pinch to change altitude; the cursor aims the descent. */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- content + artwork (from 001) ---------------- */

const ITEMS = [
  { title: "Harbor, first light", blurb: "Painted in the twenty minutes before the ferries woke. The water held more color than the sky." },
  { title: "A field, remembered", blurb: "Less a place than the feeling of one — pink heat, green shade, a sun refusing to set." },
  { title: "Nocturne in umber", blurb: "Almost nothing: a dark sea, a darker sky, one patient light on the horizon." },
  { title: "Cloud study no. 4", blurb: "Twelve minutes of weather, caught before it became a different painting." },
  { title: "The green cove", blurb: "Where the land leans in and the water goes quiet. Painted from the rocks, knees wet." },
  { title: "Lavender hour", blurb: "The eight minutes after sunset when every shadow agrees on a color." },
];
const PARAS = [
  "A painting doesn't change size; the attention around it does. This page treats layout the same way — the work stays still while the frame breathes.",
  "Compression is not loss. The icon state knows everything the article knows. It has simply chosen what to say first.",
];
const N = ITEMS.length;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { bg: ["#8fb3d9", "#33567e"], bands: [
    { y0: 0.00, y1: 0.42, colors: ["#7fa8d9", "#a9c6e8", "#5d82b3", "#c9dcf0"], angle: 0.1, drift: 0.5 },
    { y0: 0.38, y1: 0.70, colors: ["#274690", "#2e6f8e", "#3a7ca5", "#1d3a6e"], angle: 0.0, drift: 0.2 },
    { y0: 0.66, y1: 1.00, colors: ["#2e6f5e", "#1f4d42", "#3d8a70", "#173a52"], angle: 0.15, drift: 0.4 },
  ], sun: { x: 0.30, y: 0.30, r: 0.10, color: "#f2c14e" } },
  { bg: ["#f4a8bd", "#e0764e"], bands: [
    { y0: 0.00, y1: 0.50, colors: ["#f49bb5", "#f7b8c9", "#ef7fa5", "#f58f5d"], angle: 0.05, drift: 0.6 },
    { y0: 0.45, y1: 0.72, colors: ["#f58f5d", "#e86a4a", "#f7a96e", "#d95a8a"], angle: 0.0, drift: 0.3 },
    { y0: 0.68, y1: 1.00, colors: ["#2e8b57", "#1e6e42", "#48a06b", "#175c38"], angle: 0.35, drift: 0.7 },
  ], sun: { x: 0.52, y: 0.40, r: 0.15, color: "#f9d423" } },
  { bg: ["#2b2d38", "#16171e"], bands: [
    { y0: 0.00, y1: 0.55, colors: ["#23252f", "#2f3140", "#3a3347", "#1b1c24"], angle: 0.05, drift: 0.3 },
    { y0: 0.50, y1: 1.00, colors: ["#16171e", "#232838", "#2c2530", "#101116"], angle: 0.0, drift: 0.15 },
  ], sun: { x: 0.68, y: 0.52, r: 0.045, color: "#e8e2cf" } },
  { bg: ["#3b5ba5", "#26406e"], bands: [
    { y0: 0.00, y1: 0.55, colors: ["#f2f4f7", "#d7e0ee", "#b9c9e2", "#4a6ab0"], angle: 0.2, drift: 0.9 },
    { y0: 0.45, y1: 1.00, colors: ["#3b5ba5", "#2c4a8c", "#54719f", "#22386a"], angle: 0.1, drift: 0.5 },
  ], sun: null },
  { bg: ["#f2b8c6", "#2e7d5b"], bands: [
    { y0: 0.00, y1: 0.38, colors: ["#f2b8c6", "#f6d0da", "#e895ae", "#f0c983"], angle: 0.05, drift: 0.5 },
    { y0: 0.34, y1: 0.68, colors: ["#2e8b6e", "#3ba97e", "#1f6e52", "#7fc9a0"], angle: 0.3, drift: 0.6 },
    { y0: 0.64, y1: 1.00, colors: ["#1d5c46", "#174a38", "#2e7d5b", "#0f3a2c"], angle: 0.1, drift: 0.3 },
  ], sun: { x: 0.46, y: 0.24, r: 0.09, color: "#f6d365" } },
  { bg: ["#b3a5d6", "#6e5a8e"], bands: [
    { y0: 0.00, y1: 0.48, colors: ["#9b8bc4", "#b8abda", "#8672ae", "#e8b4a0"], angle: 0.08, drift: 0.5 },
    { y0: 0.44, y1: 0.75, colors: ["#6e5a8e", "#8672ae", "#5a4676", "#c4938f"], angle: 0.0, drift: 0.3 },
    { y0: 0.70, y1: 1.00, colors: ["#4a3a62", "#3a2d4e", "#5a4676", "#2e2440"], angle: 0.12, drift: 0.35 },
  ], sun: { x: 0.74, y: 0.38, r: 0.06, color: "#f5c9a4" } },
];

function makeArt(pal, seed) {
  const W = 640, H = 480;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  const rnd = mulberry32(seed);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.bg[0]); g.addColorStop(1, pal.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.lineCap = "round";
  if (pal.sun) {
    const s = pal.sun;
    const rg = x.createRadialGradient(s.x * W, s.y * H, 2, s.x * W, s.y * H, s.r * W * 2.6);
    rg.addColorStop(0, s.color); rg.addColorStop(1, "rgba(255,255,255,0)");
    x.globalAlpha = 0.9; x.fillStyle = rg; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
  }
  for (const band of pal.bands) for (let i = 0; i < 620; i++) {
    const px = rnd() * W, py = (band.y0 + rnd() * (band.y1 - band.y0)) * H;
    const wob = Math.sin(px * 0.013 + py * 0.021 + seed) * band.drift;
    const a = band.angle + wob * 0.8 + (rnd() - 0.5) * 0.25;
    const len = 12 + rnd() * 34;
    x.strokeStyle = band.colors[(rnd() * band.colors.length) | 0];
    x.globalAlpha = 0.35 + rnd() * 0.55;
    x.lineWidth = 4 + rnd() * 9;
    x.beginPath();
    x.moveTo(px - Math.cos(a) * len / 2, py - Math.sin(a) * len / 2);
    x.lineTo(px + Math.cos(a) * len / 2, py + Math.sin(a) * len / 2);
    x.stroke();
  }
  if (pal.sun) {
    const s = pal.sun;
    for (let i = 0; i < 60; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * s.r * W * 0.8;
      x.strokeStyle = s.color; x.globalAlpha = 0.5 + rnd() * 0.4; x.lineWidth = 5 + rnd() * 8;
      const px = s.x * W + Math.cos(a) * d, py = s.y * H + Math.sin(a) * d * 0.9;
      const len = 6 + rnd() * 14;
      x.beginPath(); x.moveTo(px - len / 2, py); x.lineTo(px + len / 2, py); x.stroke();
    }
  }
  x.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) { x.fillStyle = rnd() > 0.5 ? "#fff" : "#000"; x.fillRect(rnd() * W, rnd() * H, 1.4, 1.4); }
  return c.toDataURL("image/jpeg", 0.86);
}

const ARTS = PALETTES.map((p, i) => makeArt(p, 1000 + i * 977));

/* ---------------- scene builders (measured hidden, never shown) ---------------- */

const stage = document.getElementById("stage");
const field = document.getElementById("field");
const meas = document.getElementById("measure");

const SCATTER = [
  [0.20, 0.26], [0.52, 0.16], [0.80, 0.32],
  [0.30, 0.66], [0.60, 0.72], [0.84, 0.66],
];

const el = (tag, cls, style, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (style) e.style.cssText = style;
  if (text != null) e.textContent = text;
  return e;
};

/* each builder appends [data-key] placeholders into a .scene root */
function buildScene(s, atom) {
  const W = meas.clientWidth, H = meas.clientHeight;
  const root = el("div", "scene");
  const add = (node, key) => { node.dataset.key = key; root.append(node); return node; };
  const railX = 30, railGap = 12, railSize = 30;
  const others = [...Array(N).keys()].filter((i) => i !== atom);

  if (s === 0) {
    SCATTER.forEach(([fx, fy], i) =>
      add(el("div", "ph-img", `left:${fx * W - 32}px;top:${fy * H - 32}px;width:64px;height:64px;border-radius:16px;`), `img-${i}`));
  }

  if (s === 1) {
    SCATTER.forEach(([fx, fy], i) => {
      const cx = (0.5 + (fx - 0.5) * 0.88) * W, cy = (0.5 + (fy - 0.5) * 0.82) * H;
      add(el("div", "ph-img", `left:${cx - 46}px;top:${cy - 46}px;width:92px;height:92px;border-radius:21px;`), `img-${i}`);
      add(el("div", "ph-ttl", `left:${cx - 75}px;top:${cy + 56}px;width:150px;font-size:11.5px;line-height:1.35;text-align:center;`, ITEMS[i].title), `ttl-${i}`);
    });
  }

  if (s === 2) {
    const cw = 306, ch = 84, gx = 16, gy = 14;
    const x0 = (W - (cw * 2 + gx)) / 2, y0 = (H - (ch * 3 + gy * 2)) / 2;
    for (let i = 0; i < N; i++) {
      const col = i % 2, row = (i / 2) | 0;
      const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
      const srf = add(el("div", "ph-srf", `left:${x}px;top:${y}px;width:${cw}px;height:${ch}px;border-radius:14px;display:flex;align-items:center;gap:14px;padding:12px;`), `srf-${i}`);
      const img = el("div", "ph-img", `position:static;width:58px;height:58px;border-radius:11px;flex:0 0 auto;`);
      img.dataset.key = `img-${i}`;
      const ttl = el("div", "ph-ttl", `position:static;font-size:12.5px;line-height:1.3;`, ITEMS[i].title);
      ttl.dataset.key = `ttl-${i}`;
      srf.append(img, ttl);
    }
  }

  if (s >= 3) {
    // sibling rail, constant across the committed bands
    others.forEach((i, k) => {
      const y = H / 2 + (k - (others.length - 1) / 2) * (railSize + railGap);
      add(el("div", "ph-img", `left:${railX - railSize / 2}px;top:${y - railSize / 2}px;width:${railSize}px;height:${railSize}px;border-radius:8px;`), `img-${i}`);
    });
  }

  if (s === 3) {
    const card = el("div", "ph-srf", `left:50%;top:50%;transform:translate(-50%,-50%);width:min(640px,72vw);border-radius:20px;display:flex;align-items:stretch;gap:24px;padding:16px;`);
    card.dataset.key = `srf-${atom}`;
    const img = el("div", "ph-img", `position:static;width:46%;height:216px;border-radius:12px;flex:0 0 auto;`);
    img.dataset.key = `img-${atom}`;
    const metaBox = el("div", "", `display:flex;flex-direction:column;justify-content:center;gap:11px;padding-right:16px;`);
    const ttl = el("div", "ph-ttl", `position:static;font-size:17px;line-height:1.25;`, ITEMS[atom].title);
    ttl.dataset.key = `ttl-${atom}`;
    const bod = el("div", "ph-txt", `position:static;font-size:12px;line-height:1.6;`, ITEMS[atom].blurb);
    bod.dataset.key = "bod";
    metaBox.append(ttl, bod);
    card.append(img, metaBox);
    root.append(card);
  }

  if (s === 4) {
    const w = Math.min(700, W * 0.68), h = Math.min(H * 0.62, 420);
    add(el("div", "ph-img", `left:${(W - w) / 2}px;top:${(H - h) / 2 - 22}px;width:${w}px;height:${h}px;border-radius:18px;`), `img-${atom}`);
    add(el("div", "ph-ttl", `left:${W / 2 - 200}px;top:${(H + h) / 2 - 2}px;width:400px;font-size:13.5px;text-align:center;`, ITEMS[atom].title), `ttl-${atom}`);
  }

  if (s === 5) {
    const col = el("div", "", `position:absolute;left:50%;top:18px;transform:translateX(-50%);width:min(620px,72vw);display:flex;flex-direction:column;gap:18px;`);
    const ttl = el("div", "ph-ttl", `position:static;font-size:26px;letter-spacing:-0.02em;line-height:1.15;`, ITEMS[atom].title);
    ttl.dataset.key = `ttl-${atom}`;
    const bod = el("div", "ph-txt", `position:static;font-size:14.5px;line-height:1.6;color:#4a4842;`, ITEMS[atom].blurb);
    bod.dataset.key = "bod";
    const img = el("div", "ph-img", `position:static;width:100%;height:250px;border-radius:14px;`);
    img.dataset.key = `img-${atom}`;
    const p0 = el("div", "ph-txt", `position:static;font-size:13px;line-height:1.7;max-width:540px;`, PARAS[0]);
    p0.dataset.key = "para-0";
    const p1 = el("div", "ph-txt", `position:static;font-size:13px;line-height:1.7;max-width:540px;`, PARAS[1]);
    p1.dataset.key = "para-1";
    col.append(ttl, bod, img, p0, p1);
    root.append(col);
  }

  return root;
}

function measureScene(s, atom) {
  const root = buildScene(s, atom);
  meas.replaceChildren(root);
  const base = meas.getBoundingClientRect();
  const out = {};
  for (const node of root.querySelectorAll("[data-key]")) {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    out[node.dataset.key] = {
      x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height,
      fs: parseFloat(cs.fontSize), color: cs.color,
      rad: parseFloat(cs.borderTopLeftRadius) || 0,
      align: cs.textAlign,
    };
  }
  meas.replaceChildren();
  return out;
}

/* scene cache: 0-2 shared, 3-5 keyed by atom; keyed by stage size so a
   scene measured mid-resize can never serve stale geometry */
const cache = new Map();
function scene(s, atom) {
  const dim = `${meas.clientWidth}x${meas.clientHeight}`;
  const key = (s < 3 ? `s${s}` : `s${s}-a${atom}`) + "@" + dim;
  if (!cache.has(key)) cache.set(key, measureScene(s, atom));
  return cache.get(key);
}

/* ---------------- live cells ---------------- */

const cells = new Map();
function cellFor(key) {
  if (cells.has(key)) return cells.get(key);
  let c;
  if (key.startsWith("img-")) {
    c = el("img", "cel");
    c.src = ARTS[+key.slice(4)];
    c.alt = ITEMS[+key.slice(4)].title;
    c.draggable = false;
    c.dataset.item = key.slice(4);
    c.style.boxShadow = "0 10px 28px rgba(30,28,20,.08), 0 2px 8px rgba(30,28,20,.04)";
    c.style.zIndex = 2;
  } else if (key.startsWith("srf-")) {
    c = el("div", "cel");
    c.style.background = "#fff";
    c.style.boxShadow = "0 18px 44px rgba(30,28,20,.09), 0 3px 10px rgba(30,28,20,.04)";
    c.style.zIndex = 1;
  } else {
    c = el("div", "cel cel-txt");
    c.style.zIndex = 3;
    if (key.startsWith("ttl-")) { c.style.fontWeight = 600; c.style.letterSpacing = "-0.015em"; }
    c.__text = key.startsWith("ttl-") ? ITEMS[+key.slice(4)].title
      : key === "bod" ? "" : PARAS[+key.slice(5)];
  }
  field.append(c);
  cells.set(key, c);
  return c;
}

/* ---------------- render: the frame is a pure function of z ---------------- */

const BANDS = ["field", "labels", "grid", "card", "hero", "article"];
const GLYPHS = "aceimnorstuvxz·";
const rndG = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const lerp = (a, b, t) => a + (b - a) * t;
const easeQ = (q) => q * q * (3 - 2 * q); // smoothstep

let atom = 0, zPrev = 0, candidate = 0;

function decodeText(full, d) {
  if (d >= 0.995) return full;
  const real = Math.max(0, Math.floor(d * full.length));
  return real >= full.length ? full : full.slice(0, real) + rndG();
}

function applyGeom(c, g) {
  c.style.left = g.x + "px";
  c.style.top = g.y + "px";
  c.style.width = g.w + "px";
  c.style.height = g.h + "px";
  if (g.rad) c.style.borderRadius = g.rad + "px";
  if (g.fs) c.style.fontSize = g.fs + "px";
  if (g.color) c.style.color = g.color;
  if (g.align) c.style.textAlign = g.align;
}

function mix(a, b, t) {
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t),
    rad: lerp(a.rad, b.rad, t), fs: lerp(a.fs, b.fs, t),
    color: gsap.utils.interpolate(a.color, b.color)(t),
    align: t < 0.5 ? a.align : b.align,
  };
}

function render(z) {
  z = gsap.utils.clamp(0, 5, z);
  const s = Math.min(4, Math.floor(z));
  const q = z - s;
  const e = easeQ(q);

  // atom commitment: aim while above the grid, lock crossing into card
  if (zPrev < 2.5 && z >= 2.5) atom = candidate;
  zPrev = z;

  const A = scene(s, atom), B = scene(s + 1, atom);
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);

  const bodText = ITEMS[atom].blurb;

  for (const [key, c] of cells) if (!keys.has(key)) c.style.opacity = 0;

  for (const key of keys) {
    const a = A[key], b = B[key];
    const c = cellFor(key);
    const isText = !key.startsWith("img-") && !key.startsWith("srf-");
    const full = key === "bod" ? bodText : c.__text;

    if (a && b) {
      applyGeom(c, mix(a, b, e));
      c.style.opacity = 1;
      if (isText && c.textContent !== full) c.textContent = full;
    } else if (a && !b) {
      if (q >= 0.4) { c.style.opacity = 0; continue; }
      const d = 1 - q / 0.4;
      applyGeom(c, a);
      c.style.opacity = isText ? Math.min(1, d + 0.2) : d;
      if (isText) c.textContent = key.startsWith("para") ? full : decodeText(full, d);
    } else {
      if (q <= 0.55) { c.style.opacity = 0; continue; }
      const d = (q - 0.55) / 0.45;
      applyGeom(c, b);
      c.style.opacity = isText ? Math.min(1, d * 1.5 + 0.15) : d;
      if (isText) c.textContent = key.startsWith("para") ? full : decodeText(full, d);
    }
  }

  updateHUD(z);
}

/* ---------------- HUD ---------------- */

const altimeter = document.getElementById("altimeter");
const readout = document.getElementById("readout");
const hint = document.getElementById("hint");

BANDS.forEach((b, i) => {
  const btn = el("button", "band", "", b);
  btn.addEventListener("click", () => flyTo(i));
  altimeter.append(btn);
});

function updateHUD(z) {
  const nearest = Math.round(z);
  [...altimeter.children].forEach((b, i) => b.classList.toggle("active", i === nearest));
  const aim = z < 2.5 ? `aiming ${ITEMS[candidate].title}` : ITEMS[atom].title;
  readout.innerHTML = `alt ${z.toFixed(1)} · <b>${BANDS[nearest]}</b> · ${aim}`;
}

/* ---------------- input ---------------- */

const state = { z: 0 };
let zTarget = 0;

function goZ(t, dur = 0.5) {
  zTarget = gsap.utils.clamp(0, 5, t);
  hint.classList.add("gone");
  if (REDUCED) { state.z = zTarget; render(state.z); return; }
  gsap.to(state, { z: zTarget, duration: dur, ease: "power3.out", overwrite: true, onUpdate: () => render(state.z) });
}
const flyTo = (band) => goZ(band, 0.9);

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  goZ(zTarget + e.deltaY * (e.ctrlKey ? 0.004 : 0.0016), 0.4);
}, { passive: false });

let dragY = null;
stage.addEventListener("pointerdown", (e) => { dragY = e.clientY; });
addEventListener("pointermove", (e) => {
  if (dragY != null && e.buttons) {
    goZ(zTarget - (e.clientY - dragY) * 0.006, 0.2);
    dragY = e.clientY;
  }
  // aiming: nearest work to the cursor, while above commitment
  if (state.z < 2.5) {
    const r = field.getBoundingClientRect();
    let best = 1e9;
    for (let i = 0; i < N; i++) {
      const c = cells.get(`img-${i}`);
      if (!c) continue;
      const cx = r.left + parseFloat(c.style.left) + parseFloat(c.style.width) / 2;
      const cy = r.top + parseFloat(c.style.top) + parseFloat(c.style.height) / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (d < best) { best = d; candidate = i; }
    }
    updateHUD(state.z);
  }
});
addEventListener("pointerup", () => { dragY = null; });

field.addEventListener("click", (e) => {
  const t = e.target;
  if (!t.dataset || t.dataset.item === undefined) return;
  const i = +t.dataset.item;
  if (state.z >= 2.5 && i !== atom) {
    // rail switch: hand the descent to a sibling
    atom = i;
    render(state.z);
  } else if (state.z < 2.5) {
    candidate = i;
    flyTo(3);
  }
});

addEventListener("keydown", (e) => {
  const cur = Math.round(zTarget);
  if (e.key === "ArrowDown" || e.key === "ArrowRight") flyTo(Math.min(5, cur + 1));
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") flyTo(Math.max(0, cur - 1));
});

addEventListener("resize", () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(() => { cache.clear(); render(state.z); }, 150);
});

/* ---------------- boot: high altitude, the whole field ---------------- */

render(0);
