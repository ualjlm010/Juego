import { CONFIG } from './config.js';

export function captureProbability(wild,{baseChance=CONFIG.captureBaseChance,difficulty=CONFIG.captureDifficulty}={}){
  if(!wild||!Number.isFinite(baseChance)||baseChance<0||baseChance>1)throw new TypeError('Datos de captura inválidos.');
  const penalty=difficulty[wild.difficulty]??0;
  if(!Number.isFinite(penalty)||penalty<0||penalty>1)throw new TypeError('Dificultad de captura inválida.');
  return Math.max(.15,baseChance-penalty+(wild.shiny?-.08:0));
}

export function rollCapture(wild,{rng=Math.random,...settings}={}){
  if(typeof rng!=='function')throw new TypeError('El generador aleatorio debe ser una función.');
  const value=rng();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('El generador aleatorio debe devolver un valor entre 0 incluido y 1 excluido.');
  return value<captureProbability(wild,settings);
}
