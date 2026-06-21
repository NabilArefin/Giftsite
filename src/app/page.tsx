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

  return (
    <div className={`gift-root ${isOpen ? "wish-is-open" : ""}`}>
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
          <span className="button-text">Tap here, Dear</span>
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
            <div className="moon-glow" />
            <div className="moon" />
            <div className="balloon balloon-one" />
            <div className="balloon balloon-two" />
            <div className="balloon balloon-three" />
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
            <p className="eyebrow reveal reveal--1">A little wish for you</p>
            <h1 id="wishTitle" className="display-title reveal reveal--2">
              Happy Birthday,
              <br />
              Dear
            </h1>
            <p className="lead reveal reveal--3">
              I hope your day feels as beautiful as the way you make my world feel.
              You are my favorite smile, my soft place, and my sweetest reason to
              believe in magic.
            </p>
            <p className="wish-note reveal reveal--4">
              May this new year bring you peace, confidence, beautiful surprises,
              and everything your heart has been quietly wishing for. I will keep
              cheering for you, choosing you, and loving you in every little way I
              can.
            </p>
            <p className="signature reveal reveal--5">
              Forever your biggest fan&thinsp;&hearts;
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
