// ─── App Orchestrator ────────────────────────────────────────────────────────
import { Shader } from './shader.js';
import { Audio } from './audio.js';
import { Sequencer } from './scenes.js';
import { getTransition, ease } from './transitions.js';

// ─── State ───────────────────────────────────────────────────────────────────
let bpm = 28;
const BPM_MIN = 12;
const BPM_MAX = 60;
const BPM_STEP = 4;

// ─── DOM ─────────────────────────────────────────────────────────────────────
const sceneEl   = document.getElementById('scene');
const contentEl = document.getElementById('content');
const clockEl   = document.getElementById('bar-clock');
const beatDot   = document.getElementById('beat-dot');
const soundBtn  = document.getElementById('btn-sound');
const soundDot  = document.getElementById('sound-dot');

// ─── Modules ─────────────────────────────────────────────────────────────────
const shader = new Shader(document.getElementById('canvas'));
const audio  = new Audio();

let currentWipe = 0;
let prevSceneMode = 'dark';

// ─── Scene Rendering ─────────────────────────────────────────────────────────

function renderSceneContent(scene) {
  contentEl.classList.remove('visible');

  // Small delay for fade-out before swapping content
  setTimeout(() => {
    // Clear previous classes
    contentEl.className = 'scene-content';

    switch (scene.type) {
      case 'logo':
        contentEl.classList.add('scene-logo');
        contentEl.innerHTML = `
          <div class="logo-mark">IAAH</div>
          <div class="logo-sub">A Living Archive</div>
        `;
        break;

      case 'clock':
        contentEl.classList.add('scene-clock');
        contentEl.innerHTML = `<div class="clock-digits"><span class="clock-h"></span><span class="clock-colon">:</span><span class="clock-m"></span></div>`;
        break;

      case 'title':
        contentEl.classList.add('scene-title');
        contentEl.innerHTML = `
          <div class="title-name">${scene.content.name}</div>
          <div class="title-descriptor">${scene.content.descriptor}</div>
        `;
        break;

      case 'detail':
        contentEl.classList.add('scene-detail');
        contentEl.innerHTML = `<div class="detail-category">${scene.content.category}</div>`;
        break;

      case 'interlude':
        contentEl.classList.add('scene-interlude');
        contentEl.innerHTML = '';
        break;
    }

    // Set scene mode (light/dark)
    sceneEl.classList.remove('mode-light', 'mode-dark');
    sceneEl.classList.add(`mode-${scene.mode}`);

    // Fade in content
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        contentEl.classList.add('visible');
      });
    });
  }, 80);
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  // Update bar clock (always visible)
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  // Update scene clock digits if present
  const h = document.querySelector('.clock-h');
  const m = document.querySelector('.clock-m');
  if (h && m) { h.textContent = hh; m.textContent = mm; }
}

// ─── Sequencer Callbacks ─────────────────────────────────────────────────────

function onSceneChange(newScene, prevScene) {
  // Determine transition type
  currentWipe = getTransition(prevScene.mode, newScene.mode, newScene.type);

  // Advance shader palette on scene change
  shader.advancePalette();

  // Update audio ducking
  audio.setSceneMode(newScene.type);

  // Render new content
  renderSceneContent(newScene);
  prevSceneMode = newScene.mode;
}

function onBeat() {
  // Pulse beat dot
  beatDot.classList.add('on');
  setTimeout(() => beatDot.classList.remove('on'), 100);

  // Pulse clock colon
  const colon = document.querySelector('.clock-colon');
  if (colon) {
    colon.classList.add('pulse');
    setTimeout(() => colon.classList.remove('pulse'), 200);
  }

  // Play beat sound
  audio.playBeat(sequencer.currentScene.type);

  // Update clock digits
  updateClock();
}

const sequencer = new Sequencer(onSceneChange, onBeat);

// ─── Render Loop ─────────────────────────────────────────────────────────────

function render(ts) {
  const state = sequencer.update(ts, bpm);

  // Compute shader blend
  const blend = state.isTransitioning
    ? ease(state.transitionProgress)
    : 0;

  shader.render(state.elapsed, blend, bpm, currentWipe);
  audio.updateBPM(bpm);

  requestAnimationFrame(render);
}

// ─── Controls ────────────────────────────────────────────────────────────────

document.getElementById('btn-less').addEventListener('click', () => {
  bpm = Math.max(BPM_MIN, bpm - BPM_STEP);
});

document.getElementById('btn-more').addEventListener('click', () => {
  bpm = Math.min(BPM_MAX, bpm + BPM_STEP);
});

soundBtn.addEventListener('click', () => {
  audio.toggle();
  soundDot.classList.toggle('on', audio.isOn);
  soundBtn.classList.toggle('active', audio.isOn);
});

// ─── Boot ────────────────────────────────────────────────────────────────────

// Initialize first scene
renderSceneContent(sequencer.currentScene);
sceneEl.classList.add('mode-dark');

// Start bar clock immediately and update every second
updateClock();
setInterval(updateClock, 1000);

requestAnimationFrame(render);
