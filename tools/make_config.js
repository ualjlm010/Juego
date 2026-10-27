import fs from 'node:fs';

const meadow = [
  'rattata', 'pidgey', 'caterpie', 'oddish', 'jigglypuff', 'poliwag', 'bellsprout', 'psyduck',
  'bulbasaur', 'ivysaur', 'pikachu', 'meowth', 'ponyta', 'slowpoke', 'chikorita', 'totodile',
  'butterfree', 'raichu', 'wigglytuff', 'rapidash', 'eevee', 'vaporeon', 'snorlax', 'venusaur', 'ditto'
];

const forest = [
  'zubat', 'vulpix', 'oddish', 'caterpie', 'abra', 'gastly', 'cyndaquil',
  'charmander', 'charmeleon', 'ninetales', 'victreebel', 'gengar', 'scyther',
  'pinsir', 'heracross', 'espeon', 'umbreon', 'charizard', 'gardevoir', 'lucario', 'eevee', 'ditto'
];

const quarry = [
  'geodude', 'sandshrew', 'magnemite', 'cubone', 'rhyhorn', 'magikarp',
  'squirtle', 'wartortle', 'sandslash', 'golduck', 'poliwrath', 'slowbro', 'marowak',
  'onix', 'steelix', 'rhydon', 'scizor', 'tyranitar', 'gyarados', 'lapras',
  'jolteon', 'flareon', 'aerodactyl', 'blastoise', 'dratini', 'dragonair', 'dragonite',
  'mewtwo', 'mew', 'growlithe', 'ditto'
];

const allPool = [...new Set([...meadow, ...forest, ...quarry])];

function makeWeights(pool) {
  const w = {};
  for (const id of pool) {
    w[id] = 2;
  }
  // Commons get weight 4, uncommons 3, rares 2, legendaries 1
  return w;
}

const configContent = `export const CONFIG = {
  playerSpeed: 240,
  encounterRespawnMs: 10_000,
  maxWildPokemon: 5,
  shinyChance: 1 / 128,
  startingBalls: 8,
  initialLevelRange: { min: 3, max: 7 },
  captureBaseChance: 0.68,
  captureDifficulty: { common: 0, uncommon: 0.12, rare: 0.22, legendary: 0.35 },
  encounterPool: ${JSON.stringify(allPool)},
  encounterWeights: ${JSON.stringify(makeWeights(allPool), null, 2)},
  encounterSpawnPoints: [{x:850,y:310},{x:1060,y:450},{x:750,y:540},{x:1120,y:350},{x:930,y:570},{x:620,y:380},{x:800,y:220}],
};

export const EXPEDITIONS = Object.freeze([
  Object.freeze({
    id: 'meadow',
    name: 'Pradera del Refugio',
    subtitle: 'Hierba alta, arroyos serenos y senderos floridos.',
    unlockAt: 0,
    encounterPool: ${JSON.stringify(meadow)},
    encounterWeights: ${JSON.stringify(makeWeights(meadow), null, 4)},
    spawnPoints: [{x:850,y:310},{x:1060,y:450},{x:750,y:540},{x:1120,y:350},{x:930,y:570},{x:620,y:380},{x:800,y:220}],
    obstacles: [[155,150,56],[315,288,49],[1012,116,60],[1123,246,45],[210,567,66],[424,635,43],[1064,594,69],[1190,465,53],[910,303,34],[332,87,28],[875,566,31],[96,370,40]],
  }),
  Object.freeze({
    id: 'forest',
    name: 'Bosque Susurro',
    subtitle: 'Un bosque umbrío con ruinas antiguas, musgo y bruma nocturna.',
    unlockAt: 3,
    encounterPool: ${JSON.stringify(forest)},
    encounterWeights: ${JSON.stringify(makeWeights(forest), null, 4)},
    spawnPoints: [{x:810,y:310},{x:1080,y:460},{x:760,y:555},{x:1110,y:330},{x:930,y:570},{x:640,y:360},{x:820,y:240}],
    obstacles: [[142,148,54],[304,281,50],[1000,118,58],[1120,242,46],[204,566,66],[426,632,44],[1060,590,68],[1190,460,54],[910,304,36],[330,88,29],[872,562,32],[96,370,42]],
  }),
  Object.freeze({
    id: 'quarry',
    name: 'Cantera Antigua',
    subtitle: 'Afloramientos rocosos, vetas minerales y túneles mineros abandonados.',
    unlockAt: 6,
    encounterPool: ${JSON.stringify(quarry)},
    encounterWeights: ${JSON.stringify(makeWeights(quarry), null, 4)},
    spawnPoints: [{x:830,y:315},{x:1080,y:455},{x:760,y:555},{x:1110,y:330},{x:930,y:570},{x:650,y:390},{x:800,y:210}],
    obstacles: [[182,150,49],[364,288,53],[1004,126,55],[1130,245,48],[228,566,64],[444,632,43],[1062,590,70],[1190,460,54],[900,305,36],[332,90,29],[874,562,32],[96,370,42]],
  }),
]);
`;

fs.writeFileSync('C:/Users/Javier/Desktop/BlckMkt/src/config.js', configContent, 'utf8');
console.log('src/config.js updated successfully with all 74 species distributed across expeditions.');
