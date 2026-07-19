/*
  COMPRESSION V2
  A reference-led DOM film: one atom of content survives every composition.
  GSAP core only. No layout participates while a transition is in flight.
*/

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const ITEMS = [
  {
    title: "Blue passage, first light",
    body: "A garden, an arch, and the hour when the sea borrows its colour from the sky.",
    image: "assets/harbor.jpg",
  },
  {
    title: "The remembered field",
    body: "Heat held low over dark ground. The last light makes the whole horizon feel invented.",
    image: "assets/field.jpg",
  },
  {
    title: "Nocturne, one light",
    body: "Almost nothing is enough: black water, bruised air, and one patient mark on the horizon.",
    image: "assets/nocturne.jpg",
  },
  {
    title: "Weather arriving",
    body: "A cloud study built from weight, interruption, and a blue that refuses to stay behind.",
    image: "assets/clouds.jpg",
  },
  {
    title: "The green cove",
    body: "Land folds around the water until the open sea becomes a room with a yellow floor.",
    image: "assets/cove.jpg",
  },
  {
    title: "Lavender afterglow",
    body: "The hillside keeps the day a little longer than the water. Then both turn violet.",
    image: "assets/lavender.jpg",
  },
];

// Holds + flights total 15.6 seconds, matching the cadence of the reference loop.
const STATES = [
  { key: "seed",     label: "compressed",  hold: 0.55, flight: 1.20 },
  { key: "label",    label: "named",       hold: 0.55, flight: 0.80 },
  { key: "snippet",  label: "described",   hold: 0.65, flight: 0.80 },
  { key: "card",     label: "focused",     hold: 0.85, flight: 0.85 },
  { key: "matrix",   label: "repeated",    hold: 0.80, flight: 0.90 },
  { key: "rail",     label: "flowing",     hold: 0.85, flight: 0.95 },
  { key: "focus",    label: "prioritised", hold: 0.90, flight: 0.95 },
  { key: "article",  label: "opened",      hold: 1.35, flight: 1.00 },
  { key: "gallery",  label: "disclosed",   hold: 0.50, flight: 1.15 },
];

const stage = document.getElementById("stage");
const morphLayer = document.getElementById("morph-layer");
const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const stateName = document.getElementById("state-name");
const progressFill = document.getElementById("progress-fill");

function element(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of children) if (child != null) node.append(child);
  return node;
}

const bench = element("div", "bench");
bench.setAttribute("aria-hidden", "true");
document.body.append(bench);

const NODES = ITEMS.map((item, index) => {
  const art = element("img", "art");
  art.src = item.image;
  art.alt = item.title;
  art.draggable = false;
  art.dataset.morphId = `art-${index}`;
  art.dataset.item = index;

  const title = element("h2", "title", item.title);
  title.dataset.morphId = `title-${index}`;

  const body = element("p", "body-copy", item.body);
  body.dataset.morphId = `body-${index}`;

  const action = element("button", "action", "View work");
  action.type = "button";
  action.dataset.morphId = `action-${index}`;
  action.dataset.item = index;
  action.setAttribute("aria-label", `Open ${item.title}`);

  const surface = element("div", "surface");
  surface.dataset.morphId = `surface-${index}`;

  const all = [art, title, body, action, surface];
  bench.append(...all);
  return { art, title, body, action, surface, all };
});

const signal = element("span", "signal");
signal.dataset.morphId = "signal";
bench.append(signal);

let atom = 0;
let stateIndex = 0;
let activeTimeline = null;
let autoCall = null;
let progressTween = null;
let playing = !REDUCED;

const itemIndex = (offset) => (atom + offset + ITEMS.length) % ITEMS.length;
const nodes = (offset) => NODES[itemIndex(offset)];

function use(node, className) {
  node.className = className;
  return node;
}

const art = (offset, className) => use(nodes(offset).art, `art ${className}`);
const title = (offset, className) => use(nodes(offset).title, `title ${className}`);
const body = (offset, className) => use(nodes(offset).body, `body-copy ${className}`);
const action = (offset, className) => use(nodes(offset).action, `action ${className}`);

function surface(offset, className, ...children) {
  const node = use(nodes(offset).surface, `surface ${className}`);
  node.replaceChildren(...children);
  return node;
}

const extra = (className, text) => {
  const node = element("p", className, text);
  node.dataset.extra = "";
  return node;
};

const BUILD = {
  seed: () => element("div", "scene scene-seed", art(0, "seed-art")),

  label: () => element("div", "scene scene-label",
    element("div", "label-cluster",
      art(0, "label-art"),
      element("div", "meta label-meta", use(signal, "signal"), title(0, "label-title")))),

  snippet: () => element("div", "scene scene-snippet",
    element("div", "snippet-cluster",
      art(0, "snippet-art"),
      element("div", "meta snippet-meta",
        title(0, "snippet-title"),
        body(0, "snippet-body"),
        action(0, "snippet-action")))),

  card: () => element("div", "scene scene-card",
    surface(0, "card-shell",
      art(0, "card-art"),
      element("div", "meta card-meta",
        title(0, "card-title"),
        body(0, "card-body"),
        action(0, "card-action")))),

  matrix: () => element("div", "scene scene-matrix",
    element("div", "matrix-grid",
      ...[0, 1, 2, 3].map((offset) =>
        surface(offset, "matrix-card",
          art(offset, "matrix-art"),
          element("div", "meta matrix-meta",
            title(offset, "matrix-title"),
            action(offset, "matrix-action")))))),

  rail: () => element("div", "scene scene-rail",
    element("div", "rail",
      ...[-1, 0, 1].map((offset) =>
        surface(offset, "rail-card",
          art(offset, "rail-art"),
          title(offset, "rail-title"),
          action(offset, "rail-action"))))),

  focus: () => element("div", "scene scene-focus",
    element("div", "focus-grid",
      surface(0, "focus-lead",
        art(0, "focus-art"),
        title(0, "focus-title"),
        action(0, "focus-action")),
      element("div", "focus-stack",
        ...[1, 2, 3].map((offset) =>
          surface(offset, "focus-row",
            art(offset, "focus-row-art"),
            element("div", "meta focus-row-meta",
              title(offset, "focus-row-title"),
              action(offset, "focus-row-action"))))))),

  article: () => element("div", "scene scene-article",
    surface(0, "article-sheet",
      title(0, "article-title"),
      body(0, "article-body"),
      art(0, "article-art"),
      extra("article-extra", "A work does not change when the frame around it does. What changes is the amount of attention the composition asks us to give."))),

  gallery: () => element("div", "scene scene-gallery",
    element("div", "gallery-sheet",
      element("div", "gallery-intro",
        title(0, "gallery-title"),
        body(0, "gallery-body"),
        extra("gallery-extra", "Compression is not loss. Every smaller state contains the promise of this one; every larger state remembers where it began.")),
      element("div", "gallery-row",
        art(1, "gallery-art"),
        art(2, "gallery-art"),
        art(3, "gallery-art")))),
};

function fixAt(node, rect, zIndex) {
  node.style.position = "fixed";
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.style.margin = "0";
  node.style.zIndex = zIndex;
}

function clearFixed(node) {
  gsap.set(node, {
    clearProps: "position,left,top,width,height,margin,zIndex,opacity,transform,borderRadius,boxShadow",
  });
}

function layerFor(node) {
  if (node.classList.contains("surface")) return 1;
  if (node.classList.contains("art")) return 2;
  return 3;
}

function roleDelay(node, flight) {
  if (node.classList.contains("surface")) return 0;
  if (node.classList.contains("art")) return flight * 0.035;
  return flight * 0.07;
}

function finishActiveTransition() {
  if (!activeTimeline) return;
  activeTimeline.progress(1).kill();
  activeTimeline = null;
}

function parkUnusedNodes() {
  for (const item of NODES) {
    for (const node of item.all) if (!stage.contains(node)) bench.append(node);
  }
  if (!stage.contains(signal)) bench.append(signal);
}

function updateMeta() {
  const state = STATES[stateIndex];
  stateName.textContent = state.label;
  document.documentElement.classList.toggle("is-paused", !playing);
  playButton.setAttribute("aria-pressed", String(playing));
  playButton.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");

  if (stateIndex === 0) gsap.set(progressFill, { scaleX: 0 });
  else gsap.set(progressFill, { scaleX: stateIndex / STATES.length });
}

function clearScheduling() {
  autoCall?.kill();
  progressTween?.kill();
  autoCall = null;
  progressTween = null;
}

function scheduleAdvance() {
  clearScheduling();
  if (!playing || activeTimeline) return;

  const hold = STATES[stateIndex].hold;
  progressTween = gsap.to(progressFill, {
    scaleX: (stateIndex + 1) / STATES.length,
    duration: hold,
    ease: "none",
  });
  autoCall = gsap.delayedCall(hold, advance);
}

function goTo(nextState, rotate = 0, instant = false) {
  if (nextState === stateIndex && rotate === 0 && stage.firstChild) return;

  clearScheduling();
  finishActiveTransition();

  const oldNodes = [...stage.querySelectorAll("[data-morph-id]")];
  const animate = oldNodes.length > 0 && !REDUCED && !instant;
  const oldRect = new Map();
  const oldRadius = new Map();
  const oldFont = new Map();
  const oldClass = new Map();
  const oldShadow = new Map();

  for (const node of oldNodes) {
    const styles = getComputedStyle(node);
    const id = node.dataset.morphId;
    oldRect.set(id, node.getBoundingClientRect());
    oldRadius.set(id, parseFloat(styles.borderTopLeftRadius) || 0);
    oldFont.set(id, parseFloat(styles.fontSize) || 0);
    oldClass.set(id, node.className);
    oldShadow.set(id, styles.boxShadow);
  }

  const leavingExtras = [];
  if (animate) {
    for (const node of stage.querySelectorAll("[data-extra]")) {
      const rect = node.getBoundingClientRect();
      morphLayer.append(node);
      fixAt(node, rect, 3);
      leavingExtras.push(node);
    }
  }

  atom = (atom + rotate + ITEMS.length) % ITEMS.length;
  stateIndex = nextState;

  const layout = BUILD[STATES[nextState].key]();
  stage.replaceChildren(layout);
  const enteringExtras = [...layout.querySelectorAll("[data-extra]")];

  if (animate) {
    layout.style.visibility = "hidden";
    if (enteringExtras.length) {
      gsap.set(enteringExtras, { opacity: 0, y: 7 });
    }
  }

  const newNodes = [...stage.querySelectorAll("[data-morph-id]")];
  const leaving = oldNodes.filter((node) => !stage.contains(node));

  if (!animate) {
    parkUnusedNodes();
    morphLayer.replaceChildren();
    updateMeta();
    scheduleAdvance();
    return;
  }

  const morphing = [];
  const entering = [];
  const crossfades = [];
  const newRect = new Map();
  const newRadius = new Map();
  const newShadow = new Map();

  for (const node of newNodes) {
    const id = node.dataset.morphId;
    const styles = getComputedStyle(node);
    newRect.set(id, node.getBoundingClientRect());
    newRadius.set(id, parseFloat(styles.borderTopLeftRadius) || 0);
    newShadow.set(id, styles.boxShadow);

    if (!oldRect.has(id)) {
      entering.push(node);
      continue;
    }

    const isShape = node.classList.contains("surface") || node.classList.contains("art") || node.classList.contains("signal");
    const oldSize = oldFont.get(id);
    const newSize = parseFloat(styles.fontSize) || 0;
    const ratio = oldSize && newSize ? Math.max(oldSize, newSize) / Math.min(oldSize, newSize) : 1;

    if (!isShape && ratio > 1.32) {
      entering.push(node);
      const clone = document.createElement(node.tagName);
      clone.className = oldClass.get(id);
      clone.textContent = node.textContent;
      morphLayer.append(clone);
      fixAt(clone, oldRect.get(id), 3);
      crossfades.push(clone);
    } else {
      morphing.push(node);
    }
  }

  const placeholders = [];
  for (const node of [...morphing, ...entering]) {
    const placeholder = document.createComment("morph-slot");
    node.replaceWith(placeholder);
    placeholders.push([node, placeholder]);
    morphLayer.append(node);

    const id = node.dataset.morphId;
    const rect = morphing.includes(node) ? oldRect.get(id) : newRect.get(id);
    fixAt(node, rect, layerFor(node));

    if (morphing.includes(node)) node.style.borderRadius = `${oldRadius.get(id)}px`;
    else node.style.opacity = "0";
  }

  for (const node of leaving) {
    morphLayer.append(node);
    fixAt(node, oldRect.get(node.dataset.morphId), layerFor(node));
  }

  const flight = STATES[nextState].flight;
  const landing = flight * 0.82;
  const timeline = gsap.timeline({
    onComplete: () => {
      activeTimeline = null;
      scheduleAdvance();
    },
  });

  for (const node of morphing) {
    const id = node.dataset.morphId;
    const destination = newRect.get(id);
    const delay = roleDelay(node, flight);
    const values = {
      left: destination.left,
      top: destination.top,
      width: destination.width,
      height: destination.height,
      borderRadius: newRadius.get(id),
      duration: Math.max(0.2, landing - delay),
      ease: "power3.inOut",
    };

    const fromShadow = oldShadow.get(id);
    const toShadow = newShadow.get(id);
    if (fromShadow && toShadow && fromShadow !== "none" && toShadow !== "none" && fromShadow !== toShadow) {
      node.style.boxShadow = fromShadow;
      values.boxShadow = toShadow;
    }

    timeline.to(node, values, delay);
  }

  for (const node of [...leaving, ...crossfades, ...leavingExtras]) {
    timeline.to(node, {
      opacity: 0,
      y: node.classList?.contains("title") ? -3 : 0,
      duration: flight * 0.28,
      ease: "power2.out",
    }, 0);
  }

  const enteringShapes = entering.filter((node) =>
    node.classList.contains("surface") || node.classList.contains("art"));
  const enteringText = entering.filter((node) =>
    !node.classList.contains("surface") && !node.classList.contains("art") && !node.classList.contains("signal"));
  const enteringSignal = entering.filter((node) => node.classList.contains("signal"));

  if (enteringShapes.length) {
    timeline.fromTo(enteringShapes,
      { opacity: 0, y: 8, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: flight * 0.48, stagger: flight * 0.035, ease: "power3.out" },
      flight * 0.27);
  }

  if (enteringText.length) {
    timeline.fromTo(enteringText,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: flight * 0.38, stagger: flight * 0.025, ease: "power2.out" },
      flight * 0.40);
  }

  if (enteringSignal.length) {
    timeline.fromTo(enteringSignal,
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: flight * 0.42, ease: "power2.out" },
      flight * 0.28);
  }

  timeline.call(() => {
    layout.style.visibility = "";
    for (const [node, placeholder] of placeholders) {
      placeholder.replaceWith(node);
      clearFixed(node);
    }
    for (const node of leaving) {
      clearFixed(node);
      bench.append(node);
    }
    for (const clone of crossfades) clone.remove();
    for (const node of leavingExtras) node.remove();
    morphLayer.replaceChildren();
    parkUnusedNodes();
  }, [], landing);

  if (enteringExtras.length) {
    timeline.to(enteringExtras, {
      opacity: 1,
      y: 0,
      duration: flight - landing,
      stagger: 0.03,
      ease: "power2.out",
      clearProps: "opacity,transform",
    }, landing);
  }

  timeline.call(() => {}, [], flight);
  activeTimeline = timeline;
  updateMeta();
}

function advance() {
  if (stateIndex === STATES.length - 1) goTo(0, 1);
  else goTo(stateIndex + 1);
}

function retreat() {
  if (stateIndex === 0) goTo(STATES.length - 1, -1);
  else goTo(stateIndex - 1);
}

function stop() {
  playing = false;
  clearScheduling();
  updateMeta();
}

function play() {
  playing = true;
  updateMeta();
  scheduleAdvance();
}

function togglePlayback() {
  if (playing) stop();
  else play();
}

function promote(index, targetState) {
  const rotation = (index - atom + ITEMS.length) % ITEMS.length;
  goTo(targetState, rotation);
}

playButton.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePlayback();
});

previousButton.addEventListener("click", (event) => {
  event.stopPropagation();
  stop();
  retreat();
});

nextButton.addEventListener("click", (event) => {
  event.stopPropagation();
  stop();
  advance();
});

stage.addEventListener("click", (event) => {
  const target = event.target;
  const index = target?.dataset?.item;

  if (index !== undefined && target.classList.contains("action")) {
    stop();
    promote(Number(index), 7);
    return;
  }

  if (index !== undefined && target.classList.contains("art") && [4, 5, 6].includes(stateIndex)) {
    stop();
    promote(Number(index), 6);
    return;
  }

  togglePlayback();
});

addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    stop();
    advance();
  }
  if (event.key === "ArrowLeft") {
    stop();
    retreat();
  }
  if (event.key === " " && !event.target.closest("button")) {
    event.preventDefault();
    togglePlayback();
  }
});

addEventListener("resize", () => {
  if (!activeTimeline) return;
  finishActiveTransition();
});

const imageReady = ITEMS.map((item) => {
  const image = new Image();
  image.src = item.image;
  return image.decode().catch(() => undefined);
});

Promise.all(imageReady).finally(() => {
  if (REDUCED) {
    playing = false;
    stateIndex = 3;
    goTo(3, 0, true);
  } else {
    goTo(0, 0, true);
  }
});

window.__compression = {
  states: STATES.map((state) => state.key),
  goTo: (index) => {
    stop();
    goTo(Math.max(0, Math.min(STATES.length - 1, Number(index))), 0);
  },
  play,
  stop,
  get state() { return stateIndex; },
  get atom() { return atom; },
};
