import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpeditionAccess, getMissionBoard } from '../src/research.js';
import { samplePokemon } from './helpers.js';

test('investigation objectives track captures and distinct species',()=>{
  const one=[samplePokemon('rattata',{id:'r1'})];
  let board=getMissionBoard(one,[]);
  assert.equal(board.find(m=>m.id==='first-sighting').complete,true);
  assert.equal(board.find(m=>m.id==='field-variety').current,1);
  const three=[...one,samplePokemon('zubat',{id:'z1'}),samplePokemon('oddish',{id:'o1'})];
  board=getMissionBoard(three,[]);
  assert.equal(board.find(m=>m.id==='field-variety').complete,true);
  assert.equal(board.find(m=>m.id==='quarry-survey').complete,false);
  assert.equal(getExpeditionAccess(three)[1].unlocked,true);
  const six=['geodude','meowth','gastly'].map(id=>samplePokemon(id,{id}));
  board=getMissionBoard([...three,...six],[]);
  assert.equal(board.find(m=>m.id==='quarry-survey').complete,true);
  assert.equal(board.find(m=>m.id==='first-sighting').claimed,false);
});

test('new expeditions unlock from species discoveries',()=>{
  assert.deepEqual(getExpeditionAccess([]).map(a=>a.unlocked),[true,false,false]);
  const six=['rattata','zubat','oddish','geodude','meowth','gastly'].map(id=>samplePokemon(id,{id}));
  assert.deepEqual(getExpeditionAccess(six).map(a=>a.unlocked),[true,true,true]);
});
