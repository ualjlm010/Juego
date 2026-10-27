import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, SAVE_SCHEMA_VERSION, createSaveEnvelope, loadGameSave, validateSaveEnvelope, writeGameSave } from '../src/save.js';
import { createGameState } from '../src/state.js';
import { samplePokemon, MemoryStorage } from './helpers.js';

const fixedNow=()=>new Date('2026-10-26T08:00:00.000Z');

test('ida y vuelta conserva bolas, IDs, características y variocolor',()=>{
  const state=createGameState({balls:3,collection:[samplePokemon('rattata',{id:'r-1'}),samplePokemon('eevee',{id:'e-1',shiny:true})]});
  const storage=new MemoryStorage();
  const written=writeGameSave(storage,state,{now:fixedNow});
  assert.equal(written.ok,true);
  const loaded=loadGameSave(storage);
  assert.equal(loaded.status,'valid');
  assert.equal(loaded.save.schemaVersion,SAVE_SCHEMA_VERSION);
  assert.deepEqual(loaded.gameState,{balls:3,collection:state.collection,researchClaims:[]});
  assert.equal(loaded.gameState.collection[1].shiny,true);
  assert.equal(loaded.gameState.collection[0].id,'r-1');
});

test('un guardado de Fase 2 se migra y conserva colección e inventario',()=>{
  const legacy={schemaVersion:1,savedAt:fixedNow().toISOString(),gameState:{balls:4,collection:[samplePokemon('eevee',{id:'legacy-eevee'})]}};
  const storage=new MemoryStorage({[SAVE_KEY]:JSON.stringify(legacy)});
  const loaded=loadGameSave(storage);
  assert.equal(loaded.status,'valid');
  assert.equal(loaded.save.schemaVersion,SAVE_SCHEMA_VERSION);
  assert.equal(loaded.save.migratedFrom,1);
  assert.deepEqual(loaded.gameState,{balls:4,collection:legacy.gameState.collection,researchClaims:[]});
  assert.equal(storage.getItem(SAVE_KEY),JSON.stringify(legacy));
});

test('el guardado rechaza reclamaciones desconocidas o repetidas',()=>{
  const base=createSaveEnvelope({balls:2,collection:[],researchClaims:['first-sighting']},{now:fixedNow});
  const unknown=structuredClone(base);unknown.gameState.researchClaims=['not-a-mission'];
  const duplicate=structuredClone(base);duplicate.gameState.researchClaims=['first-sighting','first-sighting'];
  assert.equal(validateSaveEnvelope(unknown).valid,false);
  assert.equal(validateSaveEnvelope(duplicate).valid,false);
});

test('un guardado vacío se informa como vacío y no como partida recuperable',()=>{
  assert.equal(loadGameSave(new MemoryStorage()).status,'empty');
});

test('JSON corrupto y versiones futuras se rechazan sin sobrescribir el original',()=>{
  const storage=new MemoryStorage({[SAVE_KEY]:'{mal'});
  const malformed=loadGameSave(storage);
  assert.equal(malformed.status,'corrupt');
  assert.equal(storage.getItem(SAVE_KEY),'{mal');
  const future=validateSaveEnvelope({schemaVersion:SAVE_SCHEMA_VERSION+1,savedAt:fixedNow().toISOString(),gameState:{balls:2,collection:[]}});
  assert.equal(future.valid,false);
  const futureRaw=JSON.stringify({schemaVersion:SAVE_SCHEMA_VERSION+1,savedAt:fixedNow().toISOString(),gameState:{balls:2,collection:[]}});
  const futureStorage=new MemoryStorage({[SAVE_KEY]:futureRaw});
  assert.equal(loadGameSave(futureStorage).status,'corrupt');
  assert.equal(futureStorage.getItem(SAVE_KEY),futureRaw);
  const missing=validateSaveEnvelope({schemaVersion:1,savedAt:fixedNow().toISOString()});
  assert.equal(missing.valid,false);
});

test('un guardado rechaza IV inválidos e IDs duplicados',()=>{
  const base=createSaveEnvelope({balls:2,collection:[samplePokemon('rattata',{id:'dup'})]},{now:fixedNow});
  const badIV=structuredClone(base);badIV.gameState.collection[0].iv.PS=99;
  assert.equal(validateSaveEnvelope(badIV).valid,false);
  const duplicate=structuredClone(base);duplicate.gameState.collection.push(structuredClone(duplicate.gameState.collection[0]));
  assert.equal(validateSaveEnvelope(duplicate).valid,false);
});

test('un error de escritura conserva el guardado previo y los errores de lectura se notifican',()=>{
  const storage=new MemoryStorage({[SAVE_KEY]:'old-valid-value'});
  storage.failWrite=true;
  const result=writeGameSave(storage,{balls:2,collection:[]},{now:fixedNow});
  assert.equal(result.ok,false);
  assert.equal(storage.getItem(SAVE_KEY),'old-valid-value');
  storage.failRead=true;
  assert.equal(loadGameSave(storage).status,'unavailable');
});

test('un estado inválido no reemplaza el contenido previo',()=>{
  const storage=new MemoryStorage({[SAVE_KEY]:'keep-me'});
  const result=writeGameSave(storage,{balls:-1,collection:[]},{now:fixedNow});
  assert.equal(result.ok,false);
  assert.equal(storage.getItem(SAVE_KEY),'keep-me');
});

test('especie inexistente e inventario inválido se rechazan y preservan el guardado bruto',()=>{
  const base=createSaveEnvelope({balls:2,collection:[samplePokemon('rattata',{id:'valid-1'})]},{now:fixedNow});
  const cases=[
    ['especie',value=>{value.gameState.collection[0].speciesId='missing-species'}],
    ['inventario',value=>{value.gameState.balls=-1}],
  ];
  for(const [label,mutate] of cases){
    const invalid=structuredClone(base);mutate(invalid);
    const raw=JSON.stringify(invalid),storage=new MemoryStorage({[SAVE_KEY]:raw});
    const loaded=loadGameSave(storage);
    assert.equal(loaded.status,'corrupt',label);
    assert.match(loaded.message,/inválid|existe|entero/i,label);
    assert.equal(storage.getItem(SAVE_KEY),raw,label);
  }
});

test('una escritura fallida se informa y mantiene el guardado previo exactamente',()=>{
  const previous=JSON.stringify(createSaveEnvelope({balls:5,collection:[]},{now:fixedNow}));
  const storage=new MemoryStorage({[SAVE_KEY]:previous});storage.failWrite=true;
  const result=writeGameSave(storage,{balls:4,collection:[]},{now:fixedNow});
  assert.equal(result.ok,false);
  assert.match(result.error,/escribir|cuota/i);
  assert.equal(storage.getItem(SAVE_KEY),previous);
});
