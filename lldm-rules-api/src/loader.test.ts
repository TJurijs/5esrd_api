import { describe, it, expect, beforeAll } from 'vitest';
import { loadData } from './loader.js';
import { store } from './store.js';

describe('loadData', () => {
  beforeAll(async () => {
    process.env.DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';
    await loadData(process.env.DATA_PATH);
  });

  it('loads spells into the store', () => {
    expect(store.spells.size).toBeGreaterThan(0);
  });

  it('all spells have srd52: true', () => {
    for (const spell of store.spells.values()) {
      expect(spell.srd52).toBe(true);
    }
  });

  it('spell schools are expanded (no raw codes)', () => {
    const schools = new Set([...store.spells.values()].map(s => s.school));
    // Should contain expanded names
    expect([...schools].some(s => ['Evocation','Necromancy','Abjuration','Conjuration','Divination','Enchantment','Illusion','Transmutation'].includes(s))).toBe(true);
    // Should NOT contain raw codes
    expect(schools.has('V')).toBe(false);
    expect(schools.has('N')).toBe(false);
  });

  it('loads monsters', () => {
    expect(store.monsters.size).toBeGreaterThan(0);
  });

  it('monster sizes are expanded (no raw codes)', () => {
    const sizes = [...store.monsters.values()].flatMap(m => m.size);
    expect(sizes.some(s => ['Tiny','Small','Medium','Large','Huge','Gargantuan'].includes(s))).toBe(true);
    expect(sizes.some(s => ['T','S','M','L','H','G'].includes(s))).toBe(false);
  });

  it('loads items', () => {
    expect(store.items.size).toBeGreaterThan(0);
  });

  it('loads conditions', () => {
    expect(store.conditions.size).toBeGreaterThan(0);
  });

  it('spells are keyed by lowercase name', () => {
    // Find any spell and verify it's accessible by lowercase key
    const firstSpell = [...store.spells.values()][0];
    expect(store.spells.has(firstSpell.name.toLowerCase().trim())).toBe(true);
  });
});
