
// DestinationEditorial: a destination as a premium, smooth-scrolling HTML page.
// Smooth scrolling from Lenis, Squarespace Foundations motion suite from GSAP & SplitType.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';
import { renderEditorial } from './template.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAYOUTS = ['a', 'b', 'c'];

const tween = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }));

// Codegrid Video #49: Archival Typographic Glyph Scramble
const SCRAMBLE_CHARS = '0123456789·/—ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function scrambleText(el, targetText, duration = 0.8) {
  if (!el) return () => {};
  const str = targetText || el.textContent;
  const len = str.length;
  const startTime = performance.now();
  const durMs = duration * 1000;
  let rafId = null;

  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durMs);
    const revealedCount = Math.floor(progress * len);
    let output = '';

    for (let i = 0; i < len; i++) {
      const char = str[i];
      if (char === ' ' || char === '/' || char === '·') {
        output += char;
      } else if (i < revealedCount) {
        output += char;
      } else {
        output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    el.textContent = output;

    if (progress < 1) {
      rafId = requestAnimationFrame(update);
    } else {
      el.textContent = str;
    }
  };

  rafId = requestAnimationFrame(update);
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    el.textContent = str;
  };
}

// Framer Text Reveal Scroll Helper (https://framer.com/m/text-reveal-scroll-helper-16vc5F.js@7Bke0DBIx7GpaBFlIp2X)
function initTextRevealScroll(element, scroller, options = {}) {
  if (!element) return () => {};
  const {
    revealMode = 'chars',
    dimOpacity = 0.2,
    startOffset = 90,
    endOffset = 30,
  } = options;

  const segments = [];

  function processNode(el) {
    const originalChildren = Array.from(el.childNodes);
    for (const node of originalChildren) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.length) continue;
        const frag = document.createDocumentFragment();

        if (revealMode === 'chars') {
          for (const char of text) {
            if (char === ' ') {
              frag.appendChild(document.createTextNode(' '));
            } else {
              const span = document.createElement('span');
              span.textContent = char;
              span.className = 'ed-reveal-char';
              span.style.display = 'inline';
              span.style.opacity = String(dimOpacity);
              span.style.willChange = 'opacity';
              frag.appendChild(span);
              segments.push(span);
            }
          }
        } else {
          const parts = text.split(/(\s+)/);
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement('span');
              span.textContent = part;
              span.className = 'ed-reveal-word';
              span.style.display = 'inline';
              span.style.opacity = String(dimOpacity);
              span.style.willChange = 'opacity';
              frag.appendChild(span);
              segments.push(span);
            }
          }
        }
        node.parentNode?.replaceChild(frag, node);
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const childEl = node;
      if (childEl.tagName === 'BR') {
        childEl.style.display = 'inline';
        childEl.style.opacity = String(dimOpacity);
        childEl.style.willChange = 'opacity';
        segments.push(childEl);
        continue;
      }
      processNode(childEl);
    }
  }

  processNode(element);
  if (!segments.length) return () => {};

  const total = segments.length;

  const updateReveal = (progress) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const litCount = Math.floor(clampedProgress * total);
    for (let i = 0; i < total; i++) {
      const seg = segments[i];
      if (i < litCount) {
        seg.style.opacity = '1';
      } else if (i === litCount) {
        const frac = clampedProgress * total - litCount;
        seg.style.opacity = String(dimOpacity + frac * (1 - dimOpacity));
      } else {
        seg.style.opacity = String(dimOpacity);
      }
    }
  };

  updateReveal(0);

  const st = ScrollTrigger.create({
    trigger: element,
    scroller,
    start: `top ${startOffset}%`,
    end: `bottom ${endOffset}%`,
    scrub: true,
    onUpdate: (self) => {
      updateReveal(self.progress);
    },
  });

  return () => {
    try { st.kill(); } catch (_) {}
  };
}

// =========================================================================
// KINETIC ARCHITECTURAL LETTER STRETCH (Inspired by Frank Gehry / Getty Museum)
// =========================================================================
function initKineticTitleStretch(titleEl, chars, scroller, cleanupFns) {
  if (!titleEl || !chars || !chars.length) return;

  let isHovered = false;
  const maxRadius = 260; // Proximity reach in pixels

  const onPointerMove = (e) => {
    isHovered = true;
    const clientX = e.clientX;
    const clientY = e.clientY;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - charCenterX, clientY - charCenterY);

      if (dist < maxRadius) {
        const norm = 1 - dist / maxRadius;
        // Organic non-linear rubbery vertical stretch
        const stretchY = 1 + norm * norm * 0.95; // Up to 1.95x vertical stretch
        const compressX = 1 - norm * 0.08;      // Volume conservation
        const liftY = -norm * 16;                // Upward lift from baseline

        gsap.to(char, {
          scaleY: stretchY,
          scaleX: compressX,
          y: liftY,
          duration: 0.28,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      } else {
        gsap.to(char, {
          scaleY: 1,
          scaleX: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    });
  };

  const onPointerLeave = () => {
    isHovered = false;
    gsap.to(chars, {
      scaleY: 1,
      scaleX: 1,
      y: 0,
      duration: 0.85,
      ease: 'elastic.out(1, 0.38)',
      stagger: {
        each: 0.025,
        from: 'center',
      },
      overwrite: 'auto',
    });
  };

  titleEl.addEventListener('pointermove', onPointerMove, { passive: true });
  titleEl.addEventListener('pointerleave', onPointerLeave, { passive: true });

  cleanupFns.push(() => {
    titleEl.removeEventListener('pointermove', onPointerMove);
    titleEl.removeEventListener('pointerleave', onPointerLeave);
  });

  // Scroll-tied kinetic wave: as visitor scrolls, letters stretch upward like monument pillars
  const st = ScrollTrigger.create({
    trigger: titleEl,
    scroller,
    start: 'top 35%',
    end: 'bottom top',
    scrub: 0.6,
    onUpdate: (self) => {
      if (isHovered) return;
      const p = self.progress;
      chars.forEach((char, idx) => {
        const charP = Math.max(0, Math.min(1, p * 1.6 - idx * 0.06));
        const wave = Math.sin(charP * Math.PI);
        gsap.to(char, {
          scaleY: 1 + wave * 0.55,
          y: -wave * 28,
          duration: 0.12,
          ease: 'none',
          overwrite: 'auto',
        });
      });
    },
  });

  cleanupFns.push(() => {
    try { st.kill(); } catch (_) {}
  });
}

export class DestinationEditorial {
  constructor({ root, chapters, onNext }) {
    this.root = root;
    this.chapters = chapters;
    this.onNext = onNext;
    this.ctx = null;
    this.lenis = null;
    this.tick = null;
    this.currentChapter = null;
    this.splitInstances = [];
    this.cleanupFns = [];
    gsap.set(root, { autoAlpha: 0 });
    root.setAttribute('inert', '');
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-next-stop]')) this.onNext();
    });
  }

  async open(chapter, index) {
    const root = this.root;
    this.currentChapter = chapter;
    this.teardown();

    root.innerHTML = renderEditorial(chapter, index, this.chapters);
    root.dataset.layout = LAYOUTS[index % LAYOUTS.length];
    root.dataset.scrollMode = 'spreads';
    root.style.setProperty('--stop-accent', chapter.accent);
    root.scrollTop = 0;
    root.removeAttribute('inert');

    if (!REDUCED) {
      this.lenis = new Lenis({ wrapper: root, content: root.querySelector('.ed'), lerp: 0.1 });
      this.lenis.on('scroll', ScrollTrigger.update);
      this.tick = (t) => this.lenis.raf(t * 1000);
      gsap.ticker.add(this.tick);
    }
    this.ctx = gsap.context(() => this.animate(), root);

    await tween(root, { autoAlpha: 1, duration: REDUCED ? 0.2 : 0.8, ease: 'power2.out' });
    ScrollTrigger.refresh();
    const title = root.querySelector('.ed-hero__title');
    if (title) title.focus({ preventScroll: true });
  }

  async close() {
    await tween(this.root, { autoAlpha: 0, duration: REDUCED ? 0.15 : 0.65, ease: 'power2.inOut' });
    this.root.setAttribute('inert', '');
    this.teardown();
    this.root.innerHTML = '';
  }

  animate() {
    if (REDUCED) return;
    const scroller = this.root;
    const all = (sel) => gsap.utils.toArray(sel, this.root);
    const isSrinagar = this.currentChapter?.id === 'srinagar';

    // =========================================================================
    // 0. ATMOSPHERIC ACCENT GRADIENT MESH (Codegrid Video #19)
    // =========================================================================
    const ambientMesh = scroller.querySelector('.ed-ambient-mesh');
    if (ambientMesh) {
      const onMouseMoveMesh = (e) => {
        const x = ((e.clientX / window.innerWidth) * 100).toFixed(1);
        const y = ((e.clientY / window.innerHeight) * 100).toFixed(1);
        gsap.to(ambientMesh, {
          '--mesh-x': `${x}%`,
          '--mesh-y': `${y}%`,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };
      scroller.addEventListener('mousemove', onMouseMoveMesh, { passive: true });
      this.cleanupFns.push(() => scroller.removeEventListener('mousemove', onMouseMoveMesh));

      gsap.to(ambientMesh, {
        opacity: 0.08,
        ease: 'none',
        scrollTrigger: {
          scroller,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }

    // =========================================================================
    // 1. HERO PORTAL, 3D CHARACTER REVEAL & GLYPH SCRAMBLE (Codegrid Video #49)
    // =========================================================================
    const introTl = gsap.timeline({ delay: 0.1 });

    const heroTitle = scroller.querySelector('.ed-hero__title');
    if (heroTitle) {
      const splitTitle = new SplitType(heroTitle, { types: 'chars' });
      this.splitInstances.push(splitTitle);

      introTl.fromTo(splitTitle.chars,
        {
          opacity: 0,
          yPercent: 100,
          rotationX: -45,
          transformOrigin: '50% 100%',
        },
        {
          opacity: 1,
          yPercent: 0,
          rotationX: 0,
          duration: 1.05,
          stagger: 0.035,
          ease: 'power3.out',
          onComplete: () => {
            initKineticTitleStretch(heroTitle, splitTitle.chars, scroller, this.cleanupFns);
          },
        }
      );
    }

    const heroEyebrow = scroller.querySelector('.ed-hero__eyebrow');
    if (heroEyebrow) {
      const targetText = heroEyebrow.textContent;
      introTl.call(() => {
        const cancel = scrambleText(heroEyebrow, targetText, 0.85);
        this.cleanupFns.push(cancel);
      }, null, '-=0.8');
    }

    const heroTextEls = ['.ed-hero__eyebrow', '.ed-hero__tag'].map((sel) => scroller.querySelector(sel)).filter(Boolean);
    if (heroTextEls.length) {
      introTl.from(heroTextEls, {
        opacity: 0,
        y: 25,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
      }, '-=0.7');
    }

    const heroFrame = scroller.querySelector('[data-hero-frame]');
    if (heroFrame) {
      if (isSrinagar) {
        // High-performance Srinagar Canvas Hero Sequence:
        // Pinned sticky canvas scrubs through all 320 frames during the hero track scroll.
        // The next section remains below the fold until all frames are finished, then comes up.
        const heroCanvas = scroller.querySelector('#ed-hero-canvas, [data-hero-canvas]');
        if (heroCanvas) {
          const ctx = heroCanvas.getContext('2d', { alpha: false });
          const frameCount = parseInt(heroCanvas.dataset.frameCount || '320', 10);
          const base = heroCanvas.dataset.frameBase || '/media/srinagar/hero-frames/frame_';
          const ext = heroCanvas.dataset.frameExt || '.webp';
          const pad = parseInt(heroCanvas.dataset.framePad || '4', 10);

          const images = new Array(frameCount);
          const loaded = new Array(frameCount).fill(false);
          let currentDrawnIndex = -1;
          let rafId = null;
          let isCancelled = false;

          const getFrameUrl = (idx) => `${base}${String(idx + 1).padStart(pad, '0')}${ext}`;

          const drawFrame = (idx) => {
            if (idx === currentDrawnIndex) return;
            let drawIdx = idx;
            if (!loaded[drawIdx]) {
              for (let offset = 1; offset <= 35; offset++) {
                if (drawIdx - offset >= 0 && loaded[drawIdx - offset]) {
                  drawIdx = drawIdx - offset;
                  break;
                }
                if (drawIdx + offset < frameCount && loaded[drawIdx + offset]) {
                  drawIdx = drawIdx + offset;
                  break;
                }
              }
              if (!loaded[drawIdx]) drawIdx = 0;
            }

            const img = images[drawIdx];
            if (img && img.complete && img.naturalWidth) {
              ctx.drawImage(img, 0, 0, heroCanvas.width, heroCanvas.height);
              currentDrawnIndex = drawIdx;
            }
          };

          // Load first frame immediately
          images[0] = new Image();
          images[0].decoding = 'async';
          images[0].onload = () => {
            loaded[0] = true;
            drawFrame(0);
          };
          images[0].src = getFrameUrl(0);

          // Progressive background chunk loader
          let preloadIndex = 1;
          const preloadBatch = () => {
            if (isCancelled) return;
            const end = Math.min(frameCount, preloadIndex + 14);
            for (let i = preloadIndex; i < end; i++) {
              if (!images[i]) {
                const img = new Image();
                img.decoding = 'async';
                const fi = i;
                img.onload = () => { loaded[fi] = true; };
                img.src = getFrameUrl(i);
                images[i] = img;
              }
            }
            preloadIndex = end;
            if (preloadIndex < frameCount) {
              if ('requestIdleCallback' in window) {
                requestIdleCallback(preloadBatch, { timeout: 150 });
              } else {
                setTimeout(preloadBatch, 25);
              }
            }
          };
          setTimeout(preloadBatch, 60);

          const trackEl = scroller.querySelector('.ed-hero-track');
          const heroGrid = scroller.querySelector('.ed-hero__grid');
          const stretchContent = scroller.querySelector('.stretch-content, .titleStretch__content');
          const heroDesc = scroller.querySelector('.editorialHero__description');
          const cutoutCol = scroller.querySelector('.editorialHero__cutoutCol');

          const updateCanvasPlayback = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
              rafId = null;
              const scroll = (this.lenis ? this.lenis.scroll : scroller.scrollTop) || 0;
              const vh = window.innerHeight;
              const trackHeight = trackEl ? trackEl.offsetHeight : vh * 2.6;
              const playbackDistance = Math.max(1, trackHeight - vh);

              const progress = Math.min(Math.max(scroll / playbackDistance, 0), 1);
              const targetIndex = Math.min(frameCount - 1, Math.floor(progress * (frameCount - 1)));

              drawFrame(targetIndex);

              if (heroGrid) {
                const fadeProgress = Math.min(1, progress / 0.18);
                heroGrid.style.opacity = `${Math.max(0, 1 - fadeProgress * 1.4)}`;
                heroGrid.style.transform = `translateY(${-fadeProgress * 35}px)`;
                heroGrid.style.pointerEvents = fadeProgress >= 0.8 ? 'none' : 'auto';
              }

              // After hero sequence finishes and Section 2 scrolls up
              if (scroll > playbackDistance) {
                const sec2Progress = Math.min(1, Math.max(0, (scroll - playbackDistance) / vh));
                if (stretchContent) {
                  const currentScaleY = Math.max(1.22, 2.45 - sec2Progress * 1.23);
                  stretchContent.style.transform = `scaleY(${currentScaleY.toFixed(4)})`;
                }
                if (heroDesc) {
                  const descProgress = Math.min(1, Math.max(0, (sec2Progress - 0.15) / 0.65));
                  heroDesc.style.opacity = `${descProgress}`;
                  heroDesc.style.transform = `scaleX(1.08) translateY(${(1 - descProgress) * 14}px)`;
                  heroDesc.style.transformOrigin = 'right bottom';
                }
                if (cutoutCol) {
                  const cutoutProgress = Math.min(1, Math.max(0, (sec2Progress - 0.08) / 0.65));
                  cutoutCol.style.opacity = `${cutoutProgress}`;
                  cutoutCol.style.transform = `translateY(${(1 - cutoutProgress) * 18}px)`;
                }
              }
            });
          };

          scroller.addEventListener('scroll', updateCanvasPlayback, { passive: true });
          this.cleanupFns.push(() => {
            isCancelled = true;
            scroller.removeEventListener('scroll', updateCanvasPlayback);
            if (rafId) cancelAnimationFrame(rafId);
          });
          if (this.lenis) {
            this.lenis.on('scroll', updateCanvasPlayback);
            this.cleanupFns.push(() => this.lenis?.off('scroll', updateCanvasPlayback));
          }
          window.addEventListener('resize', updateCanvasPlayback, { passive: true });
          this.cleanupFns.push(() => window.removeEventListener('resize', updateCanvasPlayback));

          updateCanvasPlayback();
        }
      } else {
        gsap.to(heroFrame, {
          scale: 0.92,
          yPercent: 10,
          borderRadius: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: '.ed-hero',
            scroller,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }

    // =========================================================================
    // GSAP MATCHMEDIA: DESKTOP PHYSICS VS MOBILE FALLBACK
    // =========================================================================
    const mm = gsap.matchMedia();

    mm.add('(min-width: 769px)', () => {
      // 2. EDITORIAL COORDINATED FADE-AND-SLIDE (Sections 2 & 6)
      // 2. OVERVIEW SECTION: METADATA & FRAMER TEXT REVEAL SCROLL
      const introSec = scroller.querySelector('.ed-intro');
      if (introSec) {
        const meta = introSec.querySelector('.ed-meta');
        if (meta) {
          gsap.fromTo(meta,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power3.out',
              scrollTrigger: { trigger: introSec, scroller, start: 'top 82%', once: true },
            }
          );
        }

        // Apply Framer Text Reveal Scroll Helper exclusively to text in overview section
        const revealElements = Array.from(introSec.querySelectorAll('[data-text-reveal]'));
        revealElements.forEach((el) => {
          const cleanup = initTextRevealScroll(el, scroller, {
            revealMode: 'chars',
            dimOpacity: 0.2,
            startOffset: 90,
            endOffset: 30,
          });
          this.cleanupFns.push(cleanup);
        });
      }

      const tipsSec = scroller.querySelector('.ed-tips');
      if (tipsSec) {
        const leadTitle = tipsSec.querySelector('.ed-tips__lead h3');
        const leadBody = tipsSec.querySelector('.ed-tips__lead .ed-body');
        const facts = Array.from(tipsSec.querySelectorAll('.ed-fact'));

        const splitTipsBody = leadBody ? new SplitType(leadBody, { types: 'lines' }) : null;
        if (splitTipsBody) this.splitInstances.push(splitTipsBody);

        const tipsTl = gsap.timeline({
          scrollTrigger: { trigger: tipsSec, scroller, start: 'top 78%', once: true },
        });

        if (leadTitle) {
          tipsTl.fromTo(leadTitle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
        }
        if (splitTipsBody?.lines) {
          tipsTl.fromTo(splitTipsBody.lines,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1.0, stagger: 0.12, ease: 'power3.out' },
            '+=0.15'
          );
        }
        if (facts.length) {
          tipsTl.fromTo(facts,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out' },
            '-=0.4'
          );
        }
      }

      // 3. ATTRACTIONS EDITORIAL SPREADS (Section 3: Attractions)
      // Getty Gehry "Sails of Steel" Kinetic Title Stretch Entrance
      const placesSec = scroller.querySelector('.ed-places');
      if (placesSec) {
        const placesHeading = placesSec.querySelector('#ed-places-h');
        if (placesHeading) {
          const splitPlaces = new SplitType(placesHeading, { types: 'chars' });
          this.splitInstances.push(splitPlaces);

          if (isSrinagar) {
            gsap.fromTo(splitPlaces.chars,
              {
                opacity: 0,
                scaleY: 1.85,
                scaleX: 0.85,
                y: 50,
                rotationX: -30,
                transformOrigin: '50% 100%',
              },
              {
                opacity: 1,
                scaleY: 1,
                scaleX: 1,
                y: 0,
                rotationX: 0,
                duration: 1.15,
                stagger: 0.025,
                ease: 'elastic.out(1, 0.65)',
                scrollTrigger: {
                  trigger: placesSec,
                  scroller,
                  start: 'top 80%',
                  once: true,
                },
                onComplete: () => {
                  initKineticTitleStretch(placesHeading, splitPlaces.chars, scroller, this.cleanupFns);
                },
              }
            );

            // Lenis scroll velocity dynamic letter stretch (Gehry TitleStretch.5198f629.js)
            if (this.lenis) {
              const heroTitle = scroller.querySelector('.ed-hero__title');
              const heroChars = heroTitle ? Array.from(heroTitle.querySelectorAll('.char')) : [];
              const onLenisScroll = (e) => {
                const vel = Math.min(Math.abs(e.velocity || 0), 25);
                if (vel > 1.2) {
                  const stretch = 1 + (vel / 25) * 0.42;
                  const compress = 1 / Math.sqrt(stretch);
                  if (heroChars.length) {
                    gsap.to(heroChars, { scaleY: stretch, scaleX: compress, duration: 0.12, overwrite: 'auto' });
                  }
                  if (splitPlaces.chars.length) {
                    gsap.to(splitPlaces.chars, { scaleY: stretch, scaleX: compress, duration: 0.12, overwrite: 'auto' });
                  }
                } else {
                  if (heroChars.length) {
                    gsap.to(heroChars, { scaleY: 1, scaleX: 1, duration: 0.35, overwrite: 'auto' });
                  }
                  if (splitPlaces.chars.length) {
                    gsap.to(splitPlaces.chars, { scaleY: 1, scaleX: 1, duration: 0.35, overwrite: 'auto' });
                  }
                }
              };
              this.lenis.on('scroll', onLenisScroll);
              this.cleanupFns.push(() => this.lenis?.off('scroll', onLenisScroll));
            }
          } else {
            gsap.fromTo(splitPlaces.chars,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.85,
                stagger: 0.02,
                ease: 'power3.out',
                scrollTrigger: { trigger: placesSec, scroller, start: 'top 85%', once: true },
              }
            );
          }
        }
      }

      all('.ed-spread').forEach((spread) => {
        const textGroup = spread.querySelector('.ed-spread__text');
        const textChildren = textGroup ? Array.from(textGroup.children) : [];

        if (textChildren.length) {
          gsap.fromTo(textChildren,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: spread, scroller, start: 'top 80%', once: true },
            }
          );
        }
      });

      // Accent-Block Shutter Wipe on Spread Polaroids (Codegrid Videos #75 & #78)
      all('.ed-spread .ed-polaroid').forEach((polaroid) => {
        const curtain = polaroid.querySelector('.ed-shutter-curtain');
        const photo = polaroid.querySelector('.ed-polaroid__img');
        const tape = polaroid.querySelector('.ed-polaroid__tape');
        const caption = polaroid.querySelector('.ed-polaroid__caption');

        if (curtain && photo) {
          gsap.set(curtain, { scaleX: 0, transformOrigin: '0% 50%' });
          gsap.set(photo, { opacity: 0 });
          if (tape) gsap.set(tape, { opacity: 0, scale: 0.85 });
          if (caption) gsap.set(caption, { opacity: 0, y: 6 });

          const wipeTl = gsap.timeline({
            scrollTrigger: {
              trigger: polaroid,
              scroller,
              start: 'top 82%',
              once: true,
            },
          });

          wipeTl
            .to(curtain, {
              scaleX: 1,
              duration: 0.42,
              ease: 'power3.inOut',
            })
            .set(photo, { opacity: 1 })
            .set(curtain, { transformOrigin: '100% 50%' })
            .to(curtain, {
              scaleX: 0,
              duration: 0.42,
              ease: 'power3.inOut',
            })
            .to([tape, caption].filter(Boolean), {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.1,
              ease: 'power2.out',
            }, '-=0.2');
        }
      });

      // 4. SCROLL-TIED ROTATIONAL TILT (Standalone Image)
      const foodPolaroid = scroller.querySelector('.ed-food__img .ed-polaroid');
      if (foodPolaroid) {
        foodPolaroid.classList.add('ed-tilt-target');
        gsap.fromTo(foodPolaroid,
          { rotationZ: -4, scale: 0.96 },
          {
            rotationZ: 4.5,
            scale: 1.05,
            ease: 'none',
            scrollTrigger: {
              trigger: foodPolaroid.closest('.ed-food') || foodPolaroid,
              scroller,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      }
    });

    mm.add('(max-width: 768px)', () => {
      // Mobile fallback: lightweight fade reveals (no aggressive image fly-ups)
      all('.ed-intro .ed-meta, .ed-spread__text, .ed-fest, .ed-tips').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, scroller, start: 'top 85%', once: true },
          }
        );
      });
      all('.ed-polaroid').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, scroller, start: 'top 85%', once: true },
          }
        );
      });
    });

    // =========================================================================
    // 5. PERFECTED COORDINATED WIPE & FOOD SHUTTER (Section 4: Local Food)
    // =========================================================================
    const foodSec = scroller.querySelector('.ed-food');
    if (foodSec) {
      const foodText = foodSec.querySelector('.ed-food__text');
      const foodFig = foodSec.querySelector('.ed-food__fig');
      const headingH2 = foodSec.querySelector('.ed-h');
      const title = foodText?.querySelector('h3');
      const body = foodText?.querySelector('.ed-body');
      const tags = Array.from(foodText?.querySelectorAll('.ed-tags li') || []);
      const foodTextElements = [headingH2, title, body, ...tags].filter(Boolean);
      const foodPolaroid = foodFig?.querySelector('.ed-polaroid');
      const curtain = foodPolaroid?.querySelector('.ed-shutter-curtain');
      const photo = foodPolaroid?.querySelector('.ed-polaroid__img');
      const tape = foodPolaroid?.querySelector('.ed-polaroid__tape');
      const caption = foodPolaroid?.querySelector('.ed-polaroid__caption');

      // Keep strictly hidden until the dark panel fully covers the screen
      gsap.set(foodTextElements, { opacity: 0, y: 35 });
      if (foodFig) gsap.set(foodFig, { opacity: 0 });
      if (curtain && photo) {
        gsap.set(curtain, { scaleX: 0, transformOrigin: '0% 50%' });
        gsap.set(photo, { opacity: 0 });
        if (tape) gsap.set(tape, { opacity: 0 });
        if (caption) gsap.set(caption, { opacity: 0, y: 6 });
      }

      // Trigger ONLY when the dark panel reaches top: 0
      ScrollTrigger.create({
        trigger: foodSec,
        scroller,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(foodTextElements, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            stagger: 0.12,
            ease: 'power3.out',
          });
          if (foodFig) {
            gsap.to(foodFig, {
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
              onComplete: () => {
                if (curtain && photo) {
                  gsap.timeline()
                    .to(curtain, { scaleX: 1, duration: 0.42, ease: 'power3.inOut' })
                    .set(photo, { opacity: 1 })
                    .set(curtain, { transformOrigin: '100% 50%' })
                    .to(curtain, { scaleX: 0, duration: 0.42, ease: 'power3.inOut' })
                    .to([tape, caption].filter(Boolean), {
                      opacity: 1,
                      y: 0,
                      duration: 0.45,
                      stagger: 0.1,
                      ease: 'power2.out',
                    }, '-=0.2');
                }
              },
            });
          }
        },
      });

      if (isSrinagar) {
        const placesSec = scroller.querySelector('.ed-places');
        if (placesSec) {
          gsap.to(placesSec, {
            scale: 0.94,
            opacity: 0.45,
            ease: 'none',
            scrollTrigger: {
              trigger: foodSec,
              scroller,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          });
        }
      } else {
        // Soft background wash for other stops
        gsap.fromTo(foodSec,
          { backgroundColor: 'rgba(250, 247, 242, 1)' },
          {
            backgroundColor: 'rgba(239, 232, 220, 0.9)',
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: foodSec,
              scroller,
              start: 'top 75%',
              end: 'center center',
              scrub: true,
            },
          }
        );
      }
    }

    // =========================================================================
    // 6. FESTIVALS & ARCHIVAL SCRAMBLE (Codegrid Video #49)
    // =========================================================================
    const festSec = scroller.querySelector('.ed-fest');
    if (festSec) {
      const headingH2 = festSec.querySelector('.ed-h');
      const cards = Array.from(festSec.querySelectorAll('.ed-fest__card'));

      if (headingH2) {
        gsap.fromTo(headingH2,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: festSec, scroller, start: 'top 82%', once: true },
          }
        );
      }

      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: festSec,
              scroller,
              start: 'top 78%',
              once: true,
              onEnter: () => {
                cards.forEach((card, idx) => {
                  const numEl = card.querySelector('.ed-fest__num');
                  if (numEl) {
                    const timer = setTimeout(() => {
                      const cancel = scrambleText(numEl, numEl.textContent, 0.65);
                      this.cleanupFns.push(cancel);
                    }, idx * 120);
                    this.cleanupFns.push(() => clearTimeout(timer));
                  }
                });
              },
            },
          }
        );
      }
    }

    // =========================================================================
    // 7. NEXT STOP: MAGNETIC PULL & CURSOR PREVIEW (Codegrid Videos #42, #52, #73)
    // =========================================================================
    const nextSec = scroller.querySelector('.ed-next');
    if (nextSec) {
      const nextBtn = nextSec.querySelector('.ed-next__btn');
      const preview = nextSec.querySelector('[data-next-preview]');
      const nextName = nextSec.querySelector('.ed-next__name');
      const nextArrow = nextSec.querySelector('.ed-next__arrow');
      const nextLabel = nextSec.querySelector('.ed-next__label');

      const nextBtnElements = [nextLabel, nextName].filter(Boolean);

      gsap.fromTo(nextBtnElements,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: nextSec, scroller, start: 'top 85%', once: true },
        }
      );

      if (nextBtn) {
        let xTo, yTo, rotTo;
        if (preview) {
          gsap.set(preview, { scale: 0.88, rotation: 0 });
          xTo = gsap.quickTo(preview, 'x', { duration: 0.45, ease: 'power3.out' });
          yTo = gsap.quickTo(preview, 'y', { duration: 0.45, ease: 'power3.out' });
          rotTo = gsap.quickTo(preview, 'rotation', { duration: 0.45, ease: 'power3.out' });
        }

        const onMouseEnter = (e) => {
          if (preview) {
            const offsetX = (e.clientX > window.innerWidth - 300) ? -270 : 24;
            const offsetY = (e.clientY > window.innerHeight - 250) ? -160 : -40;
            gsap.set(preview, { x: e.clientX + offsetX, y: e.clientY + offsetY });
            gsap.to(preview, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
        };

        const onMouseMove = (e) => {
          if (preview && xTo && yTo) {
            const offsetX = (e.clientX > window.innerWidth - 300) ? -270 : 24;
            const offsetY = (e.clientY > window.innerHeight - 250) ? -160 : -40;
            xTo(e.clientX + offsetX);
            yTo(e.clientY + offsetY);
            const tilt = Math.max(-6, Math.min(6, (e.movementX || 0) * 0.45));
            if (rotTo) rotTo(tilt);
          }

          // Magnetic Pull on button text & arrow
          const rect = nextBtn.getBoundingClientRect();
          const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

          if (nextName) {
            gsap.to(nextName, {
              x: relX * 22,
              y: relY * 10,
              duration: 0.4,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
          if (nextArrow) {
            gsap.to(nextArrow, {
              x: relX * 38,
              y: relY * 14,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
        };

        const onMouseLeave = () => {
          if (preview) {
            gsap.to(preview, {
              autoAlpha: 0,
              scale: 0.88,
              rotation: 0,
              duration: 0.25,
              ease: 'power2.in',
              overwrite: 'auto',
            });
          }
          if (nextName) {
            gsap.to(nextName, {
              x: 0,
              y: 0,
              duration: 0.7,
              ease: 'elastic.out(1, 0.35)',
              overwrite: 'auto',
            });
          }
          if (nextArrow) {
            gsap.to(nextArrow, {
              x: 0,
              y: 0,
              duration: 0.7,
              ease: 'elastic.out(1, 0.35)',
              overwrite: 'auto',
            });
          }
        };

        nextBtn.addEventListener('mouseenter', onMouseEnter);
        nextBtn.addEventListener('mousemove', onMouseMove);
        nextBtn.addEventListener('mouseleave', onMouseLeave);

        this.cleanupFns.push(() => {
          nextBtn.removeEventListener('mouseenter', onMouseEnter);
          nextBtn.removeEventListener('mousemove', onMouseMove);
          nextBtn.removeEventListener('mouseleave', onMouseLeave);
        });
      }
    }

    // Universal Parallax & Progress Bar
    all('[data-parallax]').forEach((el) => {
      const s = parseFloat(el.dataset.parallax) || 6;
      gsap.fromTo(el, { yPercent: -s }, {
        yPercent: s, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, scroller, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    gsap.to('.ed-progress__bar', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { scroller, start: 0, end: 'max', scrub: 0.2 },
    });
  }

  teardown() {
    if (this.cleanupFns) {
      this.cleanupFns.forEach((fn) => {
        try { fn(); } catch (_) {}
      });
      this.cleanupFns = [];
    }
    if (this.ctx) { this.ctx.revert(); this.ctx = null; }
    if (this.tick) { gsap.ticker.remove(this.tick); this.tick = null; }
    if (this.lenis) { this.lenis.destroy(); this.lenis = null; }
    this.splitInstances.forEach((s) => {
      try { s.revert(); } catch (_) {}
    });
    this.splitInstances = [];
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
