import { CONFIG } from './config.js';
import { SPECIES } from './species.js';

export function chooseEncounterSpecies({rng=Math.random,pool=CONFIG.encounterPool,weights=CONFIG.encounterWeights}={}){
  if(typeof rng!=='function')throw new TypeError('El generador aleatorio debe ser una función.');
  if(!Array.isArray(pool)||pool.length===0)throw new Error('La tabla de encuentros está vacía.');
  const entries=pool.map(id=>({id,weight:weights?.[id]}));
  for(const {id,weight} of entries){if(!SPECIES[id])throw new Error(`Especie de encuentro inexistente: ${id}.`);if(!Number.isFinite(weight)||weight<=0)throw new Error(`Peso de encuentro inválido para ${id}.`)}
  const total=entries.reduce((sum,entry)=>sum+entry.weight,0),value=rng();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('El generador aleatorio debe devolver un valor entre 0 incluido y 1 excluido.');
  let target=value*total;
  for(const entry of entries){target-=entry.weight;if(target<0)return entry.id}
  return entries.at(-1).id;
}
