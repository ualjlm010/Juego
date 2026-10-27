const CYCLE_MS = 11000;
const ART_WIDTH = 1707;
const ART_HEIGHT = 920;
const TAU = Math.PI * 2;

const FORTRESS_WINDOWS = [
  [1115, 205], [1144, 205], [1107, 244], [1132, 244], [1160, 244],
  [1070, 295], [1090, 295], [1182, 295], [1202, 295],
  [1030, 350], [1050, 350], [1216, 350], [1238, 350],
  [1010, 417], [1040, 417], [1210, 417], [1240, 417],
  [880, 495], [916, 495], [967, 495], [1282, 495], [1320, 495], [1380, 495],
  [830, 523], [960, 523], [1295, 523], [1420, 523],
];

const CITY_LIGHTS = [
  [302, 491], [348, 478], [384, 506], [421, 486], [462, 515],
  [506, 497], [548, 522], [276, 519], [389, 531], [475, 542],
  [581, 506], [331, 541],
];

const WATER_GLINTS = [
  [332, 520, 34], [362, 533, 24], [393, 546, 42], [427, 558, 26],
  [454, 571, 34], [484, 584, 23], [514, 594, 31], [364, 561, 18],
];

const FOREST_MOTES = [
  [94, 715, 22, 11, 0.13], [168, 781, 18, 9, 0.29], [256, 704, 24, 13, 0.42],
  [375, 828, 16, 10, 0.57], [524, 752, 28, 12, 0.68], [671, 819, 20, 9, 0.83],
  [782, 724, 18, 12, 0.94], [916, 805, 25, 10, 0.08], [1062, 745, 17, 12, 0.21],
  [1204, 821, 22, 11, 0.36], [1348, 733, 19, 9, 0.49], [1497, 800, 26, 12, 0.61],
  [1582, 704, 18, 10, 0.77], [1430, 858, 21, 8, 0.89],
];

function pulse(phase, cycles, offset = 0) {
  return (Math.sin(TAU * (phase * cycles + offset)) + 1) * 0.5;
}

function paintPixelCloud(ctx, x, y, alpha, color) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const blocks = [
    [0, 15, 32, 8], [18, 6, 31, 10], [42, 1, 28, 11], [64, 9, 36, 12],
    [91, 3, 29, 12], [114, 11, 39, 10], [143, 6, 34, 10], [168, 14, 30, 8],
    [29, 23, 37, 5], [80, 24, 46, 5], [132, 22, 42, 5],
  ];
  for (const [dx, dy, width, height] of blocks) {
    ctx.fillRect(Math.round(x + dx), Math.round(y + dy), width, height);
  }
  ctx.globalAlpha = 1;
}

function drawAtmosphere(ctx, phase) {
  // Pixel-stepped cloud banks now travel farther so the drift reads clearly at a glance.
  const cloudTravel = Math.sin(TAU * phase) * 72;
  const secondCloudTravel = Math.sin(TAU * phase + 1.1) * 54;
  paintPixelCloud(ctx, 96 + cloudTravel, 102, 0.22, '#a18af1');
  paintPixelCloud(ctx, 475 - secondCloudTravel, 58, 0.18, '#8e83e6');
  paintPixelCloud(ctx, 857 + secondCloudTravel * 0.72, 190, 0.14, '#8276de');

  // The moon itself never moves; only its soft halo breathes.
  const moonPulse = 0.13 + pulse(phase, 1, 0.12) * 0.09;
  const moonGlow = ctx.createRadialGradient(1280, 82, 18, 1280, 82, 188);
  moonGlow.addColorStop(0, `rgba(174, 145, 255, ${moonPulse})`);
  moonGlow.addColorStop(0.48, `rgba(137, 113, 248, ${moonPulse * 0.58})`);
  moonGlow.addColorStop(1, 'rgba(120, 101, 238, 0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(1080, 0, 400, 280);

  // Two low-opacity searchlights sweep the cloud cover from the tower beacon.
  for (let i = 0; i < 2; i += 1) {
    const sweep = Math.sin(TAU * phase + i * Math.PI) * 188;
    const tipX = 1138 + sweep;
    const beam = ctx.createLinearGradient(1138, 116, tipX, 20);
    beam.addColorStop(0, 'rgba(151, 130, 255, 0.10)');
    beam.addColorStop(1, 'rgba(151, 130, 255, 0)');
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(1138, 116);
    ctx.lineTo(tipX - 34, 8);
    ctx.lineTo(tipX + 34, 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFortressLights(ctx, phase) {
  for (let i = 0; i < FORTRESS_WINDOWS.length; i += 1) {
    const [x, y] = FORTRESS_WINDOWS[i];
    const twinkle = pulse(phase, 2 + (i % 3), i * 0.173);
    const alpha = 0.28 + twinkle * 0.68;
    ctx.fillStyle = `rgba(255, 192, 93, ${alpha})`;
    ctx.fillRect(x, y, i % 4 === 0 ? 5 : 4, 7);
  }

  const emblemPulse = 0.17 + pulse(phase, 1, 0.36) * 0.2;
  const emblemGlow = ctx.createRadialGradient(1138, 374, 12, 1138, 374, 124);
  emblemGlow.addColorStop(0, `rgba(255, 47, 91, ${emblemPulse})`);
  emblemGlow.addColorStop(0.52, `rgba(234, 25, 76, ${emblemPulse * 0.42})`);
  emblemGlow.addColorStop(1, 'rgba(220, 20, 75, 0)');
  ctx.fillStyle = emblemGlow;
  ctx.fillRect(1000, 254, 276, 240);

  // The rooftop warning lamp pulses more visibly, but keeps its original pixel shape.
  const beacon = 0.24 + pulse(phase, 3, 0.22) * 0.72;
  ctx.fillStyle = `rgba(255, 54, 86, ${beacon})`;
  ctx.fillRect(1136, 101, 6, 7);
  ctx.globalAlpha = beacon * 0.32;
  ctx.fillStyle = '#ff315c';
  ctx.fillRect(1127, 92, 24, 24);
  ctx.globalAlpha = 1;
}

function drawCityAndWater(ctx, phase) {
  for (let i = 0; i < CITY_LIGHTS.length; i += 1) {
    const [x, y] = CITY_LIGHTS[i];
    const sparkle = Math.pow(pulse(phase, 3, i * 0.219), 8);
    ctx.globalAlpha = 0.2 + sparkle * 0.8;
    ctx.fillStyle = i % 3 === 0 ? '#ffe49a' : '#ffb45f';
    ctx.fillRect(x, y, i % 4 === 0 ? 4 : 3, 3);
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < WATER_GLINTS.length; i += 1) {
    const [baseX, y, width] = WATER_GLINTS[i];
    const drift = Math.round(Math.sin(TAU * phase + i * 0.8) * 13);
    const shimmer = 0.16 + pulse(phase, 2, i * 0.137) * 0.34;
    ctx.globalAlpha = shimmer;
    ctx.fillStyle = i % 3 === 0 ? '#ffcc87' : '#a7a9ff';
    ctx.fillRect(baseX + drift, y + Math.round(Math.sin(TAU * phase + i) * 2), width, 3);
  }
  ctx.globalAlpha = 1;

  // Small, slow light motes over the tree line animate the foreground without moving it.
  for (let i = 0; i < FOREST_MOTES.length; i += 1) {
    const [baseX, baseY, driftX, driftY, offset] = FOREST_MOTES[i];
    const theta = TAU * phase + offset * TAU;
    const x = Math.round(baseX + Math.sin(theta) * driftX);
    const y = Math.round(baseY + Math.cos(theta * 0.7) * driftY);
    const glow = 0.18 + pulse(phase, 2, offset) * 0.78;
    const size = i % 4 === 0 ? 4 : 3;
    ctx.globalAlpha = glow * 0.2;
    ctx.fillStyle = '#ffc879';
    ctx.fillRect(x - size * 2, y - size * 2, size * 5, size * 5);
    ctx.globalAlpha = glow;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

export function initMenuBackground() {
  const menu = document.querySelector('#menu');
  const canvas = menu?.querySelector('.menu-scene-effects');
  const art = menu?.querySelector('.menu-scenery');
  const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true });
  if (!menu || !canvas || !art || !ctx) return () => {};

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameId = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let visible = false;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    cssWidth = bounds.width;
    cssHeight = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(cssWidth * pixelRatio));
    const height = Math.max(1, Math.round(cssHeight * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    draw(0);
  }

  function draw(phase) {
    if (!cssWidth || !cssHeight) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(cssWidth / ART_WIDTH, cssHeight / ART_HEIGHT);
    const offsetX = (cssWidth - ART_WIDTH * scale) * 0.5;
    const offsetY = (cssHeight - ART_HEIGHT * scale) * 0.5;
    ctx.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, pixelRatio * offsetX, pixelRatio * offsetY);
    ctx.imageSmoothingEnabled = false;
    drawAtmosphere(ctx, phase);
    drawFortressLights(ctx, phase);
    drawCityAndWater(ctx, phase);
  }

  function animate(now) {
    frameId = 0;
    if (!visible || reducedMotion.matches || document.hidden) return;
    const phase = ((now % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;
    draw(phase);
    frameId = requestAnimationFrame(animate);
  }

  function sync() {
    const shouldRun = !menu.classList.contains('hidden') && !document.hidden;
    visible = shouldRun;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    if (reducedMotion.matches) {
      draw(0);
    } else if (visible) {
      frameId = requestAnimationFrame(animate);
    }
  }

  const observer = new MutationObserver(sync);
  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
  window.addEventListener('resize', resize, { passive: true });
  if (!art.complete) art.addEventListener('load', resize, { once: true });
  resize();
  sync();

  return () => {
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', sync);
    reducedMotion.removeEventListener?.('change', sync);
    window.removeEventListener('resize', resize);
    if (frameId) cancelAnimationFrame(frameId);
  };
}
