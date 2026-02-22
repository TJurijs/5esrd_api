import { describe, it, expect, beforeAll } from 'vitest';
import { store, normalizeKey } from '../store.js';
import type { Spell } from '../types/index.js';
import { searchSpells, getSpell } from './spells.js';
import { searchMonsters, getMonster } from './monsters.js';
import { searchItems, getItem } from './items.js';
import { getClasses, getClass, getSubclasses } from './classes.js';
import { getCondition, listConditions } from './conditions.js';
import { listSkills, getSkill } from './skills.js';

// Seed minimal test data
beforeAll(() => {
  const spell: Spell = {
    name: 'Test Fireball', source: 'XPHB', level: 3, school: 'Evocation',
    castingTime: '1 Action', range: '150 feet',
    components: { verbal: true, somatic: true, material: 'bat guano' },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Explodes in fire.', classes: ['Wizard', 'Sorcerer'],
    damageTypes: ['Fire'], savingThrow: ['Dexterity'],
    areaTags: ['Sphere'], miscTags: [], srd52: true,
  };
  store.spells.set(normalizeKey('Test Fireball'), spell);

  const spell2: Spell = { ...spell, name: 'Test Ice Storm', level: 4, school: 'Evocation', classes: ['Druid'] };
  store.spells.set(normalizeKey('Test Ice Storm'), spell2);

  const spell3: Spell = { ...spell, name: 'Test Cure Wounds', level: 1, school: 'Abjuration', classes: ['Cleric'] };
  store.spells.set(normalizeKey('Test Cure Wounds'), spell3);
});

describe('searchSpells', () => {
  it('returns results when no filters', () => {
    const r = searchSpells({});
    expect(r.total).toBeGreaterThan(0);
    expect(Array.isArray(r.data)).toBe(true);
  });

  it('filters by name substring', () => {
    const r = searchSpells({ name: 'test fire' });
    expect(r.data.every(s => s.name.toLowerCase().includes('test fire'))).toBe(true);
  });

  it('filters by level', () => {
    const r = searchSpells({ level: 3 });
    expect(r.data.every(s => s.level === 3)).toBe(true);
    expect(r.data.some(s => s.name === 'Test Fireball')).toBe(true);
  });

  it('filters by school', () => {
    const r = searchSpells({ school: 'Abjuration' });
    expect(r.data.every(s => s.school.toLowerCase().includes('abjuration'))).toBe(true);
  });

  it('filters by class', () => {
    const r = searchSpells({ class: 'druid' });
    expect(r.data.every(s => s.classes?.some(c => c.toLowerCase().includes('druid')))).toBe(true);
  });

  it('paginates results', () => {
    const r = searchSpells({}, { page: 1, limit: 2 });
    expect(r.data.length).toBeLessThanOrEqual(2);
    expect(r.limit).toBe(2);
    expect(r.page).toBe(1);
  });

  it('returns sorted by name', () => {
    const r = searchSpells({}, { limit: 100 });
    for (let i = 1; i < r.data.length; i++) {
      expect(r.data[i].name.localeCompare(r.data[i-1].name)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getSpell', () => {
  it('finds spell by exact name', () => expect(getSpell('Test Fireball')?.name).toBe('Test Fireball'));
  it('finds spell case-insensitively', () => expect(getSpell('test fireball')?.name).toBe('Test Fireball'));
  it('returns undefined for unknown', () => expect(getSpell('Nonexistent Spell XYZ')).toBeUndefined());
});

describe('searchMonsters', () => {
  it('returns results', () => expect(searchMonsters({}).total).toBeGreaterThanOrEqual(0));
  it('has correct shape', () => {
    const r = searchMonsters({}, { limit: 1 });
    expect(r).toHaveProperty('total');
    expect(r).toHaveProperty('page');
    expect(r).toHaveProperty('limit');
    expect(r).toHaveProperty('data');
  });
});

describe('getMonster', () => {
  it('returns undefined for unknown', () => expect(getMonster('Nonexistent Monster XYZ')).toBeUndefined());
});

describe('searchItems', () => {
  it('returns results', () => expect(searchItems({}).total).toBeGreaterThanOrEqual(0));
});

describe('getClasses', () => {
  it('returns page result shape', () => {
    const r = getClasses();
    expect(r).toHaveProperty('total');
    expect(r).toHaveProperty('data');
  });
});

describe('getClass / getSubclasses', () => {
  it('returns undefined for unknown class', () => expect(getClass('Nonexistent XYZ')).toBeUndefined());
  it('returns empty array for unknown class subclasses', () => expect(getSubclasses('Nonexistent XYZ')).toEqual([]));
});

describe('listConditions / getCondition', () => {
  it('listConditions returns array', () => expect(Array.isArray(listConditions())).toBe(true));
  it('getCondition returns undefined for unknown', () => expect(getCondition('Nonexistent XYZ')).toBeUndefined());
});

describe('listSkills / getSkill', () => {
  it('listSkills returns sorted array', () => {
    const skills = listSkills();
    expect(Array.isArray(skills)).toBe(true);
    for (let i = 1; i < skills.length; i++) {
      expect(skills[i].name.localeCompare(skills[i-1].name)).toBeGreaterThanOrEqual(0);
    }
  });
  it('getSkill returns undefined for unknown', () => expect(getSkill('Nonexistent XYZ')).toBeUndefined());
});
