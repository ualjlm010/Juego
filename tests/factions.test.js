import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/state.js';
import { createPokemonInstance } from '../src/pokemon.js';
import { adjustReputation, createDynamicConflict, resolveConflict, FACTIONS } from '../src/factions.js';

test('definiciones de facción son consistentes y completas', () => {
  assert.ok(FACTIONS.guardian);
  assert.ok(FACTIONS.syndicate);
  assert.equal(FACTIONS.guardian.id, 'guardian');
  assert.equal(FACTIONS.syndicate.id, 'syndicate');
});

test('adjustReputation modifica reputación dentro de los límites [-100, 100]', () => {
  const state = createGameState({ reputation: { guardian: 95, syndicate: -95 } });
  adjustReputation(state, 'guardian', 20);
  assert.equal(state.reputation.guardian, 100);

  adjustReputation(state, 'syndicate', -20);
  assert.equal(state.reputation.syndicate, -100);
});

test('createDynamicConflict genera conflictos con zona y temporizador válidos', () => {
  let id = 0;
  const conflict = createDynamicConflict(() => `conf-${++id}`, { zoneId: 'forest' });
  assert.equal(conflict.zoneId, 'forest');
  assert.equal(conflict.resolved, false);
  assert.ok(conflict.expiresAt > Date.now());
});

test('resolución de conflicto desplaza influencia territorial y registra en eventLog', () => {
  const state = createGameState({
    territory: { meadow: { guardian: 60, syndicate: 40 } },
    eventLog: [],
  });

  let id = 0;
  const conflict = createDynamicConflict(() => `conf-${++id}`, { zoneId: 'meadow', forceType: 'rescue' });
  const outcome = resolveConflict(conflict, state, { playerIntervened: true, playerWon: true });

  assert.equal(conflict.resolved, true);
  assert.equal(outcome.winner, 'guardian');
  assert.equal(state.territory.meadow.guardian, 72); // 60 + 12
  assert.equal(state.territory.meadow.syndicate, 28);
  assert.ok(state.eventLog.length >= 1);
});

test('un Pokémon robado conserva sus datos, se marca retenido y puede ser rescatado', () => {
  const mon = createPokemonInstance('eevee', {
    idFactory: () => 'victim-mon',
    rng: () => 0.5,
    now: () => new Date('2026-10-26T10:00:00Z'),
  });

  const state = createGameState({
    collection: [mon],
    team: [], // Está en la reserva, no en equipo activo
    territory: { quarry: { guardian: 20, syndicate: 80 } },
  });

  // Simular robo manual o forzar victoria de syndicate en raid
  mon.stolen = true;
  mon.stolenBy = 'syndicate';
  mon.stolenAtZone = 'quarry';

  assert.equal(mon.stolen, true);
  assert.equal(mon.id, 'victim-mon');
  assert.equal(mon.speciesId, 'eevee');

  // Operación de rescate en la misma zona con victoria de la Alianza
  const rescueConflict = createDynamicConflict(() => 'rescue-1', { zoneId: 'quarry', forceType: 'rescue' });
  const outcome = resolveConflict(rescueConflict, state, { playerIntervened: true, playerWon: true });

  assert.equal(outcome.winner, 'guardian');
  assert.equal(mon.stolen, false);
  assert.equal(mon.stolenBy, undefined);
});
