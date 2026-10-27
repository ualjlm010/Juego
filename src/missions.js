import { RESEARCH_MISSIONS, getMissionBoard, getResearchStats } from './research.js';

export const STORY_MISSIONS = Object.freeze([
  {
    id: 'story-first-catch',
    title: 'Primeros Pasos en el Campo',
    category: 'story',
    description: 'Captura tu primer Pokémon salvaje para comenzar el registro.',
    check: gameState => (gameState.collection || []).length >= 1,
    reward: { money: 300, balls: 3 },
    rewardText: '300 ₽ + 3 Poké Balls',
  },
  {
    id: 'story-team-trio',
    title: 'Formando el Escuadrón',
    category: 'story',
    description: 'Reúne al menos 3 Pokémon en tu equipo activo.',
    check: gameState => (gameState.team || []).length >= 3,
    reward: { money: 500, item: 'potion', qty: 2 },
    rewardText: '500 ₽ + 2 Pociones',
  },
  {
    id: 'story-explore-forest',
    title: 'Hacia las Sombras del Bosque',
    category: 'exploration',
    description: 'Desbloquea y viaja a la expedición Bosque Susurro (requiere 3 especies registradas).',
    check: gameState => {
      const stats = getResearchStats(gameState.collection);
      return stats.uniqueSpecies >= 3 && gameState.expeditionId === 'forest';
    },
    reward: { money: 800, darkTokens: 15 },
    rewardText: '800 ₽ + 15 Fichas Sombra',
  },
  {
    id: 'story-conflict-win',
    title: 'Puntos en Disputa',
    category: 'faction',
    description: 'Intervén y sal victorioso en un conflicto dinámico entre facciones.',
    check: gameState => (gameState.eventLog || []).some(e => e.playerWon),
    reward: { money: 1200, item: 'great-ball', qty: 3 },
    rewardText: '1200 ₽ + 3 Super Balls',
  },
  {
    id: 'story-explore-quarry',
    title: 'Dominio de la Cantera',
    category: 'exploration',
    description: 'Desbloquea y viaja a la Cantera Antigua (requiere 6 especies registradas).',
    check: gameState => {
      const stats = getResearchStats(gameState.collection);
      return stats.uniqueSpecies >= 6 && gameState.expeditionId === 'quarry';
    },
    reward: { money: 1500, item: 'ultra-ball', qty: 2 },
    rewardText: '1500 ₽ + 2 Ultra Balls',
  },
]);

export function getStoryMissionsProgress(gameState) {
  const claimed = new Set(gameState.storyClaims || []);
  return STORY_MISSIONS.map(m => {
    const isComplete = m.check(gameState);
    return {
      ...m,
      complete: isComplete,
      claimed: claimed.has(m.id),
      canClaim: isComplete && !claimed.has(m.id),
    };
  });
}

export function claimStoryMissionReward(gameState, missionId) {
  if (!gameState) return { ok: false, error: 'Estado inválido' };
  const claims = gameState.storyClaims || (gameState.storyClaims = []);
  if (claims.includes(missionId)) {
    return { ok: false, error: 'Recompensa ya reclamada.' };
  }
  const mission = STORY_MISSIONS.find(m => m.id === missionId);
  if (!mission) return { ok: false, error: 'Misión no encontrada.' };
  if (!mission.check(gameState)) {
    return { ok: false, error: 'Los objetivos de la misión no se han cumplido.' };
  }

  claims.push(missionId);

  if (mission.reward.money) {
    gameState.money = (gameState.money || 0) + mission.reward.money;
  }
  if (mission.reward.darkTokens) {
    gameState.darkTokens = (gameState.darkTokens || 0) + mission.reward.darkTokens;
  }
  if (mission.reward.balls) {
    gameState.balls = (gameState.balls || 0) + mission.reward.balls;
    const bag = gameState.bag || (gameState.bag = {});
    bag['poke-ball'] = (bag['poke-ball'] || 0) + mission.reward.balls;
  }
  if (mission.reward.item) {
    const bag = gameState.bag || (gameState.bag = {});
    bag[mission.reward.item] = (bag[mission.reward.item] || 0) + (mission.reward.qty || 1);
  }

  return { ok: true, reward: mission.reward, rewardText: mission.rewardText };
}
