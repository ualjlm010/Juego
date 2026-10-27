import { SPECIES } from './species.js';

const SPRITE_BASE='../assets/pokemon/sprites/';
const SHINY_BASE='../assets/pokemon/shiny/';
export const FALLBACK_SPRITE_URL=new URL('../assets/pokemon/fallback.svg',import.meta.url).href;

export const SPRITE_REGISTRY=Object.freeze(Object.fromEntries(Object.keys(SPECIES).map(id=>[id,Object.freeze({
  speciesId:id,
  normal:new URL(`${SPRITE_BASE}${id}.png`,import.meta.url).href,
  shiny:new URL(`${SHINY_BASE}${id}.png`,import.meta.url).href,
  portrait:new URL(`${SPRITE_BASE}${id}.png`,import.meta.url).href,
  source:{width:128,height:128},
  render:{width:78,height:78,anchor:'bottom-center',scale:'pixelated'},
})])));

const imageCache=new Map();
const reportedFailures=new Set();

export function getSpriteDefinition(speciesId){return SPRITE_REGISTRY[speciesId]||null}

export function getSpeciesSpriteUrl(speciesId,{shiny=false,portrait=false}={}){
  const definition=getSpriteDefinition(speciesId);
  if(!definition)return FALLBACK_SPRITE_URL;
  return portrait?definition.portrait:(shiny?definition.shiny:definition.normal);
}

export function loadSpriteAsset(speciesId,{shiny=false}={}){
  if(typeof Image==='undefined')return null;
  const url=getSpeciesSpriteUrl(speciesId,{shiny});
  if(imageCache.has(url))return imageCache.get(url);
  const image=new Image();
  image.decoding='async';
  image.addEventListener('error',()=>{
    if(!reportedFailures.has(url)){
      reportedFailures.add(url);
      console.error(`No se pudo cargar el sprite local: ${url}`);
    }
  },{once:true});
  image.src=url;
  imageCache.set(url,image);
  return image;
}

export function preloadSpeciesSprites(){
  if(typeof Image==='undefined')return Promise.resolve([]);
  const entries=Object.keys(SPRITE_REGISTRY);
  return Promise.all(entries.flatMap(speciesId=>[
    loadSpriteAsset(speciesId),loadSpriteAsset(speciesId,{shiny:true}),
  ]).map(image=>new Promise(resolve=>{
    if(!image)return resolve(false);
    if(image.complete)return resolve(image.naturalWidth>0);
    image.addEventListener('load',()=>resolve(true),{once:true});
    image.addEventListener('error',()=>resolve(false),{once:true});
  })));
}

export function drawMissingSprite(ctx,x,y,width,height){
  ctx.save();
  ctx.fillStyle='#10171388';
  ctx.beginPath();ctx.ellipse(x,y-2,width*.26,height*.07,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#758170';ctx.strokeStyle='#d4d8c5';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(x,y-height*.5,width*.22,height*.32,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillRect(x-width*.18,y-height*.2,width*.36,height*.22);
  ctx.restore();
}

export function drawSpeciesSprite(ctx,speciesId,x,y,{shiny=false,width=78,height=78}={}){
  const image=loadSpriteAsset(speciesId,{shiny});
  if(!image||!image.complete||!image.naturalWidth){
    drawMissingSprite(ctx,x,y,width,height);
    return false;
  }
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,x-width/2,y-height,width,height);
  ctx.restore();
  if(shiny)drawShinySparkle(ctx,x+width*.38,y-height*.86);
  return true;
}

function drawShinySparkle(ctx,x,y){
  ctx.save();ctx.fillStyle='#fff0a6';ctx.strokeStyle='#c59648';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+2,y-2);ctx.lineTo(x+7,y);ctx.lineTo(x+2,y+2);ctx.lineTo(x,y+7);ctx.lineTo(x-2,y+2);ctx.lineTo(x-7,y);ctx.lineTo(x-2,y-2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}

export function bindSpriteImages(root=document){
  for(const image of root.querySelectorAll('img[data-sprite-id]')){
    if(image.dataset.fallbackBound==='true')continue;
    image.dataset.fallbackBound='true';
    image.addEventListener('error',()=>{
      const failed=image.currentSrc||image.src;
      if(failed===FALLBACK_SPRITE_URL)return;
      if(!reportedFailures.has(failed)){
        reportedFailures.add(failed);
        console.error(`No se pudo cargar el sprite de ${image.dataset.spriteId}: ${failed}`);
      }
      image.src=FALLBACK_SPRITE_URL;
      image.alt='Silueta de reserva';
      image.classList.add('sprite-fallback');
    },{once:true});
  }
}
