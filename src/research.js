import { SPECIES } from './species.js';
import { EXPEDITIONS } from './config.js';

export const RESEARCH_MISSIONS=Object.freeze([
  Object.freeze({id:'first-sighting',title:'Primer avistamiento',description:'Registra tu primer Pokémon en la colección.',kind:'captures',target:1,reward:3}),
  Object.freeze({id:'field-variety',title:'Diversidad de campo',description:'Registra tres especies diferentes.',kind:'species',target:3,reward:5}),
  Object.freeze({id:'quarry-survey',title:'Cartógrafo experto',description:'Registra seis especies para abrir la Cantera Antigua.',kind:'species',target:6,reward:8}),
  Object.freeze({id:'full-catalog',title:'Catálogo regional',description:'Completa el catálogo de las doce especies.',kind:'species',target:Object.keys(SPECIES).length,reward:20}),
]);
export const RESEARCH_MISSION_IDS=Object.freeze(RESEARCH_MISSIONS.map(mission=>mission.id));

export function getResearchStats(collection=[]){
  const species=new Set(collection.map(pokemon=>pokemon.speciesId));
  return {captures:collection.length,uniqueSpecies:species.size,totalSpecies:Object.keys(SPECIES).length,species};
}

export function getMissionProgress(mission,collection=[]){
  const stats=getResearchStats(collection);
  const current=mission.kind==='captures'?stats.captures:stats.uniqueSpecies;
  return {current,target:mission.target,complete:current>=mission.target,progress:Math.min(1,current/mission.target)};
}

export function getMissionBoard(collection=[],claims=[]){
  const claimed=new Set(claims);
  return RESEARCH_MISSIONS.map(mission=>({...mission,...getMissionProgress(mission,collection),claimed:claimed.has(mission.id)}));
}

export function getExpeditionAccess(collection=[]){
  const {uniqueSpecies}=getResearchStats(collection);
  return EXPEDITIONS.map(expedition=>({...expedition,unlocked:uniqueSpecies>=expedition.unlockAt,discovered:uniqueSpecies}));
}
