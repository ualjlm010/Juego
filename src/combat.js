import { SPECIES, TYPE_COLORS } from './species.js';
import { getItemDefinition } from './items.js';

export const TYPE_EFFECTIVENESS = Object.freeze({
  Normal: { Roca: 0.5, Acero: 0.5, Fantasma: 0 },
  Fuego: { Fuego: 0.5, Agua: 0.5, Planta: 2, Hielo: 2, Bicho: 2, Roca: 0.5, Dragón: 0.5, Acero: 2 },
  Agua: { Fuego: 2, Agua: 0.5, Planta: 0.5, Tierra: 2, Roca: 2, Dragón: 0.5 },
  Planta: { Fuego: 0.5, Agua: 2, Planta: 0.5, Veneno: 0.5, Tierra: 2, Volador: 0.5, Bicho: 0.5, Roca: 2, Dragón: 0.5, Acero: 0.5 },
  Eléctrico: { Agua: 2, Planta: 0.5, Eléctrico: 0.5, Tierra: 0, Volador: 2, Dragón: 0.5 },
  Hielo: { Fuego: 0.5, Agua: 0.5, Planta: 2, Hielo: 0.5, Tierra: 2, Volador: 2, Dragón: 2, Acero: 0.5 },
  Lucha: { Normal: 2, Hielo: 2, Veneno: 0.5, Volador: 0.5, Psíquico: 0.5, Bicho: 0.5, Roca: 2, Fantasma: 0, Acero: 2, Hada: 0.5 },
  Veneno: { Planta: 2, Veneno: 0.5, Tierra: 0.5, Roca: 0.5, Fantasma: 0.5, Acero: 0, Hada: 2 },
  Tierra: { Fuego: 2, Eléctrico: 2, Planta: 0.5, Veneno: 2, Volador: 0, Bicho: 0.5, Roca: 2, Acero: 2 },
  Volador: { Eléctrico: 0.5, Planta: 2, Lucha: 2, Bicho: 2, Roca: 0.5, Acero: 0.5 },
  Psíquico: { Lucha: 2, Veneno: 2, Psíquico: 0.5, Acero: 0.5, Siniestro: 0 },
  Bicho: { Fuego: 0.5, Planta: 2, Lucha: 0.5, Veneno: 0.5, Volador: 0.5, Fantasma: 0.5, Acero: 0.5, Hada: 0.5 },
  Roca: { Fuego: 2, Hielo: 2, Lucha: 0.5, Tierra: 0.5, Volador: 2, Bicho: 2, Acero: 0.5 },
  Fantasma: { Normal: 0, Psíquico: 2, Fantasma: 2, Siniestro: 0.5 },
  Dragón: { Dragón: 2, Acero: 0.5, Hada: 0 },
  Acero: { Fuego: 0.5, Agua: 0.5, Eléctrico: 0.5, Hielo: 2, Roca: 2, Acero: 0.5, Hada: 2 },
  Hada: { Fuego: 0.5, Lucha: 2, Veneno: 0.5, Dragón: 2, Acero: 0.5 },
});

export const SPECIES_BASE_STATS = Object.freeze({
  rattata: { hp: 30, atk: 56, def: 35, spd: 72 },
  zubat: { hp: 40, atk: 45, def: 35, spd: 55 },
  oddish: { hp: 45, atk: 50, def: 55, spd: 30 },
  geodude: { hp: 40, atk: 80, def: 100, spd: 20 },
  meowth: { hp: 40, atk: 45, def: 35, spd: 90 },
  gastly: { hp: 30, atk: 65, def: 30, spd: 80 },
  growlithe: { hp: 55, atk: 70, def: 45, spd: 60 },
  abra: { hp: 25, atk: 60, def: 15, spd: 90 },
  magnemite: { hp: 25, atk: 60, def: 70, spd: 45 },
  eevee: { hp: 55, atk: 55, def: 50, spd: 55 },
  dratini: { hp: 41, atk: 64, def: 45, spd: 50 },
  ditto: { hp: 48, atk: 48, def: 48, spd: 48 },
});

export const SPECIES_MOVES = Object.freeze({
  rattata: [
    { name: 'Placaje', type: 'Normal', power: 40, accuracy: 1.0 },
    { name: 'Ataque Rápido', type: 'Normal', power: 40, accuracy: 1.0, priority: 1 },
    { name: 'Mordisco', type: 'Normal', power: 60, accuracy: 1.0 },
  ],
  zubat: [
    { name: 'Chupavidas', type: 'Veneno', power: 40, accuracy: 1.0, drain: 0.5 },
    { name: 'Aire Afilado', type: 'Volador', power: 55, accuracy: 0.95 },
    { name: 'Mordisco', type: 'Normal', power: 60, accuracy: 1.0 },
  ],
  oddish: [
    { name: 'Absorber', type: 'Planta', power: 40, accuracy: 1.0, drain: 0.5 },
    { name: 'Ácido', type: 'Veneno', power: 40, accuracy: 1.0 },
    { name: 'Hoja Afilada', type: 'Planta', power: 55, accuracy: 0.95 },
  ],
  geodude: [
    { name: 'Lanzarrocas', type: 'Roca', power: 50, accuracy: 0.9 },
    { name: 'Placaje', type: 'Normal', power: 40, accuracy: 1.0 },
    { name: 'Magnitud', type: 'Tierra', power: 60, accuracy: 1.0 },
  ],
  meowth: [
    { name: 'Arañazo', type: 'Normal', power: 40, accuracy: 1.0 },
    { name: 'Mordisco', type: 'Normal', power: 60, accuracy: 1.0 },
    { name: 'Golpe Aéreo', type: 'Volador', power: 50, accuracy: 1.0 },
  ],
  gastly: [
    { name: 'Lengüetazo', type: 'Fantasma', power: 30, accuracy: 1.0 },
    { name: 'Tinieblas', type: 'Fantasma', power: 50, accuracy: 1.0 },
    { name: 'Rayo Confuso', type: 'Fantasma', power: 45, accuracy: 1.0 },
  ],
  growlithe: [
    { name: 'Ascuas', type: 'Fuego', power: 40, accuracy: 1.0 },
    { name: 'Mordisco', type: 'Normal', power: 60, accuracy: 1.0 },
    { name: 'Rueda Fuego', type: 'Fuego', power: 60, accuracy: 1.0 },
  ],
  abra: [
    { name: 'Confusión', type: 'Psíquico', power: 50, accuracy: 1.0 },
    { name: 'Psicoonda', type: 'Psíquico', power: 55, accuracy: 0.9 },
    { name: 'Rapidez', type: 'Normal', power: 40, accuracy: 1.0 },
  ],
  magnemite: [
    { name: 'Impactrueno', type: 'Eléctrico', power: 40, accuracy: 1.0 },
    { name: 'Chispa', type: 'Eléctrico', power: 50, accuracy: 1.0 },
    { name: 'Bomba Imán', type: 'Acero', power: 60, accuracy: 1.0 },
  ],
  eevee: [
    { name: 'Placaje', type: 'Normal', power: 40, accuracy: 1.0 },
    { name: 'Rapidez', type: 'Normal', power: 50, accuracy: 1.0 },
    { name: 'Mordisco', type: 'Normal', power: 60, accuracy: 1.0 },
  ],
  dratini: [
    { name: 'Ciclón', type: 'Dragón', power: 40, accuracy: 1.0 },
    { name: 'Cola Dragón', type: 'Dragón', power: 60, accuracy: 0.9 },
    { name: 'Onda Trueno', type: 'Eléctrico', power: 45, accuracy: 1.0 },
  ],
  ditto: [
    { name: 'Transformación', type: 'Normal', power: 50, accuracy: 1.0 },
    { name: 'Destructor', type: 'Normal', power: 40, accuracy: 1.0 },
  ],
});

export function calculateCombatStats(pokemon) {
  const base = SPECIES_BASE_STATS[pokemon.speciesId] || { hp: 45, atk: 45, def: 45, spd: 45 };
  const iv = pokemon.iv || { PS: 15, Atq: 15, Def: 15, Vel: 15 };
  const level = pokemon.level || 5;

  const maxHp = Math.floor(((2 * base.hp + iv.PS) * level) / 100) + level + 10;
  const atk = Math.floor(((2 * base.atk + iv.Atq) * level) / 100) + 5;
  const def = Math.floor(((2 * base.def + iv.Def) * level) / 100) + 5;
  const spd = Math.floor(((2 * base.spd + iv.Vel) * level) / 100) + 5;

  return {
    maxHp,
    hp: Number.isInteger(pokemon.currentHp) ? pokemon.currentHp : maxHp,
    atk,
    def,
    spd,
  };
}

export function getTypeMultiplier(moveType, targetTypes = []) {
  if (!moveType || !targetTypes.length) return 1.0;
  let mult = 1.0;
  const chart = TYPE_EFFECTIVENESS[moveType] || {};
  for (const t of targetTypes) {
    if (Object.prototype.hasOwnProperty.call(chart, t)) {
      mult *= chart[t];
    }
  }
  return mult;
}

export function calculateDamage(attacker, defender, move) {
  const aStats = calculateCombatStats(attacker);
  const dStats = calculateCombatStats(defender);
  const defSpecies = SPECIES[defender.speciesId];
  const typeMult = getTypeMultiplier(move.type, defSpecies?.type || []);

  const basePower = move.power || 40;
  const level = attacker.level || 5;
  const variation = 0.85 + Math.random() * 0.15;

  const raw = (((2 * level / 5 + 2) * basePower * (aStats.atk / Math.max(1, dStats.def))) / 50 + 2);
  const finalDamage = Math.max(1, Math.floor(raw * typeMult * variation));

  return {
    damage: finalDamage,
    typeMult,
    isSuperEffective: typeMult > 1.2,
    isNotVeryEffective: typeMult > 0 && typeMult < 0.9,
    isImmune: typeMult === 0,
  };
}

export function createCombatSession(playerMon, opponentMon, { isTrainerBattle = false, trainerName = '' } = {}) {
  const pStats = calculateCombatStats(playerMon);
  const oStats = calculateCombatStats(opponentMon);

  playerMon.currentHp = pStats.hp;
  playerMon.maxHp = pStats.maxHp;
  opponentMon.currentHp = oStats.hp;
  opponentMon.maxHp = oStats.maxHp;

  return {
    playerMon,
    opponentMon,
    isTrainerBattle,
    trainerName,
    turn: 1,
    finished: false,
    winner: null,
    log: [
      isTrainerBattle
        ? `¡El rival ${trainerName} te desafía con ${SPECIES[opponentMon.speciesId]?.name || 'un Pokémon'}!`
        : `¡Un ${SPECIES[opponentMon.speciesId]?.name || 'Pokémon'} salvaje apareció!`,
    ],
  };
}

export function executePlayerAttack(combat, moveIndex) {
  if (combat.finished) return combat;

  const pMon = combat.playerMon;
  const oMon = combat.opponentMon;
  const pSpecies = SPECIES[pMon.speciesId];
  const oSpecies = SPECIES[oMon.speciesId];
  const moves = SPECIES_MOVES[pMon.speciesId] || SPECIES_MOVES.rattata;
  const move = moves[moveIndex] || moves[0];

  const pStats = calculateCombatStats(pMon);
  const oStats = calculateCombatStats(oMon);

  const playerFaster = pStats.spd >= oStats.spd;

  const executeHit = (attacker, defender, m, attackerName, defenderName) => {
    const outcome = calculateDamage(attacker, defender, m);
    defender.currentHp = Math.max(0, (defender.currentHp ?? defender.maxHp) - outcome.damage);

    combat.log.push(`¡${attackerName} usó ${m.name}! (Daño: ${outcome.damage})`);
    if (outcome.isSuperEffective) combat.log.push('¡Es muy eficaz!');
    if (outcome.isNotVeryEffective) combat.log.push('No es muy eficaz…');
    if (outcome.isImmune) combat.log.push('No tuvo ningún efecto.');

    if (m.drain && outcome.damage > 0) {
      const heal = Math.max(1, Math.floor(outcome.damage * m.drain));
      attacker.currentHp = Math.min(attacker.maxHp, (attacker.currentHp || attacker.maxHp) + heal);
      combat.log.push(`¡${attackerName} recuperó salud con ${m.name}!`);
    }

    return defender.currentHp <= 0;
  };

  const opponentAttack = () => {
    const oMoves = SPECIES_MOVES[oMon.speciesId] || SPECIES_MOVES.rattata;
    const oMove = oMoves[Math.floor(Math.random() * oMoves.length)];
    return executeHit(oMon, pMon, oMove, oSpecies.name, pSpecies.name);
  };

  if (playerFaster) {
    const opponentFainted = executeHit(pMon, oMon, move, pSpecies.name, oSpecies.name);
    if (opponentFainted) {
      combat.finished = true;
      combat.winner = 'player';
      combat.log.push(`¡${oSpecies.name} cayó debilitado!`);
      return combat;
    }

    const playerFainted = opponentAttack();
    if (playerFainted) {
      combat.finished = true;
      combat.winner = 'opponent';
      combat.log.push(`¡${pSpecies.name} cayó debilitado!`);
      return combat;
    }
  } else {
    const playerFainted = opponentAttack();
    if (playerFainted) {
      combat.finished = true;
      combat.winner = 'opponent';
      combat.log.push(`¡${pSpecies.name} cayó debilitado!`);
      return combat;
    }

    const opponentFainted = executeHit(pMon, oMon, move, pSpecies.name, oSpecies.name);
    if (opponentFainted) {
      combat.finished = true;
      combat.winner = 'player';
      combat.log.push(`¡${oSpecies.name} cayó debilitado!`);
      return combat;
    }
  }

  combat.turn += 1;
  return combat;
}

export function awardCombatExp(playerMon, opponentMon) {
  const oLevel = opponentMon.level || 5;
  const expGain = Math.floor(oLevel * 25 + Math.random() * 15);

  playerMon.exp = (playerMon.exp || 0) + expGain;
  const expNeeded = Math.floor((playerMon.level ** 2.8) * 8);

  let leveledUp = false;
  if (playerMon.exp >= expNeeded && playerMon.level < 100) {
    playerMon.level += 1;
    playerMon.exp = 0;
    leveledUp = true;
    const stats = calculateCombatStats(playerMon);
    playerMon.maxHp = stats.maxHp;
    playerMon.currentHp = Math.min(stats.maxHp, (playerMon.currentHp || stats.maxHp) + 10);
  }

  return { expGain, leveledUp, newLevel: playerMon.level };
}
