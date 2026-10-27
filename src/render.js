import { drawSpeciesSprite } from './sprites.js';
import { drawAnimatedPokemon } from './anim.js';
import { EXPEDITIONS } from './config.js';

const W = 1280, H = 720;
let roomArtwork = null;

function getRoomArtwork() {
  if (roomArtwork || typeof Image === 'undefined') return roomArtwork;
  roomArtwork = {
    trainers: new Image(),
    rocket: new Image(),
  };
  roomArtwork.trainers.src = '../assets/ui/faction-trainers.png';
  roomArtwork.rocket.src = '../assets/ui/rocket-fortress-night.png';
  return roomArtwork;
}

function drawRoomArtwork(ctx, image, x, y, width, height, radius = 0) {
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.save();
  if (radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.clip();
  }
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
  return true;
}

const rect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

function round(ctx, x, y, w, h, r, color, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function text(ctx, str, x, y, size, color, font = "'Pixelify Sans', monospace") {
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function poly(ctx, points, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function circle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function shadow(ctx, x, y, rx, ry, alpha = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(37,47,27,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawPokeball(ctx, x, y, r) {
  circle(ctx, x, y, r, '#fff8e8', '#694d42');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 2, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#e6544b';
  ctx.fill();
  rect(ctx, x - r + 2, y - 1, 2 * r - 4, 3, '#694d42');
  circle(ctx, x, y, 5, '#fff8e8', '#694d42');
  ctx.restore();
}

function drawPlant(ctx, x, y, s = 1, color = '#548d45') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shadow(ctx, 0, 3, 9, 3, 0.15);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse((i - 1) * 5, -4 - (i % 2) * 3, 4, 8, (i - 1) * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? color : '#71ad50';
    ctx.fill();
  }
  circle(ctx, 0, -11, 2, '#f7df76');
  ctx.restore();
}

function drawStylizedTree(ctx, cx, cy, r, time = 0, seed = 0, forest = false) {
  const sway = Math.sin(time / 1700 + seed) * Math.min(2, r * .035);
  shadow(ctx, cx + 8, cy + r * .38, r * .76, r * .3, .22);
  poly(ctx, [[cx-r*.16,cy+r*.22],[cx-r*.12,cy-r*.2],[cx+r*.12,cy-r*.2],[cx+r*.18,cy+r*.22]], forest ? '#775338' : '#956344');
  poly(ctx, [[cx-r*.11,cy-r*.1],[cx+r*.1,cy-r*.11],[cx+r*.08,cy+r*.17],[cx-r*.1,cy+r*.18]], '#bd8756');
  const crown = forest ? ['#245b3c','#2f7547','#438e52'] : ['#3e914e','#55a953','#73bb5b'];
  const lobes = [[-.42,-.12,.42],[.04,-.35,.52],[.43,-.1,.43],[-.2,.12,.46],[.25,.12,.48]];
  for (let i=0;i<lobes.length;i++) {
    const [ox,oy,scale]=lobes[i];
    circle(ctx,cx+ox*r+sway,cy+oy*r,scale*r,crown[i%crown.length]);
  }
  circle(ctx,cx-r*.16+sway-r*.04,cy-r*.35,r*.2,forest ? 'rgba(148,204,121,.24)' : 'rgba(210,245,145,.3)');
}

function drawGrassTuft(ctx, x, y, scale = 1, color = '#39894c') {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
  for (let i=-1;i<=1;i++) {
    ctx.beginPath(); ctx.moveTo(i*3,0); ctx.quadraticCurveTo(i*6,-7,-i*2,-13-Math.abs(i)*2);
    ctx.strokeStyle = i===0 ? '#8acb62' : color; ctx.stroke();
  }
  ctx.restore();
}

// =============================================================
// RENDERIZADO 3D GRAPHIC DESIGN: ELEMENTOS ISOMÉTRICOS & BASE
// =============================================================

function draw3DIsometricPlate(ctx, cx, cy, rx, ry, height, topColor, rimColor, strokeColor) {
  // Sombra de contacto inferior
  shadow(ctx, cx, cy + height + 6, rx * 1.08, ry * 0.95, 0.42);

  // Extrusión 3D del perfil metálico
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + height, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(cx - rx, cy);
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = rimColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Tapa elíptica superior
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = topColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Reflejo especular superior en arco
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 3, ry - 3, 0, Math.PI * 0.8, Math.PI * 1.6);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function draw3DCryoPod(ctx, cx, cy, w, h, time, fluidColor = '#10b981', seed = 0) {
  const rx = w / 2;
  const ry = 8;
  const topY = cy - h / 2;
  const botY = cy + h / 2;

  // Resplandor de fluidos proyectado sobre el suelo
  glow(ctx, cx, botY + 4, rx * 1.8, 'rgba(16, 185, 129, 0.28)');
  shadow(ctx, cx, botY + 8, rx * 1.3, 8, 0.38);

  // Pedestal metálico inferior con bisel
  draw3DIsometricPlate(ctx, cx, botY, rx + 4, ry + 2, 8, '#1e293b', '#0f172a', '#38bdf8');

  // Cilindro de vidrio volumétrico con fluidos bioluminiscentes
  const glassGrad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
  glassGrad.addColorStop(0, 'rgba(8, 51, 68, 0.88)');
  glassGrad.addColorStop(0.25, 'rgba(16, 185, 129, 0.72)');
  glassGrad.addColorStop(0.75, 'rgba(6, 78, 59, 0.82)');
  glassGrad.addColorStop(1, 'rgba(8, 51, 68, 0.92)');

  ctx.save();
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.rect(cx - rx, topY, w, h);
  ctx.fill();

  // Burbujas ascendentes dinámicas
  for (let b = 0; b < 5; b++) {
    const bubbleSpeed = 0.04 + b * 0.012;
    const bubbleProgress = (time * bubbleSpeed + b * 22 + seed * 17) % (h - 16);
    const by = botY - 10 - bubbleProgress;
    const bx = cx - rx * 0.5 + Math.sin(time / 250 + b * 2 + seed) * (rx * 0.35);
    const br = 2 + (b % 3);
    circle(ctx, bx, by, br, 'rgba(167, 243, 208, 0.85)', 'rgba(255, 255, 255, 0.6)');
  }

  // Reflejo especular izquierdo (brillo cilíndrico 3D)
  const sheenGrad = ctx.createLinearGradient(cx - rx, topY, cx - rx + 10, topY);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.52)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(cx - rx + 3, topY + 2, 8, h - 4);

  // Reflejo derecho sutil
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(cx + rx - 5, topY + 2, 3, h - 4);

  // Tapa superior de cromo con conduits
  draw3DIsometricPlate(ctx, cx, topY, rx + 3, ry + 1, 6, '#334155', '#1e293b', '#94a3b8');

  // Borde de cristal con luz neón
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - rx, topY, w, h);
  ctx.restore();
}

function draw3DWireframeGlobe(ctx, cx, cy, radius, time, color = '#38bdf8') {
  ctx.save();
  // Resplandor del holograma
  glow(ctx, cx, cy, radius * 1.5, 'rgba(56, 189, 248, 0.16)');

  // Anillo perimetral exterior
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Elipses longitudinales 3D en rotación continua
  const rotAngle = time * 0.0016;
  for (let lon = 0; lon < 3; lon++) {
    const angle = rotAngle + (lon * Math.PI) / 3;
    const cosA = Math.cos(angle);
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(cosA) * radius, radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = cosA >= 0 ? color : 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = cosA >= 0 ? 1.2 : 0.8;
    ctx.stroke();
  }

  // Anillos latitudinales 3D
  for (let lat = -1; lat <= 1; lat += 2) {
    const yOff = lat * (radius * 0.52);
    const rAtLat = Math.sqrt(Math.max(0, radius * radius - yOff * yOff));
    ctx.beginPath();
    ctx.ellipse(cx, cy + yOff, rAtLat, rAtLat * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Línea ecuatorial del escáner
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Baliza táctica orbitando en coordenadas 3D
  const blipAngle = time * 0.0028;
  const blipX = cx + Math.cos(blipAngle) * radius * 0.88;
  const blipY = cy + Math.sin(blipAngle) * (radius * 0.35);
  circle(ctx, blipX, blipY, 2.5, '#ef4444', '#fee2e2');
  ctx.restore();
}

function draw3DBioDome(ctx, cx, cy, rx, ry, domeHeight, time, title, variant = 0) {
  // Sombra de contacto
  shadow(ctx, cx, cy + 12, rx * 1.15, ry * 1.1, 0.45);

  // Plataforma de contención con bisel metálico
  draw3DIsometricPlate(ctx, cx, cy, rx, ry, 12, '#142036', '#09101e', '#38bdf8');

  // Superficie interna del bioma en relieve
  const hillGrad = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy, rx * 0.9);
  if (variant === 0) {
    hillGrad.addColorStop(0, '#34d399');
    hillGrad.addColorStop(0.6, '#059669');
    hillGrad.addColorStop(1, '#064e3b');
  } else {
    hillGrad.addColorStop(0, '#60a5fa');
    hillGrad.addColorStop(0.5, '#2563eb');
    hillGrad.addColorStop(1, '#1e3a8a');
  }

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, rx - 6, ry - 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = hillGrad;
  ctx.fill();

  // Manantial cristalino con ondas concéntricas
  const pondX = cx - rx * 0.35;
  const pondY = cy;
  circle(ctx, pondX, pondY, 14, 'rgba(56, 189, 248, 0.65)', '#bae6fd');
  const ripR = (time * 0.02) % 12;
  circle(ctx, pondX, pondY, ripR, 'transparent', 'rgba(255, 255, 255, 0.4)');

  // Flora cristalina luminiscente
  for (let c = 0; c < 3; c++) {
    const fx = cx + rx * 0.2 + c * 14;
    const fy = cy - 2 - (c % 2) * 5;
    circle(ctx, fx, fy, 3, variant === 0 ? '#a7f3d0' : '#fbcfe8');
    glow(ctx, fx, fy, 8, variant === 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 114, 182, 0.3)');
  }

  // Cúpula geodésica de cristal 3D
  const domeGrad = ctx.createRadialGradient(cx - rx * 0.3, cy - domeHeight * 0.6, 6, cx, cy - domeHeight * 0.4, rx * 1.1);
  domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  domeGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.16)');
  domeGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.35)');
  domeGrad.addColorStop(1, 'rgba(56, 189, 248, 0.4)');

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, domeHeight, 0, Math.PI, 0, false);
  ctx.fillStyle = domeGrad;
  ctx.fill();

  // Estructura de arcos y costillas de titanio
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy - domeHeight * 0.45, rx * 0.72, domeHeight * 0.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
  ctx.stroke();

  // Arco especular de reflejo en cristal esférico
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.32, cy - domeHeight * 0.62, rx * 0.3, domeHeight * 0.2, -0.2, 0, Math.PI * 1.4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();

  // Placa badge táctica de estación
  round(ctx, cx - 85, cy - domeHeight - 16, 170, 20, 6, 'rgba(15, 23, 42, 0.92)', '#38bdf8');
  text(ctx, title, cx - 75, cy - domeHeight - 2, 10, '#bae6fd', "'Fredoka', sans-serif");
}

function drawTrainerRoom(ctx, time) {
  const art = getRoomArtwork();
  const wall = ctx.createLinearGradient(0, 0, 0, 510);
  wall.addColorStop(0, '#203a54'); wall.addColorStop(.68, '#36586c'); wall.addColorStop(1, '#655a69');
  rect(ctx, 0, 0, W, H, wall);
  glow(ctx, 640, 118, 430, 'rgba(255,196,125,.16)');

  // Clean, symmetrical walls frame a single calm view out to the mountains.
  rect(ctx, 0, 0, W, 22, '#101b2b'); rect(ctx, 0, 22, W, 8, '#c2925e');
  round(ctx, 394, 64, 492, 290, 30, '#17283c', '#d3bd91');
  round(ctx, 410, 80, 460, 258, 22, '#1e3448', '#7189a0');
  const imageDrawn = drawRoomArtwork(ctx, art?.trainers, 418, 88, 444, 242, 18);
  if (!imageDrawn) {
    const view = ctx.createLinearGradient(0, 80, 0, 338);
    view.addColorStop(0, '#9fd6e8'); view.addColorStop(.58, '#e6d9ac'); view.addColorStop(1, '#7bb58f');
    round(ctx, 418, 88, 444, 242, 18, view);
    poly(ctx, [[418,250],[518,163],[578,215],[671,133],[762,216],[862,151],[862,330],[418,330]], '#89b7a8');
    poly(ctx, [[418,278],[531,211],[624,254],[733,186],[862,248],[862,330],[418,330]], '#65977f');
  }
  const windowShade = ctx.createLinearGradient(0, 88, 0, 330);
  windowShade.addColorStop(0, 'rgba(13,25,43,.08)'); windowShade.addColorStop(1, 'rgba(9,20,32,.4)');
  round(ctx, 418, 88, 444, 242, 18, windowShade);
  rect(ctx, 638, 88, 4, 242, 'rgba(218,211,189,.24)');
  rect(ctx, 418, 210, 444, 3, 'rgba(218,211,189,.2)');
  round(ctx, 594, 348, 92, 10, 5, '#4e6778');

  // Soft panels and restrained teal lighting replace the noisy outdoor plaza.
  for (const x of [82, 1118]) {
    round(ctx, x, 104, 82, 260, 12, '#26394c', '#6c8293');
    round(ctx, x + 14, 127, 54, 190, 8, '#17283a', '#405970');
    rect(ctx, x + 25, 148, 32, 4, '#c3975f');
    for (let i = 0; i < 3; i++) circle(ctx, x + 41, 183 + i * 42, 7, i === 1 ? '#dbad67' : '#739ca8');
  }

  // Floor and perspective seams give the room depth while keeping a broad clear center.
  const floor = ctx.createLinearGradient(0, 378, 0, H);
  floor.addColorStop(0, '#394958'); floor.addColorStop(.1, '#3a4655'); floor.addColorStop(1, '#182536');
  rect(ctx, 0, 378, W, 342, floor);
  rect(ctx, 0, 378, W, 8, '#a77c55');
  for (let i = 0; i < 8; i++) {
    const y = 405 + i * i * 4.2;
    ctx.strokeStyle = 'rgba(216,195,163,.08)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let row = 0; row < 5; row++) {
    const y = 420 + row * 56; const offset = row % 2 ? 112 : 0;
    for (let x = -offset; x < W; x += 224) {
      ctx.strokeStyle = 'rgba(216,195,163,.065)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 52); ctx.stroke();
    }
  }

  // Three readable stations: care, supply counter and team archive.
  shadow(ctx, 216, 465, 128, 20, .16);
  round(ctx, 98, 289, 236, 166, 20, '#24374a', '#b69a76');
  round(ctx, 118, 309, 196, 116, 13, '#17293c', '#516e7b');
  glow(ctx, 216, 365, 92, 'rgba(113,198,187,.24)');
  circle(ctx, 216, 365, 42, '#233d4e', '#8bb7b7'); circle(ctx, 216, 365, 28, '#5899a0');
  drawPokeball(ctx, 216, 365, 17);
  text(ctx, 'CENTRO DE CUIDADOS', 124, 444, 11, '#f1d9aa');

  shadow(ctx, 390, 568, 112, 18, .16);
  round(ctx, 320, 478, 140, 94, 12, '#26394b', '#ba9666');
  round(ctx, 332, 490, 116, 58, 8, '#d1b990', '#6b8190');
  rect(ctx, 332, 490, 116, 13, '#6b9ba3');
  drawPokeball(ctx, 390, 519, 12);
  text(ctx, 'SUMINISTROS', 350, 565, 10, '#f6dfb2');

  shadow(ctx, 1002, 473, 152, 20, .16);
  round(ctx, 824, 265, 356, 196, 18, '#24384a', '#b99b71');
  round(ctx, 842, 282, 320, 140, 12, '#172a3c', '#526d7b');
  text(ctx, 'ARCHIVO DEL EQUIPO', 864, 306, 12, '#e6c992');
  for (let i = 0; i < 5; i++) {
    round(ctx, 861 + i * 55, 325, 43, 76, 8, '#283d50', '#526f80');
    circle(ctx, 882 + i * 55, 356, 12, '#d1c7a9', '#7397a4');
    circle(ctx, 882 + i * 55, 356, 5, '#d95e59');
    rect(ctx, 870 + i * 55, 379, 24, 3, '#7399a6');
  }
  for (const x of [854, 1150]) { glow(ctx, x, 438, 36, 'rgba(97,207,168,.17)'); circle(ctx, x, 438, 4, '#75c8a6'); }

  // The exit is a clear floor marker at the bottom edge; no avatar or wandering sprites.
  ctx.save(); ctx.globalAlpha = .78 + Math.sin(time / 650) * .08;
  glow(ctx, 640, 525, 118, 'rgba(123,216,183,.26)');
  ctx.strokeStyle = '#8cc5ac'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(640, 526, 82, 22, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const a = time * .0007 + i * Math.PI * 2 / 5;
    circle(ctx, 640 + Math.cos(a) * 66, 526 + Math.sin(a) * 15, 2.5, '#e7f4c9');
  }
}

function drawRocketRoom(ctx, time) {
  const art = getRoomArtwork();
  const wall = ctx.createLinearGradient(0, 0, 0, 520);
  wall.addColorStop(0, '#202838'); wall.addColorStop(.68, '#303643'); wall.addColorStop(1, '#4c4148');
  rect(ctx, 0, 0, W, H, wall);
  glow(ctx, 646, 170, 410, 'rgba(210,43,62,.17)');

  // A precise command room: strong silhouette, muted steel and controlled red light.
  rect(ctx, 0, 0, W, 22, '#111923'); rect(ctx, 0, 22, W, 7, '#983c49');
  for (const x of [45, 1235]) {
    poly(ctx, [[x,28],[x+18,28],[x+58,382],[x+40,382]], '#272f3b', '#45505b');
    for (let i = 0; i < 5; i++) {
      const y = 82 + i * 57 + Math.sin(time / 700 + i) * 2;
      round(ctx, x + 16, y, 9, 20, 4, i % 2 ? '#a63848' : '#e1a35c');
    }
  }
  round(ctx, 278, 67, 724, 292, 22, '#141d29', '#59606a');
  round(ctx, 296, 84, 688, 256, 15, '#202b38', '#343f49');
  // One tall central operations display carries the faction identity.
  round(ctx, 489, 102, 302, 216, 12, '#111923', '#7e424b');
  const screen = ctx.createLinearGradient(0, 112, 0, 308);
  screen.addColorStop(0, '#3b303d'); screen.addColorStop(1, '#182433');
  round(ctx, 502, 115, 276, 190, 8, screen);
  drawRoomArtwork(ctx, art?.rocket, 502, 115, 276, 190, 8);
  round(ctx, 502, 115, 276, 190, 8, 'rgba(12,18,30,.55)');
  for (let i = 0; i < 5; i++) {
    const width = 84 + (i % 3) * 32;
    round(ctx, 520, 134 + i * 28, width, 4, 2, `rgba(235,91,101,${.35 + .1 * Math.sin(time / 500 + i)})`);
    round(ctx, 700, 134 + i * 28, 48, 4, 2, 'rgba(130,168,183,.35)');
  }
  glow(ctx, 640, 210, 88, `rgba(225,46,66,${.14 + .06 * Math.sin(time / 470)})`);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "900 92px 'Arial Black', sans-serif"; ctx.fillStyle = '#d94555';
  ctx.shadowColor = 'rgba(229,39,63,.55)'; ctx.shadowBlur = 22; ctx.fillText('R', 640, 213); ctx.restore();
  text(ctx, 'MERCADO NEGRO', 584, 296, 11, '#d7a7a2');

  // Sparse side consoles read as purposeful equipment rather than room clutter.
  for (const [x, label] of [[322, 'ALERTAS'], [846, 'EQUIPO']]) {
    round(ctx, x, 136, 132, 150, 10, '#18222e', '#56606a');
    round(ctx, x + 12, 148, 108, 104, 6, '#253644', '#3e5360');
    for (let i = 0; i < 4; i++) {
      const level = 19 + ((i * 17 + 29) % 55);
      rect(ctx, x + 24 + i * 22, 235 - level, 11, level, i === 2 ? '#b74655' : '#638a8a');
    }
    round(ctx, x + 24, 265, 84, 4, 2, '#a74753');
    text(ctx, label, x + 18, 308, 10, '#c9ced0');
  }

  const floor = ctx.createLinearGradient(0, 370, 0, H);
  floor.addColorStop(0, '#5b5356'); floor.addColorStop(.16, '#373942'); floor.addColorStop(1, '#202733');
  rect(ctx, 0, 374, W, 346, floor); rect(ctx, 0, 374, W, 8, '#8c4850');
  // Floor joints follow broad stone slabs instead of a bright perspective grid.
  for (let i = 0; i < 7; i++) {
    const y = 405 + i * i * 5;
    ctx.strokeStyle = 'rgba(211,196,177,.07)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let row = 0; row < 5; row++) {
    const y = 420 + row * 56;
    for (let x = row % 2 ? 90 : 0; x < W; x += 210) {
      ctx.strokeStyle = 'rgba(211,196,177,.06)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 52); ctx.stroke();
    }
  }

  // Low market counter in the left foreground; the opposite side stays open for the team panel.
  shadow(ctx, 392, 568, 118, 20, .24);
  round(ctx, 310, 480, 164, 86, 10, '#202b37', '#7b555b');
  round(ctx, 321, 490, 142, 55, 7, '#34414b', '#52616a');
  rect(ctx, 321, 490, 142, 8, '#a43c4c');
  for (let i = 0; i < 3; i++) round(ctx, 338 + i * 39, 512, 26, 17, 4, '#556775', '#879397');
  text(ctx, 'MERCADO NEGRO', 338, 562, 10, '#d7c5bb');

  // Exit hatch has a clear red guide ring and a slow, subtle pulse.
  ctx.save(); ctx.globalAlpha = .72 + Math.sin(time / 620) * .1;
  glow(ctx, 640, 525, 128, 'rgba(232,61,73,.23)');
  ctx.strokeStyle = '#c84d59'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(640, 526, 86, 23, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const a = -time * .00055 + i * Math.PI * 2 / 5;
    circle(ctx, 640 + Math.cos(a) * 68, 526 + Math.sin(a) * 16, 2.5, '#f07a78');
  }
}

function drawWarehouse(ctx, state, time = 0) {
  if (state.faction === 'syndicate') drawRocketRoom(ctx, time);
  else drawTrainerRoom(ctx, time);
}

function drawMeadow(ctx, time, area) {
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#849776');
  base.addColorStop(0.45, '#5c795e');
  base.addColorStop(1, '#3c5c4a');
  rect(ctx, 0, 0, W, H, base);

  // Capas lejanas y luz de tarde: el terreno deja de leerse como una superficie plana.
  glow(ctx, 270, 150, 245, 'rgba(255,220,156,.17)');
  ctx.beginPath(); ctx.moveTo(0,218); ctx.bezierCurveTo(112,176,165,203,252,158);
  ctx.bezierCurveTo(335,112,382,179,464,164); ctx.bezierCurveTo(546,145,596,188,682,154);
  ctx.bezierCurveTo(771,118,817,178,902,158); ctx.bezierCurveTo(1011,126,1082,183,1160,148);
  ctx.bezierCurveTo(1216,130,1250,151,1280,139); ctx.lineTo(1280,390); ctx.lineTo(0,390); ctx.closePath();
  ctx.fillStyle='#6b805f'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,270); ctx.bezierCurveTo(100,216,176,258,270,207);
  ctx.bezierCurveTo(376,151,444,243,534,218); ctx.bezierCurveTo(627,194,686,252,777,207);
  ctx.bezierCurveTo(885,154,940,238,1035,208); ctx.bezierCurveTo(1130,177,1214,232,1280,194);
  ctx.lineTo(1280,390); ctx.lineTo(0,390); ctx.closePath(); ctx.fillStyle='rgba(48,88,58,.76)'; ctx.fill();
  // Copas lejanas de distintos tamaños forman una línea de bosque orgánica.
  for (let i = 0; i < 46; i++) {
    const x = i * 29 + (i % 3) * 6; const y = 266 + (i * 23) % 94; const r = 7 + (i * 11) % 15;
    circle(ctx,x,y,r,i%2?'#3d7448':'#4e8350'); circle(ctx,x-r*.24,y-r*.28,r*.56,i%2?'#64935a':'#719c5d');
  }
  const horizonBlend = ctx.createLinearGradient(0, 330, 0, 485);
  horizonBlend.addColorStop(0, 'rgba(73,113,65,0)');
  horizonBlend.addColorStop(.4, 'rgba(76,119,67,.28)');
  horizonBlend.addColorStop(1, 'rgba(89,135,71,0)');
  rect(ctx, 0, 330, W, 155, horizonBlend);

  // Luz moteada sobre el césped, con un pulso lento y discreto.
  const sunPulse = .5 + .5 * Math.sin(time / 1800);
  glow(ctx, 1020 + Math.sin(time / 4300) * 20, 306, 190, `rgba(255,223,149,${.035 + sunPulse * .025})`);

  for (let i = 0; i < 74; i++) {
    const x = 24 + (i * 173) % 1230;
    const y = 22 + (i * 97) % 660;
    ctx.fillStyle = i % 3 ? 'rgba(224, 244, 155, .13)' : 'rgba(39, 119, 65, .09)';
    ctx.beginPath(); ctx.ellipse(x, y, 9 + i % 7, 3 + i % 3, (i % 4 - 1.5) * .18, 0, Math.PI * 2); ctx.fill();
    if (i % 4 === 0) drawGrassTuft(ctx, x + 10, y + 4, .65 + (i % 3) * .12);
  }
  for (let i = 0; i < 170; i++) {
    const x = 14 + (i * 97) % 1250; const y = 352 + (i * 61) % 350; const size = 2 + (i % 4);
    if (i % 5 === 0) {
      circle(ctx,x,y,size+2,'rgba(70,113,53,.25)');
      circle(ctx,x-1,y-1,size,i%10?'rgba(246,216,137,.74)':'rgba(244,239,204,.78)');
    } else {
      ctx.strokeStyle=i%2?'rgba(211,230,137,.25)':'rgba(46,111,56,.2)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(x,y+5); ctx.quadraticCurveTo(x-2,y,x+(i%2?4:-4),y-5); ctx.stroke();
    }
  }

  // Sendero curvo con borde de tierra, sombra y una franja de luz.
  const trail = (fill, offset = 0, stroke = null, width = 1) => {
    ctx.beginPath();
    ctx.moveTo(548 + offset, 720);
    ctx.bezierCurveTo(583 + offset, 630, 593 + offset, 580, 644 + offset, 523);
    ctx.bezierCurveTo(680 + offset, 477, 623 + offset, 442, 665 + offset, 399);
    ctx.bezierCurveTo(711 + offset, 351, 780 + offset, 332, 758 + offset, 278);
    ctx.bezierCurveTo(741 + offset, 236, 783 + offset, 202, 832 + offset, 174);
    ctx.lineTo(882 + offset, 174);
    ctx.bezierCurveTo(820 + offset, 220, 791 + offset, 251, 810 + offset, 286);
    ctx.bezierCurveTo(844 + offset, 354, 765 + offset, 382, 705 + offset, 424);
    ctx.bezierCurveTo(677 + offset, 446, 751 + offset, 488, 701 + offset, 548);
    ctx.bezierCurveTo(660 + offset, 597, 633 + offset, 656, 626 + offset, 720);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  };
  trail('rgba(49, 91, 52, .24)', 7);
  trail('#9a744d', 0, 'rgba(112, 77, 49, .45)', 4);
  trail('#d9b675', -2, 'rgba(245, 218, 159, .55)', 2);

  // Árboles con copas por capas, luz lateral y sombra de contacto.
  for (let i = 0; i < area.obstacles.length; i++) {
    const [cx, cy, r] = area.obstacles[i];
    drawStylizedTree(ctx, cx, cy, r, time, i);
  }

  // Manchas de hierba orgánicas alrededor del sendero.
  for (const [x, y, w, h] of [[736, 430, 122, 90], [934, 364, 115, 90], [721, 565, 125, 82]]) {
    shadow(ctx, x + w / 2, y + h * .68, w * .48, 8, .16);
    ctx.fillStyle = 'rgba(44, 129, 58, .45)'; ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w*.52,h*.43,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(154, 208, 81, .48)'; ctx.beginPath(); ctx.ellipse(x+w/2-4,y+h/2-4,w*.44,h*.33,0,0,Math.PI*2); ctx.fill();
    for (let i=0;i<7;i++) drawGrassTuft(ctx,x+12+i*16,y+h*.65+(i%2)*6,.8);
  }

  // Lodge at top
  drawLodge(ctx, 'REFUGIO');
}

function drawForest(ctx, time, area) {
  // Deep mossy emerald ground
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#2d5438');
  base.addColorStop(0.45, '#1e3e27');
  base.addColorStop(1, '#173320');
  rect(ctx, 0, 0, W, H, base);

  // Claros de luna entre las copas y estratos de bosque al fondo.
  glow(ctx, 900 + Math.sin(time / 4200) * 24, 112, 270, 'rgba(122,178,198,.11)');
  poly(ctx, [[0,216],[96,142],[176,205],[270,112],[350,198],[449,128],[548,217],[656,132],[758,206],[846,116],[937,211],[1046,133],[1142,209],[1224,145],[1280,197],[1280,332],[0,332]], '#183729');
  poly(ctx, [[0,260],[114,183],[216,249],[316,169],[420,260],[531,188],[646,266],[744,171],[856,263],[963,177],[1074,255],[1174,180],[1280,257],[1280,340],[0,340]], 'rgba(35,75,48,.86)');

  // Moss and ancient floor stones
  for (let y = 30; y < H; y += 50) {
    for (let x = 25; x < W; x += 60) {
      const n = (x * 19 + y * 31) % 13;
      if (n < 4) {
        round(ctx, x, y, 16, 10, 4, '#3d6148', '#254430');
      } else if (n > 9) {
        circle(ctx, x, y, 4, '#5cb37755');
      }
    }
  }

  // Sendero musgoso curvo y ancho para conservar una ruta clara.
  ctx.beginPath(); ctx.moveTo(548,720); ctx.bezierCurveTo(600,625,590,570,645,516); ctx.bezierCurveTo(690,467,630,440,675,395); ctx.bezierCurveTo(725,345,786,323,754,272); ctx.bezierCurveTo(735,231,783,200,832,174); ctx.lineTo(882,174); ctx.bezierCurveTo(825,220,792,249,812,282); ctx.bezierCurveTo(849,351,766,382,710,423); ctx.bezierCurveTo(678,449,752,489,702,548); ctx.bezierCurveTo(660,602,632,659,626,720); ctx.closePath();
  ctx.fillStyle = 'rgba(19, 55, 37, .26)'; ctx.fill();
  ctx.save(); ctx.translate(0,-5); ctx.fillStyle = '#586d4b'; ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#42583d'; ctx.lineWidth = 3; ctx.stroke();

  // Forest Obstacles: Gnarled mossy oaks and ruin pillars
  for (let i = 0; i < area.obstacles.length; i++) {
    const [cx, cy, r] = area.obstacles[i];
    shadow(ctx, cx + 4, cy + r * 0.4, r * 0.8, r * 0.3, 0.4);
    if (i % 3 === 0) {
      // Ruin pillar
      round(ctx, cx - r * 0.35, cy - r * 0.5, r * 0.7, r * 0.9, 6, '#677d6c', '#3f5344');
      rect(ctx, cx - r * 0.25, cy - r * 0.3, r * 0.5, 6, '#8ca090');
      // Glowing purple mushrooms at base
      circle(ctx, cx - r * 0.4, cy + r * 0.3, 5, '#b465c8');
      circle(ctx, cx + r * 0.35, cy + r * 0.35, 4, '#80c0d8');
    } else drawStylizedTree(ctx, cx, cy, r, time, i, true);
  }

  // Floating mist glow
  const mistGlow = Math.sin(time / 2000) * 15;
  glow(ctx, 400 + mistGlow, 300, 240, 'rgba(120, 200, 160, 0.07)');
  glow(ctx, 900 - mistGlow, 450, 260, 'rgba(150, 130, 210, 0.07)');
  for (let i = 0; i < 12; i++) {
    const x = (i * 137 + 70 + Math.sin(time / 1300 + i) * 16) % W;
    const y = 170 + (i * 83) % 430;
    const pulse = .35 + .45 * (.5 + .5 * Math.sin(time / 360 + i * 2));
    glow(ctx, x, y, 24, `rgba(174,225,151,${pulse * .20})`);
    circle(ctx, x, y, 2 + pulse, `rgba(224,245,177,${pulse})`);
  }

  drawLodge(ctx, 'REFUGIO');
}

function drawQuarry(ctx, time, area) {
  // Arid rocky dirt and sandstone terrain
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#8c7657');
  base.addColorStop(0.45, '#735f45');
  base.addColorStop(1, '#5a4935');
  rect(ctx, 0, 0, W, H, base);

  // Lomas estratificadas al fondo y reflejo mineral del atardecer.
  glow(ctx, 1000, 124, 250, 'rgba(255,188,105,.14)');
  poly(ctx, [[0,244],[117,158],[228,220],[344,138],[449,218],[568,146],[683,231],[804,144],[926,221],[1047,148],[1158,215],[1280,151],[1280,330],[0,330]], '#806c50');
  poly(ctx, [[0,278],[135,205],[256,267],[374,186],[492,272],[620,201],[748,278],[879,193],[1001,273],[1114,197],[1217,258],[1280,220],[1280,342],[0,342]], 'rgba(91,73,52,.84)');

  // Mineral veins and shale striations
  for (let y = 25; y < H; y += 45) {
    for (let x = 20; x < W; x += 65) {
      const n = (x * 13 + y * 23) % 17;
      if (n < 5) {
        round(ctx, x, y, 22, 12, 3, '#9d8765', '#574632');
      } else if (n === 8) {
        // Gold/Copper fleck
        circle(ctx, x, y, 3, '#f5c85b');
      }
    }
  }

  // Pequeñas chispas en las vetas que responden suavemente al tiempo.
  for (let i = 0; i < 9; i++) {
    const x = 110 + (i * 149) % 1080;
    const y = 330 + (i * 71) % 310;
    const alpha = .25 + .35 * (.5 + .5 * Math.sin(time / 510 + i));
    glow(ctx, x, y, 18, `rgba(245,191,92,${alpha * .2})`);
    circle(ctx, x, y, 2, `rgba(255,221,137,${alpha})`);
  }

  // Gravel quarry track with wooden rails
  const path = [[558, 720], [585, 600], [660, 520], [640, 430], [760, 340], [750, 240], [832, 174], [880, 174], [795, 260], [812, 360], [688, 455], [714, 530], [642, 626], [655, 720]];
  poly(ctx, path, '#544431', '#3d3021');
  for (let i = 0; i < path.length - 1; i += 2) {
    const [px, py] = path[i];
    rect(ctx, px - 18, py, 36, 4, '#8a6544');
  }

  // Quarry Obstacles: Heavy boulders, mineral crags and abandoned mining crates
  for (let i = 0; i < area.obstacles.length; i++) {
    const [cx, cy, r] = area.obstacles[i];
    shadow(ctx, cx + 5, cy + r * 0.45, r * 0.9, r * 0.35, 0.4);
    if (i % 2 === 0) {
      // Angular rock crag
      poly(ctx, [
        [cx - r * 0.6, cy + r * 0.4],
        [cx - r * 0.4, cy - r * 0.5],
        [cx + r * 0.2, cy - r * 0.6],
        [cx + r * 0.7, cy + r * 0.2],
        [cx + r * 0.3, cy + r * 0.5],
      ], '#786d5e', '#453d34');
      poly(ctx, [
        [cx - r * 0.3, cy + r * 0.2],
        [cx - r * 0.2, cy - r * 0.4],
        [cx + r * 0.1, cy - r * 0.45],
        [cx + r * 0.3, cy + r * 0.1],
      ], '#948875');
    } else {
      // Mining crate / mineral deposit
      round(ctx, cx - r * 0.45, cy - r * 0.35, r * 0.9, r * 0.75, 5, '#5c4632', '#36271a');
      rect(ctx, cx - r * 0.4, cy, r * 0.8, 3, '#a88056');
    }
  }

  drawLodge(ctx, 'REFUGIO');
}

function drawLodge(ctx, label) {
  shadow(ctx, 640, 124, 154, 17, 0.28);
  rect(ctx, 510, 30, 260, 96, '#f0d7a6');
  rect(ctx, 522, 45, 236, 72, '#ffedca');
  poly(ctx, [[490, 51], [640, 0], [790, 51], [770, 73], [640, 29], [510, 73]], '#d94d45', '#a73e37');
  for (let x = 515; x < 770; x += 31) {
    poly(ctx, [[x, 49], [x + 16, 43], [x + 16, 53], [x, 59]], '#f4a65e');
  }
  rect(ctx, 539, 63, 202, 55, '#ffedca');
  rect(ctx, 552, 72, 40, 35, '#83c7d1');
  rect(ctx, 688, 72, 40, 35, '#83c7d1');
  rect(ctx, 598, 68, 84, 50, '#70a05a');
  rect(ctx, 610, 77, 60, 41, '#456c4c');
  drawPokeball(ctx, 640, 68, 16);
  rect(ctx, 552, 119, 176, 13, '#e6b869');
}

function drawPokemon(ctx, p, time) {
  const bob = Math.round(Math.sin(time / 430 + p.phase) * 2);
  const y = p.y + bob;
  shadow(ctx, p.x, y + 5, 26, 8, 0.25);

  const drawn = drawAnimatedPokemon(ctx, p.speciesId, p.x, y + 4, {
    action: 'Idle',
    dir: 'down',
    time,
    shiny: p.shiny,
    scale: 2.0,
  });

  if (!drawn) {
    drawSpeciesSprite(ctx, p.speciesId, p.x, y + 4, { shiny: p.shiny, width: 78, height: 78 });
  }
}

function drawPlayer(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  shadow(ctx, 0, 14, 20, 8, 0.35);

  const moving = p.step > 0;
  const leg = moving ? Math.sin(time / 70) * 4 : 0;
  const bob = moving ? Math.abs(Math.sin(time / 70) * 2) : 0;

  // Boots & Legs
  round(ctx, -10, -3 + leg, 8, 14, 2, '#1e293b', '#0f172a');
  round(ctx, 2, -3 - leg, 8, 14, 2, '#1e293b', '#0f172a');
  // Red sneakers
  round(ctx, -11, 8 + leg, 10, 5, 2, '#f8fafc', '#dc2626');
  round(ctx, 1, 8 - leg, 10, 5, 2, '#f8fafc', '#dc2626');

  // Blue Trainer Coat
  round(ctx, -13, -19 - bob, 26, 20, 5, '#2563eb', '#1e40af');
  rect(ctx, -4, -19 - bob, 8, 14, '#f8fafc');
  // Belt with mini Pokeball buckle
  rect(ctx, -12, -4 - bob, 24, 3, '#334155');
  circle(ctx, 0, -3 - bob, 3, '#f8fafc', '#dc2626');

  // Adventurer Backpack
  if (p.dir === 'left') {
    round(ctx, 3, -20 - bob, 9, 16, 3, '#b45309', '#78350f');
  } else if (p.dir === 'right') {
    round(ctx, -12, -20 - bob, 9, 16, 3, '#b45309', '#78350f');
  } else if (p.dir === 'up') {
    round(ctx, -10, -22 - bob, 20, 18, 4, '#b45309', '#78350f');
  }

  // Head & Hair
  ctx.beginPath();
  ctx.arc(0, -26 - bob, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#fde047'; // Hair peek
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -25 - bob, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#fed7aa'; // Skin
  ctx.fill();

  // Face / Eyes
  ctx.fillStyle = '#0f172a';
  if (p.dir === 'left') {
    rect(ctx, -7, -26 - bob, 2, 3);
  } else if (p.dir === 'right') {
    rect(ctx, 5, -26 - bob, 2, 3);
  } else if (p.dir === 'down') {
    rect(ctx, -5, -26 - bob, 2, 3);
    rect(ctx, 3, -26 - bob, 2, 3);
  }

  // Red Trainer Cap
  round(ctx, -12, -35 - bob, 24, 10, 4, '#dc2626', '#b91c1c');
  // Cap Visor
  if (p.dir === 'left') {
    rect(ctx, -16, -29 - bob, 10, 3, '#fff');
  } else if (p.dir === 'right') {
    rect(ctx, 6, -29 - bob, 10, 3, '#fff');
  } else if (p.dir === 'down') {
    round(ctx, -13, -28 - bob, 26, 3, 1, '#fff');
  }
  // Cap Emblem
  circle(ctx, 0, -32 - bob, 2.5, '#fff');

  ctx.restore();
}

function drawBiomeAtmosphere(ctx, time, areaId) {
  if (areaId === 'forest') {
    // Bioluminescent fireflies & mystical drifting spores in Forest
    const sporeColors = ['#8fffd1', '#b18fff', '#e2ff78', '#69e6ff'];
    for (let i = 0; i < 32; i++) {
      const sx = (i * 39 + Math.cos(time / 1200 + i * 1.7) * 45 + (time * 0.015)) % (W + 60) - 30;
      const sy = (i * 23 + Math.sin(time / 950 + i * 1.3) * 35) % (H + 40) - 20;
      const sr = 1.6 + (i % 3) * 1.2;
      const pulse = Math.sin(time / 450 + i * 1.1) * 0.5 + 0.5;
      ctx.save();
      ctx.fillStyle = sporeColors[i % sporeColors.length];
      ctx.globalAlpha = 0.35 + pulse * 0.55;
      ctx.shadowColor = sporeColors[i % sporeColors.length];
      ctx.shadowBlur = 10 * pulse;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (areaId === 'quarry') {
    // Drifting mineral specks & warm quarry dust motes
    const dustColors = ['#f5d382', '#ffc466', '#d6baa2', '#e8dfcc'];
    for (let i = 0; i < 28; i++) {
      const qx = (i * 43 + (time * 0.055) * (1 + (i % 4) * 0.25)) % (W + 50) - 25;
      const qy = (i * 27 + Math.sin(time / 700 + i) * 14 + (time * 0.02)) % (H + 40) - 20;
      const qr = 1.3 + (i % 3) * 0.8;
      const twinkle = Math.sin(time / 300 + i * 2) * 0.4 + 0.6;
      ctx.save();
      ctx.fillStyle = dustColors[i % dustColors.length];
      ctx.globalAlpha = 0.32 * twinkle;
      ctx.beginPath();
      ctx.arc(qx, qy, qr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Drifting flower petals & sunny spores in Meadow
    const petalColors = ['#fff6d6', '#ffd4df', '#e8f5b8'];
    for (let i = 0; i < 26; i++) {
      const px = (i * 47 + (time * 0.038) * (1 + (i % 3) * 0.3)) % (W + 40) - 20;
      const py = (i * 29 + Math.sin(time / 800 + i * 2) * 18 + (time * 0.015)) % (H + 40) - 20;
      const pr = 1.4 + (i % 3) * 0.8;
      ctx.save();
      ctx.fillStyle = petalColors[i % petalColors.length];
      ctx.globalAlpha = 0.4 + Math.sin(time / 600 + i) * 0.25;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 1.5, (time / 1000 + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawVignette(ctx, areaId = 'meadow') {
  const g = ctx.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 850);
  if (areaId === 'trainer-room') {
    g.addColorStop(0, 'rgba(14, 30, 46, 0)');
    g.addColorStop(1, 'rgba(5, 12, 24, .52)');
  } else if (areaId === 'rocket-room') {
    g.addColorStop(0, 'rgba(28, 20, 33, 0)');
    g.addColorStop(1, 'rgba(4, 8, 18, .66)');
  } else if (areaId === 'forest') {
    g.addColorStop(0, 'rgba(120, 220, 180, 0.01)');
    g.addColorStop(1, 'rgba(10, 26, 16, 0.42)');
  } else if (areaId === 'quarry') {
    g.addColorStop(0, 'rgba(255, 215, 140, 0.02)');
    g.addColorStop(1, 'rgba(42, 30, 18, 0.34)');
  } else if (areaId === 'warehouse') {
    g.addColorStop(0, 'rgba(255, 230, 160, 0.03)');
    g.addColorStop(1, 'rgba(32, 22, 14, 0.28)');
  } else {
    g.addColorStop(0, 'rgba(255, 246, 210, 0.02)');
    g.addColorStop(1, 'rgba(32, 58, 28, 0.22)');
  }
  rect(ctx, 0, 0, W, H, g);
}

let currentClickMarker = null;

function drawMovingBeam(ctx, x, y, length, angle, color, width) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const beam = ctx.createLinearGradient(0, 0, 0, length);
  beam.addColorStop(0, color); beam.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(-width * .18, 0); ctx.lineTo(width * .18, 0); ctx.lineTo(width, length); ctx.lineTo(-width, length); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawRocketTower(ctx, time, cx = 260, top = 104, scale = 1) {
  ctx.save(); ctx.translate(cx, top); ctx.scale(scale, scale);
  // Kanto's Rocket headquarters: a broad, stepped city tower with warm lit windows.
  shadow(ctx, 5, 492, 190, 32, .34);
  poly(ctx, [[-164,492],[-143,126],[-112,91],[-97,12],[97,12],[112,91],[143,126],[164,492]], '#25283a', '#6a5a60');
  poly(ctx, [[-143,486],[-123,133],[-95,105],[-84,35],[84,35],[95,105],[123,133],[143,486]], '#493d4b', '#9b7771');
  // Warm masonry bands and deep vertical piers give the silhouette a civic rather than sci-fi read.
  rect(ctx, -142, 164, 284, 15, '#77605b'); rect(ctx, -146, 301, 292, 12, '#77605b'); rect(ctx, -151, 430, 302, 13, '#77605b');
  for (let row = 0; row < 8; row++) for (let col = -2; col <= 2; col++) {
    const wx = col * 43 + (row % 2 ? 0 : 10), wy = 119 + row * 43;
    const lit = .28 + .24 * (Math.sin(time / 730 + row * .8 + col) + 1) / 2;
    round(ctx, wx - 9, wy - 13, 18, 28, 7, `rgba(255,196,133,${lit})`, 'rgba(255,225,187,.28)');
    rect(ctx, wx - 1, wy - 12, 2, 25, 'rgba(71,46,54,.62)');
  }
  poly(ctx, [[-174,119],[-121,83],[-107,101],[-149,143]], '#302a39', '#96716b');
  poly(ctx, [[174,119],[121,83],[107,101],[149,143]], '#302a39', '#96716b');
  // A small red Rocket crest, set into the crown as architectural signage.
  circle(ctx, 0, 66, 34, '#382b36', '#bc7770');
  ctx.save(); ctx.fillStyle = '#e34a50'; ctx.font = '900 43px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(245,59,68,.6)'; ctx.shadowBlur = 12; ctx.fillText('R', 0, 67); ctx.restore();
  poly(ctx, [[-133,31],[0,-17],[133,31],[116,47],[0,8],[-116,47]], '#302a39', '#a27f78');
  // Searchlight pans slowly over the skyline.
  drawMovingBeam(ctx, -12, 22, 470, Math.sin(time / 2300) * .29, 'rgba(247,87,83,.08)', 66);
  ctx.restore();
}

function drawKantoGym(ctx, time, cx = 985, top = 260, scale = 1) {
  ctx.save(); ctx.translate(cx, top); ctx.scale(scale, scale);
  glow(ctx, 0, 74, 320, 'rgba(255,205,139,.13)');
  shadow(ctx, 0, 214, 300, 36, .36);
  // A brick-and-glass battle hall with a readable entrance, buttresses and roof ribs.
  poly(ctx, [[-272,202],[-250,91],[-217,71],[-194,20],[194,20],[217,71],[250,91],[272,202]], '#657184', '#d0c7af');
  poly(ctx, [[-250,195],[-232,96],[-202,81],[-180,39],[180,39],[202,81],[232,96],[250,195]], '#38536c', '#adbdc5');
  const glass = ctx.createLinearGradient(0, 39, 0, 177); glass.addColorStop(0,'#b9d8d7'); glass.addColorStop(.35,'#5789a1'); glass.addColorStop(1,'#293b58');
  poly(ctx, [[-176,43],[176,43],[206,91],[222,174],[-222,174],[-206,91]], glass, '#d0d4c9');
  ctx.save(); ctx.beginPath(); ctx.moveTo(-218,91); ctx.lineTo(-190,45); ctx.lineTo(190,45); ctx.lineTo(218,91); ctx.lineTo(230,175); ctx.lineTo(-230,175); ctx.closePath(); ctx.clip();
  for (let i = -4; i <= 4; i++) {
    ctx.strokeStyle = 'rgba(224,236,226,.38)'; ctx.lineWidth = i % 2 ? 4 : 7;
    ctx.beginPath(); ctx.moveTo(i * 47, 42); ctx.lineTo(i * 57, 176); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,214,142,.68)'; ctx.fillRect(-192,124,384,8);
  for (let i=0;i<7;i++) { const lx=-166+i*55; glow(ctx,lx,138,27,`rgba(255,217,157,${.2+.08*Math.sin(time/520+i)})`); circle(ctx,lx,138,3,'#ffe8bb'); }
  ctx.restore();
  // Broad stone stairs and the red-and-white Poké Ball crest anchor the entrance.
  rect(ctx,-240,177,480,13,'#a7a291'); rect(ctx,-213,190,426,12,'#7c8182');
  round(ctx,-42,112,84,72,34,'#26374f','#c7d2cc'); round(ctx,-32,122,64,63,28,'#203246','#e8d7b1');
  drawPokeball(ctx,0,91+Math.sin(time/850)*1.5,27);
  for (const side of [-1,1]) {
    poly(ctx, [[side*250,199],[side*220,93],[side*191,82],[side*202,192]], '#88909a','#d0c8af');
    for (let j=0;j<3;j++) round(ctx,side*(216+j*12)-5,111+j*23,10,14,4,'rgba(255,216,154,.7)');
  }
  ctx.restore();
}

function drawPokemonCenter(ctx, time, cx = 245, top = 306, scale = .66) {
  ctx.save();ctx.translate(cx,top);ctx.scale(scale,scale);
  shadow(ctx,0,210,156,24,.3);
  poly(ctx,[[-150,202],[-139,68],[0,4],[139,68],[150,202]],'#eee2c2','#918575');
  poly(ctx,[[-126,193],[-116,79],[0,25],[116,79],[126,193]],'#f1e7cf','#a8a08c');
  // Familiar red roof, timber fascia, bright windows and central sliding doors.
  poly(ctx,[[-165,81],[0,0],[165,81],[145,102],[0,34],[-145,102]],'#c9534f','#863e43');
  rect(ctx,-124,113,248,12,'#bd9c73');
  round(ctx,-99,132,54,52,5,'#94c7ce','#718b8b');round(ctx,45,132,54,52,5,'#94c7ce','#718b8b');
  rect(ctx,-91,137,6,42,'rgba(255,255,255,.34)');rect(ctx,53,137,6,42,'rgba(255,255,255,.34)');
  round(ctx,-33,111,66,91,28,'#b94f50','#75444a');
  const glowPulse=.18+.12*(Math.sin(time/700)+1)/2;
  glow(ctx,0,72,84,`rgba(255,207,148,${glowPulse})`);
  circle(ctx,0,69,29,'#f5ead3','#8f6f65');drawPokeball(ctx,0,69,21);
  rect(ctx,-153,196,306,10,'#9b8a71');
  ctx.restore();
}

function drawKantoBackdrop(ctx, time, faction = 'guardian', menu = false) {
  const rocket = faction === 'syndicate';
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (rocket) { sky.addColorStop(0, '#11162a'); sky.addColorStop(.55, '#36344a'); sky.addColorStop(1, '#be6558'); }
  else { sky.addColorStop(0, '#1b3154'); sky.addColorStop(.54, '#547da3'); sky.addColorStop(1, '#edaa73'); }
  rect(ctx, 0, 0, W, H, sky);
  glow(ctx, menu ? 652 : 628, menu ? 266 : 214, 480, rocket ? 'rgba(233,51,67,.27)' : 'rgba(143,217,255,.28)');

  // Kanto at blue hour: layered cloud banks and a distant town silhouette.
  ctx.save();ctx.globalAlpha=rocket?.35:.48;
  ctx.fillStyle=rocket?'#515065':'#91b6b1';
  ctx.beginPath();ctx.moveTo(0,397);ctx.bezierCurveTo(126,340,177,354,272,386);ctx.bezierCurveTo(365,318,446,325,526,382);ctx.bezierCurveTo(627,326,708,339,796,386);ctx.bezierCurveTo(874,342,960,350,1060,394);ctx.lineTo(1280,355);ctx.lineTo(1280,474);ctx.lineTo(0,474);ctx.closePath();ctx.fill();
  ctx.globalAlpha=rocket?.2:.34;ctx.fillStyle=rocket?'#302f43':'#648f84';
  ctx.beginPath();ctx.moveTo(0,426);ctx.bezierCurveTo(121,375,222,399,336,426);ctx.bezierCurveTo(470,375,565,394,685,428);ctx.bezierCurveTo(807,381,942,394,1057,434);ctx.lineTo(1280,390);ctx.lineTo(1280,480);ctx.lineTo(0,480);ctx.closePath();ctx.fill();
  ctx.restore();
  for (let i = 0; i < 7; i++) {
    const x = ((i * 223 + time * (.008 + i * .001)) % (W + 320)) - 160;
    const y = 93 + (i % 3) * 53 + Math.sin(time / 1800 + i) * 8;
    ctx.save(); ctx.globalAlpha = .075 + .025 * Math.sin(time / 1100 + i); glow(ctx, x, y, 130, '#d7e8ff'); ctx.restore();
  }
  for(let i=0;i<3;i++) {
    const x=((i*480-time*(.006+i*.001))%(W+260)+W+260)%(W+260)-130, y=116+i*66;
    ctx.save();ctx.globalAlpha=rocket?.08:.13;
    const cloud=ctx.createRadialGradient(x,y,5,x,y,105);cloud.addColorStop(0,'#f4e5d4');cloud.addColorStop(1,'rgba(244,229,212,0)');
    ctx.fillStyle=cloud;ctx.beginPath();ctx.ellipse(x,y,135,25,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for (let i = 0; i < 13; i++) {
    const x=i*103-29,w=64+(i*31)%38,h=58+(i*47)%94,top=480-h,shade=i%3;
    const walls=['#39475a','#344454','#4b4d59'][shade];
    rect(ctx,x+5,top+22,w-10,h-22,walls);
    poly(ctx,[[x,top+24],[x+w*.5,top],[x+w,top+24],[x+w-5,top+34],[x+w*.5,top+12],[x+5,top+34]],['#56495a','#665053','#4c4c5a'][shade]);
    for(let col=0;col<2;col++) {
      const lit=(i+col*3)%4!==0;
      if(lit) round(ctx,x+16+col*25,top+40,9,13,3,`rgba(255,202,137,${.3+.12*Math.sin(time/850+i+col)})`);
    }
  }
  // Landmark placement is deliberately faction-led: stadium plaza for trainers,
  // Rocket headquarters and its guarded gate for the syndicate.
  if (menu) {
    drawRocketTower(ctx, time, 258, 45, .70);
    drawKantoGym(ctx, time, 1000, 290, .82);
  } else if (rocket) {
    drawRocketTower(ctx, time, 640, 10, .88);
    glow(ctx, 1002, 397, 205, 'rgba(225,73,75,.18)');
    poly(ctx, [[804,478],[816,295],[855,269],[1145,269],[1184,295],[1196,478]], '#38353e','#9b6b67');
    poly(ctx, [[833,467],[846,309],[878,291],[1122,291],[1154,309],[1167,467]], '#262b37','#736a72');
    round(ctx,875,310,250,155,8,'#171f2e','#bd8a78');
    const gate = ctx.createLinearGradient(0,320,0,465); gate.addColorStop(0,'#6a5960'); gate.addColorStop(.5,'#3e3d49'); gate.addColorStop(1,'#252d3a');
    rect(ctx,889,324,222,132,gate);
    for(let rib=0;rib<9;rib++){const x=896+rib*25;rect(ctx,x,325,5,128,rib%2?'rgba(220,211,194,.11)':'rgba(18,24,33,.35)');}
    rect(ctx,886,319,228,12,'#a7474e');rect(ctx,886,454,228,9,'#927366');
    round(ctx,974,357,52,48,6,'#282a37','#8f7775');
    ctx.save();ctx.fillStyle='#d85858';ctx.font='900 35px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('R',1000,381);ctx.restore();
    for(const x of [864,1136]){glow(ctx,x,331,25,'rgba(255,206,137,.22)');round(ctx,x-5,322,10,23,4,'#f0c789','#a27b6b');}
  } else {
    drawPokemonCenter(ctx,time,246,294,.69);
    drawKantoGym(ctx, time, 1000, 255, .94);
  }

  // A warm stone forecourt replaces the old futuristic perspective grid.
  const floor = ctx.createLinearGradient(0, 430, 0, H);
  floor.addColorStop(0, rocket ? '#82645e' : '#b39470'); floor.addColorStop(.2, rocket ? '#65545a' : '#857b70'); floor.addColorStop(1, rocket ? '#39313c' : '#514d4d');
  ctx.fillStyle = floor; ctx.beginPath(); ctx.moveTo(0, 453); ctx.lineTo(W, 453); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  // Hand-laid plaza stones: staggered, slightly irregular slabs instead of a grid.
  for (let row=0;row<9;row++) {
    const y0=462+row*row*3.15, y1=y0+6+row*2.1, cell=58+row*6, offset=(row%2)*cell*.48;
    for (let col=-3;col<23;col++) {
      const x0=col*cell+offset, jitter=Math.sin(col*2.17+row*1.9)*cell*.075;
      ctx.beginPath();ctx.moveTo(x0+jitter,y0);ctx.lineTo(x0+cell*.88+jitter*.3,y0+1);ctx.lineTo(x0+cell+jitter*.2,y1);ctx.lineTo(x0+cell*.12+jitter,y1+2);
      ctx.closePath();ctx.fillStyle=`rgba(${rocket?'35,29,38':'236,203,158'},${.012+(col+row)%3*.006})`;ctx.fill();
      ctx.strokeStyle='rgba(45,40,39,.12)';ctx.lineWidth=1;ctx.stroke();
    }
  }
  // Foreground planters and lanterns frame the play space and add a near layer.
  for (const side of [-1,1]) {
    const x=side<0?78:1202;
    round(ctx,x-28,478,56,94,8,'#51433c','#b29b76');
    rect(ctx,x-24,486,48,12,rocket?'#6e4a4b':'#6d8062');
    for(let n=0;n<4;n++){circle(ctx,x+(n-1.5)*9,477-(n%2)*12,12,rocket?'#465b4d':'#537557');}
    glow(ctx,x,430,55,rocket?'rgba(240,111,89,.12)':'rgba(255,205,129,.14)');
    round(ctx,x-7,425,14,27,7,'#f1c98d','#d6a36c');
  }

  // Apariciones escalonadas: especies entran, cruzan la escena y se ocultan.
  const pidgeotX = ((time * .075) % (W + 280)) - 140;
  const arrivals = [
    { id: 'pidgeot', x: pidgeotX, y: 206 + Math.sin(time / 280) * 13, scale: 1.5, alpha: Math.max(0, Math.min(1, (time % 18000 - 1000) / 1200)) },
    { id: rocket ? 'meowth' : 'pikachu', x: rocket ? 360 : 900, y: 506 + Math.sin(time / 340) * 3, scale: 1.2, alpha: .78 },
    { id: rocket ? 'growlithe' : 'eevee', x: rocket ? 850 : 395, y: 520 + Math.sin(time / 410 + 1) * 3, scale: 1.1, alpha: .72 },
  ];
  for (const mon of arrivals) {
    if (mon.alpha <= 0 || mon.x < -130 || mon.x > W + 130) continue;
    shadow(ctx, mon.x, mon.y + 19, 31, 9, .24);
    ctx.save(); ctx.globalAlpha = mon.alpha;
    const drawn = drawAnimatedPokemon(ctx, mon.id, mon.x, mon.y, { action: 'Walk', dir: 'right', time, scale: mon.scale });
    if (!drawn) drawSpeciesSprite(ctx, mon.id, mon.x, mon.y, { width: 72, height: 72 });
    ctx.restore();
  }
  for (let i = 0; i < 17; i++) {
    const drift = (time * (.012 + (i % 4) * .002) + i * 53) % (H + 50);
    const x = (i * 97 + Math.sin(time / 1200 + i) * 36) % W;
    const y = H - drift;
    ctx.save(); ctx.globalAlpha = .13 + .1 * Math.sin(time / 420 + i); glow(ctx, x, y, 10, rocket ? 'rgba(255,145,105,.45)' : 'rgba(255,213,145,.52)'); circle(ctx, x, y, 1.5 + i % 2, rocket ? '#f08e70' : '#ffe1a7'); ctx.restore();
  }
}

function drawMenuWorld(ctx, time) {
  drawKantoBackdrop(ctx, time, 'guardian', true);
}

export function setClickMarker(marker) {
  currentClickMarker = marker;
}

export function drawWorld(ctx, state, time) {
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;

  if (typeof document !== 'undefined' && !document.querySelector('#menu')?.classList.contains('hidden')) {
    drawMenuWorld(ctx, time);
    return;
  }
  ctx.imageSmoothingEnabled = false;

  let currentAreaId = 'meadow';

  if (state.scene === 'warehouse') {
    currentAreaId = state.faction === 'syndicate' ? 'rocket-room' : 'trainer-room';
    drawWarehouse(ctx, state, time);
  } else {
    const area = EXPEDITIONS.find(item => item.id === state.expeditionId) || EXPEDITIONS[0];
    currentAreaId = area.id;

    if (area.id === 'forest') {
      drawForest(ctx, time, area);
    } else if (area.id === 'quarry') {
      drawQuarry(ctx, time, area);
    } else {
      drawMeadow(ctx, time, area);
    }

    // Silueta muy sutil en los bordes; el bioma ocupa la pantalla completa.
    const edgeTone = area.id === 'forest' ? 'rgba(15, 53, 35, .13)' : area.id === 'quarry' ? 'rgba(88, 57, 31, .12)' : 'rgba(45, 99, 48, .1)';
    const edgeShade = ctx.createRadialGradient(W/2, H/2, 340, W/2, H/2, 800);
    edgeShade.addColorStop(0, 'rgba(0,0,0,0)'); edgeShade.addColorStop(1, edgeTone);
    rect(ctx, 0, 0, W, H, edgeShade);
  }

  if (state.scene === 'outside') {
    // Click-to-Move ripple indicator
    if (currentClickMarker) {
      const elapsed = time - currentClickMarker.time;
      if (elapsed < 500) {
        const pcent = elapsed / 500;
        const r = 4 + pcent * 22;
        const alpha = (1 - pcent) * 0.8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(currentClickMarker.x, currentClickMarker.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = currentClickMarker.isEnemy ? `rgba(231, 103, 79, ${alpha})` : `rgba(255, 235, 164, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        circle(ctx, currentClickMarker.x, currentClickMarker.y, 3, currentClickMarker.isEnemy ? `rgba(248, 113, 113, ${alpha})` : `rgba(254, 240, 138, ${alpha})`);
        ctx.restore();
      } else {
        currentClickMarker = null;
      }
    }

    const actors = [...state.wild.map(p => ({ kind: 'pokemon', y: p.y, entity: p })), { kind: 'player', y: state.player.y, entity: state.player }];
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      if (actor.kind === 'pokemon') drawPokemon(ctx, actor.entity, time);
      else drawPlayer(ctx, actor.entity, time);
    }
    // Atmospheric environmental particles in wild biomes
    drawBiomeAtmosphere(ctx, time, currentAreaId);
  }

  drawVignette(ctx, currentAreaId);
}
