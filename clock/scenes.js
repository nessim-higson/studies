// ─── Scene Definitions & Sequencer ──────────────────────────────────────────

const PROJECTS = [
  { name: 'Dead Men',     descriptor: 'Motion Studies, Main and Teaser Keyart',  category: 'Identity Development' },
  { name: 'Nocturne',     descriptor: 'Title Sequence, End Crawl, In-Show Graphics', category: 'Motion Design' },
  { name: 'Territories',  descriptor: 'Brand Identity, Guidelines, Applications', category: 'Identity Development' },
  { name: 'Glass Hours',  descriptor: 'Exhibition Design, Environmental Graphics', category: 'Spatial Design' },
  { name: 'Undertow',     descriptor: 'Campaign Keyart, Outdoor, Digital',       category: 'Advertising' },
  { name: 'Meridian',     descriptor: 'Publication Design, Editorial, Typography', category: 'Print' },
];

// Scene types: logo, clock, title, detail, interlude
function buildSequence() {
  const seq = [];

  // Open with logo
  seq.push({ type: 'logo', mode: 'dark', beats: 6 });

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    // Clock breathing room
    seq.push({ type: 'clock', mode: 'dark', beats: 6 });
    // Project title card (light)
    seq.push({ type: 'title', mode: 'light', beats: 6, content: { name: p.name, descriptor: p.descriptor } });
    // Project detail (dark, over shader)
    seq.push({ type: 'detail', mode: 'dark', beats: 5, content: { category: p.category } });
    // Generative interlude
    seq.push({ type: 'interlude', mode: 'dark', beats: 4 });
  }

  // Close with logo before looping
  seq.push({ type: 'logo', mode: 'dark', beats: 6 });

  return seq;
}

export const SEQUENCE = buildSequence();

export class Sequencer {
  constructor(onSceneChange, onBeat) {
    this.onSceneChange = onSceneChange;
    this.onBeat = onBeat;
    this.sceneIndex = 0;
    this.beatInScene = 0;
    this.totalBeatCount = -1;
    this.startTime = null;
  }

  get currentScene() {
    return SEQUENCE[this.sceneIndex];
  }

  get nextScene() {
    const next = (this.sceneIndex + 1) % SEQUENCE.length;
    return SEQUENCE[next];
  }

  // Returns { scene, beatFrac, isTransitioning, transitionProgress }
  update(timestamp, bpm) {
    if (this.startTime === null) this.startTime = timestamp;

    const elapsed = (timestamp - this.startTime) / 1000;
    const beatDur = 60 / bpm;
    const totalBeats = elapsed / beatDur;
    const beatCount = Math.floor(totalBeats);
    const beatFrac = totalBeats - beatCount;

    // New beat boundary
    if (beatCount !== this.totalBeatCount) {
      if (this.totalBeatCount >= 0) {
        this.beatInScene++;
        this.onBeat();

        // Check if scene is exhausted
        const scene = SEQUENCE[this.sceneIndex];
        if (this.beatInScene >= scene.beats) {
          this.sceneIndex = (this.sceneIndex + 1) % SEQUENCE.length;
          this.beatInScene = 0;
          this.onSceneChange(SEQUENCE[this.sceneIndex], scene);
        }
      }
      this.totalBeatCount = beatCount;
    }

    const scene = SEQUENCE[this.sceneIndex];
    const progress = (this.beatInScene + beatFrac) / scene.beats;

    // Transition occupies last 30% of scene duration
    const transitionStart = 0.7;
    const isTransitioning = progress >= transitionStart;
    const transitionProgress = isTransitioning
      ? (progress - transitionStart) / (1 - transitionStart)
      : 0;

    return { scene, elapsed, beatFrac, isTransitioning, transitionProgress };
  }
}
