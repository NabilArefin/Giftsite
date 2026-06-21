"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./gift.css";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  age: number;
  color: string;
  shape: "heart" | "dot";
  spin: number;
  spinSpeed: number;
};

const PALETTE = ["#e34f6f", "#ff8c72", "#f5c85b", "#9ed7c1", "#ffffff"];

function createParticle(x: number, y: number, burst = false): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 2.4 + Math.random() * 4.6 : 0.4 + Math.random() * 1.4;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (burst ? 2 : 0),
    size: burst ? 5 + Math.random() * 7 : 2 + Math.random() * 4,
    life: burst ? 90 + Math.random() * 50 : 140 + Math.random() * 120,
    age: 0,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    shape: Math.random() > 0.54 ? "heart" : "dot",
    spin: Math.random() * Math.PI,
    spinSpeed: (Math.random() - 0.5) * 0.08,
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

export default function GiftPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      // Spawn gentle rising particles from the bottom.
      if (particlesRef.current.length < 220 && Math.random() > 0.62) {
        particlesRef.current.push(createParticle(Math.random() * w, h + 20));
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.018;
        p.spin += p.spinSpeed;
        if (p.age >= p.life) return false;

        const alpha = Math.max(0, 1 - p.age / p.life);
        if (p.shape === "heart") {
          drawHeart(ctx, p.x, p.y, p.size * 2.2, p.color, alpha, p.spin);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        return true;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const burst = useCallback(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push(createParticle(cx, cy, true));
    }
  }, []);

  const openWish = useCallback(() => {
    burst();
    setIsOpen(true);
  }, [burst]);

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

      <main className="page-shell">
        <div className="intro">
          <p className="intro-eyebrow">A little something for you</p>
          <h1 className="intro-title">Happy Birthday, Dear</h1>
          <button
            type="button"
            className="open-button"
            onClick={openWish}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls="wishPopup"
          >
            Tap here, Dear
          </button>
        </div>
      </main>

      <section
        id="wishPopup"
        className={`wish-popup ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="A little birthday wish for you"
        aria-hidden={!isOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeWish();
        }}
      >
        <div className="popup-card">
          <button
            type="button"
            className="close-button"
            onClick={closeWish}
            aria-label="Close the wish"
          >
            &times;
          </button>

          <div className="cake-scene" aria-hidden="true">
            <div className="moon" />
            <div className="balloon balloon-one" />
            <div className="balloon balloon-two" />
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
          </div>

          <div className="wish-copy">
            <p className="eyebrow">A little wish for you</p>
            <h2 className="display-title">Happy Birthday, Dear</h2>
            <p className="lead">
              I hope your day feels as beautiful as the way you make my world feel.
              You are my favorite smile, my soft place, and my sweetest reason to
              believe in magic.
            </p>
            <p className="wish-note">
              May this new year bring you peace, confidence, beautiful surprises, and
              everything your heart has been quietly wishing for. I will keep cheering
              for you, choosing you, and loving you in every little way I can.
            </p>
            <p className="signature">Forever your biggest fan</p>
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
