import { CONFIG } from './config.js';
import { SPECIES } from './species.js';
import { createPokemonInstance } from './pokemon.js';
import { createId } from './ids.js';
import { INITIAL_TERRITORY } from './factions.js';

export function createGameState({
  balls = CONFIG.startingBalls,
  collection = [],
  researchClaims = [],
  expeditionId = 'meadow',
  faction = 'guardian',
  reputation = { guardian: 10, syndicate: 0 },
  money = 500,
  darkTokens = 0,
  bag = null,
  team = null,
  eventLog = [],
  territory = null,
  settings = { audio: true },
} = {}) {
  const initialBag = bag && typeof bag === 'object'
    ? { ...bag }
    : { 'poke-ball': balls, 'potion': 2 };

  // Ensure poke-ball in bag matches balls
  if (!initialBag['poke-ball']) {
    initialBag['poke-ball'] = balls;
  }

  const initialTerritory = territory && typeof territory === 'object'
    ? { ...territory }
    : {
        meadow: { ...INITIAL_TERRITORY.meadow },
        forest: { ...INITIAL_TERRITORY.forest },
        quarry: { ...INITIAL_TERRITORY.quarry },
      };

  const initialTeam = Array.isArray(team) ? [...team] : [];

  return {
    scene: 'warehouse',
    expeditionId,
    player: { x: 640, y: 550, dir: 'up', step: 0 },
    balls,
    collection: [...collection],
    researchClaims: [...researchClaims],
    faction,
    reputation: { ...reputation },
    money,
    darkTokens,
    bag: initialBag,
    team: initialTeam,
    conflicts: [],
    eventLog: [...eventLog],
    territory: initialTerritory,
    settings: { ...settings },
    wild: [],
    modal: null,
    encounterCooldown: 0,
    startedAt: Date.now(),
  };
}

export function makeWild(id, x, y, { rng = Math.random, idFactory = createId } = {}) {
  const sp = SPECIES[id];
  if (!sp) throw new Error(`Especie desconocida: ${id}`);
  return {
    uid: `wild-${idFactory()}`,
    speciesId: id,
    x,
    y,
    phase: randomValue(rng) * Math.PI * 2,
    caught: false,
    ...sp,
    shinyColor: sp.shiny,
    shiny: randomValue(rng) < CONFIG.shinyChance,
  };
}

export function makeIndividual(wild, options = {}) {
  if (!wild || !SPECIES[wild.speciesId]) {
    throw new Error(`No se puede generar un ejemplar de especie desconocida: ${wild?.speciesId}`);
  }
  return createPokemonInstance(wild.speciesId, {
    ...options,
    shiny: wild.shiny,
    ball: options.ball || 'Poké Ball',
  });
}

export { createId } from './ids.js';

function randomValue(rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('El generador aleatorio debe devolver un valor entre 0 incluido y 1 excluido.');
  }
  return value;
}
