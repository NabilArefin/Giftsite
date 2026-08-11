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
  const [cutProgress, setCutProgress] = useState(0);
  const [isCutting, setIsCutting] = useState(false);
  const [isCutComplete, setIsCutComplete] = useState(false);

  const cakeAreaRef = useRef<HTMLDivElement | null>(null);
  const cutTrackRef = useRef<number[]>([]); // tracks horizontal coverage
  const isDraggingRef = useRef(false);


  // ── Cake cutting interaction ──
  // Track drag across the cake to compute cut progress
  useEffect(() => {
    const cakeArea = cakeAreaRef.current;
    if (!cakeArea) return;

    const SEGMENTS = 40; // divide cake width into segments
    cutTrackRef.current = new Array(SEGMENTS).fill(0);

    const getProgress = () => {
      const covered = cutTrackRef.current.filter((v) => v > 0).length;
      return covered / SEGMENTS;
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current || isCutComplete) return;
      const rect = cakeArea.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Check if pointer is within the cut zone (middle band of cake)
      const cutZoneTop = rect.height * 0.35;
      const cutZoneBottom = rect.height * 0.65;
      if (y < cutZoneTop || y > cutZoneBottom) return;
      if (x < 0 || x > rect.width) return;

      // Mark segment as cut
      const segIndex = Math.floor((x / rect.width) * SEGMENTS);
      if (segIndex >= 0 && segIndex < SEGMENTS) {
        cutTrackRef.current[segIndex] = 1;
      }

      const progress = getProgress();
      setCutProgress(progress);
      setIsCutting(true);

      if (progress >= 0.95 && !isCutComplete) {
        setCutProgress(1);
        setIsCutComplete(true);
        // Trigger the wish after a short delay for the split animation
        setTimeout(() => {
          setIsOpen(true);
          // Burst hearts and confetti inline
          const { w, h } = sizeRef.current;
          const cx = w / 2;
          for (let i = 0; i < 80; i++) {
            particlesRef.current.push(createParticle(cx, h * 0.38, { burst: true }));
          }
          window.setTimeout(() => {
            for (let i = 0; i < 60; i++) {
              particlesRef.current.push(createParticle(cx, h * 0.35, { confetti: true }));
            }
          }, 200);
        }, 800);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const rect = cakeArea.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const cutZoneTop = rect.height * 0.35;
      const cutZoneBottom = rect.height * 0.65;
      if (y >= cutZoneTop && y <= cutZoneBottom) {
        isDraggingRef.current = true;
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsCutting(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = cakeArea.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const cutZoneTop = rect.height * 0.35;
      const cutZoneBottom = rect.height * 0.65;
      if (y >= cutZoneTop && y <= cutZoneBottom) {
        isDraggingRef.current = true;
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      setIsCutting(false);
    };

    cakeArea.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    cakeArea.addEventListener("touchstart", onTouchStart, { passive: true });
    cakeArea.addEventListener("touchmove", onTouchMove, { passive: false });
    cakeArea.addEventListener("touchend", onTouchEnd);

    return () => {
      cakeArea.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cakeArea.removeEventListener("touchstart", onTouchStart);
      cakeArea.removeEventListener("touchmove", onTouchMove);
      cakeArea.removeEventListener("touchend", onTouchEnd);
    };
  }, [isCutComplete]);

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
        <div className={`cut-section ${isCutComplete ? "cut-complete" : ""}`}>
          {/* Header */}
          <div className="cut-header">
            <h2 className="cut-header-title">Cake Time</h2>
            <p className="cut-header-subtitle">Cut the cake and make a wish</p>
          </div>

          {/* Cake Card */}
          <div className="cut-card">
            <div className="cut-instructions">
              <span className="cut-label">DRAG HERE</span>
              <p className="cut-title">Drag across the cake to cut it</p>
              <p className="cut-subtitle">Swipe through the highlighted area to complete the cut.</p>
            </div>

            <div
              ref={cakeAreaRef}
              className={`cake-cut-area ${isCutting ? "is-cutting" : ""}`}
            >
              {/* Cut line visual */}
              <div className="cut-line">
                <div className="cut-line-fill" style={{ width: `${cutProgress * 100}%` }} />
                <div className="cut-line-glow" style={{ left: `${cutProgress * 100}%` }} />
              </div>

              {/* 3D Cake SVG */}
              <svg className="cut-cake-svg" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Plate shadow */}
                <ellipse cx="160" cy="256" rx="130" ry="14" fill="rgba(0,0,0,0.08)" />
                {/* Plate */}
                <ellipse cx="160" cy="250" rx="125" ry="13" fill="#f5e6d3" stroke="#e8d5c0" strokeWidth="1.5" />

                {/* Bottom tier - side */}
                <path d="M55 185 L55 230 Q55 248 160 248 Q265 248 265 230 L265 185 Q265 203 160 203 Q55 203 55 185Z" fill="#d4567a" />
                {/* Bottom tier - top ellipse */}
                <ellipse cx="160" cy="185" rx="105" ry="18" fill="#e8688e" />
                {/* Bottom tier - highlight */}
                <ellipse cx="160" cy="183" rx="90" ry="12" fill="#f08aa4" opacity="0.4" />
                {/* Bottom tier decorations */}
                <circle cx="90" cy="210" r="3" fill="#f5c85b" opacity="0.6" />
                <circle cx="130" cy="215" r="2.5" fill="#fff" opacity="0.3" />
                <circle cx="160" cy="218" r="3" fill="#f5c85b" opacity="0.6" />
                <circle cx="190" cy="215" r="2.5" fill="#fff" opacity="0.3" />
                <circle cx="230" cy="210" r="3" fill="#f5c85b" opacity="0.6" />

                {/* Top tier - side */}
                <path d="M80 120 L80 180 Q80 198 160 198 Q240 198 240 180 L240 120 Q240 138 160 138 Q80 138 80 120Z" fill="#fff0f4" />
                {/* Top tier - top ellipse */}
                <ellipse cx="160" cy="120" rx="80" ry="15" fill="#fff5f8" />
                {/* Top tier - frosting drips */}
                <path d="M95 120 Q97 132 93 140 Q90 133 95 120" fill="#fff" opacity="0.7" />
                <path d="M125 120 Q127 135 123 145 Q120 136 125 120" fill="#fff" opacity="0.7" />
                <path d="M160 120 Q162 130 158 138 Q155 130 160 120" fill="#fff" opacity="0.7" />
                <path d="M195 120 Q197 133 193 142 Q190 134 195 120" fill="#fff" opacity="0.7" />
                <path d="M225 120 Q227 128 223 135 Q220 129 225 120" fill="#fff" opacity="0.7" />
                {/* Top tier - shading */}
                <ellipse cx="160" cy="118" rx="65" ry="9" fill="#fff" opacity="0.3" />

                {/* Candles */}
                <rect x="148" y="75" width="5" height="47" rx="2.5" fill="#f5c85b" />
                <rect x="157" y="70" width="5" height="52" rx="2.5" fill="#e34f6f" />
                <rect x="166" y="75" width="5" height="47" rx="2.5" fill="#7b61ff" />
                {/* Flames */}
                <ellipse cx="150.5" cy="71" rx="4" ry="7" fill="#ffda6b" opacity="0.9" />
                <ellipse cx="150.5" cy="69" rx="2" ry="4" fill="#fff7ad" />
                <ellipse cx="159.5" cy="66" rx="4" ry="7" fill="#ffda6b" opacity="0.9" />
                <ellipse cx="159.5" cy="64" rx="2" ry="4" fill="#fff7ad" />
                <ellipse cx="168.5" cy="71" rx="4" ry="7" fill="#ffda6b" opacity="0.9" />
                <ellipse cx="168.5" cy="69" rx="2" ry="4" fill="#fff7ad" />

                {/* Sprinkles on top tier */}
                <rect x="110" y="115" width="4" height="1.5" rx="0.75" fill="#e34f6f" opacity="0.5" transform="rotate(30 112 116)" />
                <rect x="135" y="112" width="4" height="1.5" rx="0.75" fill="#7b61ff" opacity="0.5" transform="rotate(-20 137 113)" />
                <rect x="180" y="113" width="4" height="1.5" rx="0.75" fill="#f5c85b" opacity="0.5" transform="rotate(45 182 114)" />
                <rect x="205" y="116" width="4" height="1.5" rx="0.75" fill="#e34f6f" opacity="0.5" transform="rotate(-35 207 117)" />
              </svg>

              {/* Cut zone highlight overlay */}
              <div className="cut-zone-highlight" />

              {/* Cake split animation */}
              <div className="cake-split-left" style={{ transform: isCutComplete ? "translateX(-25px) rotate(-2deg)" : "translateX(0)" }} />
              <div className="cake-split-right" style={{ transform: isCutComplete ? "translateX(25px) rotate(2deg)" : "translateX(0)" }} />
            </div>

            {/* Progress bar */}
            <div className="cut-progress-section">
              <span className="cut-progress-label">Cut Progress</span>
              <div className="cut-progress-bar">
                <div className="cut-progress-fill" style={{ width: `${cutProgress * 100}%` }} />
                <div className="cut-progress-shimmer" style={{ left: `${cutProgress * 100 - 15}%` }} />
              </div>
              <span className="cut-progress-status">
                {Math.round(cutProgress * 100)}%{cutProgress > 0 && cutProgress < 0.5 && " · Keep going"}
                {cutProgress >= 0.5 && cutProgress < 0.85 && " · Almost there"}
                {cutProgress >= 0.85 && cutProgress < 1 && " · Nearly done!"}
                {cutProgress >= 1 && " · Complete!"}
              </span>
            </div>
          </div>
        </div>
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
              <span className="title-line">Happy Birthday</span>
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
