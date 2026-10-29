"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './traveler-auth.css';

export interface Passenger {
  name: string;
  email: string;
  pnr: string;
  originStopId: string;
  originStopName: string;
  travelClass: '1A' | '2A' | 'SL';
  dateIssued: string;
  isGuest?: boolean;
}

const STOPS = [
  { id: 'srinagar', num: '01', name: 'Srinagar', code: 'SXR', state: 'Kashmir', accent: '#2E5E73' },
  { id: 'manali', num: '02', name: 'Manali', code: 'MNL', state: 'Himachal', accent: '#3D5A40' },
  { id: 'amritsar', num: '03', name: 'Amritsar', code: 'ASR', state: 'Punjab', accent: '#C2410C' },
  { id: 'jaipur', num: '04', name: 'Jaipur', code: 'JPR', state: 'Rajasthan', accent: '#DC2626' },
  { id: 'agra', num: '05', name: 'Agra', code: 'AGC', state: 'Uttar Pradesh', accent: '#7C3AED' },
  { id: 'goa', num: '06', name: 'Goa', code: 'MAO', state: 'Konkan', accent: '#0284C7' },
  { id: 'munnar', num: '07', name: 'Munnar', code: 'MNR', state: 'Kerala', accent: '#16A34A' },
  { id: 'gangtok', num: '08', name: 'Gangtok', code: 'GTK', state: 'Sikkim', accent: '#E11D48' },
  { id: 'kutch', num: '09', name: 'Rann of Kutch', code: 'KTC', state: 'Gujarat', accent: '#EA580C' },
  { id: 'shillong', num: '10', name: 'Shillong', code: 'SHL', state: 'Meghalaya', accent: '#0D9488' },
];

const CLASS_DETAILS = {
  '1A': { name: 'First Class AC', code: '1A', coach: 'HA-1 / Coupe B', color: '#F2B632' },
  '2A': { name: 'Heritage Coupé', code: '2A', coach: 'A-2 / Berth 08', color: '#E08E2B' },
  'SL': { name: 'Explorer Saloon', code: 'SL', coach: 'S-4 / Window 14', color: '#B5523B' },
};

// --- Web Audio Synthesizer for Tactile Vintage Railway Feedback ---
class RailwaySoundFx {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Soft mechanical key click
  typeClick() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 400;
      filter.Q.value = 4;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 + Math.random() * 80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio fails silently if blocked
    }
  }

  // Heavy rubber stamp punch
  stampPunch() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Low frequency thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);

      // High frequency paper impact snap
      const snap = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snap.type = 'square';
      snap.frequency.setValueAtTime(800, t);
      snap.frequency.exponentialRampToValueAtTime(120, t + 0.05);

      snapGain.gain.setValueAtTime(0.08, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      snap.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snap.start(t);
      snap.stop(t + 0.07);
    } catch {
      // ignore
    }
  }

  // Arrival / success chime
  successChime() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const t = this.ctx!.currentTime + i * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {
      // ignore
    }
  }
}

const sfx = new RailwaySoundFx();

interface TravelerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (passenger: Passenger) => void;
  onStartJourney?: () => void;
  initialMode?: 'signup' | 'signin';
}

export default function TravelerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onStartJourney,
  initialMode = 'signup',
}: TravelerAuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot' | 'success'>(initialMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedStopId, setSelectedStopId] = useState<string>('jaipur');
  const [travelClass, setTravelClass] = useState<'1A' | '2A' | 'SL'>('1A');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activePassenger, setActivePassenger] = useState<Passenger | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [telegraphSent, setTelegraphSent] = useState<boolean>(false);

  const ticketRef = useRef<HTMLDivElement>(null);

  // Load existing passenger on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wanderwords_passenger');
      if (saved) {
        const parsed = JSON.parse(saved);
        setActivePassenger(parsed);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.originStopId) setSelectedStopId(parsed.originStopId);
        if (parsed.travelClass) setTravelClass(parsed.travelClass);
      }
    } catch {
      // ignore
    }
  }, []);

  // Update mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (activePassenger) {
        setMode('success');
      } else {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialMode, activePassenger]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derived Stop
  const currentStop = STOPS.find((s) => s.id === selectedStopId) || STOPS[3];
  const classInfo = CLASS_DETAILS[travelClass];

  // Dynamic PNR Code
  const pnrCode = React.useMemo(() => {
    if (activePassenger?.pnr) return activePassenger.pnr;
    const base = name ? name.replace(/\s+/g, '').toUpperCase().slice(0, 3) : 'WW';
    const num = Math.floor(1000 + ((name.length * 379 + selectedStopId.length * 43) % 8999));
    return `${base}-${num}-IN`;
  }, [name, selectedStopId, activePassenger]);

  // Password Signal Strength (0 = none, 1 = red/weak, 2 = amber/fair, 3 = green/strong)
  const passwordStrength = React.useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8 && /[0-9]/.test(password)) score++;
    if (password.length >= 10 && /[^A-Za-z0-9]/.test(password)) score++;
    return Math.max(1, score);
  }, [password]);

  // 3D Parallax Tilt Handler on the Boarding Pass
  const handleTicketMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ticketRef.current) return;
    const rect = ticketRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rx = ((y - centerY) / centerY) * -10;
    const ry = ((x - centerX) / centerX) * 12;
    setTilt({ rx, ry });
  };

  const handleTicketMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    sfx.stampPunch();

    setTimeout(() => {
      const passenger: Passenger = {
        name: name.trim() || 'Distinguished Traveler',
        email: email.trim() || 'traveler@wanderwords.in',
        pnr: pnrCode,
        originStopId: currentStop.id,
        originStopName: currentStop.name,
        travelClass,
        dateIssued: 'OCT 2026',
        isGuest: false,
      };

      if (rememberMe) {
        localStorage.setItem('wanderwords_passenger', JSON.stringify(passenger));
      }
      setActivePassenger(passenger);
      setIsSubmitting(false);
      setMode('success');
      sfx.successChime();

      if (onSuccess) onSuccess(passenger);

      // Dispatch global event so header buttons can update immediately
      window.dispatchEvent(new CustomEvent('wanderwords:passenger_updated', { detail: passenger }));
    }, 600);
  };

  // Quick Guest Pass Handler
  const handleGuestPass = () => {
    setIsSubmitting(true);
    sfx.stampPunch();

    setTimeout(() => {
      const guestPassenger: Passenger = {
        name: 'Guest Explorer',
        email: 'guest@wanderwords.in',
        pnr: `EXP-${Math.floor(1000 + Math.random() * 9000)}-IN`,
        originStopId: currentStop.id,
        originStopName: currentStop.name,
        travelClass: '1A',
        dateIssued: 'OCT 2026',
        isGuest: true,
      };

      localStorage.setItem('wanderwords_passenger', JSON.stringify(guestPassenger));
      setActivePassenger(guestPassenger);
      setIsSubmitting(false);
      setMode('success');
      sfx.successChime();

      if (onSuccess) onSuccess(guestPassenger);
      window.dispatchEvent(new CustomEvent('wanderwords:passenger_updated', { detail: guestPassenger }));
    }, 450);
  };

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('wanderwords_passenger');
    setActivePassenger(null);
    setName('');
    setEmail('');
    setPassword('');
    setMode('signup');
    sfx.typeClick();
    window.dispatchEvent(new CustomEvent('wanderwords:passenger_updated', { detail: null }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="ww-auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="ww-auth-modal"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Gold Stripe */}
          <div className="ww-auth-gold-stripe" />

          {/* Close Button */}
          <button
            className="ww-auth-close"
            onClick={onClose}
            aria-label="Close traveler sign in"
          >
            ✕
          </button>

          {/* If successfully confirmed or logged in */}
          {mode === 'success' && activePassenger ? (
            <div className="ww-auth-success">
              <motion.div
                className="ww-success-seal"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              >
                ★
              </motion.div>

              <h2 className="ww-success-title">
                <em>Welcome aboard,</em> {activePassenger.name}
              </h2>
              <p className="ww-success-sub">
                Your Indian Railways Passenger Pass is verified and stamped for all 10 stops.
                Carriage: <strong>{CLASS_DETAILS[activePassenger.travelClass]?.coach || '1A'}</strong> ·
                Origin: <strong>{activePassenger.originStopName}</strong>.
              </p>

              {/* Render the confirmed ticket in full glory */}
              <div
                className="ww-ticket-wrapper"
                ref={ticketRef}
                onMouseMove={handleTicketMouseMove}
                onMouseLeave={handleTicketMouseLeave}
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  marginBottom: '28px',
                }}
              >
                <div className="ww-ticket-card">
                  <div className="ww-ticket-perforation" />

                  <div className="ww-ticket-top">
                    <div className="ww-ticket-brand">
                      WANDERWORDS EXPRESS
                      <small>Indian Railways · Issue 01</small>
                    </div>
                    <div className="ww-ticket-pnr-badge">
                      PNR RECORD
                      <strong>{activePassenger.pnr}</strong>
                    </div>
                  </div>

                  <div className="ww-ticket-route">
                    <div className="ww-route-station">
                      <span className="ww-route-label">ORIGIN</span>
                      <span className="ww-route-code">{currentStop.code}</span>
                      <span className="ww-route-city">{activePassenger.originStopName}</span>
                    </div>
                    <div className="ww-route-train">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 18L19 18M19 18L13 12M19 18L13 24" />
                      </svg>
                      <span>10 STOPS</span>
                    </div>
                    <div className="ww-route-station right">
                      <span className="ww-route-label">TERMINUS</span>
                      <span className="ww-route-code">SHL</span>
                      <span className="ww-route-city">Shillong</span>
                    </div>
                  </div>

                  <div className="ww-ticket-passenger">
                    <div className="ww-ticket-pass-label">PASSENGER NAME</div>
                    <div className="ww-ticket-pass-name handwritten">
                      {activePassenger.name}
                    </div>
                  </div>

                  <div className="ww-ticket-info-grid">
                    <div className="ww-info-item">
                      <dt>CLASS</dt>
                      <dd>{activePassenger.travelClass} · {CLASS_DETAILS[activePassenger.travelClass]?.name}</dd>
                    </div>
                    <div className="ww-info-item">
                      <dt>CARRIAGE</dt>
                      <dd>{CLASS_DETAILS[activePassenger.travelClass]?.coach.split('/')[0]}</dd>
                    </div>
                    <div className="ww-info-item">
                      <dt>STATUS</dt>
                      <dd style={{ color: '#16A34A' }}>CONFIRMED</dd>
                    </div>
                  </div>

                  <div className="ww-ticket-stub">
                    <div className="ww-ticket-barcode-wrap">
                      <svg className="ww-ticket-barcode" viewBox="0 0 160 36">
                        <rect x="0" y="0" width="4" height="36" fill="#0E0C0A" />
                        <rect x="6" y="0" width="2" height="36" fill="#0E0C0A" />
                        <rect x="11" y="0" width="6" height="36" fill="#0E0C0A" />
                        <rect x="20" y="0" width="2" height="36" fill="#0E0C0A" />
                        <rect x="25" y="0" width="4" height="36" fill="#0E0C0A" />
                        <rect x="33" y="0" width="8" height="36" fill="#0E0C0A" />
                        <rect x="44" y="0" width="3" height="36" fill="#0E0C0A" />
                        <rect x="50" y="0" width="5" height="36" fill="#0E0C0A" />
                        <rect x="58" y="0" width="2" height="36" fill="#0E0C0A" />
                        <rect x="64" y="0" width="7" height="36" fill="#0E0C0A" />
                        <rect x="74" y="0" width="4" height="36" fill="#0E0C0A" />
                        <rect x="82" y="0" width="2" height="36" fill="#0E0C0A" />
                        <rect x="88" y="0" width="5" height="36" fill="#0E0C0A" />
                        <rect x="96" y="0" width="8" height="36" fill="#0E0C0A" />
                        <rect x="108" y="0" width="3" height="36" fill="#0E0C0A" />
                        <rect x="115" y="0" width="6" height="36" fill="#0E0C0A" />
                        <rect x="124" y="0" width="2" height="36" fill="#0E0C0A" />
                        <rect x="130" y="0" width="5" height="36" fill="#0E0C0A" />
                        <rect x="139" y="0" width="4" height="36" fill="#0E0C0A" />
                        <rect x="146" y="0" width="6" height="36" fill="#0E0C0A" />
                        <rect x="156" y="0" width="4" height="36" fill="#0E0C0A" />
                      </svg>
                      <span className="ww-ticket-barcode-num">WW·{activePassenger.pnr}·VALID·2026</span>
                    </div>

                    <motion.div
                      className="ww-ticket-stamp"
                      initial={{ scale: 2.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.9 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 220 }}
                    >
                      <span className="ww-stamp-stars">★ ★ ★</span>
                      <span className="ww-stamp-text">CONFIRMED</span>
                      <span className="ww-stamp-loc">{currentStop.code} · IN</span>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="ww-success-actions">
                <button
                  className="ww-submit-btn"
                  style={{ width: 'auto', padding: '14px 36px' }}
                  onClick={() => {
                    onClose();
                    if (onStartJourney) onStartJourney();
                  }}
                >
                  <span>Board Train & Continue Journey ↗</span>
                </button>

                <button
                  className="ww-alt-btn"
                  onClick={handleSignOut}
                >
                  Switch Passenger / Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Main Form Grid */
            <div className="ww-auth-grid">
              {/* Left Column: Form */}
              <div className="ww-auth-form-pane">
                <div>
                  <div className="ww-auth-header">
                    <div className="ww-auth-eyebrow">WanderWords Gazette · Passenger Log</div>
                    <h2 className="ww-auth-title">
                      <em>The</em> {mode === 'signup' ? 'PASSENGER PASS' : mode === 'signin' ? 'CHECK-IN' : 'TELEGRAPH DESK'}
                    </h2>
                    <p className="ww-auth-sub">
                      {mode === 'signup'
                        ? 'Register your berth across ten Indian destinations.'
                        : mode === 'signin'
                        ? 'Present your traveler credentials to resume your journey.'
                        : 'Send a wire dispatch to recover your traveler passcode.'}
                    </p>
                  </div>

                  {/* Mode Switcher Tabs */}
                  {mode !== 'forgot' && (
                    <div className="ww-auth-tabs">
                      <button
                        type="button"
                        className={`ww-auth-tab-btn ${mode === 'signup' ? 'is-active' : ''}`}
                        onClick={() => {
                          setMode('signup');
                          sfx.typeClick();
                        }}
                      >
                        Issue Travel Pass
                      </button>
                      <button
                        type="button"
                        className={`ww-auth-tab-btn ${mode === 'signin' ? 'is-active' : ''}`}
                        onClick={() => {
                          setMode('signin');
                          sfx.typeClick();
                        }}
                      >
                        Passenger Check-In
                      </button>
                    </div>
                  )}

                  {/* Forgot Password Flow */}
                  {mode === 'forgot' ? (
                    <div className="ww-auth-fields">
                      <div className="ww-field-group">
                        <label className="ww-field-label">
                          <span>Telegraph Dispatch (Email)</span>
                        </label>
                        <div className="ww-input-wrap">
                          <input
                            type="email"
                            className="ww-input"
                            placeholder="passenger@wanderwords.in"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              sfx.typeClick();
                            }}
                            required
                          />
                        </div>
                      </div>

                      {telegraphSent ? (
                        <div style={{ padding: '14px', background: '#F4EFE6', borderRadius: '6px', border: '1px solid #16A34A', color: '#16A34A', fontSize: '13px' }}>
                          ✓ Telegraph wire dispatched to <strong>{email}</strong>. Check your inbox for recovery instructions.
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="ww-submit-btn"
                        onClick={() => {
                          setTelegraphSent(true);
                          sfx.stampPunch();
                        }}
                      >
                        <span>Send Wire Recovery ↗</span>
                      </button>

                      <button
                        type="button"
                        className="ww-alt-btn"
                        style={{ marginTop: '10px' }}
                        onClick={() => {
                          setMode('signin');
                          setTelegraphSent(false);
                          sfx.typeClick();
                        }}
                      >
                        Return to Check-In
                      </button>
                    </div>
                  ) : (
                    /* Sign Up / Sign In Form */
                    <form onSubmit={handleSubmit} className="ww-auth-fields">
                      {mode === 'signup' && (
                        <div className="ww-field-group">
                          <label className="ww-field-label">
                            <span>Passenger Full Name</span>
                            <span className="ww-label-tag">Appears on ticket</span>
                          </label>
                          <div className="ww-input-wrap">
                            <input
                              type="text"
                              className="ww-input"
                              placeholder="e.g. Arjun Dev / Maya Sen"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                sfx.typeClick();
                              }}
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="ww-field-group">
                        <label className="ww-field-label">
                          <span>Telegraph Email</span>
                          <span className="ww-label-tag">Dispatches & stories</span>
                        </label>
                        <div className="ww-input-wrap">
                          <input
                            type="email"
                            className="ww-input"
                            placeholder="traveler@wanderwords.in"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              sfx.typeClick();
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="ww-field-group">
                        <label className="ww-field-label">
                          <span>Secret Passcode</span>
                          <span className="ww-label-tag">Secure berth</span>
                        </label>
                        <div className="ww-input-wrap">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="ww-input"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              sfx.typeClick();
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="ww-pw-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                          >
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Railway Signal Lamp - Password Strength Meter */}
                        {password && (
                          <div className="ww-signal-meter">
                            <div className="ww-signals">
                              <span className={`ww-signal-dot red ${passwordStrength >= 1 ? 'active' : ''}`} />
                              <span className={`ww-signal-dot amber ${passwordStrength >= 2 ? 'active' : ''}`} />
                              <span className={`ww-signal-dot green ${passwordStrength >= 3 ? 'active' : ''}`} />
                            </div>
                            <span className="ww-signal-desc">
                              {passwordStrength === 1 && 'Signal: Red · Minimum 8 chars recommended'}
                              {passwordStrength === 2 && 'Signal: Amber · Good for local passage'}
                              {passwordStrength === 3 && 'Signal: Clear Line · First Class Security'}
                            </span>
                          </div>
                        )}
                      </div>

                      {mode === 'signup' && (
                        <>
                          {/* Origin Station Picker */}
                          <div className="ww-field-group">
                            <label className="ww-field-label">
                              <span>Origin Station / Favorite Stop</span>
                              <span className="ww-label-tag">10 destinations</span>
                            </label>
                            <div className="ww-stops-grid">
                              {STOPS.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className={`ww-stop-chip ${selectedStopId === s.id ? 'is-selected' : ''}`}
                                  onClick={() => {
                                    setSelectedStopId(s.id);
                                    sfx.typeClick();
                                  }}
                                >
                                  <span className="ww-stop-chip-num">{s.num} · {s.code}</span>
                                  <span className="ww-stop-chip-name">{s.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Class / Berth Selector */}
                          <div className="ww-field-group">
                            <label className="ww-field-label">
                              <span>Carriage Class</span>
                              <span className="ww-label-tag">{classInfo.coach}</span>
                            </label>
                            <div className="ww-class-row">
                              {(['1A', '2A', 'SL'] as const).map((cls) => (
                                <button
                                  key={cls}
                                  type="button"
                                  className={`ww-class-btn ${travelClass === cls ? 'is-active' : ''}`}
                                  onClick={() => {
                                    setTravelClass(cls);
                                    sfx.typeClick();
                                  }}
                                >
                                  <span className="ww-class-code">{CLASS_DETAILS[cls].code}</span>
                                  <span className="ww-class-name">{CLASS_DETAILS[cls].name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Extras: Remember me & Forgot Password */}
                      <div className="ww-form-extras">
                        <label className="ww-checkbox-label">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>Keep berth reserved</span>
                        </label>

                        {mode === 'signin' && (
                          <button
                            type="button"
                            className="ww-forgot-btn"
                            onClick={() => {
                              setMode('forgot');
                              sfx.typeClick();
                            }}
                          >
                            Lost telegraph code?
                          </button>
                        )}
                      </div>

                      {/* Primary Submission Button */}
                      <button
                        type="submit"
                        className="ww-submit-btn"
                        disabled={isSubmitting}
                      >
                        <span>
                          {isSubmitting
                            ? 'Stamping Pass...'
                            : mode === 'signup'
                            ? 'Stamp & Issue Travel Pass ↗'
                            : 'Verify Credentials & Board ↗'}
                        </span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Secondary Fast Action Options */}
                {mode !== 'forgot' && (
                  <div className="ww-alt-options">
                    <div className="ww-divider">
                      <span>or board immediately</span>
                    </div>

                    <div className="ww-alt-btns">
                      <button
                        type="button"
                        className="ww-alt-btn"
                        onClick={handleGuestPass}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        <span>Guest Explorer</span>
                      </button>

                      <button
                        type="button"
                        className="ww-alt-btn"
                        onClick={() => {
                          // Quick Google mock fill
                          setName('Maya Sen');
                          setEmail('maya.sen@gmail.com');
                          setPassword('wanderwords1928');
                          sfx.stampPunch();
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.18 0 10.03 0 12s.46 3.82 1.26 5.41l4.02-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z"/>
                        </svg>
                        <span>Google Pass</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Boarding Pass Preview */}
              <div className="ww-auth-ticket-pane">
                <div className="ww-ticket-lead">
                  <span className="ww-live-dot" />
                  <span>Interactive Boarding Pass Preview</span>
                </div>

                <div
                  className="ww-ticket-wrapper"
                  ref={ticketRef}
                  onMouseMove={handleTicketMouseMove}
                  onMouseLeave={handleTicketMouseLeave}
                  style={{
                    transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  }}
                >
                  <div className="ww-ticket-card">
                    <div className="ww-ticket-perforation" />

                    <div className="ww-ticket-top">
                      <div className="ww-ticket-brand">
                        WANDERWORDS EXPRESS
                        <small>Indian Railways · Special Pass</small>
                      </div>
                      <div className="ww-ticket-pnr-badge">
                        PNR CODE
                        <strong>{pnrCode}</strong>
                      </div>
                    </div>

                    <div className="ww-ticket-route">
                      <div className="ww-route-station">
                        <span className="ww-route-label">ORIGIN</span>
                        <span className="ww-route-code">{currentStop.code}</span>
                        <span className="ww-route-city">{currentStop.name}</span>
                      </div>
                      <div className="ww-route-train">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 18L19 18M19 18L13 12M19 18L13 24" />
                        </svg>
                        <span>10 STOPS</span>
                      </div>
                      <div className="ww-route-station right">
                        <span className="ww-route-label">TERMINUS</span>
                        <span className="ww-route-code">SHL</span>
                        <span className="ww-route-city">Shillong</span>
                      </div>
                    </div>

                    <div className="ww-ticket-passenger">
                      <div className="ww-ticket-pass-label">PASSENGER RECORD</div>
                      <div className="ww-ticket-pass-name handwritten">
                        {name || 'Traveler Unknown'}
                      </div>
                    </div>

                    <div className="ww-ticket-info-grid">
                      <div className="ww-info-item">
                        <dt>CLASS</dt>
                        <dd>{travelClass} · {classInfo.name}</dd>
                      </div>
                      <div className="ww-info-item">
                        <dt>CARRIAGE</dt>
                        <dd>{classInfo.coach.split('/')[0]}</dd>
                      </div>
                      <div className="ww-info-item">
                        <dt>DEPARTURE</dt>
                        <dd>OCT 2026</dd>
                      </div>
                    </div>

                    <div className="ww-ticket-stub">
                      <div className="ww-ticket-barcode-wrap">
                        <svg className="ww-ticket-barcode" viewBox="0 0 160 36">
                          <rect x="0" y="0" width="4" height="36" fill="#0E0C0A" />
                          <rect x="6" y="0" width="2" height="36" fill="#0E0C0A" />
                          <rect x="11" y="0" width="6" height="36" fill="#0E0C0A" />
                          <rect x="20" y="0" width="2" height="36" fill="#0E0C0A" />
                          <rect x="25" y="0" width="4" height="36" fill="#0E0C0A" />
                          <rect x="33" y="0" width="8" height="36" fill="#0E0C0A" />
                          <rect x="44" y="0" width="3" height="36" fill="#0E0C0A" />
                          <rect x="50" y="0" width="5" height="36" fill="#0E0C0A" />
                          <rect x="58" y="0" width="2" height="36" fill="#0E0C0A" />
                          <rect x="64" y="0" width="7" height="36" fill="#0E0C0A" />
                          <rect x="74" y="0" width="4" height="36" fill="#0E0C0A" />
                          <rect x="82" y="0" width="2" height="36" fill="#0E0C0A" />
                          <rect x="88" y="0" width="5" height="36" fill="#0E0C0A" />
                          <rect x="96" y="0" width="8" height="36" fill="#0E0C0A" />
                          <rect x="108" y="0" width="3" height="36" fill="#0E0C0A" />
                          <rect x="115" y="0" width="6" height="36" fill="#0E0C0A" />
                          <rect x="124" y="0" width="2" height="36" fill="#0E0C0A" />
                          <rect x="130" y="0" width="5" height="36" fill="#0E0C0A" />
                          <rect x="139" y="0" width="4" height="36" fill="#0E0C0A" />
                          <rect x="146" y="0" width="6" height="36" fill="#0E0C0A" />
                          <rect x="156" y="0" width="4" height="36" fill="#0E0C0A" />
                        </svg>
                        <span className="ww-ticket-barcode-num">WW·{pnrCode}·VALID</span>
                      </div>

                      <div className="ww-ticket-stamp unconfirmed">
                        <span className="ww-stamp-stars">★ ★ ★</span>
                        <span className="ww-stamp-text">UNCONFIRMED</span>
                        <span className="ww-stamp-loc">{currentStop.code} · IN</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ marginTop: '16px', fontSize: '11.5px', color: '#8C8275', textAlign: 'center', maxWidth: '300px', lineHeight: '1.4' }}>
                  Interactive live pass: values reflect inputs in real-time. Stamp applies automatically on completion.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
