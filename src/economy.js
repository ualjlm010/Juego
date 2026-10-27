import { getItemDefinition, ITEMS } from './items.js';

export const LEGAL_SHOP_STOCK = Object.freeze([
  'poke-ball',
  'great-ball',
  'potion',
  'super-potion',
  'revive',
]);

export const BLACK_MARKET_STOCK = Object.freeze([
  'great-ball',
  'ultra-ball',
  'super-potion',
  'revive',
  'dark-radar',
  'contraband-chip',
]);

export function getLegalShopItems() {
  return LEGAL_SHOP_STOCK.map(id => getItemDefinition(id)).filter(Boolean);
}

export function getBlackMarketItems() {
  return BLACK_MARKET_STOCK.map(id => getItemDefinition(id)).filter(Boolean);
}

export function buyItem(gameState, itemId, quantity = 1, useDarkTokens = false) {
  if (!gameState || typeof gameState !== 'object') {
    return { ok: false, error: 'Estado de juego inválido.' };
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: 'La cantidad debe ser un entero positivo.' };
  }
  const item = getItemDefinition(itemId);
  if (!item) {
    return { ok: false, error: `Objeto desconocido: ${itemId}` };
  }

  const bag = gameState.bag || (gameState.bag = {});
  const money = Number.isSafeInteger(gameState.money) ? gameState.money : 0;
  const darkTokens = Number.isSafeInteger(gameState.darkTokens) ? gameState.darkTokens : 0;

  if (useDarkTokens) {
    if (!item.darkPrice || item.darkPrice <= 0) {
      return { ok: false, error: 'Este objeto no admite pago con fichas clandestinas.' };
    }
    const totalCost = item.darkPrice * quantity;
    if (darkTokens < totalCost) {
      return { ok: false, error: `Fichas insuficientes. Necesitas ${totalCost} ◈ y tienes ${darkTokens} ◈.` };
    }
    gameState.darkTokens = darkTokens - totalCost;
  } else {
    const totalCost = item.price * quantity;
    if (money < totalCost) {
      return { ok: false, error: `Fondos insuficientes. Necesitas ${totalCost} ₽ y tienes ${money} ₽.` };
    }
    gameState.money = money - totalCost;
  }

  bag[itemId] = (bag[itemId] || 0) + quantity;

  // Keep gameState.balls in sync for legacy compatibility if poke-ball is bought
  if (itemId === 'poke-ball') {
    gameState.balls = (gameState.balls || 0) + quantity;
  }

  return { ok: true, itemId, quantity, balance: gameState.money, darkTokens: gameState.darkTokens };
}

export function sellItem(gameState, itemId, quantity = 1) {
  if (!gameState || typeof gameState !== 'object') {
    return { ok: false, error: 'Estado de juego inválido.' };
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: 'La cantidad debe ser un entero positivo.' };
  }
  const item = getItemDefinition(itemId);
  if (!item) {
    return { ok: false, error: `Objeto desconocido: ${itemId}` };
  }
  const bag = gameState.bag || (gameState.bag = {});
  const currentQty = bag[itemId] || 0;
  if (currentQty < quantity) {
    return { ok: false, error: `No tienes suficientes unidades de ${item.name}.` };
  }

  const sellPricePerUnit = Math.floor(item.price * 0.5);
  const totalEarned = sellPricePerUnit * quantity;

  bag[itemId] = currentQty - quantity;
  if (bag[itemId] <= 0) {
    delete bag[itemId];
  }
  gameState.money = (Number.isSafeInteger(gameState.money) ? gameState.money : 0) + totalEarned;

  if (itemId === 'poke-ball') {
    gameState.balls = Math.max(0, (gameState.balls || 0) - quantity);
  }

  return { ok: true, itemId, quantity, earned: totalEarned, balance: gameState.money };
}

export function awardMoney(gameState, amount) {
  if (!gameState || !Number.isInteger(amount) || amount < 0) return false;
  gameState.money = (Number.isSafeInteger(gameState.money) ? gameState.money : 0) + amount;
  return true;
}

export function awardDarkTokens(gameState, amount) {
  if (!gameState || !Number.isInteger(amount) || amount < 0) return false;
  gameState.darkTokens = (Number.isSafeInteger(gameState.darkTokens) ? gameState.darkTokens : 0) + amount;
  return true;
}
