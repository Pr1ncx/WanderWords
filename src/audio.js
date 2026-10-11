// Audio bus (Web Audio API).
// Browsers only allow audio after a user gesture, so nothing plays until unlock() is called
// from the Enter click. The mute choice is remembered between visits.
// Later milestones add the ambient bed, the dispatch layers and the dial ticks on top of this.
const KEY = 'ww:muted';

function readMuted() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
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
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* storage unavailable: still works for this visit */ }
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.06);
  }

  // A soft, synthesised rising tone. Confirms that audio is unlocked. No audio file needed.
  chime() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, t);
    osc.frequency.exponentialRampToValueAtTime(293.66, t + 0.9);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 1.3);
  }
}

export const audio = new AudioBus();
