import { calculateCombatStats } from './combat.js';

export const MAX_TEAM_SIZE = 6;

export function ensureTeamInitialized(gameState) {
  if (!gameState) return [];
  if (!Array.isArray(gameState.team)) {
    gameState.team = [];
  }
  const collection = Array.isArray(gameState.collection) ? gameState.collection : [];

  // Filter out invalid IDs or stolen pokemon from team
  gameState.team = gameState.team.filter(id => {
    const mon = collection.find(p => p.id === id);
    return mon && !mon.stolen;
  });

  // If team has fewer than MAX_TEAM_SIZE and collection has unstolen mons not yet in team
  if (gameState.team.length < MAX_TEAM_SIZE) {
    for (const mon of collection) {
      if (gameState.team.length >= MAX_TEAM_SIZE) break;
      if (!mon.stolen && !gameState.team.includes(mon.id)) {
        gameState.team.push(mon.id);
      }
    }
  }

  // Ensure every pokemon in collection has currentHp and maxHp initialized
  for (const mon of collection) {
    const stats = calculateCombatStats(mon);
    mon.maxHp = stats.maxHp;
    if (mon.currentHp === undefined) {
      mon.currentHp = stats.maxHp;
    }
  }

  return gameState.team;
}

export function getTeam(gameState) {
  ensureTeamInitialized(gameState);
  const collection = gameState.collection || [];
  return (gameState.team || [])
    .map(id => collection.find(p => p.id === id))
    .filter(Boolean);
}

export function getLeadPokemon(gameState) {
  const team = getTeam(gameState);
  if (!team.length) return null;
  const healthy = team.find(p => (p.currentHp ?? p.maxHp) > 0);
  return healthy || team[0];
}

export function addToTeam(gameState, pokemonId) {
  ensureTeamInitialized(gameState);
  if (gameState.team.length >= MAX_TEAM_SIZE) {
    return { ok: false, error: 'El equipo ya tiene el máximo de 6 Pokémon.' };
  }
  const mon = (gameState.collection || []).find(p => p.id === pokemonId);
  if (!mon) {
    return { ok: false, error: 'Ejemplar no encontrado en la colección.' };
  }
  if (mon.stolen) {
    return { ok: false, error: 'Este Pokémon está retenido por la facción rival.' };
  }
  if (gameState.team.includes(pokemonId)) {
    return { ok: false, error: 'Este Pokémon ya forma parte del equipo activo.' };
  }

  gameState.team.push(pokemonId);
  return { ok: true, team: gameState.team };
}

export function removeFromTeam(gameState, pokemonId) {
  ensureTeamInitialized(gameState);
  if (gameState.team.length <= 1) {
    return { ok: false, error: 'Debes conservar al menos un Pokémon en el equipo activo.' };
  }
  const idx = gameState.team.indexOf(pokemonId);
  if (idx === -1) {
    return { ok: false, error: 'El Pokémon no está en el equipo activo.' };
  }

  gameState.team.splice(idx, 1);
  return { ok: true, team: gameState.team };
}

export function swapTeamOrder(gameState, indexA, indexB) {
  ensureTeamInitialized(gameState);
  if (
    indexA < 0 ||
    indexA >= gameState.team.length ||
    indexB < 0 ||
    indexB >= gameState.team.length
  ) {
    return false;
  }
  const temp = gameState.team[indexA];
  gameState.team[indexA] = gameState.team[indexB];
  gameState.team[indexB] = temp;
  return true;
}

export function healEntireTeam(gameState) {
  const team = getTeam(gameState);
  for (const mon of team) {
    const stats = calculateCombatStats(mon);
    mon.maxHp = stats.maxHp;
    mon.currentHp = stats.maxHp;
  }
  return team.length;
}

export function isTeamWiped(gameState) {
  const team = getTeam(gameState);
  if (!team.length) return false;
  return team.every(p => (p.currentHp ?? p.maxHp) <= 0);
}
