import gsap from 'gsap';

// Sound synthesis using Web Audio API for an authentic, zero-latency Indian train pass-by
let audioCtx = null;
function playTrainPassSound(duration = 2.2) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;

    // 1. Dual-tone Indian Railways air horn (subtle, atmospheric at the beginning)
    const hornFrequencies = [311.13, 370.0, 466.16]; // Eb chord tone
    hornFrequencies.forEach((freq, idx) => {
      const hornOsc = audioCtx.createOscillator();
      const hornGain = audioCtx.createGain();
      hornOsc.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(freq, t);

      const hFilter = audioCtx.createBiquadFilter();
      hFilter.type = 'lowpass';
      hFilter.frequency.setValueAtTime(1200, t);

      hornGain.gain.setValueAtTime(0.0001, t);
      hornGain.gain.linearRampToValueAtTime(0.045, t + 0.15 + idx * 0.02);
      hornGain.gain.linearRampToValueAtTime(0.035, t + 0.7);
      hornGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

      hornOsc.connect(hFilter);
      hFilter.connect(hornGain);
      hornGain.connect(audioCtx.destination);

      hornOsc.start(t + 0.05);
      hornOsc.stop(t + 1.2);
    });

    // 2. Heavy iron rail rumble (low bass vibration)
    const rumbleOsc = audioCtx.createOscillator();
    const rumbleGain = audioCtx.createGain();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(42, t);
    rumbleOsc.frequency.linearRampToValueAtTime(58, t + duration * 0.45);
    rumbleOsc.frequency.exponentialRampToValueAtTime(32, t + duration);

    const rumbleFilter = audioCtx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(130, t);

    rumbleGain.gain.setValueAtTime(0.001, t);
    rumbleGain.gain.linearRampToValueAtTime(0.24, t + duration * 0.4);
    rumbleGain.gain.linearRampToValueAtTime(0.22, t + duration * 0.65);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.2);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(audioCtx.destination);

    rumbleOsc.start(t);
    rumbleOsc.stop(t + duration + 0.3);

    // 3. High-velocity wind rush / whoosh (filtered white noise)
    const bufferSize = audioCtx.sampleRate * (duration + 0.2);
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(250, t);
    noiseFilter.frequency.linearRampToValueAtTime(800, t + duration * 0.5);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, t + duration);
    noiseFilter.Q.setValueAtTime(1.8, t);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.28, t + duration * 0.45);
    noiseGain.gain.linearRampToValueAtTime(0.25, t + duration * 0.65);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration + 0.1);
  } catch (err) {
    // Non-critical: audio plays on user gesture or fails silently if blocked
  }
}

let overlayEl = null;
let trackEl = null;

function ensureOverlay() {
  if (overlayEl) return { overlayEl, trackEl };

  overlayEl = document.createElement('div');
  overlayEl.id = 'trainWipeOverlay';
  overlayEl.className = 'train-wipe-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  // Chained consist of 4 coaches so the train pass feels long, continuous, and unhurried
  overlayEl.innerHTML = `
    <div class="train-wipe-track">
      <img class="train-wipe-car" src="/media/indian-train-wipe.png" alt="" draggable="false" />
      <img class="train-wipe-car" src="/media/indian-train-wipe.png" alt="" draggable="false" />
      <img class="train-wipe-car" src="/media/indian-train-wipe.png" alt="" draggable="false" />
      <img class="train-wipe-car" src="/media/indian-train-wipe.png" alt="" draggable="false" />
    </div>
    <div class="train-wipe-vignette"></div>
  `;

  document.body.appendChild(overlayEl);
  trackEl = overlayEl.querySelector('.train-wipe-track');
  return { overlayEl, trackEl };
}

/**
 * Runs the cinematic Indian Train side cutout speed-wipe transition
 * @param {Object} options
 * @param {Function} options.onMidpoint - Callback executed when the train wall completely blankets the screen
 * @param {number} [options.duration=2.4] - Total duration in seconds (comfortable full express train pass)
 */
export function playTrainWipe({ onMidpoint = () => {}, duration = 2.4 } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    return Promise.resolve().then(async () => {
      await onMidpoint();
    });
  }

  const { overlayEl, trackEl } = ensureOverlay();
  playTrainPassSound(duration);

  return new Promise((resolve) => {
    overlayEl.style.display = 'block';

    const screenW = window.innerWidth;
    // Calculate total length of the 4 coaches
    const trackW = trackEl.scrollWidth || screenW * 4.5;

    // Camera shake target (the destination container)
    const destinationEl = document.getElementById('destination');
    let midpointCalled = false;

    // Timeline setup
    const tl = gsap.timeline({
      onComplete: () => {
        overlayEl.style.display = 'none';
        gsap.set(destinationEl, { clearProps: 'x,y' });
        resolve();
      },
    });

    // 1. Tactile camera rumble on destination container as the heavy train thunders past
    if (destinationEl) {
      tl.to(destinationEl, {
        y: () => (Math.random() - 0.5) * 8,
        x: () => (Math.random() - 0.5) * 4,
        duration: 0.05,
        repeat: Math.floor(duration * 14),
        yoyo: true,
        ease: 'none',
      }, 0.2);
    }

    // 2. High-speed express train movement: smooth, steady velocity across the screen
    tl.fromTo(
      trackEl,
      {
        x: -trackW,
      },
      {
        x: screenW + 80,
        duration,
        ease: 'power1.inOut', // Smoother, steadier motion so coaches remain clearly visible and admired
        onUpdate: function () {
          // Trigger midpoint swap when the train body completely blankets the viewport (~50% mark)
          if (!midpointCalled && this.progress() >= 0.5) {
            midpointCalled = true;
            try {
              onMidpoint();
            } catch (err) {
              console.error('Error during train wipe midpoint swap:', err);
            }
          }
        },
      },
      0
    );
  });
}
