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
const stopNav = document.getElementById("stop-nav");

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
  const artImage = element("img", "art-image");
  artImage.src = item.image;
  artImage.alt = item.title;
  artImage.draggable = false;

  const art = element("div", "art", artImage);
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
  return { art, artImage, title, body, action, surface, all };
});

const signal = element("span", "signal");
signal.dataset.morphId = "signal";
bench.append(signal);

const stopButtons = STATES.map((state, index) => {
  const button = element("button", "stop", state.key);
  button.type = "button";
  button.dataset.state = index;
  button.setAttribute("aria-label", `Show ${index + 1} of ${STATES.length}: ${state.label}`);
  stopNav.append(button);
  return button;
});

let atom = 0;
let stateIndex = 0;
let activeTimeline = null;
let autoCall = null;
let navTween = null;
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
    clearProps: "position,left,top,width,height,margin,zIndex,opacity,transform,borderRadius,boxShadow,filter",
  });
}

function coverFrame(node, rect) {
  const image = node.querySelector(".art-image");
  const naturalWidth = image.naturalWidth || 4;
  const naturalHeight = image.naturalHeight || 3;
  const scale = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    left: (rect.width - width) / 2,
    top: (rect.height - height) / 2,
    width,
    height,
  };
}

function setArtFrame(node, frame) {
  const image = node.querySelector(".art-image");
  Object.assign(image.style, {
    position: "absolute",
    left: `${frame.left}px`,
    top: `${frame.top}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    maxWidth: "none",
    objectFit: "fill",
  });
}

function clearArtFrame(node) {
  const image = node.querySelector(".art-image");
  if (!image) return;
  gsap.set(image, {
    clearProps: "position,left,top,width,height,maxWidth,objectFit,transform",
  });
}

function layerFor(node) {
  if (node.classList.contains("surface")) return 1;
  if (node.classList.contains("art")) return 2;
  return 3;
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

function updateMeta(duration = 0) {
  const state = STATES[stateIndex];
  stateName.textContent = `${String(stateIndex + 1).padStart(2, "0")} / ${String(STATES.length).padStart(2, "0")} · ${state.label}`;
  document.documentElement.classList.toggle("is-paused", !playing);
  playButton.setAttribute("aria-pressed", String(playing));
  playButton.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");

  stopButtons.forEach((button, index) => {
    const active = index === stateIndex;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  navTween?.kill();
  const scaleX = stateIndex / (STATES.length - 1);
  if (duration > 0) {
    navTween = gsap.to(progressFill, { scaleX, duration, ease: "power3.inOut" });
  } else {
    gsap.set(progressFill, { scaleX });
    navTween = null;
  }
}

function clearScheduling() {
  autoCall?.kill();
  autoCall = null;
}

function scheduleAdvance() {
  clearScheduling();
  if (!playing || activeTimeline) return;

  const hold = STATES[stateIndex].hold;
  autoCall = gsap.delayedCall(hold, advance);
}

function goTo(nextState, rotate = 0, instant = false) {
  if (nextState === stateIndex && rotate === 0 && stage.firstChild) {
    finishActiveTransition();
    updateMeta();
    return;
  }

  clearScheduling();
  finishActiveTransition();

  const oldNodes = [...stage.querySelectorAll("[data-morph-id]")];
  const animate = oldNodes.length > 0 && !REDUCED && !instant;
  const oldRect = new Map();
  const oldRadius = new Map();
  const oldClass = new Map();
  const oldShadow = new Map();
  const oldArtFrame = new Map();

  for (const node of oldNodes) {
    const styles = getComputedStyle(node);
    const id = node.dataset.morphId;
    const rect = node.getBoundingClientRect();
    oldRect.set(id, rect);
    oldRadius.set(id, parseFloat(styles.borderTopLeftRadius) || 0);
    oldClass.set(id, node.className);
    oldShadow.set(id, styles.boxShadow);
    if (node.classList.contains("art")) oldArtFrame.set(id, coverFrame(node, rect));
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
  const enteringExtraRect = new Map(enteringExtras.map((node) => [node, node.getBoundingClientRect()]));

  if (animate) {
    layout.style.visibility = "hidden";
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
  const newArtFrame = new Map();

  for (const node of newNodes) {
    const id = node.dataset.morphId;
    const styles = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    newRect.set(id, rect);
    newRadius.set(id, parseFloat(styles.borderTopLeftRadius) || 0);
    newShadow.set(id, styles.boxShadow);
    if (node.classList.contains("art")) newArtFrame.set(id, coverFrame(node, rect));

    if (!oldRect.has(id)) {
      entering.push(node);
      continue;
    }

    const isShape = node.classList.contains("surface") || node.classList.contains("art") || node.classList.contains("signal");

    // Type should never reflow while its box is moving. A clean optical
    // crossfade reads as one content atom without the elastic line wrapping
    // that made the previous pass feel wobbly.
    if (!isShape) {
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

    if (morphing.includes(node)) {
      node.style.borderRadius = `${oldRadius.get(id)}px`;
      if (node.classList.contains("art")) setArtFrame(node, oldArtFrame.get(id));
    }
    else node.style.opacity = "0";
  }

  const extraPlaceholders = [];
  for (const node of enteringExtras) {
    const placeholder = document.createComment("extra-slot");
    node.replaceWith(placeholder);
    extraPlaceholders.push([node, placeholder]);
    morphLayer.append(node);
    fixAt(node, enteringExtraRect.get(node), 3);
    node.style.opacity = "0";
  }

  for (const node of leaving) {
    morphLayer.append(node);
    fixAt(node, oldRect.get(node.dataset.morphId), layerFor(node));
  }

  const flight = STATES[nextState].flight;
  const shapeDuration = flight * 0.82;
  const timeline = gsap.timeline({
    onComplete: () => {
      activeTimeline = null;
      scheduleAdvance();
    },
  });

  for (const node of morphing) {
    const id = node.dataset.morphId;
    const destination = newRect.get(id);
    const values = {
      left: destination.left,
      top: destination.top,
      width: destination.width,
      height: destination.height,
      borderRadius: newRadius.get(id),
      duration: shapeDuration,
      ease: "expo.inOut",
    };

    const fromShadow = oldShadow.get(id);
    const toShadow = newShadow.get(id);
    if (fromShadow && toShadow && fromShadow !== "none" && toShadow !== "none" && fromShadow !== toShadow) {
      node.style.boxShadow = fromShadow;
      values.boxShadow = toShadow;
    }

    // Surfaces and artwork share one clock. Their relative geometry can
    // change, but neither element trails the other.
    timeline.to(node, values, 0);

    if (node.classList.contains("art")) {
      const image = node.querySelector(".art-image");
      const frame = newArtFrame.get(id);
      timeline.to(image, {
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        duration: shapeDuration,
        ease: "expo.inOut",
      }, 0);
    }
  }

  for (const node of [...leaving, ...crossfades, ...leavingExtras]) {
    timeline.to(node, {
      opacity: 0,
      duration: Math.min(0.18, flight * 0.22),
      ease: "power1.out",
    }, 0);
  }

  const enteringShapes = entering.filter((node) =>
    node.classList.contains("surface") || node.classList.contains("art"));
  const enteringText = entering.filter((node) =>
    !node.classList.contains("surface") && !node.classList.contains("art") && !node.classList.contains("signal"));
  const enteringSignal = entering.filter((node) => node.classList.contains("signal"));

  if (enteringShapes.length) {
    timeline.fromTo(enteringShapes,
      { opacity: 0 },
      { opacity: 1, duration: flight * 0.32, stagger: flight * 0.025, ease: "power2.out" },
      flight * 0.30);
  }

  if (enteringText.length) {
    timeline.fromTo(enteringText,
      { opacity: 0 },
      {
        opacity: 1,
        duration: Math.max(0.38, flight * 0.46),
        stagger: 0.028,
        ease: "power2.out",
      },
      flight * 0.24);
  }

  if (enteringExtras.length) {
    timeline.fromTo(enteringExtras,
      { opacity: 0 },
      {
        opacity: 1,
        duration: Math.max(0.4, flight * 0.48),
        stagger: 0.03,
        ease: "power2.out",
      },
      flight * 0.27);
  }

  if (enteringSignal.length) {
    timeline.fromTo(enteringSignal,
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: flight * 0.42, ease: "power2.out" },
      flight * 0.28);
  }

  const landing = Math.max(flight, timeline.duration());
  timeline.call(() => {
    layout.style.visibility = "";
    for (const [node, placeholder] of placeholders) {
      placeholder.replaceWith(node);
      if (node.classList.contains("art")) clearArtFrame(node);
      clearFixed(node);
    }
    for (const [node, placeholder] of extraPlaceholders) {
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
  activeTimeline = timeline;
  updateMeta(shapeDuration);
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

stopButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    stop();
    goTo(index);
  });
});

stage.addEventListener("click", (event) => {
  const target = event.target.closest("[data-item]");
  const index = target?.dataset.item;

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
