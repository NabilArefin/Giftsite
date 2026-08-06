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
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const buttonTextRef = useRef<HTMLSpanElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  // ── JS-driven text color sync ──
  // Reads the button's actual computed background-position every frame,
  // maps it to a gradient position, computes luminance, and sets text color
  // so it always contrasts perfectly with the animated background.
  useEffect(() => {
    const btn = buttonRef.current;
    const txt = buttonTextRef.current;
    if (!btn || !txt) return;

    let smoothLum = 0.6; // start near middle
    const LUM_THRESHOLD = 0.58;
    const TRANSITION_WIDTH = 0.13;
    const SMOOTH_FACTOR = 0.25;

    let colorRaf = 0;

    const tick = () => {
      const pos = getComputedStyle(btn).backgroundPosition;
      // Parse "X% Y%" or "Xpx Ypx"
      const parts = pos.split(/\s+/);
      let fracX = 0.5;
      let fracY = 0.5;

      for (let i = 0; i < parts.length && i < 2; i++) {
        const v = parseFloat(parts[i]);
        if (parts[i].includes('%')) {
          // For background-size: 300%, 0%→start, 100%→end
          // frac: 0→0.333, 1→1.0  →  (pct/100 * 2 + 1) / 3
          // Actually: bg-size 300% means the image is 3x the container.
          // bg-pos 0% = left edge of image at left edge of container = gradient start
          // bg-pos 100% = right edge of image at right edge of container = gradient end
          // So fracX = pct / 100 maps [0,1] for the full gradient sweep
          // But with 300% size, position 0%=gradient-start, 50%=gradient-middle, 100%=gradient-end
          const f = v / 100;
          if (i === 0) fracX = f;
          else fracY = f;
        } else {
          // px value — approximate by ratio to element size
          const dim = i === 0 ? btn.offsetWidth : btn.offsetHeight;
          if (dim > 0) {
            const f = Math.min(1, Math.max(0, v / (dim * 2))); // rough normalization
            if (i === 0) fracX = f;
            else fracY = f;
          }
        }
      }

      // The gradient is 135deg with 5 color stops (violet, rose, coral, gold, mint)
      // gradientT goes from 0 (violet/rose) to 1 (gold/mint)
      // For 135deg gradient, position depends on both X and Y
      const gradientT = (fracX + fracY) / 2;

      // Map gradientT to approximate luminance of the gradient colors
      // violet(#7b61ff) lum≈0.44, rose(#e34f6f) lum≈0.45, coral(#ff8c72) lum≈0.53, gold(#f5c85b) lum≈0.72, mint(#9ed7c1) lum≈0.69
      // Use a piecewise approximation:
      let lum = 0.44;
      if (gradientT < 0.25) {
        lum = 0.44 + (0.45 - 0.44) * (gradientT / 0.25); // violet→rose
      } else if (gradientT < 0.5) {
        lum = 0.45 + (0.53 - 0.45) * ((gradientT - 0.25) / 0.25); // rose→coral
      } else if (gradientT < 0.75) {
        lum = 0.53 + (0.72 - 0.53) * ((gradientT - 0.5) / 0.25); // coral→gold
      } else {
        lum = 0.72 + (0.69 - 0.72) * ((gradientT - 0.75) / 0.25); // gold→mint
      }

      // Apply exponential smoothing to prevent jitter
      smoothLum = smoothLum + SMOOTH_FACTOR * (lum - smoothLum);

      // Map luminance to text color with smooth gray transition
      // Low lum (dark bg) → white text, High lum (bright bg) → dark text
      let r: number, g: number, b: number;
      if (smoothLum < LUM_THRESHOLD - TRANSITION_WIDTH) {
        // Fully white
        r = 255; g = 255; b = 255;
      } else if (smoothLum > LUM_THRESHOLD + TRANSITION_WIDTH) {
        // Fully dark
        r = 17; g = 17; b = 17;
      } else {
        // Transition zone — smooth gray interpolation
        const t = (smoothLum - (LUM_THRESHOLD - TRANSITION_WIDTH)) / (2 * TRANSITION_WIDTH);
        r = Math.round(255 + (17 - 255) * t);
        g = Math.round(255 + (17 - 255) * t);
        b = Math.round(255 + (17 - 255) * t);
      }

      txt.style.color = `rgb(${r},${g},${b})`;
      colorRaf = requestAnimationFrame(tick);
    };

    colorRaf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(colorRaf);
  }, []);

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
      cursor.style.transform = `translate3d(${current.x - 7}px, ${
        current.y - 7
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
        <svg className="magic-wand" width="48" height="48" viewBox="0 0 90 90" fill="none">
          <defs>
            <linearGradient id="wandShaft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a056" />
              <stop offset="15%" stopColor="#b8863a" />
              <stop offset="30%" stopColor="#a0722e" />
              <stop offset="50%" stopColor="#7a5420" />
              <stop offset="70%" stopColor="#5c3d14" />
              <stop offset="85%" stopColor="#3d280a" />
              <stop offset="100%" stopColor="#2a1b06" />
            </linearGradient>
            <linearGradient id="wandShaftHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8c47a" />
              <stop offset="40%" stopColor="#c9a050" />
              <stop offset="100%" stopColor="#8b6914" />
            </linearGradient>
            <linearGradient id="wandHandle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a3520" />
              <stop offset="30%" stopColor="#3a2818" />
              <stop offset="60%" stopColor="#2a1c10" />
              <stop offset="100%" stopColor="#1a0f08" />
            </linearGradient>
            <linearGradient id="handleWrap" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b6914" />
              <stop offset="50%" stopColor="#6b4f10" />
              <stop offset="100%" stopColor="#4a3520" />
            </linearGradient>
            <radialGradient id="wandTipCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fffbe6" />
              <stop offset="55%" stopColor="#ffe066" />
              <stop offset="75%" stopColor="#ffb347" />
              <stop offset="100%" stopColor="#ff8c72" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="wandOuterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,240,180,0.6)" />
              <stop offset="30%" stopColor="rgba(255,200,91,0.35)" />
              <stop offset="55%" stopColor="rgba(255,140,114,0.15)" />
              <stop offset="80%" stopColor="rgba(227,79,111,0.06)" />
              <stop offset="100%" stopColor="rgba(227,79,111,0)" />
            </radialGradient>
            <radialGradient id="wandAmbientGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245,200,91,0.25)" />
              <stop offset="40%" stopColor="rgba(255,140,114,0.1)" />
              <stop offset="100%" stopColor="rgba(227,79,111,0)" />
            </radialGradient>
            <filter id="wandGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="wandGlowStrong" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="woodGrain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(90,60,20,0.15)" strokeWidth="0.5" />
              <line x1="2" y1="0" x2="2" y2="4" stroke="rgba(60,40,10,0.1)" strokeWidth="0.3" />
            </pattern>
          </defs>
          {/* Ambient glow */}
          <circle className="wand-ambient" cx="14" cy="14" r="32" fill="url(#wandAmbientGlow)" />
          {/* Outer aura */}
          <circle className="wand-aura" cx="14" cy="14" r="20" fill="url(#wandOuterGlow)" />
          {/* Shaft shadow */}
          <line x1="16" y1="16" x2="72" y2="72" stroke="rgba(20,10,5,0.3)" strokeWidth="7" strokeLinecap="round" />
          {/* Main shaft */}
          <line x1="14" y1="14" x2="70" y2="70" stroke="url(#wandShaft)" strokeWidth="5.5" strokeLinecap="round" />
          {/* Wood grain overlay */}
          <line x1="14" y1="14" x2="70" y2="70" stroke="url(#woodGrain)" strokeWidth="5" strokeLinecap="round" />
          {/* Highlight stripe */}
          <line x1="14" y1="14" x2="70" y2="70" stroke="url(#wandShaftHighlight)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          {/* Edge highlight */}
          <line x1="13.5" y1="13.5" x2="69" y2="69" stroke="rgba(232,196,122,0.3)" strokeWidth="1" strokeLinecap="round" />
          {/* Ferrule ring */}
          <circle cx="56" cy="56" r="4.5" fill="#5c3d14" stroke="#3d280a" strokeWidth="1" />
          <circle cx="56" cy="56" r="3" fill="#6b4f10" opacity="0.6" />
          {/* Handle shadow */}
          <line x1="62" y1="62" x2="82" y2="82" stroke="rgba(10,5,2,0.5)" strokeWidth="11" strokeLinecap="round" />
          {/* Handle */}
          <line x1="60" y1="60" x2="80" y2="80" stroke="url(#wandHandle)" strokeWidth="9" strokeLinecap="round" />
          {/* Handle texture */}
          <line x1="60" y1="60" x2="80" y2="80" stroke="rgba(100,70,30,0.3)" strokeWidth="3" strokeLinecap="round" />
          {/* Gold grip wraps */}
          <line x1="63" y1="63" x2="65" y2="65" stroke="url(#handleWrap)" strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="68" x2="70" y2="70" stroke="url(#handleWrap)" strokeWidth="3" strokeLinecap="round" />
          <line x1="73" y1="73" x2="75" y2="75" stroke="url(#handleWrap)" strokeWidth="3" strokeLinecap="round" />
          {/* Pommel */}
          <circle cx="82" cy="82" r="5" fill="#2a1b06" stroke="#1a0f08" strokeWidth="1" />
          <circle cx="82" cy="82" r="3.5" fill="#3d280a" opacity="0.7" />
          <circle cx="81" cy="81" r="1.5" fill="rgba(139,105,20,0.4)" />
          {/* Inner halo */}
          <circle className="wand-halo" cx="14" cy="14" r="8" fill="url(#wandTipCore)" filter="url(#wandGlow)" />
          {/* Core point */}
          <circle className="wand-core" cx="14" cy="14" r="3" fill="white" opacity="0.95" />
          {/* Star tip */}
          <path
            className="wand-star"
            d="M 14,4 L 15.5,10.5 L 22,11 L 17,14.5 L 18.5,21 L 14,17.5 L 9.5,21 L 11,14.5 L 6,11 L 12.5,10.5 Z"
            fill="url(#wandTipCore)"
            filter="url(#wandGlowStrong)"
          />
          {/* Sparkle dots */}
          <circle className="sparkle-dot sd-1" cx="4" cy="8" r="1.2" fill="#fff7ad" />
          <circle className="sparkle-dot sd-2" cx="24" cy="6" r="0.9" fill="#ffffff" />
          <circle className="sparkle-dot sd-3" cx="6" cy="22" r="1.0" fill="#ff8c72" />
          <circle className="sparkle-dot sd-4" cx="22" cy="20" r="0.7" fill="#f5c85b" />
          <circle className="sparkle-dot sd-5" cx="14" cy="0" r="0.8" fill="#ffffff" />
          <circle className="sparkle-dot sd-6" cx="0" cy="14" r="0.6" fill="#ffe066" />
          <circle className="sparkle-dot sd-7" cx="28" cy="14" r="0.5" fill="#fff7ad" />
          <circle className="sparkle-dot sd-8" cx="8" cy="28" r="0.7" fill="#ff8c72" />
          {/* Magic rays */}
          <line className="magic-ray mr-1" x1="14" y1="14" x2="2" y2="2" stroke="rgba(255,240,180,0.3)" strokeWidth="0.5" />
          <line className="magic-ray mr-2" x1="14" y1="14" x2="26" y2="2" stroke="rgba(255,240,180,0.25)" strokeWidth="0.5" />
          <line className="magic-ray mr-3" x1="14" y1="14" x2="2" y2="26" stroke="rgba(255,200,91,0.2)" strokeWidth="0.5" />
          <line className="magic-ray mr-4" x1="14" y1="14" x2="26" y2="26" stroke="rgba(255,200,91,0.2)" strokeWidth="0.5" />
          {/* Hover ring */}
          <circle className="hover-ring" cx="14" cy="14" r="16" fill="none" stroke="rgba(245,200,91,0.5)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Frost blobs */}
      <div className="frost-blob frost-blob-1" aria-hidden="true" />
      <div className="frost-blob frost-blob-2" aria-hidden="true" />
      <div className="frost-blob frost-blob-3" aria-hidden="true" />
      <div className="frost-blob frost-blob-4" aria-hidden="true" />
      <div className="frost-blob frost-blob-5" aria-hidden="true" />

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
          ref={buttonRef}
          type="button"
          className="open-button"
          onClick={openWish}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="wishPopup"
        >
          <span className="button-glass" />
          <span className="button-light-orb orb-1" />
          <span className="button-light-orb orb-2" />
          <span className="button-light-orb orb-3" />
          <span className="button-glow-ring" />
          <span ref={buttonTextRef} className="button-text">Tap Here</span>
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
              <span className="name-accent">Nuha</span>
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
              I&thinsp;♥&thinsp;U
            </p>
          </div>
        </div>
      </section>

      <footer className="gift-footer">
        <div className="footer-box">
          <span className="footer-ornament footer-ornament-left">✦</span>
          <span className="footer-text">Made with <span className="heart-dot">♥</span> just for you</span>
          <span className="footer-ornament footer-ornament-right">✦</span>
        </div>
      </footer>
    </div>
  );
}
