import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SPECIES } from '../src/species.js';
import { SPRITE_REGISTRY, getSpeciesSpriteUrl, getSpriteDefinition } from '../src/sprites.js';

const root = new URL('../', import.meta.url);

test('sprite registry has local normal and shiny art for every catalog species', async () => {
  assert.deepEqual(Object.keys(SPRITE_REGISTRY).sort(), Object.keys(SPECIES).sort());
  for (const id of Object.keys(SPECIES)) {
    const definition = getSpriteDefinition(id);
    assert.ok(definition);
    for (const url of [definition.normal, definition.shiny, definition.portrait]) {
      assert.equal(new URL(url).protocol, 'file:');
      await access(fileURLToPath(new URL(url, import.meta.url)));
    }
  }
});

test('unknown species resolves to the local fallback and registry URLs remain stable', () => {
  assert.ok(getSpeciesSpriteUrl('not-a-species').endsWith('/assets/pokemon/fallback.svg'));
  assert.equal(getSpeciesSpriteUrl('ditto'), SPRITE_REGISTRY.ditto.normal);
  assert.equal(getSpeciesSpriteUrl('ditto', { shiny: true }), SPRITE_REGISTRY.ditto.shiny);
});
