import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { IV_KEYS, NATURES, SPECIES } from '../src/species.js';
import { createPokemonInstance, validateCollection, validateEncounterConfig, validatePokemonInstance, validateSpeciesCatalog } from '../src/pokemon.js';
import { makeIndividual, makeWild } from '../src/state.js';
import { samplePokemon, sequenceRandom } from './helpers.js';

test('el catálogo estático contiene especies consistentes e IDs estables',()=>{
  const result=validateSpeciesCatalog();
  assert.equal(result.valid,true,result.errors.join('\n'));
  assert.ok(Object.keys(SPECIES).length>=10);
  assert.deepEqual(Object.keys(SPECIES),Object.values(SPECIES).map(species=>species.id));
  assert.equal(validateEncounterConfig().valid,true);
  assert.ok(CONFIG.encounterPool.every(id=>SPECIES[id]));
});

test('un ejemplar se genera con habilidad compatible, IV en rango e ID único',()=>{
  let id=0;
  const options={idFactory:()=>`instance-${++id}`,rng:sequenceRandom([0,0.5,0.99,0]),now:()=>new Date('2026-10-26T08:00:00.000Z'),shiny:true};
  const first=createPokemonInstance('rattata',options),second=createPokemonInstance('rattata',options);
  assert.notEqual(first.id,second.id);
  assert.equal(first.speciesId,'rattata');
  assert.ok(NATURES.includes(first.nature));
  assert.ok(SPECIES.rattata.ability.includes(first.ability));
  assert.equal(first.shiny,true);
  assert.equal(Object.keys(first.iv).length,IV_KEYS.length);
  assert.ok(Object.values(first.iv).every(value=>Number.isInteger(value)&&value>=0&&value<=31));
  assert.equal(validatePokemonInstance(first).valid,true);
});

test('la generación y consulta no mutan la definición de especie',()=>{
  const before=JSON.stringify(SPECIES.rattata);
  const wild=makeWild('rattata',10,20,{rng:()=>0,idFactory:()=> 'wild-1'});
  const individual=makeIndividual(wild,{idFactory:()=> 'captured-1',rng:()=>0,now:()=>new Date('2026-10-26T08:00:00Z')});
  validatePokemonInstance(individual);
  assert.equal(JSON.stringify(SPECIES.rattata),before);
  assert.equal(Object.isFrozen(SPECIES.rattata.ability),true);
  assert.throws(()=>createPokemonInstance('missing'),/Especie desconocida/);
});

test('los validadores rechazan naturaleza, habilidad, IV y duplicados inválidos',()=>{
  const valid=samplePokemon();
  assert.equal(validatePokemonInstance({...valid,nature:'Inventada'}).valid,false);
  assert.equal(validatePokemonInstance({...valid,ability:'Levitación'}).valid,false);
  assert.equal(validatePokemonInstance({...valid,iv:{...valid.iv,PS:32}}).valid,false);
  assert.equal(validatePokemonInstance({...valid,shiny:'sí'}).valid,false);
  assert.equal(validateCollection([valid,{...valid}]).valid,false);
});
