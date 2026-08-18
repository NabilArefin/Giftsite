/* ================================================================
   Gift — Birthday Wish Page (Script)
   Polished edition: mouse trail sparkles, confetti burst,
   staggered text reveal, improved particle physics
   ================================================================ */

(function () {
  "use strict";

  /* ── DOM References ──────────────────────────────────────────── */
  const canvas  = document.getElementById("sparkle-canvas");
  const ctx     = canvas.getContext("2d");
  const openBtn = document.getElementById("openWishButton");
  const closeBtn = document.getElementById("closeWishButton");
  const popup   = document.getElementById("wishPopup");

  /* ── State ──────────────────────────────────────────────────── */
  let W = 0;
  let H = 0;
  let particles = [];
  let mouseX = -100;
  let mouseY = -100;
  let mouseActive = false;
  let lastTrailTime = 0;
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Colour Palette ──────────────────────────────────────────── */
  const palette = ["#e34f6f", "#ff8c72", "#f5c85b", "#9ed7c1", "#7b61ff", "#ffffff"];

  /* ── Canvas Sizing ───────────────────────────────────────────── */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── Particle Factory ────────────────────────────────────────── */
  function createParticle(x, y, opts) {
    opts = opts || {};
    const isBurst     = opts.burst || false;
    const isTrail     = opts.trail || false;
    const isConfetti  = opts.confetti || false;

    const angle = Math.random() * Math.PI * 2;
    let speed;

    if (isBurst) {
      speed = 2.4 + Math.random() * 4.6;
    } else if (isTrail) {
      speed = 0.3 + Math.random() * 0.8;
    } else {
      speed = 0.4 + Math.random() * 1.4;
    }

    const shapes = isConfetti
      ? ["star", "circle", "square"]
      : ["heart", "dot"];

    return {
      x: x,
      y: y,
      vx: isConfetti ? Math.cos(angle) * (1 + Math.random() * 3) : Math.cos(angle) * speed,
      vy: isConfetti
        ? Math.sin(angle) * (1 + Math.random() * 3) - 2
        : Math.sin(angle) * speed - (isBurst ? 2 : 0),
      size: isBurst    ? 5 + Math.random() * 7
           : isTrail    ? 1.5 + Math.random() * 3
           : isConfetti ? 3 + Math.random() * 5
           : 2 + Math.random() * 4,
      life: isBurst    ? 90 + Math.random() * 50
           : isTrail    ? 40 + Math.random() * 40
           : isConfetti ? 100 + Math.random() * 80
           : 140 + Math.random() * 120,
      age: 0,
      color: isConfetti
        ? palette[Math.floor(Math.random() * palette.length)]
        : palette[Math.floor(Math.random() * (palette.length - 1))], // exclude white for ambient
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      spin: Math.random() * Math.PI,
      gravity: isConfetti ? 0.06 : isTrail ? 0.01 : 0.018,
      wobble: isConfetti ? 0.08 : 0,
      wobbleSpeed: 0.05 + Math.random() * 0.05
    };
  }

  /* ── Drawing Helpers ────────────────────────────────────────── */
  function drawHeart(x, y, size, color, alpha, spin) {
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

  function drawStar(x, y, size, color, alpha, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + (2 * Math.PI) / 10;
      if (i === 0) ctx.moveTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
      else ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
      ctx.lineTo(Math.cos(innerAngle) * size * 0.45, Math.sin(innerAngle) * size * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSquare(x, y, size, color, alpha, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function drawParticle(p) {
    var alpha = Math.max(0, 1 - p.age / p.life);
    if (alpha <= 0) return;

    switch (p.shape) {
      case "heart":
        drawHeart(p.x, p.y, p.size * 2.2, p.color, alpha, p.spin);
        break;
      case "star":
        drawStar(p.x, p.y, p.size, p.color, alpha, p.spin);
        break;
      case "square":
        drawSquare(p.x, p.y, p.size, p.color, alpha, p.spin);
        break;
      default:
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
  }

  /* ── Animation Loop ────────────────────────────────────────── */
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Ambient particles (rising from bottom)
    if (!reducedMotion && particles.length < 100 && Math.random() > 0.62) {
      particles.push(createParticle(Math.random() * W, H + 20));
    }

    // Update and draw
    particles = particles.filter(function (p) { return p.age < p.life; });

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.age += 1;
      p.x += p.vx + Math.sin(p.age * p.wobbleSpeed) * p.wobble;
      p.y += p.vy;
      p.vy += p.gravity;
      p.spin += 0.02;
      drawParticle(p);
    }

    requestAnimationFrame(animate);
  }

  /* ── Burst Effects ──────────────────────────────────────────── */
  function burstHearts() {
    var cx = W / 2;
    var cy = H * 0.38;
    for (var i = 0; i < 80; i++) {
      particles.push(createParticle(cx, cy, { burst: true }));
    }
  }

  function burstConfetti() {
    var cx = W / 2;
    var cy = H * 0.35;
    for (var i = 0; i < 60; i++) {
      particles.push(createParticle(cx, cy, { confetti: true }));
    }
  }

  /* ── Mouse Trail ────────────────────────────────────────────── */
  function spawnTrailSparkle() {
    if (reducedMotion) return;
    var now = performance.now();
    if (now - lastTrailTime < 40) return; // throttle to ~25 fps
    lastTrailTime = now;
    particles.push(createParticle(mouseX, mouseY, { trail: true }));
  }

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
    spawnTrailSparkle();
  });

  document.addEventListener("mouseleave", function () {
    mouseActive = false;
  });

  /* ── Popup Controls ─────────────────────────────────────────── */
  function openWish() {
    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("wish-is-open");
    burstHearts();
    setTimeout(burstConfetti, 200);
  }

  function closeWish() {
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("wish-is-open");
  }

  openBtn.addEventListener("click", openWish);
  closeBtn.addEventListener("click", closeWish);

  // Close on backdrop click
  popup.addEventListener("click", function (e) {
    if (e.target === popup) closeWish();
  });

  // Close on Escape
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && popup.classList.contains("open")) {
      closeWish();
    }
  });

  // Listen for reduced-motion preference changes
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (e) {
    reducedMotion = e.matches;
  });

  /* ── Init ───────────────────────────────────────────────────── */
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  animate();
})();
