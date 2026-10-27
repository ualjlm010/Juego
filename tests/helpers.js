import { createPokemonInstance } from '../src/pokemon.js';

export function sequenceRandom(values){let index=0;return ()=>values[index++%values.length]}
export function samplePokemon(id='rattata',options={}){
  return createPokemonInstance(id,{idFactory:()=>options.id||'pokemon-1',rng:()=>0,now:()=>new Date('2026-10-26T08:00:00.000Z'),shiny:options.shiny??false,ball:'Poké Ball'});
}
export class MemoryStorage{
  constructor(initial={}){this.values=new Map(Object.entries(initial));this.failRead=false;this.failWrite=false}
  getItem(key){if(this.failRead)throw new Error('lectura denegada');return this.values.has(key)?this.values.get(key):null}
  setItem(key,value){if(this.failWrite)throw new Error('cuota superada');this.values.set(key,String(value))}
}
