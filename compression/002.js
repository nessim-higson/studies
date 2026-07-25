/* COMPRESSION 002 — ABSTRACT
   One generated painting hangs still forever. The only thing that ever
   moves is the writing about it: the same text at five real compression
   levels — TITLE → CAPTION → WALL LABEL → CATALOG → ESSAY — scrubbed
   by hand. Words shared between levels slide to their new positions;
   everything else dissolves through cycling letterforms. Summarization
   as a physical act.

   Engine: every level is typeset naturally once at boot and measured
   word-by-word; one paused master timeline tweens shared-word cells
   between measured rects; materialize/dissolve is a pure function of
   timeline progress, so scrubbing, snapping and reversing are exact. */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- the painting (harbor palette from 001) ---------------- */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAL = {
  bg: ["#8fb3d9", "#33567e"],
  bands: [
    { y0: 0.00, y1: 0.42, colors: ["#7fa8d9", "#a9c6e8", "#5d82b3", "#c9dcf0"], angle: 0.1, drift: 0.5 },
    { y0: 0.38, y1: 0.70, colors: ["#274690", "#2e6f8e", "#3a7ca5", "#1d3a6e"], angle: 0.0, drift: 0.2 },
    { y0: 0.66, y1: 1.00, colors: ["#2e6f5e", "#1f4d42", "#3d8a70", "#173a52"], angle: 0.15, drift: 0.4 },
  ],
  sun: { x: 0.30, y: 0.30, r: 0.10, color: "#f2c14e" },
};

function makeArt(pal, seed) {
  const W = 800, H = 600;
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
    x.globalAlpha = 0.9; x.fillStyle = rg; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
  }
  for (const band of pal.bands) {
    for (let i = 0; i < 800; i++) {
      const px = rnd() * W;
      const py = (band.y0 + rnd() * (band.y1 - band.y0)) * H;
      const wob = Math.sin(px * 0.013 + py * 0.021 + seed) * band.drift;
      const a = band.angle + wob * 0.8 + (rnd() - 0.5) * 0.25;
      const len = 14 + rnd() * 40;
      x.strokeStyle = band.colors[(rnd() * band.colors.length) | 0];
      x.globalAlpha = 0.35 + rnd() * 0.55;
      x.lineWidth = 5 + rnd() * 10;
      x.beginPath();
      x.moveTo(px - Math.cos(a) * len / 2, py - Math.sin(a) * len / 2);
      x.lineTo(px + Math.cos(a) * len / 2, py + Math.sin(a) * len / 2);
      x.stroke();
    }
  }
  if (pal.sun) {
    const s = pal.sun;
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * s.r * W * 0.8;
      x.strokeStyle = s.color;
      x.globalAlpha = 0.5 + rnd() * 0.4;
      x.lineWidth = 6 + rnd() * 9;
      const px = s.x * W + Math.cos(a) * d, py = s.y * H + Math.sin(a) * d * 0.9;
      const len = 7 + rnd() * 16;
      x.beginPath(); x.moveTo(px - len / 2, py); x.lineTo(px + len / 2, py); x.stroke();
    }
  }
  x.globalAlpha = 0.05;
  for (let i = 0; i < 3200; i++) {
    x.fillStyle = rnd() > 0.5 ? "#fff" : "#000";
    x.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
  }
  return c.toDataURL("image/jpeg", 0.88);
}

document.getElementById("painting").src = makeArt(PAL, 1977);

/* ---------------- the writing, at five compressions ---------------- */

const LEVELS = [
  { key: "title", text: `First Light` },

  { key: "caption", text: `First light over the harbor, before the ferries wake.` },

  { key: "wall label", text: `First light over the harbor. Painted from the seawall in the twenty minutes before the ferries wake, when the water carries more color than the sky — cobalt, bottle green, one patient streak of sun.` },

  { key: "catalog", text: `First light over the harbor. Painted from the seawall in the twenty minutes before the ferries wake, when the water carries more color than the sky — cobalt, bottle green, one patient streak of sun. The strokes run short and wet, laid in bands that follow the current; the sun is not painted so much as left out, a hole in the blue that the morning pours through. Begun and finished in a single sitting, which is why it survives.` },

  { key: "essay", text: `First light over the harbor. Painted from the seawall in the twenty minutes before the ferries wake, when the water carries more color than the sky — cobalt, bottle green, one patient streak of sun. The strokes run short and wet, laid in bands that follow the current; the sun is not painted so much as left out, a hole in the blue that the morning pours through. Begun and finished in a single sitting, which is why it survives. Every picture holds its words at several sizes at once. Two of them make a title. A handful make a caption; give them a wall and they become a label, give them a page and they become this. Nothing new was added on the way down — the essay was folded inside the title the whole time, the way the harbor is folded inside the paint. Reading is decompression. A title is an essay that trusts you.` },
];

const N = LEVELS.length;
const SEGS = N - 1;

/* ---------------- typeset + measure every level ---------------- */

const well = document.getElementById("well");
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const measured = LEVELS.map((lvl, li) => {
  const host = document.createElement("div");
  host.className = `lvl lvl-${li}`;
  const words = lvl.text.split(/\s+/);
  host.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  well.appendChild(host);
  const base = well.getBoundingClientRect();
  const cs = getComputedStyle(host);
  const out = [...host.querySelectorAll(".w")].map((s, i) => {
    const r = s.getBoundingClientRect();
    return {
      raw: words[i], norm: norm(words[i]),
      x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height,
      fs: parseFloat(cs.fontSize), color: cs.color,
    };
  });
  out.height = host.getBoundingClientRect().height;
  well.removeChild(host);
  return out;
});

well.style.height = Math.max(...measured.map((m) => m.height)) + "px";

/* ---------------- track words across adjacent levels (LCS) ---------------- */

function lcsMatch(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i].norm === b[j].norm ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].norm === b[j].norm) { pairs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/* tracks: one cell per word lineage; spans[li] = word index at level li (or -1) */
const tracks = [];
{
  // seed tracks from level 0
  const byLevelOwner = measured.map((m) => new Array(m.length).fill(-1));
  measured[0].forEach((_, wi) => {
    byLevelOwner[0][wi] = tracks.length;
    tracks.push({ spans: [wi, -1, -1, -1, -1] });
  });
  for (let li = 0; li < SEGS; li++) {
    const pairs = lcsMatch(measured[li], measured[li + 1]);
    const matchedNext = new Set();
    for (const [ai, bi] of pairs) {
      const owner = byLevelOwner[li][ai];
      if (owner >= 0) {
        tracks[owner].spans[li + 1] = bi;
        byLevelOwner[li + 1][bi] = owner;
        matchedNext.add(bi);
      }
    }
    measured[li + 1].forEach((_, wi) => {
      if (!matchedNext.has(wi) && byLevelOwner[li + 1][wi] < 0) {
        const t = { spans: [-1, -1, -1, -1, -1] };
        t.spans[li + 1] = wi;
        byLevelOwner[li + 1][wi] = tracks.length;
        tracks.push(t);
      }
    });
  }
}

/* ---------------- build cells + the master timeline ---------------- */

const GLYPHS = "aceimnorstuvxz·";
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

for (const t of tracks) {
  const first = t.spans.findIndex((s) => s >= 0);
  const word = measured[first][t.spans[first]];
  const cell = document.createElement("span");
  cell.className = "cell";
  cell.textContent = word.raw;
  cell.style.cssText = `left:${word.x}px;top:${word.y}px;font-size:${word.fs}px;color:${word.color};opacity:${first === 0 ? 1 : 0};`;
  well.appendChild(cell);
  t.cell = cell;
  t.first = first;
  t.last = t.spans.length - 1 - [...t.spans].reverse().findIndex((s) => s >= 0);
}

const tl = gsap.timeline({ paused: true });
for (const t of tracks) {
  for (let li = 0; li < SEGS; li++) {
    const a = t.spans[li], b = t.spans[li + 1];
    if (a >= 0 && b >= 0) {
      const w = measured[li + 1][b];
      tl.to(t.cell, {
        left: w.x, top: w.y, fontSize: w.fs, color: w.color,
        duration: 1, ease: "power2.inOut",
      }, li);
    }
  }
}
tl.to({}, { duration: 0.001 }, SEGS); // pin full length even if last segment has no shared words

/* materialize / dissolve — pure function of progress, evaluated per tick */
const OUT_END = 0.35, IN_START = 0.55;

function renderDecode() {
  const p = tl.progress() * SEGS;
  const s = Math.min(SEGS - 1, Math.floor(p));
  const q = p - s;
  for (const t of tracks) {
    const here = t.spans[s] >= 0, next = t.spans[s + 1] >= 0;
    const el = t.cell;
    if (here && next) {
      // shared word: show the spelling of whichever level is nearer, so
      // "Light" (title case) becomes "light" as it enters the prose
      const w = q < 0.5 ? measured[s][t.spans[s]] : measured[s + 1][t.spans[s + 1]];
      if (el.textContent !== w.raw) el.textContent = w.raw;
      el.style.opacity = 1;
      continue;
    }
    if (!here && !next) { el.style.opacity = 0; continue; }
    const word = here ? measured[s][t.spans[s]] : measured[s + 1][t.spans[s + 1]];
    const len = word.raw.length;
    if (here) { // dissolving out across [0, OUT_END]
      if (q >= OUT_END) { el.style.opacity = 0; continue; }
      const d = 1 - q / OUT_END;
      const real = Math.floor(d * len);
      el.textContent = word.raw.slice(0, real) + (real < len ? rnd() : "");
      el.__scr = 1;
      el.style.opacity = Math.min(1, d + 0.25);
    } else { // materializing in across [IN_START, 1]
      if (q <= IN_START) { el.style.opacity = 0; continue; }
      const d = (q - IN_START) / (1 - IN_START);
      const real = Math.floor(d * len);
      el.textContent = word.raw.slice(0, real) + (real < len ? rnd() : "");
      el.__scr = 1;
      el.style.opacity = Math.min(1, d * 1.6 + 0.2);
    }
  }
  updateHUD(p);
}
tl.eventCallback("onUpdate", renderDecode);

/* ---------------- HUD ---------------- */

const rail = document.getElementById("rail");
const readout = document.getElementById("readout");
const hint = document.getElementById("hint");
const COUNTS = LEVELS.map((l) => l.text.split(/\s+/).length);

LEVELS.forEach((l, i) => {
  const b = document.createElement("button");
  b.className = "tick";
  b.textContent = l.key;
  b.addEventListener("click", () => animateTo(i / SEGS));
  rail.appendChild(b);
});

function updateHUD(p) {
  const nearest = Math.round(p);
  [...rail.children].forEach((b, i) => b.classList.toggle("active", i === nearest));
  const s = Math.min(SEGS - 1, Math.floor(p)), q = p - s;
  const count = Math.round(COUNTS[s] + (COUNTS[s + 1] - COUNTS[s]) * q);
  readout.innerHTML = `<b>${LEVELS[nearest].key}</b> · ${count} words`;
}

/* ---------------- input: drag to scrub, snap on release ---------------- */

const DRAG_RANGE = 900; // px of drag for the full title↔essay traverse
let dragging = false, pDown = 0, xDown = 0;

function animateTo(p, fast) {
  gsap.killTweensOf(tl);
  if (REDUCED) { tl.progress(p); renderDecode(); return; }
  gsap.to(tl, { progress: p, duration: fast ? 0.5 : 0.9, ease: fast ? "expo.out" : "power3.inOut" });
}

well.addEventListener("pointerdown", (e) => {
  dragging = true;
  pDown = tl.progress();
  xDown = e.clientX;
  gsap.killTweensOf(tl);
  well.setPointerCapture(e.pointerId);
  hint.classList.add("gone");
});
well.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  tl.progress(gsap.utils.clamp(0, 1, pDown + (e.clientX - xDown) / DRAG_RANGE));
});
addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;
  animateTo(Math.round(tl.progress() * SEGS) / SEGS, true);
});

addEventListener("keydown", (e) => {
  const cur = Math.round(tl.progress() * SEGS);
  if (e.key === "ArrowRight") animateTo(Math.min(SEGS, cur + 1) / SEGS);
  if (e.key === "ArrowLeft") animateTo(Math.max(0, cur - 1) / SEGS);
});

/* ---------------- boot: open at the essay, fully decompressed ---------------- */

tl.progress(1);
renderDecode();
