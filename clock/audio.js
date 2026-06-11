// ─── Audio System ────────────────────────────────────────────────────────────
// Ambient drone + beat markers with scene-aware ducking

export class Audio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.isOn = false;
    this._currentDuck = 1.0;
  }

  _init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    // Drone bus
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 1.0;

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 900;
    lpf.Q.value = 0.7;
    this.droneGain.connect(lpf);
    lpf.connect(this.masterGain);

    // Drone oscillators: A1, warmth, A2, E3
    const drones = [
      { freq: 55,    det: 0,  gain: 0.26, type: 'sine' },
      { freq: 82.5,  det: 0,  gain: 0.10, type: 'triangle' },
      { freq: 110,   det: 5,  gain: 0.14, type: 'sine' },
      { freq: 164.8, det: -4, gain: 0.07, type: 'sine' },
    ];
    for (const d of drones) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = d.type;
      osc.frequency.value = d.freq;
      osc.detune.value = d.det;
      g.gain.value = d.gain;
      osc.connect(g);
      g.connect(this.droneGain);
      osc.start();
    }

    // LFO breathing — rate will be updated per frame
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = 0.07;
    this.lfoGain.gain.value = 0.05;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.masterGain.gain);
    this.lfo.start();
  }

  start() {
    this._init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isOn = true;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0.55, t + 1.8);
  }

  stop() {
    if (!this.masterGain) return;
    this.isOn = false;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + 1.2);
  }

  toggle() {
    if (this.isOn) this.stop(); else this.start();
    return this.isOn;
  }

  // Update LFO rate based on BPM
  updateBPM(bpm) {
    if (!this.lfo) return;
    this.lfo.frequency.value = bpm / 60 / 8;
  }

  // Scene-aware ducking
  setSceneMode(sceneType) {
    if (!this.droneGain) return;
    const t = this.ctx.currentTime;
    let target = 1.0;

    if (sceneType === 'title') target = 0.4;       // duck 60% on light scenes
    else if (sceneType === 'interlude') target = 1.2; // boost on interludes
    else if (sceneType === 'clock') target = 0.85;    // slightly reduced

    if (target !== this._currentDuck) {
      this.droneGain.gain.cancelScheduledValues(t);
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
      this.droneGain.gain.linearRampToValueAtTime(target, t + 0.8);
      this._currentDuck = target;
    }
  }

  // Beat sound
  playBeat(sceneType) {
    if (!this.ctx || !this.isOn) return;
    const now = this.ctx.currentTime;

    // Sub-bass thump (muted on title scenes)
    if (sceneType !== 'title') {
      const thumpGain = sceneType === 'clock' ? 0.30 : 0.42;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const lpf = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(72, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);
      lpf.type = 'lowpass';
      lpf.frequency.value = 260;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(thumpGain, now + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(lpf);
      lpf.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.28);
    }

    // High-frequency tick (softer on title scenes)
    const tickGain = sceneType === 'title' ? 0.06 : 0.04;
    const tickFreq = sceneType === 'title' ? 880 : 4000;
    const tickOsc = this.ctx.createOscillator();
    const tickEnv = this.ctx.createGain();
    const tickFilter = this.ctx.createBiquadFilter();
    tickOsc.type = 'sine';
    tickOsc.frequency.value = tickFreq;
    tickFilter.type = 'bandpass';
    tickFilter.frequency.value = tickFreq;
    tickFilter.Q.value = 8;
    tickEnv.gain.setValueAtTime(0, now);
    tickEnv.gain.linearRampToValueAtTime(tickGain, now + 0.002);
    tickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    tickOsc.connect(tickFilter);
    tickFilter.connect(tickEnv);
    tickEnv.connect(this.masterGain);
    tickOsc.start(now);
    tickOsc.stop(now + 0.05);
  }
}
