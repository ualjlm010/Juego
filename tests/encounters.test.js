import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseEncounterSpecies } from '../src/encounters.js';
import { captureProbability, rollCapture } from '../src/capture.js';
import { SPECIES } from '../src/species.js';
import { CONFIG } from '../src/config.js';

test('la selección de encuentros admite RNG inyectado y devuelve una especie del catálogo',()=>{
  const chosen=chooseEncounterSpecies({rng:()=>0});
  assert.ok(SPECIES[chosen]);
  assert.equal(chooseEncounterSpecies({rng:()=>0.999999}),CONFIG.encounterPool.at(-1));
  assert.throws(()=>chooseEncounterSpecies({rng:()=>1}),/aleatorio/);
  assert.throws(()=>chooseEncounterSpecies({pool:['missing'],weights:{missing:1},rng:()=>0}),/inexistente/);
});

test('la captura puede reproducir éxito y fallo sin cambiar las probabilidades de producción',()=>{
  const wild={difficulty:'common',shiny:false};
  assert.equal(rollCapture(wild,{baseChance:1,rng:()=>0}),true);
  assert.equal(rollCapture(wild,{baseChance:0,difficulty:{common:0},rng:()=>0.999}),false);
  assert.equal(captureProbability(wild,{baseChance:0,difficulty:{common:0}}),0.15);
  assert.throws(()=>rollCapture(wild,{rng:()=>-0.1}),/aleatorio/);
});
