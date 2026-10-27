import fs from 'node:fs';

const main = fs.readFileSync('C:/Users/Javier/Desktop/BlckMkt/src/main.js', 'utf8');
const lines = main.split('\n');
const selectors = new Set();
lines.forEach(l => {
  const m = l.match(/\$\((['"])(.*?)\1\)/g);
  if (m) m.forEach(s => selectors.add(s));
});
console.log(Array.from(selectors).sort());
