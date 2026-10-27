import test from 'node:test';
import assert from 'node:assert/strict';
import { createPokemonInstance } from '../src/pokemon.js';
import { calculateCombatStats, getTypeMultiplier, calculateDamage, createCombatSession, executePlayerAttack, awardCombatExp } from '../src/combat.js';

function makeMon(speciesId, level = 5) {
  return createPokemonInstance(speciesId, {
    levelRange: { min: level, max: level },
    idFactory: () => `${speciesId}-${Math.random()}`,
    rng: () => 0.5,
  });
}

test('calculateCombatStats produce estadísticas coherentes con nivel e IV', () => {
  const mon = makeMon('growlithe', 10);
  const stats = calculateCombatStats(mon);

  assert.ok(stats.maxHp >= 20);
  assert.ok(stats.atk >= 10);
  assert.ok(stats.def >= 10);
  assert.ok(stats.spd >= 10);
  assert.equal(stats.hp, stats.maxHp);
});

test('getTypeMultiplier calcula efectividad de tipos elemental correctamente', () => {
  // Fuego es muy eficaz contra Planta
  assert.equal(getTypeMultiplier('Fuego', ['Planta']), 2);
  // Agua es poco eficaz contra Planta
  assert.equal(getTypeMultiplier('Agua', ['Planta']), 0.5);
  // Normal no afecta a Fantasma
  assert.equal(getTypeMultiplier('Normal', ['Fantasma']), 0);
  // Eléctrico vs Dragón/Volador
  assert.equal(getTypeMultiplier('Eléctrico', ['Dragón', 'Volador']), 1); // 0.5 * 2 = 1
});

test('calculateDamage genera daño positivo y detecta ventajas elementales', () => {
  const attacker = makeMon('growlithe', 15);
  const defender = makeMon('oddish', 10);
  const move = { name: 'Ascuas', type: 'Fuego', power: 40 };

  const result = calculateDamage(attacker, defender, move);
  assert.ok(result.damage > 0);
  assert.equal(result.isSuperEffective, true);
  assert.equal(result.isImmune, false);
});

test('flujo de combate por turnos reduce PS del oponente y declara victoria', () => {
  const playerMon = makeMon('growlithe', 25);
  const opponentMon = makeMon('oddish', 5);
  const combat = createCombatSession(playerMon, opponentMon);

  assert.equal(combat.finished, false);
  assert.equal(combat.turn, 1);

  // Ejecutar ataque con ventaja de nivel
  executePlayerAttack(combat, 0);
  assert.ok(opponentMon.currentHp < opponentMon.maxHp);

  // Continuar hasta debilitar si no cayó en un golpe
  if (!combat.finished) {
    executePlayerAttack(combat, 0);
  }

  assert.equal(combat.finished, true);
  assert.equal(combat.winner, 'player');
});

test('awardCombatExp incrementa experiencia y gestiona subida de nivel', () => {
  const playerMon = makeMon('rattata', 3);
  const opponentMon = makeMon('eevee', 8);

  const expResult = awardCombatExp(playerMon, opponentMon);
  assert.ok(expResult.expGain > 0);
  if (expResult.leveledUp) {
    assert.equal(playerMon.level, 4);
  }
});
