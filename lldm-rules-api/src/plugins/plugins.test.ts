import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { store, normalizeKey } from '../store.js';
import type { Spell, Condition } from '../types/index.js';
import spellsPlugin from './spells.js';
import monstersPlugin from './monsters.js';
import itemsPlugin from './items.js';
import classesPlugin from './classes.js';
import conditionsPlugin from './conditions.js';
import skillsPlugin from './skills.js';

let app: FastifyInstance;

beforeAll(async () => {
  // Seed store
  const spell: Spell = {
    name: 'Plugin Test Fireball', source: 'XPHB', level: 3, school: 'Evocation',
    castingTime: '1 Action', range: '150 feet',
    components: { verbal: true, somatic: true, material: 'bat guano' },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Explodes in a fiery ball.', classes: ['Wizard'],
    damageTypes: ['Fire'], savingThrow: ['Dexterity'],
    areaTags: ['Sphere'], miscTags: [], srd52: true,
  };
  store.spells.set(normalizeKey('Plugin Test Fireball'), spell);

  const condition: Condition = {
    name: 'Plugin Test Blinded', source: 'XPHB',
    description: 'Cannot see.',
    effects: ["Can't see", 'Attacks against have advantage'],
    srd52: true,
  };
  store.conditions.set(normalizeKey('Plugin Test Blinded'), condition);

  app = Fastify();
  const prefix = '/api/v1';
  await app.register(spellsPlugin, { prefix });
  await app.register(monstersPlugin, { prefix });
  await app.register(itemsPlugin, { prefix });
  await app.register(classesPlugin, { prefix });
  await app.register(conditionsPlugin, { prefix });
  await app.register(skillsPlugin, { prefix });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/v1/spells', () => {
  it('returns 200 with paginated shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('filters by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells?name=plugin+test+fire' });
    const body = JSON.parse(res.body);
    expect(body.data.some((s: Spell) => s.name === 'Plugin Test Fireball')).toBe(true);
  });

  it('filters by level', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells?level=3&name=plugin' });
    const body = JSON.parse(res.body);
    expect(body.data.every((s: Spell) => s.level === 3)).toBe(true);
  });
});

describe('GET /api/v1/spells/:name', () => {
  it('returns spell by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells/Plugin%20Test%20Fireball' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe('Plugin Test Fireball');
  });

  it('returns 404 for unknown', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells/Nonexistent%20XYZ%20Spell' });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toHaveProperty('error');
  });
});

describe('GET /api/v1/monsters', () => {
  it('returns paginated shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/monsters' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('data');
  });
});

describe('GET /api/v1/items', () => {
  it('returns paginated shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/items' });
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/v1/classes', () => {
  it('returns paginated shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/classes' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty('data');
  });
});

describe('GET /api/v1/conditions', () => {
  it('returns all conditions with shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/conditions' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('data');
    expect(body.data.some((c: Condition) => c.name === 'Plugin Test Blinded')).toBe(true);
  });
});

describe('GET /api/v1/conditions/:name', () => {
  it('returns condition by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/conditions/Plugin%20Test%20Blinded' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for unknown', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/conditions/Nonexistent%20XYZ' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/skills', () => {
  it('returns skills list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/skills' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty('data');
  });
});
