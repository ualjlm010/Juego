import fs from 'node:fs';

const dexList = JSON.parse(fs.readFileSync('C:/Users/Javier/Desktop/BlckMkt/src/species-data.json', 'utf8'));

// Common moves by primary type
const TYPE_DEFAULT_MOVES = {
  Normal: [
    { name: 'Placaje', type: 'Normal', power: 40, accuracy: 1.0 },
    { name: 'Ataque Rápido', type: 'Normal', power: 40, accuracy: 1.0, priority: 1 },
    { name: 'Golpe Cabeza', type: 'Normal', power: 70, accuracy: 1.0 },
  ],
  Fuego: [
    { name: 'Ascuas', type: 'Fuego', power: 40, accuracy: 1.0 },
    { name: 'Rueda Fuego', type: 'Fuego', power: 60, accuracy: 1.0 },
    { name: 'Lanzallamas', type: 'Fuego', power: 90, accuracy: 1.0 },
  ],
  Agua: [
    { name: 'Pistola Agua', type: 'Agua', power: 40, accuracy: 1.0 },
    { name: 'Rayo Burbuja', type: 'Agua', power: 65, accuracy: 1.0 },
    { name: 'Hidrobomba', type: 'Agua', power: 110, accuracy: 0.8 },
  ],
  Planta: [
    { name: 'Absorber', type: 'Planta', power: 40, accuracy: 1.0, drain: 0.5 },
    { name: 'Hoja Afilada', type: 'Planta', power: 55, accuracy: 0.95 },
    { name: 'Rayo Solar', type: 'Planta', power: 120, accuracy: 1.0 },
  ],
  Eléctrico: [
    { name: 'Impactrueno', type: 'Eléctrico', power: 40, accuracy: 1.0 },
    { name: 'Chispa', type: 'Eléctrico', power: 60, accuracy: 1.0 },
    { name: 'Rayo', type: 'Eléctrico', power: 90, accuracy: 1.0 },
  ],
  Hielo: [
    { name: 'Vaho Gélido', type: 'Hielo', power: 60, accuracy: 0.9 },
    { name: 'Rayo Hielo', type: 'Hielo', power: 90, accuracy: 1.0 },
    { name: 'Ventisca', type: 'Hielo', power: 110, accuracy: 0.7 },
  ],
  Lucha: [
    { name: 'Golpe Kárate', type: 'Lucha', power: 50, accuracy: 1.0 },
    { name: 'Demolición', type: 'Lucha', power: 75, accuracy: 1.0 },
    { name: 'A bocajarro', type: 'Lucha', power: 120, accuracy: 1.0 },
  ],
  Veneno: [
    { name: 'Ácido', type: 'Veneno', power: 40, accuracy: 1.0 },
    { name: 'Picotazo Veneno', type: 'Veneno', power: 50, accuracy: 1.0 },
    { name: 'Bomba Lodo', type: 'Veneno', power: 90, accuracy: 1.0 },
  ],
  Tierra: [
    { name: 'Bofetón Lodo', type: 'Tierra', power: 30, accuracy: 1.0 },
    { name: 'Disparo Lodo', type: 'Tierra', power: 55, accuracy: 0.95 },
    { name: 'Terremoto', type: 'Tierra', power: 100, accuracy: 1.0 },
  ],
  Volador: [
    { name: 'Tornado', type: 'Volador', power: 40, accuracy: 1.0 },
    { name: 'Aire Afilado', type: 'Volador', power: 60, accuracy: 0.95 },
    { name: 'Pájaro Osado', type: 'Volador', power: 120, accuracy: 1.0 },
  ],
  Psíquico: [
    { name: 'Confusión', type: 'Psíquico', power: 50, accuracy: 1.0 },
    { name: 'Psicorrayo', type: 'Psíquico', power: 65, accuracy: 1.0 },
    { name: 'Psíquico', type: 'Psíquico', power: 90, accuracy: 1.0 },
  ],
  Bicho: [
    { name: 'Picadura', type: 'Bicho', power: 60, accuracy: 1.0 },
    { name: 'Doble Ataque', type: 'Bicho', power: 40, accuracy: 1.0 },
    { name: 'Tijera X', type: 'Bicho', power: 80, accuracy: 1.0 },
  ],
  Roca: [
    { name: 'Lanzarrocas', type: 'Roca', power: 50, accuracy: 0.9 },
    { name: 'Poder Pasado', type: 'Roca', power: 60, accuracy: 1.0 },
    { name: 'Roca Afilada', type: 'Roca', power: 100, accuracy: 0.8 },
  ],
  Fantasma: [
    { name: 'Lengüetazo', type: 'Fantasma', power: 30, accuracy: 1.0 },
    { name: 'Tinieblas', type: 'Fantasma', power: 50, accuracy: 1.0 },
    { name: 'Bola Sombra', type: 'Fantasma', power: 80, accuracy: 1.0 },
  ],
  Dragón: [
    { name: 'Ciclón', type: 'Dragón', power: 40, accuracy: 1.0 },
    { name: 'Garra Dragón', type: 'Dragón', power: 80, accuracy: 1.0 },
    { name: 'Cometa Draco', type: 'Dragón', power: 130, accuracy: 0.9 },
  ],
  Acero: [
    { name: 'Garra Metal', type: 'Acero', power: 50, accuracy: 0.95 },
    { name: 'Bomba Imán', type: 'Acero', power: 60, accuracy: 1.0 },
    { name: 'Cabeza de Hierro', type: 'Acero', power: 80, accuracy: 1.0 },
  ],
  Hada: [
    { name: 'Viento Feérico', type: 'Hada', power: 40, accuracy: 1.0 },
    { name: 'Beso Drenaje', type: 'Hada', power: 50, accuracy: 1.0, drain: 0.5 },
    { name: 'Brillo Mágico', type: 'Hada', power: 80, accuracy: 1.0 },
  ],
  Siniestro: [
    { name: 'Mordisco', type: 'Siniestro', power: 60, accuracy: 1.0 },
    { name: 'Finta', type: 'Siniestro', power: 60, accuracy: 1.0 },
    { name: 'Triturar', type: 'Siniestro', power: 80, accuracy: 1.0 },
  ],
};

const baseStats = {};
const speciesMoves = {};

for (const s of dexList) {
  const pType = s.type[0];
  const sType = s.type[1] || pType;

  // Approximate authentic stats
  const isLegend = s.rarity === 'legendario';
  const isRare = s.rarity === 'raro';
  const isUncommon = s.rarity === 'poco común';

  const baseHp = isLegend ? 90 : isRare ? 75 : isUncommon ? 55 : 42;
  const baseAtk = isLegend ? 110 : isRare ? 85 : isUncommon ? 60 : 48;
  const baseDef = isLegend ? 90 : isRare ? 75 : isUncommon ? 50 : 42;
  const baseSpd = isLegend ? 100 : isRare ? 80 : isUncommon ? 60 : 45;

  baseStats[s.id] = { hp: baseHp, atk: baseAtk, def: baseDef, spd: baseSpd };

  const m1 = TYPE_DEFAULT_MOVES[pType][0];
  const m2 = (TYPE_DEFAULT_MOVES[sType] || TYPE_DEFAULT_MOVES.Normal)[1];
  const m3 = TYPE_DEFAULT_MOVES[pType][2] || TYPE_DEFAULT_MOVES.Normal[2];

  speciesMoves[s.id] = [m1, m2, m3];
}

let combatSrc = fs.readFileSync('C:/Users/Javier/Desktop/BlckMkt/src/combat.js', 'utf8');

// Replace SPECIES_BASE_STATS and SPECIES_MOVES
const statsBlock = `export const SPECIES_BASE_STATS = Object.freeze(${JSON.stringify(baseStats, null, 2)});\n\nexport const SPECIES_MOVES = Object.freeze(${JSON.stringify(speciesMoves, null, 2)});`;

combatSrc = combatSrc.replace(
  /export const SPECIES_BASE_STATS[\s\S]*?export const SPECIES_MOVES[\s\S]*?\n\);/,
  statsBlock
);

fs.writeFileSync('C:/Users/Javier/Desktop/BlckMkt/src/combat.js', combatSrc, 'utf8');
console.log('src/combat.js updated with base stats and moves for all 74 species.');
