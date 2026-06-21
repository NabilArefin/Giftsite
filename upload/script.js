const canvas = document.getElementById("sparkle-canvas");
const context = canvas.getContext("2d");
const openWishButton = document.getElementById("openWishButton");
const closeWishButton = document.getElementById("closeWishButton");
const wishPopup = document.getElementById("wishPopup");

let width = 0;
let height = 0;
let particles = [];

const palette = ["#e34f6f", "#ff8c72", "#f5c85b", "#9ed7c1", "#ffffff"];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createParticle(x, y, burst = false) {
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
    color: palette[Math.floor(Math.random() * palette.length)],
    shape: Math.random() > 0.54 ? "heart" : "dot",
    spin: Math.random() * Math.PI
  };
}

function drawHeart(x, y, size, color, alpha, spin) {
  context.save();
  context.translate(x, y);
  context.rotate(spin);
  context.scale(size / 18, size / 18);
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 6);
  context.bezierCurveTo(-16, -4, -8, -18, 0, -9);
  context.bezierCurveTo(8, -18, 16, -4, 0, 6);
  context.fill();
  context.restore();
}

function drawParticle(particle) {
  const alpha = Math.max(0, 1 - particle.age / particle.life);

  if (particle.shape === "heart") {
    drawHeart(particle.x, particle.y, particle.size * 2.2, particle.color, alpha, particle.spin);
    return;
  }

  context.globalAlpha = alpha;
  context.fillStyle = particle.color;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

function animate() {
  context.clearRect(0, 0, width, height);

  if (particles.length < 90 && Math.random() > 0.62) {
    particles.push(createParticle(Math.random() * width, height + 20));
  }

  particles = particles.filter((particle) => particle.age < particle.life);

  for (const particle of particles) {
    particle.age += 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.018;
    particle.spin += 0.02;
    drawParticle(particle);
  }

  requestAnimationFrame(animate);
}

function burstHearts() {
  const x = width / 2;
  const y = height * 0.38;

  for (let index = 0; index < 80; index += 1) {
    particles.push(createParticle(x, y, true));
  }
}

function openWish() {
  wishPopup.classList.add("open");
  wishPopup.setAttribute("aria-hidden", "false");
  document.body.classList.add("wish-is-open");
  burstHearts();
}

function closeWish() {
  wishPopup.classList.remove("open");
  wishPopup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("wish-is-open");
}

openWishButton.addEventListener("click", openWish);
closeWishButton.addEventListener("click", closeWish);

wishPopup.addEventListener("click", (event) => {
  if (event.target === wishPopup) {
    closeWish();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && wishPopup.classList.contains("open")) {
    closeWish();
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
animate();
