"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./gift.css";

type ParticleShape = "heart" | "dot" | "star" | "circle" | "square";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  age: number;
  color: string;
  shape: ParticleShape;
  spin: number;
  gravity: number;
  wobble: number;
  wobbleSpeed: number;
};

type CreateOptions = {
  burst?: boolean;
  trail?: boolean;
  confetti?: boolean;
};

const PALETTE = ["#e34f6f", "#ff8c72", "#f5c85b", "#9ed7c1", "#7b61ff", "#ffffff"];
const AMBIENT_PALETTE = PALETTE.slice(0, PALETTE.length - 1); // exclude white for ambient

function createParticle(x: number, y: number, opts: CreateOptions = {}): Particle {
  const isBurst = opts.burst || false;
  const isTrail = opts.trail || false;
  const isConfetti = opts.confetti || false;

  const angle = Math.random() * Math.PI * 2;
  let speed: number;
  if (isBurst) {
    speed = 2.4 + Math.random() * 4.6;
  } else if (isTrail) {
    speed = 0.3 + Math.random() * 0.8;
  } else {
    speed = 0.4 + Math.random() * 1.4;
  }

  const shapes: ParticleShape[] = isConfetti
    ? ["star", "circle", "square"]
    : ["heart", "dot"];

  return {
    x,
    y,
    vx: isConfetti
      ? Math.cos(angle) * (1 + Math.random() * 3)
      : Math.cos(angle) * speed,
    vy: isConfetti
      ? Math.sin(angle) * (1 + Math.random() * 3) - 2
      : Math.sin(angle) * speed - (isBurst ? 2 : 0),
    size: isBurst
      ? 5 + Math.random() * 7
      : isTrail
        ? 1.5 + Math.random() * 3
        : isConfetti
          ? 3 + Math.random() * 5
          : 2 + Math.random() * 4,
    life: isBurst
      ? 90 + Math.random() * 50
      : isTrail
        ? 40 + Math.random() * 40
        : isConfetti
          ? 100 + Math.random() * 80
          : 140 + Math.random() * 120,
    age: 0,
    color: isConfetti
      ? PALETTE[Math.floor(Math.random() * PALETTE.length)]
      : AMBIENT_PALETTE[Math.floor(Math.random() * AMBIENT_PALETTE.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    spin: Math.random() * Math.PI,
    gravity: isConfetti ? 0.06 : isTrail ? 0.01 : 0.018,
    wobble: isConfetti ? 0.08 : 0,
    wobbleSpeed: 0.05 + Math.random() * 0.05,
  };
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  spin: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.scale(size / 18, size / 18);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-16, -4, -8, -18, 0, -9);
  ctx.bezierCurveTo(8, -18, 16, -4, 0, 6);
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  spin: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + (2 * Math.PI) / 10;
    if (i === 0) {
      ctx.moveTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
    } else {
      ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
    }
    ctx.lineTo(
      Math.cos(innerAngle) * size * 0.45,
      Math.sin(innerAngle) * size * 0.45,
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  spin: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = Math.max(0, 1 - p.age / p.life);
  if (alpha <= 0) return;

  switch (p.shape) {
    case "heart":
      drawHeart(ctx, p.x, p.y, p.size * 2.2, p.color, alpha, p.spin);
      break;
    case "star":
      drawStar(ctx, p.x, p.y, p.size, p.color, alpha, p.spin);
      break;
    case "square":
      drawSquare(ctx, p.x, p.y, p.size, p.color, alpha, p.spin);
      break;
    default: {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

export default function GiftPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const mouseRef = useRef({ x: -100, y: -100, last: 0 });
  const reducedRef = useRef(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = reducedMotionMQ.matches;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sizeRef.current = { w, h };
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Ambient particles (rising from bottom)
      if (
        !reducedRef.current &&
        particlesRef.current.length < 100 &&
        Math.random() > 0.62
      ) {
        particlesRef.current.push(createParticle(Math.random() * w, h + 20));
      }

      particlesRef.current = particlesRef.current.filter((p) => p.age < p.life);

      for (const p of particlesRef.current) {
        p.age += 1;
        p.x += p.vx + Math.sin(p.age * p.wobbleSpeed) * p.wobble;
        p.y += p.vy;
        p.vy += p.gravity;
        p.spin += 0.02;
        drawParticle(ctx, p);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    reducedMotionMQ.addEventListener("change", onMotionChange);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (reducedRef.current) return;
      const now = performance.now();
      if (now - mouseRef.current.last < 40) return; // throttle ~25fps
      mouseRef.current.last = now;
      particlesRef.current.push(
        createParticle(mouseRef.current.x, mouseRef.current.y, { trail: true }),
      );
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      reducedMotionMQ.removeEventListener("change", onMotionChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const burstHearts = useCallback(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h * 0.38;
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push(createParticle(cx, cy, { burst: true }));
    }
  }, []);

  const burstConfetti = useCallback(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h * 0.35;
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push(createParticle(cx, cy, { confetti: true }));
    }
  }, []);

  const openWish = useCallback(() => {
    setIsOpen(true);
    burstHearts();
    window.setTimeout(burstConfetti, 200);
  }, [burstHearts, burstConfetti]);

  const closeWish = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeWish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeWish]);

  // Magical wand cursor — smooth follow with easing, velocity tilt, click sparkles.
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      cursor.style.display = "none";
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: -200, y: -200 };
    const current = { x: -200, y: -200 };
    const velocity = { x: 0, y: 0 };
    let hasMoved = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        current.x = e.clientX;
        current.y = e.clientY;
        cursor.classList.remove("is-hidden");
      }
      const el = e.target as HTMLElement | null;
      if (el && el.closest("button, a, [role='button']")) {
        cursor.classList.add("is-active");
      } else {
        cursor.classList.remove("is-active");
      }
    };
    const onDown = () => {
      cursor.classList.add("is-pressed");
      // Emit sparkle burst on click from wand tip position
      if (!reduced) {
        const tipX = current.x;
        const tipY = current.y;
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push(createParticle(tipX, tipY, { trail: true }));
        }
      }
    };
    const onUp = () => cursor.classList.remove("is-pressed");
    const onLeave = () => cursor.classList.add("is-hidden");
    const onEnter = () => {
      if (hasMoved) cursor.classList.remove("is-hidden");
    };

    const tick = () => {
      if (reduced) {
        current.x = target.x;
        current.y = target.y;
      } else {
        const prevX = current.x;
        const prevY = current.y;
        current.x += (target.x - current.x) * 0.28;
        current.y += (target.y - current.y) * 0.28;
        velocity.x = current.x - prevX;
        velocity.y = current.y - prevY;
      }

      // Velocity-based tilt: wand leans in direction of movement
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      let tiltAngle = -8; // default rest angle
      if (speed > 1.5) {
        const moveAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
        // Map movement direction to wand tilt (subtle lean)
        tiltAngle = -8 + velocity.x * 0.8;
        tiltAngle = Math.max(-30, Math.min(20, tiltAngle));
      }
      cursor.style.transform = `translate3d(${current.x - 10}px, ${
        current.y - 10
      }px, 0)`;
      // Apply velocity tilt via CSS custom property
      cursor.style.setProperty("--wand-tilt", `${tiltAngle}deg`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`gift-root ${isOpen ? "wish-is-open" : ""}`}>
      <div ref={cursorRef} className="magic-cursor is-hidden" aria-hidden="true">
        <svg className="magic-wand" width="56" height="56" viewBox="0 0 56 56" fill="none">
          <defs>
            <linearGradient id="wandShaft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9a0f0" />
              <stop offset="30%" stopColor="#a06bd6" />
              <stop offset="65%" stopColor="#5a3d7d" />
              <stop offset="100%" stopColor="#2a1b29" />
            </linearGradient>
            <radialGradient id="wandTip" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#fff7e0" />
              <stop offset="45%" stopColor="#fff7ad" />
              <stop offset="70%" stopColor="#f5c85b" />
              <stop offset="100%" stopColor="#ff8c72" />
            </radialGradient>
            <radialGradient id="wandOuterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245,200,91,0.35)" />
              <stop offset="50%" stopColor="rgba(255,140,114,0.15)" />
              <stop offset="100%" stopColor="rgba(255,140,114,0)" />
            </radialGradient>
            <filter id="wandGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Soft outer glow aura */}
          <circle className="wand-aura" cx="10" cy="10" r="18" fill="url(#wandOuterGlow)" />
          {/* Inner halo */}
          <circle className="wand-halo" cx="10" cy="10" r="9" fill="url(#wandTip)" />
          {/* Tiny sparkle dots around the star */}
          <circle className="sparkle-dot sd-1" cx="2" cy="6" r="0.8" fill="#fff7ad" />
          <circle className="sparkle-dot sd-2" cx="18" cy="5" r="0.6" fill="#ffffff" />
          <circle className="sparkle-dot sd-3" cx="4" cy="16" r="0.7" fill="#ff8c72" />
          <circle className="sparkle-dot sd-4" cx="16" cy="15" r="0.5" fill="#f5c85b" />
          <circle className="sparkle-dot sd-5" cx="10" cy="0" r="0.6" fill="#ffffff" />
          {/* Shaft with gradient */}
          <line x1="12" y1="12" x2="44" y2="44" stroke="url(#wandShaft)" strokeWidth="4" strokeLinecap="round" />
          {/* Handle base */}
          <line x1="38" y1="38" x2="50" y2="50" stroke="#2a1b29" strokeWidth="7" strokeLinecap="round" />
          {/* Gold grip rings */}
          <line x1="40" y1="40" x2="42" y2="42" stroke="#f5c85b" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="44" x2="46" y2="46" stroke="#f5c85b" strokeWidth="2" strokeLinecap="round" />
          {/* Star tip with glow filter */}
          <path
            className="wand-star"
            d="M 10,2 L 11.88,7.41 L 17.61,7.53 L 13.04,10.99 L 14.70,16.47 L 10,13.2 L 5.30,16.47 L 6.96,10.99 L 2.39,7.53 L 8.12,7.41 Z"
            fill="url(#wandTip)"
            filter="url(#wandGlow)"
          />
          {/* Hover ring (shown when is-active) */}
          <circle className="hover-ring" cx="10" cy="10" r="14" fill="none" stroke="rgba(245,200,91,0.5)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>

      <canvas ref={canvasRef} className="sparkle-canvas" aria-hidden="true" />

      <div className="stars-layer" aria-hidden="true">
        <span className="star star--1" />
        <span className="star star--2" />
        <span className="star star--3" />
        <span className="star star--4" />
        <span className="star star--5" />
        <span className="star star--6" />
        <span className="star star--7" />
        <span className="star star--8" />
        <span className="star star--9" />
        <span className="star star--10" />
        <span className="star star--11" />
        <span className="star star--12" />
      </div>

      <main className="page-shell">
        <button
          type="button"
          className="open-button"
          onClick={openWish}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="wishPopup"
        >
          <span className="button-shimmer" />
          <span className="button-text">Tap here</span>
        </button>
      </main>

      <section
        id="wishPopup"
        className={`wish-popup ${isOpen ? "open" : ""}`}
        aria-label="Birthday wish"
        aria-hidden={!isOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeWish();
        }}
      >
        <div
          className="popup-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wishTitle"
        >
          <button
            type="button"
            className="close-button"
            onClick={closeWish}
            aria-label="Close birthday wish"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>

          <div className="cake-scene" aria-hidden="true">
            <div className="balloon balloon-one" />
            <div className="balloon balloon-two" />
            <div className="balloon balloon-three" />
            <div className="balloon balloon-four" />
            <div className="cake">
              <div className="candles">
                <span />
                <span />
                <span />
              </div>
              <div className="cake-top" />
              <div className="cake-mid" />
              <div className="cake-bottom" />
              <div className="plate" />
            </div>
            <div className="confetti-burst" />
          </div>

          <div className="wish-copy">
            <h1 id="wishTitle" className="display-title reveal reveal--2">
              Happy Birthday
              <br />
              Nuha
            </h1>
            <p className="wish-note reveal reveal--3">
              I hope your day feels as beautiful as the way you make my world feel.
              You are my favorite smile, my soft place, and my sweetest reason to
              believe in magic. May this new year bring you peace, confidence,
              beautiful surprises, and everything your heart has been quietly
              wishing for. I will keep cheering for you, choosing you, and loving
              you in every little way I can.
            </p>
            <p className="signature reveal reveal--5">
              I&thinsp;&hearts;&thinsp;U
            </p>
          </div>
        </div>
      </section>

      <footer className="gift-footer">
        <span>
          Made with <span className="heart-dot">&hearts;</span> just for you
        </span>
      </footer>
    </div>
  );
}
