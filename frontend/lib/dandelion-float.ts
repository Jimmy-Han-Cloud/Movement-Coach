/**
 * Dandelion seed burst + float effect — pure DOM / Web Animations API.
 * Only call from client-side code (useEffect, event handlers).
 */

let _floatTimer: ReturnType<typeof setInterval> | null = null;
let _windTimer:  ReturnType<typeof setInterval> | null = null;
let _wind = (Math.random() - 0.5) * 0.5;

function makeSVG(): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", "-16 -20 32 42");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "42");
  svg.style.cssText = "width:100%;height:100%;overflow:visible";

  // Stem
  const stem = document.createElementNS(ns, "line");
  stem.setAttribute("x1", "0"); stem.setAttribute("y1", "18");
  stem.setAttribute("x2", "0"); stem.setAttribute("y2", "0");
  stem.setAttribute("stroke", "#d9c49a"); stem.setAttribute("stroke-width", "0.7");
  svg.append(stem);

  // Seed pod
  const pod = document.createElementNS(ns, "ellipse");
  pod.setAttribute("cx", "0"); pod.setAttribute("cy", "20");
  pod.setAttribute("rx", "2.5"); pod.setAttribute("ry", "3.5");
  pod.setAttribute("fill", "#c49040"); pod.setAttribute("opacity", "0.9");
  svg.append(pod);

  // Pappus fibers radiating from top of stem
  const count = 10 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = ((i / count) * Math.PI * 2) - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const len   = 12 + Math.random() * 5;
    const ex = (Math.cos(angle) * len).toFixed(2);
    const ey = (Math.sin(angle) * len).toFixed(2);

    const fiber = document.createElementNS(ns, "line");
    fiber.setAttribute("x1", "0"); fiber.setAttribute("y1", "0");
    fiber.setAttribute("x2", ex); fiber.setAttribute("y2", ey);
    fiber.setAttribute("stroke", "#f0ece0"); fiber.setAttribute("stroke-width", "0.45");
    svg.append(fiber);

    const tip = document.createElementNS(ns, "circle");
    tip.setAttribute("cx", ex); tip.setAttribute("cy", ey);
    tip.setAttribute("r", "1.4"); tip.setAttribute("fill", "#f5f1e6");
    svg.append(tip);
  }

  return svg;
}

function spawnDiv(x: number, y: number, scale: number, tag: string): HTMLDivElement {
  const w = Math.round(32 * scale);
  const h = Math.round(42 * scale);
  const div = document.createElement("div");
  div.style.cssText = [
    "position:fixed",
    `left:${x - w / 2}px`,
    `top:${y}px`,
    `width:${w}px`,
    `height:${h}px`,
    "pointer-events:none",
    "will-change:transform,opacity",
    "z-index:2",
  ].join(";");
  div.dataset.dandelion = tag;
  div.append(makeSVG());
  document.body.append(div);
  return div;
}

// ── Float seed (bottom → top) ────────────────────────────────────

function spawnFloatSeed() {
  const x     = Math.random() * window.innerWidth;
  const scale = 0.45 + Math.random() * 0.9;
  const div   = spawnDiv(x, window.innerHeight + 10, scale, "float");

  const drift   = _wind * window.innerWidth * 0.14 + (Math.random() - 0.5) * 70;
  const sway    = (25 + Math.random() * 50) * (Math.random() > 0.5 ? 1 : -1);
  const rot     = (Math.random() - 0.5) * 30;
  const rd      = (Math.random() - 0.5) * 90;
  const dur     = 7000 + Math.random() * 5000;

  div.animate([
    { transform: `translate(0,0) rotate(${rot}deg) scale(0.9)`,
      opacity: 0, offset: 0 },
    { transform: `translate(0,0) rotate(${rot}deg) scale(1)`,
      opacity: 0.88, offset: 0.05 },
    { transform: `translate(${drift * 0.25 + sway}px,-24vh) rotate(${rot + rd * 0.3}deg) scale(1)`,
      opacity: 0.92, offset: 0.25 },
    { transform: `translate(${drift * 0.5 - sway * 0.5}px,-50vh) rotate(${rot + rd * 0.6}deg) scale(0.95)`,
      opacity: 0.8, offset: 0.5 },
    { transform: `translate(${drift * 0.75 + sway * 0.3}px,-76vh) rotate(${rot + rd * 0.8}deg) scale(0.88)`,
      opacity: 0.55, offset: 0.75 },
    { transform: `translate(${drift}px,-114vh) rotate(${rot + rd}deg) scale(0.7)`,
      opacity: 0, offset: 1 },
  ], { duration: dur, easing: "linear", fill: "forwards" }).onfinish = () => div.remove();
}

// ── Burst seed ───────────────────────────────────────────────────

function launchBurstSeed(cx: number, cy: number, angle: number, dist: number) {
  const scale = 0.4 + Math.random() * 0.7;
  const dx    = Math.cos(angle) * dist;
  const dy    = Math.sin(angle) * dist - 60 - Math.random() * 200;
  const rot   = (Math.random() - 0.5) * 360;
  const rd    = (Math.random() - 0.5) * 180;
  const dur   = 3500 + Math.random() * 2000;
  const del   = Math.random() * 350;

  const div = spawnDiv(cx, cy, scale, "burst");
  div.animate([
    { transform: `translate(0,0) rotate(${rot}deg) scale(0.5)`,
      opacity: 0.85, offset: 0 },
    { transform: `translate(${dx * 0.4}px,${dy * 0.4}px) rotate(${rot + rd * 0.4}deg) scale(1)`,
      opacity: 1, offset: 0.4 },
    { transform: `translate(${dx}px,${dy}px) rotate(${rot + rd}deg) scale(0.55)`,
      opacity: 0, offset: 1 },
  ], { duration: dur, delay: del, easing: "cubic-bezier(0.05,0.5,0.15,1)", fill: "forwards" })
    .onfinish = () => div.remove();
}

// ── Public API ────────────────────────────────────────────────────

/** Burst dandelion seeds from (cx, cy). Call on Go bubble click. */
export function triggerDandelionBurst(cx: number, cy: number) {
  // Soft puff ring
  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:fixed", `left:${cx}px`, `top:${cy}px`,
    "width:50px", "height:50px", "border-radius:50%",
    "border:2px solid rgba(240,228,200,0.85)",
    "pointer-events:none", "z-index:2",
  ].join(";");
  document.body.append(ring);
  ring.animate([
    { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
    { transform: "translate(-50%,-50%) scale(5.5)", opacity: 0 },
  ], { duration: 480, easing: "ease-out", fill: "forwards" }).onfinish = () => ring.remove();

  // 80 seeds, biased upward
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() > 0.25
      ? Math.random() * Math.PI - Math.PI   // upper semicircle (bias)
      : Math.random() * Math.PI;             // lower semicircle
    launchBurstSeed(cx, cy, angle, 60 + Math.random() * 320);
  }
}

/** Start continuous dandelion seeds floating up from bottom. */
export function startDandelionFloat() {
  if (_floatTimer) return;
  _wind = (Math.random() - 0.5) * 0.5;
  _windTimer = setInterval(() => {
    _wind += (Math.random() - 0.5) * 0.18;
    _wind = Math.max(-0.8, Math.min(0.8, _wind));
  }, 2200);
  let tick = 0;
  _floatTimer = setInterval(() => {
    const count = tick < 12 ? 2 : 1;
    for (let i = 0; i < count; i++) spawnFloatSeed();
    tick++;
  }, 260);
}

/** Stop float and remove all in-flight seeds. */
export function stopDandelionFloat() {
  if (_floatTimer) { clearInterval(_floatTimer); _floatTimer = null; }
  if (_windTimer)  { clearInterval(_windTimer);  _windTimer  = null; }
  document.querySelectorAll("[data-dandelion]").forEach((el) => el.remove());
}
