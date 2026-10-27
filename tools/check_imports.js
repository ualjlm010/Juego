import fs from 'node:fs';

const main = fs.readFileSync('C:/Users/Javier/Desktop/BlckMkt/src/main.js', 'utf8');
const lines = main.split('\n');
const imports = [];
lines.forEach(l => {
  const m = l.match(/from\s+['"](.*?)['"]/);
  if (m) imports.push(m[1]);
});

for (const imp of imports) {
  try {
    const full = 'file:///C:/Users/Javier/Desktop/BlckMkt/src/' + imp.replace('./', '');
    await import(full);
    console.log('OK:', imp);
  } catch (e) {
    console.error('ERROR in', imp, ':', e);
  }
}
