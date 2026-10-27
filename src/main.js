import { CONFIG, EXPEDITIONS } from './config.js';
import { SPECIES, TYPE_COLORS } from './species.js';
import { createGameState, makeIndividual, makeWild } from './state.js';
import { drawWorld, setClickMarker } from './render.js';
import { consumePokeball, refundPokeball, registerCapturedPokemon } from './collection.js';
import { loadGameSave, writeGameSave } from './save.js';
import { chooseEncounterSpecies } from './encounters.js';
import { rollCapture } from './capture.js';
import { bindSpriteImages, getSpeciesSpriteUrl, preloadSpeciesSprites } from './sprites.js';
import { drawAnimatedPokemon } from './anim.js';
import { getExpeditionAccess, getMissionBoard, getResearchStats, RESEARCH_MISSIONS } from './research.js';
import { FACTIONS, createDynamicConflict, resolveConflict, adjustReputation } from './factions.js';
import { ITEMS, getItemDefinition } from './items.js';
import { buyItem, sellItem, getLegalShopItems, getBlackMarketItems } from './economy.js';
import { ensureTeamInitialized, getTeam, getLeadPokemon, addToTeam, removeFromTeam, swapTeamOrder, healEntireTeam, isTeamWiped } from './team.js';
import { createCombatSession, executePlayerAttack, awardCombatExp, calculateCombatStats, SPECIES_MOVES } from './combat.js';
import { getStoryMissionsProgress, claimStoryMissionReward } from './missions.js';
import { sfxSelect, sfxBack, sfxCaptureThrow, sfxCaptureSuccess, sfxCaptureFail, sfxHit, sfxSuperEffective, sfxLevelUp, sfxHeal, sfxAlarm, setAudioEnabled } from './audio.js';
import { initMenuBackground } from './menu-background.js';

// DOM Selectors
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const hud = document.querySelector('#hud');
const panelLayer = document.querySelector('#panelLayer');
const $ = s => document.querySelector(s);

initMenuBackground();

// Game State
let state = createGameState();
if (typeof window !== 'undefined') {
  window.gameState = state;
  window.__state__ = state;
  Object.defineProperty(window, 'gameState', {
    get() { return state; },
    set(v) { state = v; },
    configurable: true
  });
}
const keys = new Set();
let last = performance.now();
let toastTimer = 0;
let spawnTimer = 0;
let conflictTimer = 0;
let transitioning = false;
let pendingCapture = null;
let activeCombat = null;
let activeGame = false;
let clickTarget = null;

let detailAnimId = null;
let detailAnimRunning = false;
function cleanDetailAnim() {
  detailAnimRunning = false;
  if (detailAnimId) {
    cancelAnimationFrame(detailAnimId);
    detailAnimId = null;
  }
}

// -------------------------------------------------------------
// NATIVE FULLSCREEN API
// -------------------------------------------------------------
export function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

export async function toggleFullscreen() {
  try {
    if (!isFullscreen()) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('No se pudo alternar pantalla completa:', err);
    toast('Pantalla completa no disponible o bloqueada por el navegador.');
  }
  updateFullscreenUI();
}

function updateFullscreenUI() {
  const active = isFullscreen();
  const topBtn = $('#fullscreenTopBtn');
  const menuBtn = $('#fullscreenMenuBtn');

  if (topBtn) {
    const icon = topBtn.querySelector('.fs-icon');
    const label = topBtn.querySelector('.fs-label');
    if (icon?.querySelector('use')) icon.querySelector('use').setAttribute('href', './assets/ui/sprites.svg#fullscreen');
    if (label) label.textContent = active ? 'SALIR PANTALLA COMPLETA' : 'PANTALLA COMPLETA';
    topBtn.classList.toggle('active', active);
    topBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  if (menuBtn) {
    const menuLabel = menuBtn.querySelector('.fs-menu-label');
    if (menuLabel) {
      menuLabel.textContent = active ? 'SALIR DE PANTALLA COMPLETA' : 'ACTIVAR PANTALLA COMPLETA';
    }
    menuBtn.classList.toggle('active', active);
  }
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, updateFullscreenUI);
});

// Persistent storage
const storage = browserStorage();
let saveStatus = loadGameSave(storage);

function browserStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('El almacenamiento local no está disponible.', error);
    return null;
  }
}

function refreshMenuSaveStatus() {
  saveStatus = loadGameSave(storage);
  const button = $('#continueGame');
  const notice = $('#saveNotice');

  // Keep “Entrar” in the primary slot; disable it until a valid local profile exists.
  const canContinue = saveStatus.status === 'valid';
  button.classList.remove('hidden');
  button.disabled = !canContinue;
  button.setAttribute('aria-disabled', String(!canContinue));
  button.title = canContinue ? 'Entrar al perfil guardado' : 'Crea un perfil local para poder entrar';
  notice.classList.toggle('hidden', saveStatus.status === 'empty' || saveStatus.status === 'valid');

  if (saveStatus.status === 'corrupt') {
    notice.textContent = 'Guardado incompatible';
  } else if (saveStatus.status === 'unavailable') {
    notice.textContent = 'Guardado no disponible';
  }

  const saveInd = $('#saveIndicator');
  if (saveInd) {
    if (saveStatus.status === 'valid') {
      saveInd.textContent = 'PARTIDA GUARDADA';
    } else if (saveStatus.status === 'empty') {
      saveInd.textContent = 'SIN PARTIDA';
    } else {
      saveInd.textContent = 'REVISAR';
    }
  }
}

function persistCurrentGame() {
  if (!activeGame) return { ok: false, error: 'No hay una partida activa.' };
  const result = writeGameSave(storage, state);
  if (result.ok) {
    saveStatus = {
      status: 'valid',
      gameState: {
        balls: state.balls,
        collection: state.collection,
        researchClaims: state.researchClaims,
      },
      savedAt: result.savedAt,
    };
    const saveInd = $('#saveIndicator');
    if (saveInd) saveInd.textContent = 'GUARDADO';
  } else {
    const saveInd = $('#saveIndicator');
    if (saveInd) saveInd.textContent = 'ERROR AL GUARDAR';
    toast('No se pudo escribir en almacenamiento local.');
    console.error('Fallo al guardar partida:', result.error);
  }
  return result;
}

function updateHud() {
  ensureTeamInitialized(state);
  const stats = getResearchStats(state.collection);
  const area = EXPEDITIONS.find(item => item.id === state.expeditionId) || EXPEDITIONS[0];

  $('#collectionCount').textContent = state.collection.length;
  $('#researchCount').textContent = `${stats.uniqueSpecies}/${stats.totalSpecies}`;
  $('#ballCount').textContent = state.balls;
  $('#moneyDisplay').textContent = `${state.money || 0} ₽`;
  $('#darkTokenDisplay').textContent = `${state.darkTokens || 0} ◈`;

  // Faction indicator
  const faction = FACTIONS[state.faction] || FACTIONS.guardian;
  const fBadge = $('#factionIndicator');
  fBadge.textContent = faction.shortName.toUpperCase();
  fBadge.className = `faction-tag-badge faction-${faction.id}`;

  // Lead mon preview in HUD
  const lead = getLeadPokemon(state);
  const leadImg = $('#leadMonImg');
  const leadHpBar = $('#leadHpBar');
  const leadHpFill = $('#leadHpFill');

  if (lead) {
    leadImg.src = getSpeciesSpriteUrl(lead.speciesId, { shiny: lead.shiny });
    leadImg.classList.remove('hidden');
    leadHpBar.classList.remove('hidden');
    const pcent = Math.max(0, Math.min(100, Math.floor(((lead.currentHp ?? lead.maxHp) / (lead.maxHp || 20)) * 100)));
    leadHpFill.style.width = `${pcent}%`;
    leadHpFill.style.background = pcent > 50 ? '#4ade80' : pcent > 20 ? '#facc15' : '#f87171';
  } else {
    leadImg.classList.add('hidden');
    leadHpBar.classList.add('hidden');
  }

  const team = getTeam(state);
  $('#teamCount').textContent = `${team.length}/6`;

  // Dynamic conflicts badge
  const activeConflict = state.conflicts.find(c => !c.resolved && c.expiresAt > Date.now());
  $('#conflictBadge').classList.toggle('hidden', !activeConflict);

  // Location banner & Scene-specific UI controls
  document.body.classList.toggle('in-refugio', state.scene === 'warehouse');
  const actionsWidget = $('#refugioActionsWidget');
  const returnBtn = $('#returnToRefugioBtn');
  const wildCard = $('#wildTargetCard');

  if (state.scene === 'warehouse') {
    $('#locationName').textContent = 'SALA';
    $('#locationSub').textContent = `BASE DE OPERACIONES · ${faction.name.toUpperCase()}`;
    if (actionsWidget) actionsWidget.classList.remove('hidden');
    if (returnBtn) returnBtn.classList.add('hidden');
    if (wildCard) wildCard.classList.add('hidden');
  } else {
    $('#locationName').textContent = area.name.toUpperCase();
    $('#locationSub').textContent = `${stats.uniqueSpecies}/${stats.totalSpecies} ESPECIES · CAMPO SALVAJE`;
    if (actionsWidget) actionsWidget.classList.add('hidden');
    if (returnBtn) returnBtn.classList.remove('hidden');
  }
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function randomSpawn() {
  const area = EXPEDITIONS.find(item => item.id === state.expeditionId) || EXPEDITIONS[0];
  const candidates = area.spawnPoints.filter(p => state.wild.every(w => Math.hypot(w.x - p.x, w.y - p.y) > 90));
  if (!candidates.length) return;
  const point = candidates[Math.floor(Math.random() * candidates.length)];
  const id = chooseEncounterSpecies({ pool: area.encounterPool, weights: area.encounterWeights });
  state.wild.push(makeWild(id, point.x, point.y));
}

function startGameWithFaction(factionId = 'guardian') {
  if (pendingCapture) {
    clearTimeout(pendingCapture.timer);
    pendingCapture = null;
  }
  keys.clear();
  state = createGameState({ faction: factionId });
  if (typeof window !== 'undefined') window.state = state;
  ensureTeamInitialized(state);
  state.modal = null;
  spawnTimer = 0;
  conflictTimer = 0;
  transitioning = false;
  activeGame = true;

  panelLayer.classList.add('hidden');
  panelLayer.innerHTML = '';
  panelLayer.onclick = null;
  $('#menu').classList.add('hidden');
  hud.classList.remove('hidden');

  updateHud();
  sfxSelect();
  persistCurrentGame();
}

function openFactionSelectModal() {
  const willReplaceProgress = saveStatus.status === 'valid' || saveStatus.status === 'corrupt';
  const content = `
    <button class="faction-select-close" type="button" data-action="close" aria-label="Cerrar selección de bando" title="Volver al menú principal">
      <span aria-hidden="true">×</span>
    </button>
    <div class="faction-columns">
      <button id="chooseGuardianBtn" class="faction-poster trainers-poster" type="button" aria-label="Entrenador Pokémon">
        <img class="faction-poster-art" src="./assets/ui/faction-trainers.png" alt="" aria-hidden="true" />
        <span class="faction-poster-cut" aria-hidden="true"></span>
        <span class="faction-poster-name"><span class="faction-poster-ball" aria-hidden="true"></span>Entrenador Pokémon</span>
      </button>
      <button id="chooseSyndicateBtn" class="faction-poster rocket-poster" type="button" aria-label="Team Rocket">
        <img class="faction-poster-art" src="./assets/ui/faction-rocket.png" alt="" aria-hidden="true" />
        <span class="faction-poster-cut" aria-hidden="true"></span>
        <span class="faction-poster-name"><span class="faction-poster-ball" aria-hidden="true"></span>Team Rocket</span>
      </button>
    </div>
    ${willReplaceProgress ? '<p class="faction-reset-warning" role="status">Se borrará todo el progreso guardado de partidas anteriores.</p>' : ''}
  `;
  showPanel('faction-select', content);

  $('#chooseGuardianBtn').addEventListener('click', () => {
    const card = $('#chooseGuardianBtn');
    if (card.disabled) return;
    card.disabled = true;
    card.classList.add('is-picked');
    setTimeout(() => { closePanel(); startGameWithFaction('guardian'); }, 230);
  });
  $('#chooseSyndicateBtn').addEventListener('click', () => {
    const card = $('#chooseSyndicateBtn');
    if (card.disabled) return;
    card.disabled = true;
    card.classList.add('is-picked');
    setTimeout(() => { closePanel(); startGameWithFaction('syndicate'); }, 230);
  });
}

function requestNewGame() {
  openFactionSelectModal();
}

function continueGame() {
  const result = loadGameSave(storage);
  saveStatus = result;
  if (result.status !== 'valid') {
    refreshMenuSaveStatus();
    toast('No hay perfil local guardado.');
    return;
  }
  keys.clear();
  state = createGameState(result.gameState);
  if (typeof window !== 'undefined') window.state = state;
  ensureTeamInitialized(state);
  activeGame = true;
  spawnTimer = 0;
  conflictTimer = 0;
  transitioning = false;

  panelLayer.classList.add('hidden');
  panelLayer.innerHTML = '';
  $('#menu').classList.add('hidden');
  hud.classList.remove('hidden');

  updateHud();
  sfxSelect();
    toast('Sesión local recuperada.');
}

function nearTarget() {
  if (state.scene === 'warehouse') return null;

  const p = state.player;
  let best = null;
  let dist = Infinity;

  const targets = [
    { x: 640, y: 119, type: 'exit', label: 'VOLVER A LA SALA' },
    ...state.wild.map(w => ({
      x: w.x,
      y: w.y - 5,
      type: 'wild',
      label: `INTERACTUAR CON ${w.name.toUpperCase()}`,
      target: w,
    })),
  ];

  for (const t of targets) {
    const d = Math.hypot(t.x - p.x, t.y - p.y);
    if (d < 66 && d < dist && clearInteractionPath(t)) {
      dist = d;
      best = t;
    }
  }
  return best;
}

function updatePrompt() {
  const wtc = $('#wildTargetCard');
  if (!wtc) return;

  if (state.modal || state.scene !== 'outside') {
    wtc.classList.add('hidden');
    return;
  }

  const target = nearTarget();
  if (target && target.type === 'wild' && target.target) {
    const w = target.target;
    const sp = SPECIES[w.speciesId] || w;
    const nameEl = $('#wtcName');
    const lvlEl = $('#wtcLevel');
    const spriteEl = $('#wtcSprite');
    const typesEl = $('#wtcTypes');

    if (nameEl) nameEl.textContent = sp.name;
    if (lvlEl) lvlEl.textContent = `Nv. ${w.level || 10}`;
    if (spriteEl) spriteEl.src = getSpeciesSpriteUrl(w.speciesId, { shiny: w.shiny });
    if (typesEl) {
      typesEl.innerHTML = (sp.type || ['Normal']).map(t => {
        const c = TYPE_COLORS[t] || '#64748b';
        return `<span style="background: ${c}; color: #fff; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">${t}</span>`;
      }).join(' ');
    }

    const fightBtn = $('#wtcFightBtn');
    if (fightBtn) {
      fightBtn.onclick = (e) => {
        e.stopPropagation();
        openEncounter(w);
      };
    }

    const catchBtn = $('#wtcCatchBtn');
    if (catchBtn) {
      catchBtn.onclick = (e) => {
        e.stopPropagation();
        openEncounter(w);
      };
    }

    wtc.classList.remove('hidden');
  } else {
    wtc.classList.add('hidden');
  }
}

const warehouseBlockers = [
  [75, 125, 290, 176],
  [895, 125, 315, 270],
  [820, 397, 350, 162],
  [76, 415, 270, 148],
];

function blockedPoint(x, y, radius = 12, scene = state.scene, expeditionId = state.expeditionId) {
  if (x - radius < 30 || x + radius > 1250 || y - radius < 42 || y + radius > 690) return true;
  if (scene === 'warehouse') {
    if (y > 638 && x > 526 && x < 754) return false;
    return warehouseBlockers.some(([a, b, w, h]) => x + radius > a && x - radius < a + w && y + radius > b && y - radius < b + h);
  }
  const area = EXPEDITIONS.find(item => item.id === expeditionId) || EXPEDITIONS[0];
  return area.obstacles.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < (r + radius) ** 2);
}

function clearInteractionPath(target) {
  const p = state.player;
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.ceil(distance / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blockedPoint(p.x + dx * t, p.y + dy * t, 12)) return false;
  }
  return true;
}

function changeScene(scene, expeditionId = state.expeditionId) {
  if (transitioning || state.modal) return;
  keys.clear();
  clickTarget = null;
  transitioning = true;
  const fade = $('#fade');
  fade.classList.add('active');

  setTimeout(() => {
    state.scene = scene;
    if (scene === 'outside') state.expeditionId = expeditionId;
    state.player.x = 640;
    state.player.y = scene === 'warehouse' ? 550 : 160;
    state.player.dir = scene === 'warehouse' ? 'up' : 'down';
    state.wild = [];

    if (scene === 'outside') {
      randomSpawn();
      randomSpawn();
      spawnTimer = 0;
    }

    updateHud();
    fade.classList.remove('active');
    setTimeout(() => {
      transitioning = false;
    }, 240);

    const areaName = EXPEDITIONS.find(a => a.id === state.expeditionId)?.name || 'campo';
    toast(scene === 'outside' ? `Llegada a ${areaName}.` : 'De vuelta a la sala.');
  }, 220);
}

function doInteraction() {
  if (state.modal) return;
  if (state.scene === 'warehouse') {
    openExpeditionMap();
    return;
  }
  const t = nearTarget();
  if (!t) return;

  if (t.type === 'exit') {
    changeScene('warehouse');
  } else if (t.type === 'wild') {
    openEncounter(t.target);
  }
}

function healTeamAtCareCenter() {
  const count = healEntireTeam(state);
  sfxHeal();
  updateHud();
  toast(`¡Centro de Cuidados! ${count} Pokémon del equipo fueron restaurados al 100%.`);
  persistCurrentGame();
}

function showPanel(kind, content = '') {
  keys.clear();
  state.modal = kind;
  panelLayer.classList.remove('hidden');
  panelLayer.innerHTML = `<section class="panel ${kind === 'combat' ? 'combat-panel' : ''} ${kind === 'faction-select' ? 'faction-select' : ''}">${content}</section>`;
  bindSpriteImages(panelLayer);

  panelLayer.querySelectorAll('[data-action="close"]').forEach(b => b.addEventListener('click', closePanel));
  panelLayer.onclick = e => {
    if (e.target === panelLayer) closePanel();
  };
}

function closePanel() {
  if (!state.modal) return;
  cleanDetailAnim();
  keys.clear();
  sfxBack();

  if (pendingCapture) {
    clearTimeout(pendingCapture.timer);
    pendingCapture = null;
    refundPokeball(state);
    updateHud();
    toast('Intento cancelado. Poké Ball devuelta.');
  }

  state.modal = null;
  panelLayer.classList.add('hidden');
  panelLayer.innerHTML = '';
  panelLayer.onclick = null;
  updateHud();
}

function panelHeader(kicker, title) {
  return `
    <div class="panel-header">
      <div>
        ${kicker ? `<div class="panel-kicker">${kicker}</div>` : ''}
        <h2>${title}</h2>
      </div>
      <button class="close-button" data-action="close" aria-label="Cerrar"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#close"/></svg></button>
    </div>
  `;
}

// -------------------------------------------------------------
// PANELES: EQUIPO (TEAM)
// -------------------------------------------------------------
function openTeam() {
  ensureTeamInitialized(state);
  const team = getTeam(state);
  const collection = state.collection || [];
  const reserve = collection.filter(p => !state.team.includes(p.id) && !p.stolen);
  const stolen = collection.filter(p => p.stolen);

  let teamCards = team.map((p, idx) => {
    const s = SPECIES[p.speciesId];
    const stats = calculateCombatStats(p);
    const hp = p.currentHp ?? stats.maxHp;
    const maxHp = stats.maxHp;
    const pcent = Math.max(0, Math.min(100, Math.floor((hp / maxHp) * 100)));
    const hpClass = pcent > 50 ? '' : pcent > 20 ? 'warn' : 'danger';
    const isLead = idx === 0;

    return `
      <div class="team-card ${isLead ? 'lead' : ''} ${hp === 0 ? 'fainted' : ''}">
        <div class="team-card-header">
          <div>
            <b style="font-size: 15px; color: ${p.shiny ? '#facc15' : '#fff'}">${s.name}</b>
            <span style="font-size: 11px; color: #a2baa5;">Nv. ${p.level} · ${s.type.join('/')}</span>
            ${isLead ? '<span style="color: #facc15; font-size: 10px; display: block; font-weight: bold;">★ LÍDER</span>' : ''}
            ${hp === 0 ? '<span style="color: #f87171; font-size: 10px; display: block;">DEBILITADO</span>' : ''}
          </div>
          <img class="team-card-sprite" data-sprite-id="${p.speciesId}" src="${getSpeciesSpriteUrl(p.speciesId, { shiny: p.shiny })}" alt="${s.name}">
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
            <span>PS</span>
            <b>${hp} / ${maxHp}</b>
          </div>
          <div class="hp-bar-full">
            <div class="hp-bar-fill ${hpClass}" style="width: ${pcent}%;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; margin-top: 6px;">
          ${!isLead ? `<button class="small-btn" data-team-lead="${idx}">Hacer Líder</button>` : ''}
          <button class="small-btn" data-team-box="${p.id}">Mover a Reserva</button>
          <button class="small-btn" data-team-detail="${p.id}">Ficha</button>
        </div>
      </div>
    `;
  }).join('');

  const teamEmptySlots = Array.from({ length: Math.max(0, 6 - team.length) }, (_, index) => `
    <div class="team-slot-empty" aria-label="Espacio ${team.length + index + 1} disponible">
      <span aria-hidden="true">＋</span>
      <small>Espacio ${team.length + index + 1}</small>
    </div>
  `).join('');

  let reserveCards = reserve.map(p => {
    const s = SPECIES[p.speciesId];
    return `
      <div style="background: #141c15; border: 1px solid #2d4231; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img style="width: 32px; height: 32px; image-rendering: pixelated;" data-sprite-id="${p.speciesId}" src="${getSpeciesSpriteUrl(p.speciesId, { shiny: p.shiny })}" alt="${s.name}">
          <div>
            <b>${s.name}</b> <small style="color: #8da48f;">Nv. ${p.level}</small>
          </div>
        </div>
        <button class="small-btn" data-reserve-add="${p.id}" style="max-width: 100px;">Añadir al Equipo</button>
      </div>
    `;
  }).join('');

  let stolenNotice = '';
  if (stolen.length > 0) {
    stolenNotice = `
      <div class="compact-alert">
        <b>RETENIDOS · ${stolen.length}</b>
        <span>${stolen.map(p => SPECIES[p.speciesId]?.name || p.speciesId).join(' · ')}</span>
      </div>
    `;
  }

  const content = `
    ${panelHeader('', `Equipo ${team.length}/6`)}
    ${stolenNotice}
    ${team.length === 0 ? '<p class="team-empty-hint">Tu equipo se irá llenando con los Pokémon que captures.</p>' : ''}
    <div class="team-grid">${teamCards}${teamEmptySlots}</div>
    
    <div style="border-top: 1px solid #2c4030; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 16px; color: var(--gold); margin-bottom: 10px;">Reserva</h3>
      <div style="display: grid; gap: 6px; max-height: 180px; overflow-y: auto;">
        ${reserveCards || '<p class="empty-label">Vacía</p>'}
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 18px;">
      ${state.scene === 'warehouse' ? '<button id="healTeamBtn" class="primary-button" style="flex: 1; justify-content: center;">Curar</button>' : ''}
      <button class="secondary-button" data-action="close" style="flex: 1; justify-content: center;">Cerrar</button>
    </div>
  `;

  showPanel('team', content);

  panelLayer.querySelectorAll('[data-team-lead]').forEach(b => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.teamLead, 10);
      swapTeamOrder(state, 0, idx);
      sfxSelect();
      openTeam();
    });
  });

  panelLayer.querySelectorAll('[data-team-box]').forEach(b => {
    b.addEventListener('click', () => {
      const res = removeFromTeam(state, b.dataset.teamBox);
      if (res.ok) {
        sfxBack();
        openTeam();
      } else {
        toast(res.error);
      }
    });
  });

  panelLayer.querySelectorAll('[data-reserve-add]').forEach(b => {
    b.addEventListener('click', () => {
      const res = addToTeam(state, b.dataset.reserveAdd);
      if (res.ok) {
        sfxSelect();
        openTeam();
      } else {
        toast(res.error);
      }
    });
  });

  panelLayer.querySelectorAll('[data-team-detail]').forEach(b => {
    b.addEventListener('click', () => {
      const mon = state.collection.find(p => p.id === b.dataset.teamDetail);
      if (mon) openDetail(mon, () => openTeam());
    });
  });

  $('#healTeamBtn')?.addEventListener('click', () => {
    healTeamAtCareCenter();
    openTeam();
  });
}

// -------------------------------------------------------------
// PANELES: BOLSA E INVENTARIO
// -------------------------------------------------------------
function openBag() {
  const bag = state.bag || {};
  const itemKeys = Object.keys(bag).filter(k => bag[k] > 0);

  const cards = itemKeys.map(k => {
    const item = getItemDefinition(k);
    if (!item) return '';
    const qty = bag[k];
    const canUse = item.category === 'heal' || item.category === 'revive';

    return `
      <div class="item-card">
        <div>
          <h4>
            <span>${item.name}</span>
            <span>×${qty}</span>
          </h4>
          <p class="item-desc">${item.description}</p>
        </div>
        <div class="item-actions">
          ${canUse ? `<button class="small-btn" data-use-item="${item.id}">Usar</button>` : ''}
          <button class="small-btn" data-sell-item="${item.id}">Vender (${Math.floor(item.price * 0.5)} ₽)</button>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    ${panelHeader('', 'Bolsa')}
    <div style="background: #151d16; border: 1px solid #2d4231; border-radius: 6px; padding: 10px 16px; display: flex; justify-content: space-between; margin-bottom: 14px;">
      <div><b style="color: var(--lime); font-size: 16px;">${state.money || 0} ₽</b></div>
      <div><b style="color: #d47ce8; font-size: 16px;">${state.darkTokens || 0} ◈</b></div>
    </div>

    <div class="bag-grid">
      ${cards || '<p class="empty-label">Vacía</p>'}
    </div>

    <div style="display: flex; gap: 10px; margin-top: 14px;">
      <button id="openStoreBtn" class="primary-button" style="flex: 1; justify-content: center;">Tienda</button>
      <button class="secondary-button" data-action="close" style="flex: 1; justify-content: center;">Cerrar</button>
    </div>
  `;

  showPanel('bag', content);

  $('#openStoreBtn').addEventListener('click', () => openStoreHub());

  panelLayer.querySelectorAll('[data-use-item]').forEach(b => {
    b.addEventListener('click', () => {
      openUseItemTargetSelect(b.dataset.useItem);
    });
  });

  panelLayer.querySelectorAll('[data-sell-item]').forEach(b => {
    b.addEventListener('click', () => {
      const res = sellItem(state, b.dataset.sellItem, 1);
      if (res.ok) {
        sfxSelect();
        toast(`Vendido por ${res.earned} ₽.`);
        persistCurrentGame();
        openBag();
      } else {
        toast(res.error);
      }
    });
  });
}

function openUseItemTargetSelect(itemId) {
  const item = getItemDefinition(itemId);
  const team = getTeam(state);

  const targets = team.map(p => {
    const s = SPECIES[p.speciesId];
    const stats = calculateCombatStats(p);
    const hp = p.currentHp ?? stats.maxHp;
    return `
      <button class="secondary-button" data-item-target="${p.id}" style="margin-bottom: 8px; width: 100%;">
        <span>${s.name} (Nv. ${p.level})</span>
        <b>${hp} / ${stats.maxHp} PS</b>
      </button>
    `;
  }).join('');

  showPanel('use-target', `
    ${panelHeader('', item.name)}
    <div>${targets}</div>
    <button class="secondary-button" data-action="back-to-bag" style="width: 100%; justify-content: center; margin-top: 10px;">Volver</button>
  `);

  panelLayer.querySelector('[data-action="back-to-bag"]').addEventListener('click', openBag);

  panelLayer.querySelectorAll('[data-item-target]').forEach(b => {
    b.addEventListener('click', () => {
      const mon = state.collection.find(p => p.id === b.dataset.itemTarget);
      if (!mon) return;
      const stats = calculateCombatStats(mon);
      const bag = state.bag || {};

      if ((bag[itemId] || 0) <= 0) {
        toast('No quedan unidades de este objeto.');
        openBag();
        return;
      }

      if (item.category === 'heal') {
        if ((mon.currentHp ?? stats.maxHp) >= stats.maxHp) {
          toast(`${SPECIES[mon.speciesId].name} ya tiene los PS al máximo.`);
          return;
        }
        if ((mon.currentHp ?? stats.maxHp) <= 0) {
          toast(`${SPECIES[mon.speciesId].name} está debilitado. Usa un Revivir.`);
          return;
        }
        mon.currentHp = Math.min(stats.maxHp, (mon.currentHp ?? stats.maxHp) + item.healAmount);
        bag[itemId] -= 1;
        if (bag[itemId] <= 0) delete bag[itemId];
        sfxHeal();
        toast(`¡${SPECIES[mon.speciesId].name} recuperó salud!`);
      } else if (item.category === 'revive') {
        if ((mon.currentHp ?? stats.maxHp) > 0) {
          toast(`${SPECIES[mon.speciesId].name} no está debilitado.`);
          return;
        }
        mon.currentHp = Math.floor(stats.maxHp * 0.5);
        bag[itemId] -= 1;
        if (bag[itemId] <= 0) delete bag[itemId];
        sfxHeal();
        toast(`¡${SPECIES[mon.speciesId].name} fue reanimado!`);
      }

      persistCurrentGame();
      openBag();
    });
  });
}

// -------------------------------------------------------------
// PANELES: TIENDA Y MERCADO NEGRO
// -------------------------------------------------------------
function openStoreHub(tab = 'legal') {
  const legalItems = getLegalShopItems();
  const blackItems = getBlackMarketItems();
  const sellItems = Object.values(ITEMS).filter(item => (state.bag?.[item.id] || 0) > 0);

  const itemSprite = item => ({
    ball: 'ball', heal: 'potion', revive: 'revive', special: 'radar', contraband: 'chip',
  }[item.category] || 'chip');
  const renderStock = (items, isDark = false, isSelling = false) => items.map(item => {
    const price = isSelling ? Math.floor(item.price * 0.5) : isDark ? item.darkPrice : item.price;
    const currency = isDark ? '◈' : '₽';
    const canPay = isSelling || (price > 0 && (isDark ? (state.darkTokens || 0) >= price : (state.money || 0) >= price));
    return `
      <article class="shop-card ${isDark ? 'shop-card-shadow' : ''}">
        <div class="shop-item-art"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#${itemSprite(item)}"/></svg></div>
        <div class="shop-item-copy">
          <h3>${item.name}</h3>
          <p>${isSelling ? `Tienes ${state.bag[item.id]} · Recuperas la mitad de su valor.` : item.description}</p>
          <span class="shop-price ${isDark ? 'shadow-price' : ''}">${isSelling ? '+' : ''}${price.toLocaleString('es-ES')} ${currency}</span>
        </div>
        <button class="shop-buy ${isSelling ? 'shop-sell' : ''}" ${isSelling ? `data-sell-item="${item.id}"` : `data-buy-item="${item.id}" data-dark="${isDark}"`} ${canPay ? '' : 'disabled'} aria-label="${isSelling ? 'Vender' : 'Comprar'} ${item.name} por ${price} ${currency}">
          <svg class="ui-sprite"><use href="./assets/ui/sprites.svg#${isSelling ? 'chip' : 'shop'}"/></svg><span>${isSelling ? 'Vender 1' : 'Comprar'}</span>
        </button>
      </article>`;
  }).join('');

  const content = `
    ${panelHeader('PUESTO DE SUMINISTROS', tab === 'legal' ? 'Tienda' : tab === 'black' ? 'Mercado negro' : 'Vender objetos')}
    <div class="shop-balances" aria-label="Saldo">
      <div class="shop-balance"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#shop"/></svg><span><small>Monedas</small><b>${(state.money || 0).toLocaleString('es-ES')} ₽</b></span></div>
      <div class="shop-balance shadow-balance"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#chip"/></svg><span><small>Fichas sombra</small><b>${(state.darkTokens || 0).toLocaleString('es-ES')} ◈</b></span></div>
    </div>

    <div class="panel-nav">
      <button class="panel-tab ${tab === 'legal' ? 'active' : ''}" id="tabLegal"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#shop"/></svg><span>Tienda</span></button>
      <button class="panel-tab ${tab === 'black' ? 'active' : ''}" id="tabBlack"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#chip"/></svg><span>Mercado negro</span></button>
      <button class="panel-tab ${tab === 'sell' ? 'active' : ''}" id="tabSell"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#bag"/></svg><span>Vender</span></button>
    </div>

    <div class="shop-grid">
      ${tab === 'legal' ? renderStock(legalItems) : tab === 'black' ? renderStock(blackItems, true) : sellItems.length ? renderStock(sellItems, false, true) : '<div class="shop-empty"><svg class="ui-sprite"><use href="./assets/ui/sprites.svg#bag"/></svg><b>Tu bolsa está vacía</b><span>Los objetos que consigas aparecerán aquí.</span></div>'}
    </div>

    <button class="secondary-button shop-back" data-action="close" aria-label="Cerrar tienda">Volver al juego</button>
  `;

  showPanel('store', content);

  $('#tabLegal').addEventListener('click', () => openStoreHub('legal'));
  $('#tabBlack').addEventListener('click', () => openStoreHub('black'));
  $('#tabSell').addEventListener('click', () => openStoreHub('sell'));

  panelLayer.querySelectorAll('[data-buy-item]').forEach(b => {
    b.addEventListener('click', () => {
      const isDark = b.dataset.dark === 'true';
      const res = buyItem(state, b.dataset.buyItem, 1, isDark);
      if (res.ok) {
        sfxSelect();
        toast('¡Compra realizada con éxito!');
        persistCurrentGame();
        updateHud();
        openStoreHub(tab);
      } else {
        toast(res.error);
      }
    });
  });
  panelLayer.querySelectorAll('[data-sell-item]').forEach(b => {
    b.addEventListener('click', () => {
      const res = sellItem(state, b.dataset.sellItem, 1);
      if (res.ok) {
        sfxSelect();
        toast('Objeto vendido.');
        persistCurrentGame();
        updateHud();
        openStoreHub('sell');
      } else toast(res.error);
    });
  });
}

function openCounterHub() {
  showPanel('hub', `
    ${panelHeader('', 'Puesto de mando')}
    <div style="display: grid; gap: 10px;">
      <button id="hubStoreBtn" class="primary-button" style="justify-content: space-between;">
        <span>Tienda</span><span>→</span>
      </button>
      <button id="hubFactionsBtn" class="secondary-button">
        <span>Facciones</span><span>→</span>
      </button>
      <button id="hubMissionsBtn" class="secondary-button">
        <span>Misiones</span><span>→</span>
      </button>
      <button id="hubHealBtn" class="secondary-button">
        <span>Curar equipo</span><span>❤</span>
      </button>
    </div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center; margin-top: 14px;">Cerrar</button>
  `);

  $('#hubStoreBtn').addEventListener('click', () => openStoreHub());
  $('#hubFactionsBtn').addEventListener('click', () => openFactions());
  $('#hubMissionsBtn').addEventListener('click', () => openMissions());
  $('#hubHealBtn').addEventListener('click', () => healTeamAtCareCenter());
}

// -------------------------------------------------------------
// PANELES: FACCIONES Y CONFLICTOS DINÁMICOS
// -------------------------------------------------------------
function openFactions() {
  const isGuardian = state.faction === 'guardian';
  const gRep = state.reputation?.guardian || 0;
  const sRep = state.reputation?.syndicate || 0;
  const territory = state.territory || {};

  const activeConflicts = (state.conflicts || []).filter(c => !c.resolved && c.expiresAt > Date.now());
  const logEntries = state.eventLog || [];

  const conflictHtml = activeConflicts.map(c => `
    <div class="conflict-card">
      <div>
        <h4 style="color: #f87171; font-size: 15px;">⚡ ${c.title}</h4>
        <small style="color: #ff9999;">${c.zoneId.toUpperCase()} · ACTIVO</small>
      </div>
      <button class="primary-button" data-intervene="${c.id}" style="height: 38px; padding: 0 14px; font-size: 12px;">
        INTERVENIR
      </button>
    </div>
  `).join('');

  const logHtml = logEntries.slice(0, 6).map(e => `
    <div style="background: #141c15; border-bottom: 1px solid #283a2c; padding: 6px 10px; font-size: 11px;">
      <b style="color: ${e.winner === 'guardian' ? '#8cd77e' : '#d47ce8'};">${e.title}</b>
    </div>
  `).join('');

  const content = `
    ${panelHeader('', 'Facciones')}
    <div class="faction-columns">
      <div class="faction-card ${isGuardian ? 'active-faction' : ''}">
        <div style="display: flex; justify-content: space-between;">
          <h3 style="color: #8cd77e;">Alianza Guardiana</h3>
          <b style="color: #8cd77e;">${gRep}</b>
        </div>
      </div>

      <div class="faction-card ${!isGuardian ? 'active-faction' : ''}">
        <div style="display: flex; justify-content: space-between;">
          <h3 style="color: #d47ce8;">Sindicato Sombra</h3>
          <b style="color: #d47ce8;">${sRep}</b>
        </div>
      </div>
    </div>

    <div style="background: #151d16; border: 2px solid #2d4231; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
      <h3 style="font-size: 16px; color: var(--gold); margin-bottom: 10px;">Territorios</h3>
      ${['meadow', 'forest', 'quarry'].map(z => {
        const ctrl = territory[z] || { guardian: 50, syndicate: 50 };
        const zName = EXPEDITIONS.find(e => e.id === z)?.name || z;
        return `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>${zName}</span>
              <span><b>${ctrl.guardian}</b> · <b>${ctrl.syndicate}</b></span>
            </div>
            <div class="territory-bar">
              <div class="territory-fill-guardian" style="width: ${ctrl.guardian}%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <h3 style="font-size: 16px; color: #f87171; margin-bottom: 8px;">Conflictos</h3>
    ${conflictHtml || '<p class="empty-label">—</p>'}

    <h3 style="font-size: 16px; color: var(--gold); margin-bottom: 8px;">Registro</h3>
    <div style="max-height: 120px; overflow-y: auto; margin-bottom: 16px;">
      ${logHtml || '<p class="empty-label">—</p>'}
    </div>

    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center;">Cerrar</button>
  `;

  showPanel('factions', content);

  panelLayer.querySelectorAll('[data-intervene]').forEach(b => {
    b.addEventListener('click', () => {
      const conflict = state.conflicts.find(c => c.id === b.dataset.intervene);
      if (conflict) {
        interveneInConflict(conflict);
      }
    });
  });
}

function triggerPeriodicConflict() {
  const zones = ['meadow', 'forest', 'quarry'];
  const zoneId = zones[Math.floor(Math.random() * zones.length)];
  const conflict = createDynamicConflict(() => Math.random().toString(36).substring(2, 8), { zoneId });
  state.conflicts.push(conflict);
  sfxAlarm();
  toast(`⚡ ¡ALERTA! Conflicto en ${EXPEDITIONS.find(e => e.id === zoneId)?.name || zoneId}.`);
  updateHud();
}

function interveneInConflict(conflict) {
  closePanel();
  // Generate rival squad pokemon for skirmish
  const lead = getLeadPokemon(state);
  if (!lead || (lead.currentHp ?? lead.maxHp) <= 0) {
    toast('Tu líder está debilitado. Cúralo antes de intervenir.');
    return;
  }

  const rivalPool = ['growlithe', 'gastly', 'meowth', 'geodude', 'zubat', 'rattata'];
  const rivalSpecies = rivalPool[Math.floor(Math.random() * rivalPool.length)];
  const rivalMon = makeIndividual(makeWild(rivalSpecies, 0, 0), {
    levelRange: { min: Math.max(3, lead.level - 1), max: lead.level + 2 },
  });

  const trainerName = conflict.attacker === state.faction ? 'Defensor Hostil' : 'Asaltante Clandestino';

  openCombat(rivalMon, {
    isTrainerBattle: true,
    trainerName,
    onFinish: playerWon => {
      resolveConflict(conflict, state, { playerIntervened: true, playerWon });
      updateHud();
      persistCurrentGame();
    },
  });
}

// -------------------------------------------------------------
// PANELES: MISIONES E INVESTIGACIÓN
// -------------------------------------------------------------
function openMissions() {
  const storyList = getStoryMissionsProgress(state);
  const shortTitles = {
    'story-first-catch': 'Capturar',
    'story-team-trio': 'Equipo',
    'story-explore-forest': 'Bosque',
    'story-conflict-win': 'Conflicto',
    'story-explore-quarry': 'Cantera',
  };

  const storyHtml = storyList.map(m => `
    <div style="background: #162018; border: 2px solid ${m.complete ? '#5b9856' : '#2f4233'}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <b style="font-size: 15px; color: ${m.complete ? 'var(--lime)' : '#fff'};">${shortTitles[m.id] || m.title}</b>
          <small style="color: var(--gold);">Recompensa: ${m.rewardText}</small>
        </div>
        ${m.claimed
          ? '<span style="color: #657e68; font-size: 12px; font-weight: bold;">RECLAMADA</span>'
          : m.complete
            ? `<button class="primary-button" data-claim-story="${m.id}" style="height: 36px; padding: 0 12px; font-size: 11px;">RECLAMAR</button>`
            : '<span style="color: #8da48f; font-size: 12px;">EN PROGRESO</span>'
        }
      </div>
    </div>
  `).join('');

  const content = `
    ${panelHeader('', 'Misiones')}
    <div class="panel-nav">
      <button class="panel-tab active" id="tabStory">Historia</button>
      <button class="panel-tab" id="tabResearch">Dex</button>
    </div>

    <div>${storyHtml}</div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center; margin-top: 14px;">VOLVER</button>
  `;

  showPanel('missions', content);

  $('#tabResearch').addEventListener('click', () => openResearch());

  panelLayer.querySelectorAll('[data-claim-story]').forEach(b => {
    b.addEventListener('click', () => {
      const res = claimStoryMissionReward(state, b.dataset.claimStory);
      if (res.ok) {
        sfxLevelUp();
        toast(`¡Recompensa obtenida: ${res.rewardText}!`);
        persistCurrentGame();
        openMissions();
      } else {
        toast(res.error);
      }
    });
  });
}

function openResearch() {
  const board = getMissionBoard(state.collection, state.researchClaims);
  const stats = getResearchStats(state.collection);
  const shortTitles = {
    'first-sighting': 'Avistar',
    'field-variety': 'Variedad',
    'quarry-survey': 'Cantera',
    'full-catalog': 'Catálogo',
  };

  const missionsHtml = board.map(m => `
    <div style="background: #162018; border: 2px solid ${m.complete ? '#5b9856' : '#2f4233'}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <b style="font-size: 15px; color: ${m.complete ? 'var(--lime)' : '#fff'};">${shortTitles[m.id] || m.title}</b>
          <div class="mission-progress"><b>${m.current} / ${m.target}</b></div>
        </div>
        ${m.claimed
          ? '<span style="color: #657e68; font-size: 12px; font-weight: bold;">RECLAMADO</span>'
          : m.complete
            ? `<button class="primary-button" data-claim-research="${m.id}" style="height: 36px; padding: 0 12px; font-size: 11px;">+${m.reward} · Cobrar</button>`
            : '<span style="color: #8da48f; font-size: 12px;">…</span>'
        }
      </div>
    </div>
  `).join('');

  const content = `
    ${panelHeader('', `Dex ${stats.uniqueSpecies}/${stats.totalSpecies}`)}
    <div class="panel-nav">
      <button class="panel-tab" id="tabStoryFromRes">Historia</button>
      <button class="panel-tab active" id="tabResearchActive">Dex</button>
    </div>

    <div>${missionsHtml}</div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center; margin-top: 14px;">VOLVER</button>
  `;

  showPanel('research', content);

  $('#tabStoryFromRes').addEventListener('click', () => openMissions());

  panelLayer.querySelectorAll('[data-claim-research]').forEach(b => {
    b.addEventListener('click', () => {
      const missionId = b.dataset.claimResearch;
      const m = board.find(x => x.id === missionId);
      if (!m || m.claimed || !m.complete) return;

      state.researchClaims.push(missionId);
      state.balls += m.reward;
      const bag = state.bag || (state.bag = {});
      bag['poke-ball'] = (bag['poke-ball'] || 0) + m.reward;

      sfxLevelUp();
      toast(`¡Investigación completada! Recibiste ${m.reward} Poké Balls.`);
      persistCurrentGame();
      openResearch();
    });
  });
}

// -------------------------------------------------------------
// PANELES: MAPA DE EXPEDICIONES
// -------------------------------------------------------------
function openExpeditionMap() {
  const expeditions = getExpeditionAccess(state.collection);

  const cards = expeditions.map(exp => {
    const isCurrent = state.scene === 'outside' && state.expeditionId === exp.id;
    return `
      <div style="background: #162018; border: 2px solid ${exp.unlocked ? '#4d6d53' : '#332323'}; border-radius: 8px; padding: 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 17px; color: ${exp.unlocked ? 'var(--gold)' : '#888'};">${exp.name}</h3>
          <small style="color: ${exp.unlocked ? '#8cd77e' : '#f87171'};">
            ${exp.unlocked ? '✓' : `🔒 ${exp.discovered}/${exp.unlockAt}`}
          </small>
        </div>
        ${exp.unlocked
          ? `<button class="primary-button" data-travel="${exp.id}" style="height: 42px; padding: 0 16px; font-size: 13px;" ${isCurrent ? 'disabled' : ''}>
              ${isCurrent ? 'Aquí' : 'Ir'}
            </button>`
          : '<button class="secondary-button" disabled style="opacity: 0.5;">BLOQUEADO</button>'
        }
      </div>
    `;
  }).join('');

  const content = `
    ${panelHeader('', 'Destinos')}
    <div>${cards}</div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center; margin-top: 10px;">Cerrar</button>
  `;

  showPanel('map', content);

  panelLayer.querySelectorAll('[data-travel]').forEach(b => {
    b.addEventListener('click', () => {
      const dest = b.dataset.travel;
      closePanel();
      changeScene('outside', dest);
    });
  });
}

// -------------------------------------------------------------
// PANELES: COLECCIÓN Y REGISTRO INDIVIDUAL
// -------------------------------------------------------------
const colFilterState = {
  search: '',
  type: 'ALL',
  category: 'ALL',
  sort: 'LEVEL_DESC',
};

const ALL_TYPES = [
  'Acero', 'Agua', 'Bicho', 'Dragón', 'Eléctrico', 'Fantasma',
  'Fuego', 'Hada', 'Hielo', 'Lucha', 'Normal', 'Planta',
  'Psíquico', 'Roca', 'Siniestro', 'Tierra', 'Veneno', 'Volador'
];

function filterAndSortCollection() {
  const q = colFilterState.search.trim().toLowerCase();
  const selectedType = colFilterState.type;
  const category = colFilterState.category;
  const sortMode = colFilterState.sort;

  let list = state.collection.filter(p => {
    const s = SPECIES[p.speciesId];
    if (!s) return false;

    // Search query
    if (q) {
      const matchName = s.name.toLowerCase().includes(q);
      const matchType = s.type.some(t => t.toLowerCase().includes(q));
      const matchNat = p.nature ? p.nature.toLowerCase().includes(q) : false;
      const matchHab = p.ability ? p.ability.toLowerCase().includes(q) : false;
      if (!matchName && !matchType && !matchNat && !matchHab) return false;
    }

    // Type filter
    if (selectedType !== 'ALL') {
      if (!s.type.includes(selectedType)) return false;
    }

    // Category filter
    if (category === 'TEAM') {
      if (!state.team || !state.team.includes(p.id)) return false;
    } else if (category === 'RESERVE') {
      if (state.team && state.team.includes(p.id)) return false;
    } else if (category === 'SHINY') {
      if (!p.shiny) return false;
    } else if (category === 'STOLEN') {
      if (!p.stolen) return false;
    }

    return true;
  });

  // Sort
  list.sort((a, b) => {
    const sA = SPECIES[a.speciesId] || {};
    const sB = SPECIES[b.speciesId] || {};
    if (sortMode === 'LEVEL_ASC') return a.level - b.level;
    if (sortMode === 'DEX') return (sA.dex || 999) - (sB.dex || 999);
    if (sortMode === 'NAME') return (sA.name || '').localeCompare(sB.name || '');
    if (sortMode === 'HP_DESC') {
      const hpA = calculateCombatStats(a).maxHp;
      const hpB = calculateCombatStats(b).maxHp;
      return hpB - hpA;
    }
    // Default LEVEL_DESC
    return b.level - a.level;
  });

  return list;
}

function renderCollectionCards(list) {
  if (!list.length) {
    return `<div class="empty-state" style="grid-column: 1 / -1; padding: 30px;">
      No se encontraron ejemplares con los filtros seleccionados.<br>
      <small style="color: #8da48f; display: block; margin-top: 6px;">Prueba a modificar la búsqueda o los filtros de tipo/estado.</small>
    </div>`;
  }

  return list.map(p => {
    const s = SPECIES[p.speciesId];
    const type = s.type.map(t => `<span style="color:${TYPE_COLORS[t] || '#ddd'}">${t}</span>`).join(' · ');
    const isTeam = state.team && state.team.includes(p.id);

    return `
      <button class="pokemon-card" data-pokemon="${p.id}" style="--mon-color:${p.shiny ? '#f1d66e' : s.color}">
        <img class="pokemon-card-sprite" data-sprite-id="${p.speciesId}" src="${getSpeciesSpriteUrl(p.speciesId, { shiny: p.shiny })}" alt="${s.name}">
        <b>${s.name}${p.shiny ? ' <i class="shiny-tag">★</i>' : ''}</b>
        <small>${type} · Nv. ${p.level}</small>
        ${isTeam ? '<span style="color: var(--lime); font-size: 9px; display: block; font-weight: bold;">EQUIPO</span>' : ''}
        ${p.stolen ? '<span style="color: #f87171; font-size: 9px; display: block; font-weight: bold;">RETENIDO</span>' : ''}
      </button>
    `;
  }).join('');
}

function openCollection() {
  cleanDetailAnim();
  const filtered = filterAndSortCollection();

  const typeOptions = [
    `<option value="ALL"${colFilterState.type === 'ALL' ? ' selected' : ''}>Todos los tipos</option>`,
    ...ALL_TYPES.map(t => `<option value="${t}"${colFilterState.type === t ? ' selected' : ''}>${t}</option>`),
  ].join('');

  const content = `
    ${panelHeader('', `Dex ${state.collection.length}`)}

    <div class="collection-toolbar">
      <input type="search" id="colSearchInput" class="search-input" placeholder="🔍 Buscar por nombre, tipo o naturaleza..." value="${colFilterState.search}">

      <select id="colTypeFilter" class="sort-select">
        ${typeOptions}
      </select>

      <select id="colCategoryFilter" class="sort-select">
        <option value="ALL"${colFilterState.category === 'ALL' ? ' selected' : ''}>Todos los ejemplares</option>
        <option value="TEAM"${colFilterState.category === 'TEAM' ? ' selected' : ''}>⚔ Equipo activo</option>
        <option value="RESERVE"${colFilterState.category === 'RESERVE' ? ' selected' : ''}>📦 En reserva</option>
        <option value="SHINY"${colFilterState.category === 'SHINY' ? ' selected' : ''}>★ Variocolor</option>
        <option value="STOLEN"${colFilterState.category === 'STOLEN' ? ' selected' : ''}>⚠ Retenidos</option>
      </select>

      <select id="colSortFilter" class="sort-select">
        <option value="LEVEL_DESC"${colFilterState.sort === 'LEVEL_DESC' ? ' selected' : ''}>Nivel (mayor a menor)</option>
        <option value="LEVEL_ASC"${colFilterState.sort === 'LEVEL_ASC' ? ' selected' : ''}>Nivel (menor a mayor)</option>
        <option value="DEX"${colFilterState.sort === 'DEX' ? ' selected' : ''}>Nº Pokédex (#1 - #74)</option>
        <option value="NAME"${colFilterState.sort === 'NAME' ? ' selected' : ''}>Nombre (A → Z)</option>
        <option value="HP_DESC"${colFilterState.sort === 'HP_DESC' ? ' selected' : ''}>PS Máximos</option>
      </select>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; color: #8da48f;">
      <span id="colStatsCount">Mostrando ${filtered.length} de ${state.collection.length} ejemplares</span>
      <span>74 especies autóctonas registrables</span>
    </div>

    <div id="colGrid" class="collection-grid">
      ${renderCollectionCards(filtered)}
    </div>

    <button class="secondary-button" data-action="close" style="margin-top: 14px; width: 100%; justify-content: center;">VOLVER AL JUEGO</button>
  `;

  showPanel('collection', content);

  function attachCardListeners() {
    panelLayer.querySelectorAll('[data-pokemon]').forEach(b => {
      b.addEventListener('click', () => {
        const mon = state.collection.find(p => p.id === b.dataset.pokemon);
        if (mon) openDetail(mon, () => openCollection());
      });
    });
  }

  function updateCollectionGrid() {
    const updated = filterAndSortCollection();
    const grid = $('#colGrid');
    const countEl = $('#colStatsCount');
    if (grid) grid.innerHTML = renderCollectionCards(updated);
    if (countEl) countEl.textContent = `Mostrando ${updated.length} de ${state.collection.length} ejemplares`;
    attachCardListeners();
  }

  $('#colSearchInput')?.addEventListener('input', e => {
    colFilterState.search = e.target.value;
    updateCollectionGrid();
  });

  $('#colTypeFilter')?.addEventListener('change', e => {
    colFilterState.type = e.target.value;
    updateCollectionGrid();
  });

  $('#colCategoryFilter')?.addEventListener('change', e => {
    colFilterState.category = e.target.value;
    updateCollectionGrid();
  });

  $('#colSortFilter')?.addEventListener('change', e => {
    colFilterState.sort = e.target.value;
    updateCollectionGrid();
  });

  attachCardListeners();
}

function openDetail(p, onBack = () => openCollection()) {
  if (!p) return;
  cleanDetailAnim();

  const s = SPECIES[p.speciesId];
  const stats = calculateCombatStats(p);
  const moves = SPECIES_MOVES[p.speciesId] || SPECIES_MOVES.rattata;

  let currentAction = 'Idle';
  let currentDir = 'down';

  const content = `
    ${panelHeader('REGISTRO INDIVIDUAL', `${s.name}${p.shiny ? ' <span class="shiny-tag">VARIOCOLOR ★</span>' : ''}`)}
    <div class="detail-layout">
      <div class="detail-art">
        <canvas id="detailAnimCanvas" width="128" height="128" class="detail-anim-canvas" aria-label="Animación"></canvas>
        <div class="anim-controls-row">
          <button class="anim-ctrl-btn active" data-action-type="Idle">Reposo</button>
          <button class="anim-ctrl-btn" data-action-type="Walk">Andar</button>
          <button class="anim-ctrl-btn" data-action-type="Attack">Ataque</button>
          <button class="anim-ctrl-btn" data-action-type="Hurt">Daño</button>
        </div>
        <div class="anim-controls-row" style="margin-top: 4px;">
          <button class="anim-ctrl-btn active" data-dir-type="down" title="Mirar Abajo">↓</button>
          <button class="anim-ctrl-btn" data-dir-type="right" title="Mirar Derecha">→</button>
          <button class="anim-ctrl-btn" data-dir-type="up" title="Mirar Arriba">↑</button>
          <button class="anim-ctrl-btn" data-dir-type="left" title="Mirar Izquierda">←</button>
        </div>
      </div>
      <div>
        <div class="detail-data">
          <div class="data-cell"><small>Tipo</small><b>${s.type.join(' / ')}</b></div>
          <div class="data-cell"><small>Nivel</small><b>${p.level}</b></div>
          <div class="data-cell"><small>PS Máximos</small><b>${stats.maxHp}</b></div>
          <div class="data-cell"><small>Ataque</small><b>${stats.atk}</b></div>
          <div class="data-cell"><small>Defensa</small><b>${stats.def}</b></div>
          <div class="data-cell"><small>Velocidad</small><b>${stats.spd}</b></div>
          <div class="data-cell"><small>Naturaleza</small><b>${p.nature}</b></div>
          <div class="data-cell"><small>Habilidad</small><b>${p.ability}</b></div>
          <div class="data-cell"><small>Capturado con</small><b>${p.ball}</b></div>
          <div class="data-cell"><small>Nº Pokédex</small><b>#${s.dex || '—'}</b></div>
          <div class="iv-row">
            ${Object.entries(p.iv).map(([k, v]) => `<span>${k} ${v.toString().padStart(2, '0')}</span>`).join('')}
          </div>
        </div>

        <div style="margin-top: 12px; background: #131b14; border: 1px solid #2a3c2e; border-radius: 6px; padding: 8px 12px;">
          <small style="color: var(--gold); font-weight: bold;">MOVIMIENTOS CONOCIDOS</small>
          <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
            ${moves.map(m => `<span style="background: #253828; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${m.name} (${m.type} · ${m.power})</span>`).join('')}
          </div>
        </div>

        <p class="detail-desc" style="margin-top: 10px;">${s.description}</p>
        <small style="font-family: var(--font-mono); color: #858b80; font-size: 9px; display: block; margin-top: 6px;">
          ID ÚNICO: ${p.id.slice(0, 12).toUpperCase()}
        </small>
      </div>
    </div>
    <button class="secondary-button" data-action="back" style="margin-top: 14px; width: 100%; justify-content: center;">← VOLVER</button>
  `;

  showPanel('detail', content);

  // Setup interactive animation preview loop
  const animCanvas = $('#detailAnimCanvas');
  if (animCanvas) {
    const dCtx = animCanvas.getContext('2d');
    detailAnimRunning = true;

    function renderDetailFrame(time) {
      if (!detailAnimRunning) return;
      dCtx.clearRect(0, 0, 128, 128);
      dCtx.imageSmoothingEnabled = false;

      // Draw shadow
      dCtx.save();
      dCtx.fillStyle = 'rgba(20, 32, 22, 0.4)';
      dCtx.beginPath();
      dCtx.ellipse(64, 108, 24, 7, 0, 0, Math.PI * 2);
      dCtx.fill();
      dCtx.restore();

      // Draw animated sprite centered
      drawAnimatedPokemon(dCtx, p.speciesId, 64, 102, {
        action: currentAction,
        dir: currentDir,
        time,
        shiny: p.shiny,
        scale: 2.2,
      });

      detailAnimId = requestAnimationFrame(renderDetailFrame);
    }

    detailAnimId = requestAnimationFrame(renderDetailFrame);

    // Switch action
    panelLayer.querySelectorAll('[data-action-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        panelLayer.querySelectorAll('[data-action-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAction = btn.dataset.actionType;
      });
    });

    // Switch direction
    panelLayer.querySelectorAll('[data-dir-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        panelLayer.querySelectorAll('[data-dir-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDir = btn.dataset.dirType;
      });
    });
  }

  panelLayer.querySelector('[data-action="back"]').addEventListener('click', () => {
    cleanDetailAnim();
    onBack();
  });
}

// -------------------------------------------------------------
// PANELES: ENCUENTRO SALVAJE Y COMBATE TURN-BASED
// -------------------------------------------------------------
function openEncounter(w) {
  if (!w || !state.wild.includes(w)) return;
  sfxSelect();

  const p = `
    ${panelHeader('', w.name)}
    <div class="encounter-hero">
      <img class="encounter-sprite" data-sprite-id="${w.speciesId}" src="${getSpeciesSpriteUrl(w.speciesId, { shiny: w.shiny })}" alt="${w.name}">
      <span class="rarity">${w.shiny ? 'VARIOCOLOR' : w.rarity}</span>
    </div>
    <div class="encounter-info">
      <div>
        <h3>${w.name}</h3>
        <small>${w.type.join(' / ')}</small>
      </div>
      <small style="color: var(--gold);">${w.shiny ? '★' : ''}</small>
    </div>

    <div style="display: grid; gap: 8px; margin-bottom: 8px;">
      <button id="fightWildBtn" class="primary-button" style="justify-content: space-between;">
        <span>Combatir</span>
        <span>⚔</span>
      </button>

      <button id="quickCaptureBtn" class="secondary-button" ${state.balls <= 0 ? 'disabled' : ''} style="justify-content: space-between;">
        <span>Capturar</span>
        <b>×${state.balls}</b>
      </button>

      <button class="secondary-button" data-action="close" style="justify-content: center;">Huir</button>
    </div>
  `;

  showPanel('encounter', p);

  $('#fightWildBtn').addEventListener('click', () => {
    closePanel();
    const wildMon = makeIndividual(w);
    openCombat(wildMon, {
      wildRef: w,
      onCapture: ind => {
        const reg = registerCapturedPokemon(state, w, ind);
        if (reg.ok) {
          toast(`¡${w.name} se unió a la colección!`);
          persistCurrentGame();
        }
      },
    });
  });

  $('#quickCaptureBtn').addEventListener('click', () => quickCapture(w));
}

function quickCapture(w) {
  if (state.modal !== 'encounter' || pendingCapture || state.balls <= 0 || !state.wild.includes(w)) return;
  const btn = $('#quickCaptureBtn');
  if (!btn || btn.disabled || !consumePokeball(state)) return;
  btn.disabled = true;
  updateHud();
  sfxCaptureThrow();
  btn.textContent = 'Lanzando…';

  const timer = setTimeout(() => {
    pendingCapture = null;
    if (!state.wild.includes(w)) {
      closePanel();
      updateHud();
      return;
    }
    const success = rollCapture(w);
    if (success) {
      try {
        const individual = makeIndividual(w);
        const registered = registerCapturedPokemon(state, w, individual);
        if (registered.ok) {
          sfxCaptureSuccess();
          toast(`¡${w.name} capturado con éxito!`);
        } else {
          refundPokeball(state);
          toast(`Error al registrar captura: ${registered.error}`);
        }
      } catch (error) {
        refundPokeball(state);
        toast('No se pudieron validar los datos del ejemplar.');
      }
    } else {
      sfxCaptureFail();
      toast(`¡${w.name} escapó de la Poké Ball!`);
    }

    state.modal = null;
    panelLayer.classList.add('hidden');
    panelLayer.innerHTML = '';
    updateHud();
    persistCurrentGame();
  }, 750);

  pendingCapture = { timer, w };
}

function openCombat(opponentMon, { isTrainerBattle = false, trainerName = '', wildRef = null, onFinish = null, onCapture = null } = {}) {
  ensureTeamInitialized(state);
  const leadMon = getLeadPokemon(state);
  if (!leadMon || (leadMon.currentHp ?? leadMon.maxHp) <= 0) {
    toast('Todos los Pokémon de tu equipo están debilitados.');
    return;
  }

  activeCombat = createCombatSession(leadMon, opponentMon, { isTrainerBattle, trainerName });

  const renderCombat = () => {
    const pMon = activeCombat.playerMon;
    const oMon = activeCombat.opponentMon;
    const pSpecies = SPECIES[pMon.speciesId];
    const oSpecies = SPECIES[oMon.speciesId];
    const moves = SPECIES_MOVES[pMon.speciesId] || SPECIES_MOVES.rattata;

    const pStats = calculateCombatStats(pMon);
    const oStats = calculateCombatStats(oMon);

    const pHp = pMon.currentHp ?? pStats.maxHp;
    const oHp = oMon.currentHp ?? oStats.maxHp;

    const pPcent = Math.max(0, Math.min(100, Math.floor((pHp / pStats.maxHp) * 100)));
    const oPcent = Math.max(0, Math.min(100, Math.floor((oHp / oStats.maxHp) * 100)));

    const movesHtml = moves.map((m, idx) => `
      <button class="move-btn" data-move-idx="${idx}" ${activeCombat.finished ? 'disabled' : ''}>
        <span>${m.name}</span>
        <span class="move-type-badge" style="background: ${TYPE_COLORS[m.type] || '#555'}">${m.type}</span>
      </button>
    `).join('');

    const logHtml = activeCombat.log.map(l => `<div>• ${l}</div>`).join('');

    const content = `
      ${panelHeader('', isTrainerBattle ? trainerName : oSpecies.name)}
      
      <div class="combat-arena">
        <!-- Jugador (Lead) -->
        <div class="combat-fighter">
          <img class="combat-sprite" data-sprite-id="${pMon.speciesId}" src="${getSpeciesSpriteUrl(pMon.speciesId, { shiny: pMon.shiny })}" alt="${pSpecies.name}">
          <div class="combat-fighter-info">
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <b>${pSpecies.name}</b>
              <span>Nv. ${pMon.level}</span>
            </div>
            <div class="hp-bar-full" style="margin-top: 4px;">
              <div class="hp-bar-fill" style="width: ${pPcent}%;"></div>
            </div>
            <div style="font-size: 10px; text-align: right; margin-top: 2px;">${pHp} / ${pStats.maxHp} PS</div>
          </div>
        </div>

        <!-- Oponente -->
        <div class="combat-fighter opponent">
          <div class="combat-fighter-info">
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <b>${oSpecies.name}</b>
              <span>Nv. ${oMon.level}</span>
            </div>
            <div class="hp-bar-full" style="margin-top: 4px;">
              <div class="hp-bar-fill" style="width: ${oPcent}%; background: #ef4444;"></div>
            </div>
            <div style="font-size: 10px; text-align: right; margin-top: 2px;">${oHp} / ${oStats.maxHp} PS</div>
          </div>
          <img class="combat-sprite" data-sprite-id="${oMon.speciesId}" src="${getSpeciesSpriteUrl(oMon.speciesId, { shiny: oMon.shiny })}" alt="${oSpecies.name}">
        </div>
      </div>

      <!-- Log de combate -->
      <div class="combat-log-box" id="combatLogBox">${logHtml}</div>

      <!-- Acciones de combate -->
      ${!activeCombat.finished ? `
        <div class="combat-moves-grid">${movesHtml}</div>
        <div style="display: flex; gap: 8px;">
          ${!isTrainerBattle ? '<button id="combatCatchBtn" class="primary-button" style="flex: 1; justify-content: center;">CAPTURAR (BALLS)</button>' : ''}
          <button id="combatBagBtn" class="secondary-button" style="flex: 1; justify-content: center;">USAR OBJETO</button>
          <button id="combatRunBtn" class="secondary-button" style="flex: 1; justify-content: center;">HUIR</button>
        </div>
      ` : `
        <div style="text-align: center; margin-top: 10px;">
          <h3 style="color: ${activeCombat.winner === 'player' ? 'var(--lime)' : '#f87171'}; font-size: 20px; margin-bottom: 8px;">
            ${activeCombat.winner === 'player' ? 'Victoria' : 'Derrota'}
          </h3>
          <button id="combatFinishBtn" class="primary-button" style="width: 100%; justify-content: center;">Continuar</button>
        </div>
      `}
    `;

    showPanel('combat', content);

    const logBox = $('#combatLogBox');
    if (logBox) logBox.scrollTop = logBox.scrollHeight;

    if (!activeCombat.finished) {
      panelLayer.querySelectorAll('[data-move-idx]').forEach(b => {
        b.addEventListener('click', () => {
          const mIdx = parseInt(b.dataset.moveIdx, 10);
          sfxHit();
          executePlayerAttack(activeCombat, mIdx);

          if (activeCombat.finished) {
            if (activeCombat.winner === 'player') {
              sfxLevelUp();
              const expResult = awardCombatExp(activeCombat.playerMon, activeCombat.opponentMon);
              activeCombat.log.push(`¡${SPECIES[activeCombat.playerMon.speciesId].name} ganó ${expResult.expGain} EXP!`);
              if (expResult.leveledUp) {
                activeCombat.log.push(`¡${SPECIES[activeCombat.playerMon.speciesId].name} subió al Nivel ${expResult.newLevel}!`);
              }
              const moneyGain = (activeCombat.opponentMon.level || 5) * 40;
              state.money = (state.money || 0) + moneyGain;
              activeCombat.log.push(`¡Obtuviste ${moneyGain} ₽ de recompensa!`);
            } else {
              sfxBack();
            }
          }
          renderCombat();
        });
      });

      $('#combatCatchBtn')?.addEventListener('click', () => {
        openCombatCatchModal(activeCombat.opponentMon, wildRef, onCapture);
      });

      $('#combatBagBtn')?.addEventListener('click', () => {
        openBag();
      });

      $('#combatRunBtn')?.addEventListener('click', () => {
        sfxBack();
        toast('Escapaste del combate sin incidentes.');
        closePanel();
      });
    } else {
      $('#combatFinishBtn').addEventListener('click', () => {
        const playerWon = activeCombat.winner === 'player';
        closePanel();
        if (wildRef && playerWon) {
          state.wild = state.wild.filter(w => w !== wildRef);
        }
        if (!playerWon) {
          toast('Tu equipo fue derrotado. Fuiste trasladado a un punto seguro.');
          changeScene('warehouse');
          healEntireTeam(state);
        }
        if (typeof onFinish === 'function') onFinish(playerWon);
        updateHud();
        persistCurrentGame();
      });
    }
  };

  renderCombat();
}

function openCombatCatchModal(opponentMon, wildRef, onCapture) {
  const ballsAvailable = ['poke-ball', 'great-ball', 'ultra-ball'].filter(bId => (state.bag?.[bId] || 0) > 0);
  if (!ballsAvailable.length) {
    toast('No tienes Poké Balls en tu bolsa.');
    return;
  }

  const buttonsHtml = ballsAvailable.map(bId => {
    const item = getItemDefinition(bId);
    return `
      <button class="secondary-button" data-throw-ball="${bId}" style="margin-bottom: 8px; width: 100%;">
        <span>${item.name}</span>
        <b>×${state.bag[bId]}</b>
      </button>
    `;
  }).join('');

  showPanel('combat-catch', `
    ${panelHeader('', 'Poké Balls')}
    <div>${buttonsHtml}</div>
    <button class="secondary-button" data-action="back-to-combat" style="width: 100%; justify-content: center; margin-top: 10px;">Volver</button>
  `);

  panelLayer.querySelector('[data-action="back-to-combat"]').addEventListener('click', () => {
    // Re-render combat
    openCombat(activeCombat.opponentMon, {
      isTrainerBattle: activeCombat.isTrainerBattle,
      trainerName: activeCombat.trainerName,
      wildRef,
      onCapture,
    });
  });

  panelLayer.querySelectorAll('[data-throw-ball]').forEach(b => {
    b.addEventListener('click', () => {
      const bId = b.dataset.throwBall;
      const item = getItemDefinition(bId);
      state.bag[bId] -= 1;
      if (state.bag[bId] <= 0) delete state.bag[bId];
      if (bId === 'poke-ball') state.balls = Math.max(0, state.balls - 1);

      sfxCaptureThrow();
      toast(`Lanzando ${item.name}…`);

      // Roll capture with item multiplier and current HP factor
      const oHp = opponentMon.currentHp || 20;
      const oMaxHp = opponentMon.maxHp || 20;
      const hpFactor = 1 + (1 - oHp / oMaxHp) * 0.5;
      const chance = CONFIG.captureBaseChance * (item.multiplier || 1.0) * hpFactor;

      setTimeout(() => {
        if (Math.random() < chance) {
          sfxCaptureSuccess();
          toast(`¡${SPECIES[opponentMon.speciesId].name} fue capturado!`);
          opponentMon.ball = item.ballType || 'Poké Ball';
          if (typeof onCapture === 'function') {
            onCapture(opponentMon);
          } else {
            state.collection.push(opponentMon);
          }
          if (wildRef) {
            state.wild = state.wild.filter(w => w !== wildRef);
          }
          closePanel();
          updateHud();
          persistCurrentGame();
        } else {
          sfxCaptureFail();
          toast(`¡${SPECIES[opponentMon.speciesId].name} se liberó de la ${item.name}!`);
          openCombat(activeCombat.opponentMon, {
            isTrainerBattle: activeCombat.isTrainerBattle,
            trainerName: activeCombat.trainerName,
            wildRef,
            onCapture,
          });
        }
      }, 700);
    });
  });
}

// -------------------------------------------------------------
// PANELES: CONFIGURACIÓN, CRÉDITOS Y PAUSA
// -------------------------------------------------------------
function openSettings() {
  const audioOn = state.settings?.audio !== false;
  const content = `
    ${panelHeader('', 'Ajustes')}
    <div style="background: #141c15; border: 2px solid #2d4231; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <b>Sonido</b>
        </div>
        <button id="toggleAudioBtn" class="small-btn" style="max-width: 90px;">
          ${audioOn ? 'On' : 'Off'}
        </button>
      </div>

      <div style="border-top: 1px solid #283a2c; padding-top: 14px; margin-top: 14px;">
        <b style="color: #f87171;">Guardado</b>
        <button id="deleteSaveBtn" class="secondary-button" style="border-color: #7f2b2b; color: #f87171; justify-content: center; width: 100%;">
          Borrar
        </button>
      </div>
    </div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center;">Cerrar</button>
  `;

  showPanel('settings', content);

  $('#toggleAudioBtn').addEventListener('click', () => {
    state.settings = state.settings || {};
    state.settings.audio = !audioOn;
    setAudioEnabled(state.settings.audio);
    sfxSelect();
    persistCurrentGame();
    openSettings();
  });

  $('#deleteSaveBtn').addEventListener('click', () => {
    if (confirm('¿Borrar guardado?')) {
      storage?.removeItem('pokemon-black-market.save');
      toast('Partida eliminada.');
      closePanel();
      refreshMenuSaveStatus();
    }
  });
}

function openCredits() {
  const content = `
    ${panelHeader('ATRIBUCIÓN', 'Créditos y Licencias')}
    <div style="background: #141c15; border: 2px solid #2d4231; border-radius: 8px; padding: 14px; max-height: 380px; overflow-y: auto; font-size: 12px; line-height: 1.6; color: #cbd8cb;">
      <h3 style="color: var(--gold); font-size: 15px; margin-bottom: 6px;">Sprites y Animaciones de Pokémon</h3>
      <p style="margin-bottom: 12px;">
        Los sprites y hojas de animación de Pokémon Mundo Misterioso provienen del archivo comunitario <b>PMDCollab / SpriteCollab</b> (vía repositorio PokéSurvivor), licenciados bajo <b>Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0)</b>.
      </p>

      <h4 style="color: var(--lime); font-size: 13px; margin-bottom: 4px;">Artistas por Especie:</h4>
      <ul style="margin-left: 18px; margin-bottom: 14px;">
        <li><b>Rattata (19):</b> CHUNSOFT; ShyStarryRain</li>
        <li><b>Zubat (41):</b> CHUNSOFT; Tacocoa</li>
        <li><b>Oddish (43):</b> CHUNSOFT; Tacocoa</li>
        <li><b>Geodude (74):</b> CHUNSOFT; El_Pangoro_Parse</li>
        <li><b>Meowth (52):</b> CHUNSOFT; El_Pangoro_Parse</li>
        <li><b>Gastly (92):</b> CHUNSOFT; El_Pangoro_Parse; ShyStarryRain</li>
        <li><b>Growlithe (58):</b> Audino; CHUNSOFT; Emmuffin; JustAGunk</li>
        <li><b>Abra (63):</b> 3Monika4; CHUNSOFT; Emmuffin; Tacocoa</li>
        <li><b>Magnemite (81):</b> CHUNSOFT; El_Pangoro_Parse</li>
        <li><b>Eevee (133):</b> baronessfaron; CHUNSOFT; Lovi</li>
        <li><b>Dratini (147):</b> CHUNSOFT; JFain; Pencil</li>
        <li><b>Ditto (132):</b> CHUNSOFT; ShyStarryRain</li>
      </ul>

      <h3 style="color: var(--gold); font-size: 15px; margin-bottom: 6px;">Tipografía</h3>
      <p style="margin-bottom: 12px;">
        Fuente tipográfica <b>Pixelify Sans</b> licenciada bajo la Open Font License (SIL OFL 1.1).
      </p>

      <h3 style="color: var(--gold); font-size: 15px; margin-bottom: 6px;">Aviso Legal</h3>
      <p>
        Este es un proyecto no comercial creado con fines de exploración técnica y aprendizaje. Pokémon y las marcas relacionadas pertenecen a Nintendo, Game Freak y Creatures Inc.
      </p>
    </div>
    <button class="secondary-button" data-action="close" style="width: 100%; justify-content: center; margin-top: 14px;">VOLVER</button>
  `;
  showPanel('credits', content);
}

function showPause() {
  if (state.modal) {
    closePanel();
    return;
  }
  sfxSelect();
  showPanel('pause', `
    ${panelHeader('', 'Pausa')}
    <div style="display: grid; gap: 8px;">
      <button class="primary-button" data-action="resume" style="justify-content: center;">Seguir</button>
      <button class="secondary-button" data-action="team">Equipo</button>
      <button class="secondary-button" data-action="bag">Bolsa</button>
      <button class="secondary-button" data-action="factions">Facciones</button>
      <button class="secondary-button" data-action="missions">Misiones</button>
      <button class="secondary-button" data-action="collection">Dex</button>
      <button class="secondary-button" data-action="settings">Ajustes</button>
      <button class="secondary-button" data-action="save">Guardar</button>
      <button class="secondary-button" data-action="menu" style="border-color: #613636; color: #f87171;">Inicio</button>
    </div>
  `);

  panelLayer.querySelector('[data-action="resume"]').addEventListener('click', closePanel);
  panelLayer.querySelector('[data-action="team"]').addEventListener('click', () => openTeam());
  panelLayer.querySelector('[data-action="bag"]').addEventListener('click', () => openBag());
  panelLayer.querySelector('[data-action="factions"]').addEventListener('click', () => openFactions());
  panelLayer.querySelector('[data-action="missions"]').addEventListener('click', () => openMissions());
  panelLayer.querySelector('[data-action="collection"]').addEventListener('click', () => openCollection());
  panelLayer.querySelector('[data-action="settings"]').addEventListener('click', () => openSettings());
  panelLayer.querySelector('[data-action="save"]').addEventListener('click', () => {
    persistCurrentGame();
    sfxSelect();
    toast('¡Partida guardada con éxito!');
  });
  panelLayer.querySelector('[data-action="menu"]').addEventListener('click', () => {
    closePanel();
    hud.classList.add('hidden');
    $('#menu').classList.remove('hidden');
    state.wild = [];
    refreshMenuSaveStatus();
  });
}

// -------------------------------------------------------------
// LOOP PRINCIPAL DE SIMULACIÓN Y ENTRADA
// -------------------------------------------------------------
function step(dt, time) {
  if (!$('#menu').classList.contains('hidden') || state.modal || transitioning) return;

  if (state.scene === 'outside') {
    const p = state.player;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy--;
    if (keys.has('s') || keys.has('arrowdown')) dy++;
    if (keys.has('a') || keys.has('arrowleft')) dx--;
    if (keys.has('d') || keys.has('arrowright')) dx++;

    if (dx || dy) {
      // Control por teclado manual cancela el destino de clic
      clickTarget = null;
      const m = Math.hypot(dx, dy);
      dx = (dx / m) * CONFIG.playerSpeed * dt;
      dy = (dy / m) * CONFIG.playerSpeed * dt;
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      p.step = (p.step + dt * 15) % 6;
      if (!blockedPoint(p.x + dx, p.y)) p.x += dx;
      if (!blockedPoint(p.x, p.y + dy)) p.y += dy;
    } else if (clickTarget) {
      // Navegación fluida por clic de ratón (Click-to-Move)
      const tX = clickTarget.targetEntity ? clickTarget.targetEntity.x : clickTarget.x;
      const tY = clickTarget.targetEntity ? clickTarget.targetEntity.y : clickTarget.y;
      const dist = Math.hypot(tX - p.x, tY - p.y);
      const stopDist = clickTarget.targetEntity ? 52 : 6;

      if (dist > stopDist) {
        const stepDist = Math.min(dist, CONFIG.playerSpeed * dt);
        const mX = ((tX - p.x) / dist) * stepDist;
        const mY = ((tY - p.y) / dist) * stepDist;
        p.dir = Math.abs(mX) > Math.abs(mY) ? (mX < 0 ? 'left' : 'right') : (mY < 0 ? 'up' : 'down');
        p.step = (p.step + dt * 15) % 6;

        let moved = false;
        if (!blockedPoint(p.x + mX, p.y)) {
          p.x += mX;
          moved = true;
        }
        if (!blockedPoint(p.x, p.y + mY)) {
          p.y += mY;
          moved = true;
        }
        // Si choca contra un obstáculo infranqueable, detener
        if (!moved) {
          clickTarget = null;
          p.step = 0;
        }
      } else {
        p.step = 0;
        if (clickTarget.targetEntity) {
          openEncounter(clickTarget.targetEntity);
        }
        clickTarget = null;
      }
    } else {
      p.step = 0;
    }

    // Spawners en campo salvaje
    spawnTimer += dt * 1000;
    if (state.wild.length < CONFIG.maxWildPokemon && spawnTimer > CONFIG.encounterRespawnMs) {
      randomSpawn();
      spawnTimer = 0;
    }
  } else {
    // En el refugio: Modo gestión fija e interactiva. El personaje permanece en el estrado de mando.
    clickTarget = null;
    state.player.step = 0;
    state.player.dir = 'down';
  }

  // Temporizador de conflictos periódicos dinámicos
  conflictTimer += dt * 1000;
  if (conflictTimer > 60_000) {
    triggerPeriodicConflict();
    conflictTimer = 0;
  }

  // Auto-resolución de conflictos expirados no intervenidos
  if (state.conflicts && state.conflicts.length) {
    for (const c of state.conflicts) {
      if (!c.resolved && c.expiresAt < Date.now()) {
        resolveConflict(c, state, { playerIntervened: false });
        updateHud();
      }
    }
  }

  updatePrompt();
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;
  step(dt, now);
  drawWorld(ctx, state, now);

  requestAnimationFrame(loop);
}

// Event Listeners Globales
$('#newGame').addEventListener('click', requestNewGame);
$('#continueGame').addEventListener('click', continueGame);
$('#settingsBtn').addEventListener('click', openSettings);
$('#creditsBtn').addEventListener('click', openCredits);
$('#fullscreenTopBtn')?.addEventListener('click', toggleFullscreen);
$('#fullscreenMenuBtn')?.addEventListener('click', toggleFullscreen);
$('#hudShopQuick')?.addEventListener('click', () => openStoreHub());
$('#hudProfilePill')?.addEventListener('click', () => openTeam());

// Botón de alternar sonido en Topbar
let audioEnabled = true;
$('#soundTopBtn')?.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  setAudioEnabled(audioEnabled);
  const icon = $('#soundTopIcon');
  if (icon?.querySelector('use')) icon.querySelector('use').setAttribute('href', `./assets/ui/sprites.svg#${audioEnabled ? 'sound' : 'sound-off'}`);
  toast(audioEnabled ? 'Sonido activado.' : 'Sonido desactivado.');
});

// Refugio Action Widget Listeners
$('#expeditionHeroBtn')?.addEventListener('click', () => {
  sfxSelect();
  openExpeditionMap();
});
$('#quickHealBtn')?.addEventListener('click', () => {
  healTeamAtCareCenter();
});
$('#quickShopBtn')?.addEventListener('click', () => {
  sfxSelect();
  openStoreHub();
});
$('#returnToRefugioBtn')?.addEventListener('click', () => {
  changeScene('warehouse');
});

$('#menuColQuick')?.addEventListener('click', () => openCollection());
$('#menuTeamQuick')?.addEventListener('click', () => openTeam());
$('#menuBagQuick')?.addEventListener('click', () => openBag());
$('#menuFactionsQuick')?.addEventListener('click', () => openFactions());

$('#teamBtn').addEventListener('click', openTeam);
$('#bagBtn').addEventListener('click', openBag);
$('#factionBtn').addEventListener('click', openFactions);
$('#missionsBtn').addEventListener('click', openMissions);
$('#researchBtn').addEventListener('click', openResearch);
$('#collectionBtn').addEventListener('click', openCollection);
$('#pauseBtn').addEventListener('click', showPause);

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }
  const fresh = !keys.has(k);
  keys.add(k);

  if (fresh) {
    if (k === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      toggleFullscreen();
      return;
    }

    if (k === 'e') doInteraction();
    if ($('#menu').classList.contains('hidden') && !state.modal) {
      if (k === 't') openTeam();
      if (k === 'b') openBag();
      if (k === 'g') openFactions();
      if (k === 'm') openMissions();
      if (k === 'c') openCollection();
      if (k === 'h' && state.scene === 'warehouse') healTeamAtCareCenter();
      if (k === 'r' && state.scene === 'outside') changeScene('warehouse');
      if (k === 'escape') showPause();
    } else if (k === 'escape' && state.modal) {
      closePanel();
    }
  }
});

window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function warehouseActionAt(x,y) {
  if (x>=520 && x<=760 && y>=480 && y<=570) return 'expedition';
  if (state.faction==='syndicate') {
    if (x>=330 && x<=455 && y>=455 && y<=560) return 'market';
    if (x>=465 && x<=815 && y>=20 && y<=455) return 'market';
    if (x>=810 && x<=1210 && y>=250 && y<=465) return 'team';
  } else {
    if (x>=80 && x<=380 && y>=275 && y<=455) return 'heal';
    if (x>=330 && x<=455 && y>=455 && y<=560) return 'market';
    if (x>=740 && x<=1240 && y>=180 && y<=455) return 'team';
  }
  return null;
}

// Clicks follow the visible room landmarks; keyboard shortcuts remain available.
$('#world').addEventListener('pointerdown', e => {
  if (state.modal || !$('#menu').classList.contains('hidden')) return;
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 1280;
  const y = ((e.clientY - r.top) / r.height) * 720;

  if (state.scene === 'warehouse') {
    const action=warehouseActionAt(x,y);
    if(action==='heal'){healTeamAtCareCenter();return;}
    if(action==='market'){sfxSelect();openCounterHub();return;}
    if(action==='team'){sfxSelect();openTeam();return;}
    if(action==='expedition'){sfxSelect();openExpeditionMap();return;}
  } else {
    // Fuera en expedición salvaje
    // Clic en la cabaña superior para regresar al refugio
    if (x >= 510 && x <= 770 && y >= 20 && y <= 135) {
      changeScene('warehouse');
      return;
    }
    // Clic en Pokémon salvaje
    const target = state.wild.find(w => Math.hypot(w.x - x, w.y - y) < 48);
    if (target) {
      const dist = Math.hypot(target.x - state.player.x, target.y - state.player.y);
      if (dist < 65) {
        openEncounter(target);
      } else {
        clickTarget = { x: target.x, y: target.y, targetEntity: target };
        setClickMarker({ x: target.x, y: target.y, time: performance.now(), isEnemy: true });
      }
      return;
    }

    // Clic en terreno libre: Click-to-Move
    clickTarget = { x, y, targetEntity: null };
    setClickMarker({ x, y, time: performance.now(), isEnemy: false });
  }
});

// Cursor dinámico en hover del canvas
$('#world').addEventListener('pointermove', e => {
  if (state.modal || !$('#menu').classList.contains('hidden')) {
    canvas.style.cursor = 'default';
    return;
  }
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 1280;
  const y = ((e.clientY - r.top) / r.height) * 720;

  if (state.scene === 'warehouse') {
    canvas.style.cursor = warehouseActionAt(x,y) ? 'pointer' : 'default';
  } else {
    const isWild = state.wild.some(w => Math.hypot(w.x - x, w.y - y) < 48);
    const isLodge = (x >= 510 && x <= 770 && y >= 20 && y <= 135);
    canvas.style.cursor = (isWild || isLodge) ? 'pointer' : 'default';
  }
});

// =============================================================
// CARRUSEL INTERACTIVO 3D DEL MENÚ PRINCIPAL
// =============================================================
const FEATURED_SHOWCASE = Object.values(SPECIES)
  .slice()
  .sort((a, b) => a.dex - b.dex);

let currentShowcaseIdx = 0;

function updateMenuShowcase(idx) {
  const item = FEATURED_SHOWCASE[idx];
  if (!item) return;

  const sprite = $('#menuMonSprite');
  const nameEl = $('#partnerCaptionName');
  const levelEl = $('#partnerCaptionLevel');
  const typesEl = $('#partnerCaptionTypes');
  const metaEl = $('#partnerCaptionMeta');
  const hpEl = $('#smiHp');
  const atkEl = $('#smiAtk');
  const defEl = $('#smiDef');
  const spdEl = $('#smiSpd');

  if (sprite) {
    sprite.src = getSpeciesSpriteUrl(item.id, { shiny: false });
    sprite.alt = item.name;
    sprite.dataset.spriteId = item.id;
  }
  if (nameEl) nameEl.textContent = item.name;
  if (levelEl) levelEl.textContent = `#${String(item.dex).padStart(3, '0')}`;
  const countEl = $('#showcaseCount');
  if (countEl) countEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(FEATURED_SHOWCASE.length).padStart(2, '0')}`;
  if (typesEl) {
    typesEl.innerHTML = item.type
      .map(t => `<span class="type-tag" style="--type-color:${TYPE_COLORS[t] || '#8aa37b'}">${t}</span>`)
      .join('');
  }
  if (metaEl) metaEl.textContent = '';
  for (const bar of [hpEl, atkEl, defEl, spdEl]) if (bar) bar.style.width = '0%';
}

$('#menuMonPrev')?.addEventListener('click', () => {
  currentShowcaseIdx = (currentShowcaseIdx - 1 + FEATURED_SHOWCASE.length) % FEATURED_SHOWCASE.length;
  sfxSelect();
  updateMenuShowcase(currentShowcaseIdx);
});

$('#menuMonNext')?.addEventListener('click', () => {
  currentShowcaseIdx = (currentShowcaseIdx + 1) % FEATURED_SHOWCASE.length;
  sfxSelect();
  updateMenuShowcase(currentShowcaseIdx);
});

// Inicialización
requestAnimationFrame(loop);
refreshMenuSaveStatus();
updateMenuShowcase(0);
bindSpriteImages(document);
preloadSpeciesSprites().catch(() => {});
