import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/state.js';
import { createPokemonInstance } from '../src/pokemon.js';
import { ensureTeamInitialized, getTeam, getLeadPokemon, addToTeam, removeFromTeam, swapTeamOrder, healEntireTeam, isTeamWiped } from '../src/team.js';

function makeTestMon(speciesId, id) {
  return createPokemonInstance(speciesId, { idFactory: () => id, rng: () => 0.5 });
}

test('el equipo se inicializa automáticamente con hasta 6 ejemplares no robados', () => {
  const collection = [
    makeTestMon('rattata', 'm-1'),
    makeTestMon('zubat', 'm-2'),
    makeTestMon('oddish', 'm-3'),
    makeTestMon('eevee', 'm-4'),
  ];
  collection[1].stolen = true; // Zubat está retenido

  const state = createGameState({ collection });
  const team = getTeam(state);

  assert.equal(team.length, 3);
  assert.equal(team.some(p => p.id === 'm-2'), false); // El robado no entra
  assert.equal(team[0].id, 'm-1');
});

test('getLeadPokemon devuelve el primer ejemplar con salud disponible', () => {
  const collection = [
    makeTestMon('rattata', 'm-1'),
    makeTestMon('eevee', 'm-2'),
  ];
  const state = createGameState({ collection });
  ensureTeamInitialized(state);

  // Debilitamos a rattata
  collection[0].currentHp = 0;
  const lead = getLeadPokemon(state);
  assert.equal(lead.id, 'm-2');
});

test('no se puede añadir un Pokémon duplicado ni superar 6 miembros', () => {
  const mons = Array.from({ length: 8 }, (_, i) => makeTestMon('rattata', `m-${i + 1}`));
  const state = createGameState({ collection: mons });
  ensureTeamInitialized(state);

  assert.equal(state.team.length, 6);
  // Intentar añadir el 7º
  const addSeventh = addToTeam(state, 'm-7');
  assert.equal(addSeventh.ok, false);

  // Intentar duplicar
  const addDup = addToTeam(state, 'm-1');
  assert.equal(addDup.ok, false);
});

test('no se puede vaciar por completo el equipo activo', () => {
  const mon = makeTestMon('eevee', 'm-only');
  const state = createGameState({ collection: [mon] });
  ensureTeamInitialized(state);

  assert.equal(state.team.length, 1);
  const result = removeFromTeam(state, 'm-only');
  assert.equal(result.ok, false);
  assert.equal(state.team.length, 1);
});

test('swapTeamOrder intercambia posiciones del equipo de forma válida', () => {
  const collection = [
    makeTestMon('rattata', 'm-1'),
    makeTestMon('eevee', 'm-2'),
  ];
  const state = createGameState({ collection });
  ensureTeamInitialized(state);

  assert.equal(state.team[0], 'm-1');
  assert.equal(swapTeamOrder(state, 0, 1), true);
  assert.equal(state.team[0], 'm-2');
  assert.equal(swapTeamOrder(state, 0, 5), false); // Fuera de rango
});

test('healEntireTeam restaura la salud de todo el equipo y limpia debilitados', () => {
  const collection = [
    makeTestMon('rattata', 'm-1'),
    makeTestMon('eevee', 'm-2'),
  ];
  collection[0].currentHp = 0;
  collection[1].currentHp = 5;

  const state = createGameState({ collection });
  ensureTeamInitialized(state);
  assert.equal(isTeamWiped(state), false);

  collection[1].currentHp = 0;
  assert.equal(isTeamWiped(state), true);

  healEntireTeam(state);
  assert.ok(collection[0].currentHp > 0);
  assert.equal(collection[0].currentHp, collection[0].maxHp);
  assert.equal(isTeamWiped(state), false);
});
