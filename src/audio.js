// Audio bus (Web Audio API).
// Browsers only allow audio after a user gesture, so nothing plays until unlock() is called
// from the Enter click. The mute choice is remembered between visits.
//
// All sound is synthesised in the browser: a soft drone bed per chapter, four layers that fade in
// as dispatches are read, a swell when the hour is found, and the tick and lock sounds of the dial.
// If a destination supplies audio files in destinations.json (audio.bed, audio.layers[], audio.swell)
// those are used instead, falling back to the synthesised sound if a file fails to load.
// The sound is ambient only: it carries no speech and no information that is not also on screen.
const KEY = 'ww:muted';
const BED_BASE = 1;

function readMuted() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

// A pentatonic-ish root note per chapter
const rootFor = (i) => 110 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][i % 10] / 12);

function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function osc(ctx, type, freq, level, dest) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = level;
  o.connect(g).connect(dest);
  o.start();
  return o;
}

function synthBed(ctx, root) {
  const out = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  lp.connect(out);
  const nodes = [osc(ctx, 'triangle', root, 0.1, lp), osc(ctx, 'sine', root * 1.5, 0.06, lp), osc(ctx, 'sine', root / 2, 0.12, lp)];
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  lfo.frequency.value = 0.07;
  lg.gain.value = 250;
  lfo.connect(lg).connect(lp.frequency);
  lfo.start();
  nodes.push(lfo);
  return { out, stop: () => nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }) };
}

// Four layers: air, shimmer, slow pulse, soft bell
function synthLayer(ctx, root, i) {
  const out = ctx.createGain();
  const nodes = [];
  if (i === 0) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(bp).connect(g).connect(out);
    src.start();
    nodes.push(src);
  } else if (i === 1) {
    nodes.push(osc(ctx, 'sine', root * 4, 0.012, out), osc(ctx, 'sine', root * 6.01, 0.01, out));
  } else if (i === 2) {
    const g = ctx.createGain();
    g.gain.value = 0.08;
    g.connect(out);
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 0.2;
    lg.gain.value = 0.07;
    lfo.connect(lg).connect(g.gain);
    lfo.start();
    nodes.push(lfo, osc(ctx, 'sine', root * 0.5, 1, g));
  } else {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.connect(out);
    nodes.push(osc(ctx, 'triangle', root * 3, 0.03, lp));
  }
  return { out, stop: () => nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }) };
}

class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.music = null;
    this.chapter = null;
    this.muted = readMuted();
  }

  // Call from inside a click or key handler. Returns false if Web Audio is not available.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.connect(this.master);
      // Do not burn CPU in a hidden tab
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend();
        else this.ctx.resume();
      });
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* storage unavailable: still works for this visit */ }
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.06);
  }

  // Use a file if a URL is given, otherwise (or if loading fails) the synthesised sound
  _source(url, synth) {
    if (!url) return synth();
    const out = this.ctx.createGain();
    let inner = null, stopped = false;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then((b) => this.ctx.decodeAudioData(b))
      .then((buf) => {
        if (stopped) return;
        const s = this.ctx.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        s.connect(out);
        s.start();
        inner = { stop: () => { try { s.stop(); } catch { /* already stopped */ } } };
      })
      .catch(() => {
        if (stopped) return;
        inner = synth();
        inner.out.connect(out);
      });
    return { out, stop: () => { stopped = true; if (inner) inner.stop(); } };
  }

  // Start a chapter's soundscape, silent at first. openedIdx = layers already unlocked.
  startChapter(d, index, openedIdx = []) {
    if (!this.ctx) return;
    this.stopChapter(0.2);
    const ctx = this.ctx, a = d.audio || {}, root = rootFor(index);
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0;
    const bed = this._source(a.bed, () => synthBed(ctx, root));
    bed.out.connect(bedGain).connect(this.music);
    const layers = [0, 1, 2, 3].map((i) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      const src = this._source((a.layers || [])[i], () => synthLayer(ctx, root, i));
      src.out.connect(g).connect(this.music);
      return { g, src };
    });
    this.chapter = { bed, bedGain, layers, swellUrl: a.swell };
    openedIdx.forEach((i) => this.layerOn(i));
  }

  // Fade the bed to a level (0 to 1) over roughly the given seconds
  bedTo(level, secs = 2) {
    if (!this.chapter) return;
    this.chapter.bedGain.gain.setTargetAtTime(level * BED_BASE, this.ctx.currentTime, Math.max(0.05, secs / 3));
  }

  layerOn(i) {
    if (!this.chapter || !this.chapter.layers[i]) return;
    this.chapter.layers[i].g.gain.setTargetAtTime(1, this.ctx.currentTime, 1.2);
  }

  stopChapter(secs = 1.2) {
    if (!this.chapter) return;
    const c = this.chapter;
    this.chapter = null;
    const now = this.ctx.currentTime;
    c.bedGain.gain.setTargetAtTime(0, now, Math.max(0.05, secs / 3));
    c.layers.forEach((l) => l.g.gain.setTargetAtTime(0, now, Math.max(0.05, secs / 3)));
    setTimeout(() => {
      c.bed.stop();
      c.layers.forEach((l) => l.src.stop());
      c.bedGain.disconnect();
      c.layers.forEach((l) => l.g.disconnect());
    }, secs * 1000 + 400);
  }

  // The full soundscape swells when the hour is found
  swell() {
    if (!this.ctx) return;
    const c = this.chapter;
    if (c) {
      this.bedTo(1, 2);
      c.layers.forEach((_l, i) => this.layerOn(i));
    }
    const now = this.ctx.currentTime;
    if (c && c.swellUrl) {
      fetch(c.swellUrl)
        .then((r) => r.arrayBuffer())
        .then((b) => this.ctx.decodeAudioData(b))
        .then((buf) => {
          const s = this.ctx.createBufferSource();
          s.buffer = buf;
          s.connect(this.master);
          s.start();
        })
        .catch(() => this._chord(now));
    } else {
      this._chord(now);
    }
  }

  _chord(now) {
    const root = 110;
    [1, 1.5, 2, 3].forEach((m, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = root * m * 2;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.05 / (i + 1), now + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      o.connect(g).connect(this.master);
      o.start(now);
      o.stop(now + 4.2);
    });
  }

  _click(freq, at, level) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(level, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + 0.06);
  }

  // Dial detent, every 15 minutes
  tick() {
    if (!this.ctx || this.muted) return;
    this._click(1800, this.ctx.currentTime, 0.05);
  }

  // Soft double-click when the dial locks on the hour
  lock() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this._click(900, t, 0.09);
    this._click(900, t + 0.09, 0.09);
  }

  // A soft, rising tone on Enter. Confirms that audio is unlocked.
  chime() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(196, t);
    o.frequency.exponentialRampToValueAtTime(293.66, t + 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 1.3);
  }
}

export const audio = new AudioBus();
