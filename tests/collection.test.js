import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, makeWild } from '../src/state.js';
import { consumePokeball, refundPokeball, registerCapturedPokemon } from '../src/collection.js';
import { samplePokemon } from './helpers.js';

test('el inventario consume y devuelve una bola sin permitir cantidades negativas',()=>{
  const state=createGameState({balls:1});
  assert.equal(consumePokeball(state),true);
  assert.equal(state.balls,0);
  assert.equal(consumePokeball(state),false);
  assert.equal(state.balls,0);
  assert.equal(refundPokeball(state),true);
  assert.equal(state.balls,1);
});

test('registro exitoso retira el encuentro y permite misma especie con IDs distintos',()=>{
  const state=createGameState();
  const wildA=makeWild('rattata',1,1,{idFactory:()=> 'wild-a',rng:()=>0});
  const wildB=makeWild('rattata',2,2,{idFactory:()=> 'wild-b',rng:()=>0});
  state.wild=[wildA,wildB];
  const a=samplePokemon('rattata',{id:'caught-a'}),b=samplePokemon('rattata',{id:'caught-b'});
  assert.equal(registerCapturedPokemon(state,wildA,a).ok,true);
  assert.equal(registerCapturedPokemon(state,wildB,b).ok,true);
  assert.deepEqual(state.collection.map(p=>p.id),['caught-a','caught-b']);
  assert.deepEqual(state.wild,[ ]);
});

test('un fallo o un ID duplicado no altera colección ni elimina el encuentro',()=>{
  const state=createGameState();
  const wild=makeWild('zubat',4,5,{idFactory:()=> 'wild-c',rng:()=>0});
  const existing=samplePokemon('rattata',{id:'same-id'});
  state.collection=[existing];state.wild=[wild];
  // A failed capture does not call the registration function.
  assert.equal(state.collection.length,1);
  const duplicate=samplePokemon('zubat',{id:'same-id'});
  const result=registerCapturedPokemon(state,wild,duplicate);
  assert.equal(result.ok,false);
  assert.equal(state.collection.length,1);
  assert.deepEqual(state.wild,[wild]);
});
