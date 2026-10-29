"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";

export interface Greeting {
  text: string;
  script?: string;
  language: string;
  color?: string;
}

interface DynamicTextProps {
  onComplete?: () => void;
  greetingList?: Greeting[];
  intervalMs?: number;
}

export const defaultGreetings: Greeting[] = [
  { text: "Hello", script: "", language: "English", color: "#1E293B" },
  { text: "Adaab", script: "آداب", language: "Kashmiri · Srinagar", color: "#B45309" },
  { text: "Namaste", script: "नमस्ते", language: "Pahari · Manali", color: "#047857" },
  { text: "Sat Sri Akal", script: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", language: "Punjabi · Amritsar", color: "#C2410C" },
  { text: "Khamma Ghani", script: "खम्मा घणी", language: "Rajasthani · Jaipur", color: "#DC2626" },
  { text: "Adaab", script: "آداب", language: "Urdu · Agra", color: "#7C3AED" },
  { text: "Deo Boro Dis", script: "देव बरे करूं", language: "Konkani · Goa", color: "#0284C7" },
  { text: "Namaskaram", script: "നമസ്കാരം", language: "Malayalam · Munnar", color: "#16A34A" },
  { text: "Kuzuzangpo", script: "कुजुज़ांग्पो", language: "Sikkimese · Gangtok", color: "#E11D48" },
  { text: "Kem Cho", script: "કેમ છો", language: "Gujarati · Kutch", color: "#EA580C" },
  { text: "Khublei", script: "", language: "Khasi · Shillong", color: "#0D9488" },
];

const FALLBACK_COLORS = [
  "#1E293B",
  "#B45309",
  "#047857",
  "#C2410C",
  "#DC2626",
  "#7C3AED",
  "#0284C7",
  "#16A34A",
  "#E11D48",
  "#EA580C",
  "#0D9488",
];

function parseGreeting(raw: Greeting) {
  let primary = raw.text;
  let script = raw.script || "";
  if (!script && raw.text.includes("·")) {
    const parts = raw.text.split("·").map((s) => s.trim());
    primary = parts[0];
    script = parts[1] || "";
  }
  return { primary, script, language: raw.language, color: raw.color };
}

function DynamicText({
  onComplete,
  greetingList,
  intervalMs = 650,
}: DynamicTextProps) {
  const greetings =
    greetingList && greetingList.length > 0 ? greetingList : defaultGreetings;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex: number) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= greetings.length) {
          clearInterval(interval);
          setIsAnimating(false);
          if (onComplete) onComplete();
          return prevIndex;
        }
        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAnimating, greetings, onComplete, intervalMs]);

  const rawGreeting = greetings[currentIndex] || greetings[0];
  const { primary, script, language } = parseGreeting(rawGreeting);
  const currentColor =
    rawGreeting?.color || FALLBACK_COLORS[currentIndex % FALLBACK_COLORS.length];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        minHeight: "180px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "visible",
      }}
      aria-label="Cultural greetings across India"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(3px)" }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
          }}
        >
          {/* Glowing accent dot */}
          <div
            style={{
              width: "11px",
              height: "11px",
              borderRadius: "9999px",
              backgroundColor: currentColor,
              boxShadow: `0 0 14px ${currentColor}55`,
              marginBottom: "0.85rem",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            }}
            aria-hidden="true"
          />

          {/* Primary Latin/Roman phonetic greeting */}
          <h2
            className="font-serif italic"
            style={{
              margin: 0,
              color: currentColor,
              fontSize: "clamp(2.75rem, 6.5vw, 4.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              transition: "color 0.3s ease",
            }}
          >
            {primary}
          </h2>

          {/* Authentic native regional script */}
          <div
            style={{
              minHeight: "2.4rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "0.35rem",
            }}
          >
            {script ? (
              <p
                style={{
                  margin: 0,
                  color: currentColor,
                  fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
                  lineHeight: 1.25,
                  fontWeight: 500,
                  opacity: 0.85,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                  transition: "color 0.3s ease",
                }}
              >
                {script}
              </p>
            ) : null}
          </div>

          {/* Region / Provenance indicator */}
          <span
            className="font-mono"
            style={{
              fontSize: "11px",
              lineHeight: "16px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--ink, #0E0C0A)",
              opacity: 0.52,
              marginTop: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            {language}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function GreetingPreloader({
  greetings,
  intervalMs = 650,
  fullPage = true,
  onFinish,
}: {
  greetings?: Greeting[];
  intervalMs?: number;
  fullPage?: boolean;
  onFinish?: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap.set(overlay, { y: 0 });

    if (!fullPage) return;

    overlay.style.zIndex = "11000";
    gsap.set(overlay, { zIndex: 11000 });
    gsap.set("#navbar, .ctrl", { autoAlpha: 0, y: -20 });
    gsap.set("#main-content h1, #main-content h2, #intro .intro__card", {
      autoAlpha: 0,
      y: 30,
    });
    gsap.set("#projectHeader", { autoAlpha: 0, y: 20 });
    gsap.set("#hr", {
      autoAlpha: 0,
      scaleX: 0,
      width: "100%",
      transformOrigin: "center center",
    });
  }, [fullPage]);

  const handleComplete = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const tl = gsap.timeline({
      defaults: { ease: "power2.out", duration: 0.8 },
      onComplete: () => {
        setDone(true);
        if (onFinish) onFinish();
      },
    });

    tl.to(overlay, { yPercent: -110, duration: 1 });

    if (!fullPage) return;

    tl.to(
      "#navbar, .ctrl",
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05 },
      "-=0.6"
    );
    tl.to(
      "#main-content h1, #main-content h2, #intro .intro__card",
      { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.8 },
      "-=0.4"
    );
    tl.to("#projectHeader", { y: 0, autoAlpha: 1, duration: 0.6 }, "-=0.4");
    tl.to(
      "#hr",
      {
        scaleX: 1,
        autoAlpha: 1,
        duration: 0.8,
        transformOrigin: "center center",
      },
      "-=0.4"
    );
  };

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: fullPage ? "fixed" : "absolute",
        inset: 0,
        zIndex: 11000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--cream, #FAF7F2)",
        overflow: "hidden",
      }}
    >
      <DynamicText
        onComplete={handleComplete}
        greetingList={greetings}
        intervalMs={intervalMs}
      />
    </div>
  );
}
