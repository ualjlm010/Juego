import { CONFIG } from './config.js';
import { IV_KEYS, IV_MAX, IV_MIN, LEVEL_MAX, LEVEL_MIN, NATURES, POKEBALLS, SPECIES, TYPE_COLORS } from './species.js';
import { createId } from './ids.js';

const OWN = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const isRecord = value => value!==null&&typeof value==='object'&&!Array.isArray(value);

function randomIndex(length,rng){
  const value=rng();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('El generador aleatorio debe devolver un valor entre 0 incluido y 1 excluido.');
  return Math.floor(value*length);
}

export function createPokemonInstance(speciesId,{idFactory=createId,rng=Math.random,now=()=>new Date(),shiny,ball='Poké Ball',levelRange=CONFIG.initialLevelRange}={}){
  const species=SPECIES[speciesId];
  if(!species)throw new Error(`Especie desconocida: ${speciesId}`);
  if(typeof idFactory!=='function'||typeof rng!=='function'||typeof now!=='function')throw new TypeError('Las dependencias de generación deben ser funciones.');
  if(!levelRange||!Number.isInteger(levelRange.min)||!Number.isInteger(levelRange.max)||levelRange.min<LEVEL_MIN||levelRange.max>LEVEL_MAX||levelRange.min>levelRange.max)throw new RangeError('Rango de niveles inicial inválido.');
  if(!OWN(POKEBALLS,ball))throw new Error(`Poké Ball desconocida: ${ball}`);
  const id=idFactory();
  if(typeof id!=='string'||id.trim()==='')throw new Error('El generador devolvió un ID vacío.');
  const nature=NATURES[randomIndex(NATURES.length,rng)];
  const ability=species.ability[randomIndex(species.ability.length,rng)];
  const level=levelRange.min+randomIndex(levelRange.max-levelRange.min+1,rng);
  const iv=Object.fromEntries(IV_KEYS.map(key=>[key,IV_MIN+randomIndex(IV_MAX-IV_MIN+1,rng)]));
  const capturedAt=now();
  const isShiny=shiny===undefined?randomIndex(128,rng)===0:shiny;
  if(!(capturedAt instanceof Date)||!Number.isFinite(capturedAt.getTime()))throw new TypeError('La fecha de captura no es válida.');
  if(typeof isShiny!=='boolean')throw new TypeError('La condición variocolor debe ser booleana.');
  return {id,speciesId,level,nature,ability,iv,shiny:isShiny,caughtAt:capturedAt.toISOString(),ball};
}

export function validatePokemonInstance(value){
  const errors=[];
  if(!isRecord(value)){return {valid:false,errors:['El ejemplar debe ser un objeto.']}}
  if(typeof value.id!=='string'||value.id.trim()===''||value.id.length>128)errors.push('ID de ejemplar vacío o demasiado largo.');
  if(typeof value.speciesId!=='string'||!OWN(SPECIES,value.speciesId))errors.push('La especie referenciada no existe.');
  if(!Number.isInteger(value.level)||value.level<LEVEL_MIN||value.level>LEVEL_MAX)errors.push(`El nivel debe ser un entero entre ${LEVEL_MIN} y ${LEVEL_MAX}.`);
  if(typeof value.nature!=='string'||!NATURES.includes(value.nature))errors.push('La naturaleza no está en el catálogo.');
  const species=OWN(SPECIES,value.speciesId)?SPECIES[value.speciesId]:null;
  if(typeof value.ability!=='string'||!species||!species.ability.includes(value.ability))errors.push('La habilidad no es compatible con la especie.');
  if(typeof value.shiny!=='boolean')errors.push('El indicador variocolor debe ser booleano.');
  if(!OWN(POKEBALLS,value.ball))errors.push('La Poké Ball no está en el catálogo.');
  if(typeof value.caughtAt!=='string'||!Number.isFinite(Date.parse(value.caughtAt)))errors.push('La fecha de captura no es válida.');
  if(!isRecord(value.iv))errors.push('Los IV deben ser un objeto.');
  else{
    const keys=Object.keys(value.iv);
    if(keys.length!==IV_KEYS.length||IV_KEYS.some(key=>!OWN(value.iv,key)))errors.push(`Los IV deben contener exactamente: ${IV_KEYS.join(', ')}.`);
    for(const key of IV_KEYS)if(!Number.isInteger(value.iv[key])||value.iv[key]<IV_MIN||value.iv[key]>IV_MAX)errors.push(`El IV ${key} debe estar entre ${IV_MIN} y ${IV_MAX}.`);
  }
  return {valid:errors.length===0,errors};
}

export function validateCollection(value){
  if(!Array.isArray(value))return {valid:false,errors:['La colección debe ser una lista.']};
  const errors=[],ids=new Set();
  value.forEach((pokemon,index)=>{
    const validation=validatePokemonInstance(pokemon);
    for(const error of validation.errors)errors.push(`Ejemplar ${index+1}: ${error}`);
    if(typeof pokemon?.id==='string'){
      if(ids.has(pokemon.id))errors.push(`ID de ejemplar duplicado: ${pokemon.id}.`);
      ids.add(pokemon.id);
    }
  });
  return {valid:errors.length===0,errors};
}

export function validateSpeciesCatalog(){
  const errors=[],ids=new Set();
  for(const [key,species] of Object.entries(SPECIES)){
    if(species.id!==key)errors.push(`El ID de especie ${key} no coincide con su clave.`);
    if(ids.has(species.id))errors.push(`ID de especie duplicado: ${species.id}.`);
    ids.add(species.id);
    if(typeof species.name!=='string'||species.name.trim()==='')errors.push(`La especie ${key} no tiene nombre.`);
    if(!Array.isArray(species.type)||species.type.length<1||species.type.length>2||species.type.some(type=>!OWN(TYPE_COLORS,type)))errors.push(`Tipos inválidos para ${key}.`);
    if(!Array.isArray(species.ability)||species.ability.length===0||species.ability.some(ability=>typeof ability!=='string'||ability.trim()===''))errors.push(`Habilidades inválidas para ${key}.`);
  }
  return {valid:errors.length===0,errors};
}

export function validateEncounterConfig(){
  const errors=[],pool=CONFIG.encounterPool;
  if(!Array.isArray(pool)||pool.length===0)return {valid:false,errors:['La tabla de encuentros está vacía.']};
  for(const id of pool){if(!OWN(SPECIES,id))errors.push(`Especie de encuentro inexistente: ${id}.`);const weight=CONFIG.encounterWeights?.[id];if(!Number.isFinite(weight)||weight<=0)errors.push(`Peso de encuentro inválido para ${id}.`)}
  for(const [id,weight] of Object.entries(CONFIG.encounterWeights||{}))if(!OWN(SPECIES,id)||!Number.isFinite(weight)||weight<=0)errors.push(`Peso de encuentro inválido: ${id}.`);
  return {valid:errors.length===0,errors};
}

export function copyPokemonInstance(value){
  const validation=validatePokemonInstance(value);
  if(!validation.valid)throw new TypeError(`Ejemplar inválido: ${validation.errors.join(' ')}`);
  return {...value,iv:{...value.iv}};
}
