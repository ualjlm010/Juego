import { ANIM_META } from './anim-data.js';
import { drawSpeciesSprite } from './sprites.js';

const animCache = new Map();

const DIR_TO_ROW = {
  down: 0,
  downright: 1,
  right: 2,
  upright: 3,
  up: 4,
  upleft: 5,
  left: 6,
  downleft: 7,
};

export function getAnimMeta(speciesId) {
  return ANIM_META[speciesId] || null;
}

export function loadAnimSheet(speciesId, action = 'Idle', shiny = false) {
  if (typeof Image === 'undefined') return null;

  const key = `${speciesId}_${action}_${shiny ? 's' : 'n'}`;
  if (animCache.has(key)) return animCache.get(key);

  const sub = shiny ? 's/' : '';
  const url = new URL(`../assets/pokemon/anim/${speciesId}/${sub}${action}.png`, import.meta.url).href;

  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  animCache.set(key, img);
  return img;
}

export function drawAnimatedPokemon(ctx, speciesId, x, y, {
  action = 'Idle',
  dir = 'down',
  time = 0,
  shiny = false,
  scale = 2.0,
} = {}) {
  const meta = getAnimMeta(speciesId);
  if (!meta || !meta.a || !meta.a[action]) {
    // Fallback to static sprite
    return drawSpeciesSprite(ctx, speciesId, x, y, { shiny, width: 78, height: 78 });
  }

  const anim = meta.a[action];
  const sheet = loadAnimSheet(speciesId, action, shiny);

  if (!sheet || !sheet.complete || !sheet.naturalWidth) {
    // If anim sheet not yet loaded, use static sprite
    return drawSpeciesSprite(ctx, speciesId, x, y, { shiny, width: 78, height: 78 });
  }

  // Frame calculation using frame durations d
  const durations = anim.d || [8];
  const totalTicks = durations.reduce((sum, d) => sum + d, 0);
  const frameTime = (time / 16.666) % Math.max(1, totalTicks);

  let acc = 0;
  let frame = 0;
  for (let i = 0; i < durations.length; i++) {
    acc += durations[i];
    if (frameTime < acc) {
      frame = i;
      break;
    }
  }
  frame = Math.min(frame, anim.n - 1);

  const row = DIR_TO_ROW[dir.toLowerCase()] ?? 0;
  const sx = frame * anim.w;
  const sy = (row % anim.r) * anim.h;

  const dw = anim.w * scale;
  const dh = anim.h * scale;

  // Anchor relative to bottom-center
  const ax = (anim.ax !== undefined ? anim.ax : anim.w / 2) * scale;
  const ay = (anim.ay !== undefined ? anim.ay : anim.h) * scale;

  const dx = Math.round(x - ax);
  const dy = Math.round(y - ay);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, sx, sy, anim.w, anim.h, dx, dy, dw, dh);
  ctx.restore();

  return true;
}
