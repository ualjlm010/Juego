import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/state.js';
import { buyItem, sellItem, awardMoney, awardDarkTokens, getLegalShopItems, getBlackMarketItems } from '../src/economy.js';

test('catálogos de tienda legal y mercado negro están definidos y no vacíos', () => {
  const legal = getLegalShopItems();
  const black = getBlackMarketItems();
  assert.ok(legal.length >= 4);
  assert.ok(black.length >= 4);
  assert.ok(legal.every(i => i.price > 0));
  assert.ok(black.some(i => i.darkPrice > 0));
});

test('comprar un objeto descuenta dinero y lo añade a la bolsa', () => {
  const state = createGameState({ money: 1000, bag: {} });
  const result = buyItem(state, 'potion', 2);
  assert.equal(result.ok, true);
  assert.equal(state.money, 400); // potion price 300 * 2 = 600
  assert.equal(state.bag['potion'], 2);
});

test('comprar con saldo insuficiente es rechazado sin mutar el estado', () => {
  const state = createGameState({ money: 100, bag: {} });
  const result = buyItem(state, 'potion', 1);
  assert.equal(result.ok, false);
  assert.equal(state.money, 100);
  assert.equal(state.bag['potion'], undefined);
});

test('comprar con fichas clandestinas descuenta darkTokens', () => {
  const state = createGameState({ darkTokens: 50, bag: {} });
  const result = buyItem(state, 'great-ball', 2, true);
  assert.equal(result.ok, true);
  assert.equal(state.darkTokens, 20); // great-ball darkPrice 15 * 2 = 30
  assert.equal(state.bag['great-ball'], 2);
});

test('vender un objeto reembolsa el 50% del precio y reduce la cantidad', () => {
  const state = createGameState({ money: 0, bag: { potion: 3 } });
  const result = sellItem(state, 'potion', 2);
  assert.equal(result.ok, true);
  assert.equal(state.money, 300); // 150 * 2
  assert.equal(state.bag['potion'], 1);
});

test('vender más unidades de las disponibles es rechazado', () => {
  const state = createGameState({ money: 100, bag: { potion: 1 } });
  const result = sellItem(state, 'potion', 2);
  assert.equal(result.ok, false);
  assert.equal(state.money, 100);
  assert.equal(state.bag['potion'], 1);
});

test('awardMoney y awardDarkTokens validan enteros no negativos', () => {
  const state = createGameState({ money: 100, darkTokens: 10 });
  assert.equal(awardMoney(state, 500), true);
  assert.equal(state.money, 600);
  assert.equal(awardDarkTokens(state, 25), true);
  assert.equal(state.darkTokens, 35);
  assert.equal(awardMoney(state, -50), false);
  assert.equal(awardDarkTokens(state, 'invalido'), false);
});
