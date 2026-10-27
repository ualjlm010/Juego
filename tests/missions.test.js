import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/state.js';
import { createPokemonInstance } from '../src/pokemon.js';
import { getStoryMissionsProgress, claimStoryMissionReward, STORY_MISSIONS } from '../src/missions.js';

test('las misiones de historia detectan objetivos completados en el estado', () => {
  const mon = createPokemonInstance('rattata', { idFactory: () => 'm-1', rng: () => 0.5 });
  const state = createGameState({ collection: [mon], team: ['m-1'] });

  const progress = getStoryMissionsProgress(state);
  const firstCatch = progress.find(m => m.id === 'story-first-catch');
  assert.ok(firstCatch);
  assert.equal(firstCatch.complete, true);
  assert.equal(firstCatch.claimed, false);

  const trio = progress.find(m => m.id === 'story-team-trio');
  assert.equal(trio.complete, false);
});

test('claimStoryMissionReward entrega recompensas y rechaza duplicados', () => {
  const mon = createPokemonInstance('rattata', { idFactory: () => 'm-1', rng: () => 0.5 });
  const state = createGameState({ collection: [mon], money: 0, balls: 2 });

  const result = claimStoryMissionReward(state, 'story-first-catch');
  assert.equal(result.ok, true);
  assert.equal(state.money, 300);
  assert.equal(state.balls, 5); // 2 + 3

  // Reclamar de nuevo debe fallar
  const repeat = claimStoryMissionReward(state, 'story-first-catch');
  assert.equal(repeat.ok, false);
});
