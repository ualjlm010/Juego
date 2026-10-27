import fs from 'node:fs';

const list = JSON.parse(fs.readFileSync('C:/Users/Javier/Desktop/BlckMkt/src/species-data.json', 'utf8'));

let out = 'const SPECIES_DEFINITIONS = {\n';
for (const s of list) {
  out += `  ${s.id}: { dex: ${s.dex}, name: '${s.name}', type: ${JSON.stringify(s.type)}, rarity: '${s.rarity}', difficulty: '${s.difficulty}', color: '${s.color}', shiny: '${s.shiny}', mark: '${s.mark}', ability: ${JSON.stringify(s.ability)}, description: '${s.desc.replace(/'/g, "\\'")}' },\n`;
}
out += '};\n\n';

out += 'export const SPECIES = Object.freeze(Object.fromEntries(\n';
out += '  Object.entries(SPECIES_DEFINITIONS).map(([id, definition]) => [id, Object.freeze({\n';
out += '    ...definition,\n';
out += '    id,\n';
out += '    type: Object.freeze([...definition.type]),\n';
out += '    ability: Object.freeze([...definition.ability]),\n';
out += '  })]),\n';
out += '));\n\n';

out += "export const NATURES = Object.freeze(['Audaz', 'Alegre', 'Serena', 'Firme', 'Tímida', 'Modesta', 'Activa', 'Osada', 'Ingenua', 'Mansa', 'Rara', 'Dócil']);\n";
out += 'export const TYPE_COLORS = Object.freeze({\n';
out += "  Normal: '#8e8c85', Fuego: '#cb7955', Agua: '#5991bc', Planta: '#65a277', Eléctrico: '#c8a84e',\n";
out += "  Hielo: '#71aeb2', Lucha: '#bd675e', Veneno: '#9c70ad', Tierra: '#b08b59', Volador: '#8096bf',\n";
out += "  Psíquico: '#c36d8b', Bicho: '#93a34e', Roca: '#a18c61', Fantasma: '#796b9b', Dragón: '#7185bc',\n";
out += "  Acero: '#82949e', Hada: '#c987a8', Siniestro: '#524449'\n";
out += '});\n\n';

out += 'export const POKEBALLS = Object.freeze({\n';
out += "  'Poké Ball': Object.freeze({ id: 'Poké Ball', name: 'Poké Ball', multiplier: 1.0 }),\n";
out += "  'Super Ball': Object.freeze({ id: 'Super Ball', name: 'Super Ball', multiplier: 1.5 }),\n";
out += "  'Ultra Ball': Object.freeze({ id: 'Ultra Ball', name: 'Ultra Ball', multiplier: 2.0 }),\n";
out += '});\n\n';

out += "export const IV_KEYS = Object.freeze(['PS', 'Atq', 'Def', 'Vel']);\n";
out += 'export const IV_MIN = 0;\n';
out += 'export const IV_MAX = 31;\n';
out += 'export const LEVEL_MIN = 1;\n';
out += 'export const LEVEL_MAX = 100;\n';

fs.writeFileSync('C:/Users/Javier/Desktop/BlckMkt/src/species.js', out, 'utf8');
console.log('src/species.js updated successfully with 74 species.');
