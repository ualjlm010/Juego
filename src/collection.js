import { validateCollection, validatePokemonInstance } from './pokemon.js';

export function consumePokeball(gameState){
  if(!Number.isSafeInteger(gameState?.balls)||gameState.balls<=0)return false;
  gameState.balls-=1;
  return true;
}

export function refundPokeball(gameState){
  if(!Number.isSafeInteger(gameState?.balls)||gameState.balls<0)return false;
  gameState.balls+=1;
  return true;
}

export function registerCapturedPokemon(gameState,wild,individual){
  if(!gameState||!Array.isArray(gameState.collection)||!Array.isArray(gameState.wild))return {ok:false,error:'Estado de partida inválido.'};
  if(!gameState.wild.includes(wild))return {ok:false,error:'El encuentro ya no está disponible.'};
  const validation=validatePokemonInstance(individual);
  if(!validation.valid)return {ok:false,error:validation.errors.join(' ')};
  const collectionValidation=validateCollection(gameState.collection);
  if(!collectionValidation.valid)return {ok:false,error:collectionValidation.errors.join(' ')};
  if(gameState.collection.some(pokemon=>pokemon.id===individual.id))return {ok:false,error:`El ID ${individual.id} ya existe en la colección.`};
  const nextCollection=[...gameState.collection,individual];
  const nextValidation=validateCollection(nextCollection);
  if(!nextValidation.valid)return {ok:false,error:nextValidation.errors.join(' ')};
  gameState.collection=nextCollection;
  gameState.wild=gameState.wild.filter(pokemon=>pokemon!==wild);
  return {ok:true,pokemon:individual};
}
