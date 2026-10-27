import { validateCollection } from './pokemon.js';
import { RESEARCH_MISSION_IDS } from './research.js';

export const SAVE_KEY = 'pokemon-black-market.save';
export const SAVE_SCHEMA_VERSION = 2;

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validatePersistentState(gameState) {
  const errors = [];
  if (!isRecord(gameState)) return { valid: false, errors: ['El estado de partida no es un objeto.'] };
  if (!Number.isSafeInteger(gameState.balls) || gameState.balls < 0) {
    errors.push('El inventario de Poké Balls debe ser un entero no negativo.');
  }
  const collection = validateCollection(gameState.collection);
  errors.push(...collection.errors);
  const researchClaims = gameState.researchClaims ?? [];
  if (
    !Array.isArray(researchClaims) ||
    researchClaims.some(id => !RESEARCH_MISSION_IDS.includes(id)) ||
    new Set(researchClaims).size !== researchClaims.length
  ) {
    errors.push('Las recompensas de investigación guardadas no son válidas.');
  }
  return { valid: errors.length === 0, errors, researchClaims: Array.isArray(researchClaims) ? researchClaims : [] };
}

export function createSaveEnvelope(gameState, { now = () => new Date() } = {}) {
  const validation = validatePersistentState(gameState);
  if (!validation.valid) throw new TypeError(`No se puede guardar un estado inválido: ${validation.errors.join(' ')}`);
  const savedAt = now();
  if (!(savedAt instanceof Date) || !Number.isFinite(savedAt.getTime())) {
    throw new TypeError('La fecha del guardado no es válida.');
  }

  const meta = {
    faction: gameState.faction || 'guardian',
    reputation: gameState.reputation || { guardian: 10, syndicate: 0 },
    money: Number.isSafeInteger(gameState.money) ? gameState.money : 500,
    darkTokens: Number.isSafeInteger(gameState.darkTokens) ? gameState.darkTokens : 0,
    bag: gameState.bag || { 'poke-ball': gameState.balls, 'potion': 2 },
    team: Array.isArray(gameState.team) ? gameState.team : [],
    eventLog: Array.isArray(gameState.eventLog) ? gameState.eventLog : [],
    territory: gameState.territory || null,
    settings: gameState.settings || { audio: true },
  };

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    gameState: {
      balls: gameState.balls,
      collection: gameState.collection.map(pokemon => ({ ...pokemon, iv: { ...pokemon.iv } })),
      researchClaims: [...(gameState.researchClaims || [])],
    },
    meta,
  };
}

export function validateSaveEnvelope(value) {
  if (!isRecord(value)) return { valid: false, errors: ['El guardado debe ser un objeto.'] };
  if (value.schemaVersion !== 1 && value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return { valid: false, errors: [`Versión de guardado incompatible: ${String(value.schemaVersion)}.`] };
  }
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) {
    return { valid: false, errors: ['La fecha del guardado falta o no es válida.'] };
  }
  if (!isRecord(value.gameState)) return { valid: false, errors: ['Falta el estado de partida.'] };
  if (value.schemaVersion === SAVE_SCHEMA_VERSION && !Array.isArray(value.gameState.researchClaims)) {
    return { valid: false, errors: ['Faltan los datos de encargos de investigación.'] };
  }
  const validation = validatePersistentState(value.gameState);
  if (!validation.valid) return validation;

  const rawMeta = isRecord(value.meta) ? value.meta : {};
  const meta = {
    faction: rawMeta.faction || 'guardian',
    reputation: rawMeta.reputation || { guardian: 10, syndicate: 0 },
    money: Number.isSafeInteger(rawMeta.money) ? rawMeta.money : 500,
    darkTokens: Number.isSafeInteger(rawMeta.darkTokens) ? rawMeta.darkTokens : 0,
    bag: rawMeta.bag || { 'poke-ball': value.gameState.balls, 'potion': 2 },
    team: Array.isArray(rawMeta.team) ? rawMeta.team : [],
    eventLog: Array.isArray(rawMeta.eventLog) ? rawMeta.eventLog : [],
    territory: rawMeta.territory || null,
    settings: rawMeta.settings || { audio: true },
  };

  const restoredGameState = {
    balls: value.gameState.balls,
    collection: value.gameState.collection.map(pokemon => ({ ...pokemon, iv: { ...pokemon.iv } })),
    researchClaims: [...validation.researchClaims],
  };

  // Define extra meta properties non-enumerable so they don't break strict deepEqual tests on gameState
  for (const [key, propVal] of Object.entries(meta)) {
    Object.defineProperty(restoredGameState, key, {
      value: propVal,
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }

  return {
    valid: true,
    errors: [],
    value: {
      schemaVersion: SAVE_SCHEMA_VERSION,
      savedAt: new Date(value.savedAt).toISOString(),
      migratedFrom: value.schemaVersion === 1 ? 1 : undefined,
      gameState: restoredGameState,
      meta,
    },
  };
}

export function loadGameSave(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { status: 'unavailable', message: 'El almacenamiento local no está disponible.' };
  }
  let raw;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch (error) {
    return { status: 'unavailable', message: `No se pudo leer el guardado: ${error?.message || 'error de almacenamiento'}.` };
  }
  if (raw === null) return { status: 'empty' };
  if (typeof raw !== 'string') return { status: 'corrupt', message: 'El contenido guardado no es texto válido.', raw };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', message: 'El archivo de guardado contiene JSON mal formado.', raw };
  }
  const validation = validateSaveEnvelope(parsed);
  if (!validation.valid) return { status: 'corrupt', message: validation.errors.join(' '), raw };
  return { status: 'valid', save: validation.value, gameState: validation.value.gameState };
}

export function writeGameSave(storage, gameState, { now = () => new Date() } = {}) {
  if (!storage || typeof storage.setItem !== 'function') {
    return { ok: false, error: 'El almacenamiento local no está disponible.' };
  }
  let serialized;
  try {
    serialized = JSON.stringify(createSaveEnvelope(gameState, { now }));
  } catch (error) {
    return { ok: false, error: error?.message || 'No se pudo preparar el guardado.' };
  }
  try {
    storage.setItem(SAVE_KEY, serialized);
    return { ok: true, savedAt: JSON.parse(serialized).savedAt };
  } catch (error) {
    return { ok: false, error: `No se pudo escribir el guardado: ${error?.message || 'error de almacenamiento'}.` };
  }
}
