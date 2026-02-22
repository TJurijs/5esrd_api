import type { FastifyPluginAsync } from 'fastify';
import { searchSpells, getSpell } from '../services/spells.js';

const spellsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/spells', {
    schema: {
      tags: ['Spells'],
      description: 'Search and filter spells.',
      querystring: {
        type: 'object',
        properties: {
          name:   { type: 'string', description: 'Case-insensitive substring match' },
          level:  { type: 'integer', minimum: 0, maximum: 9 },
          school: { type: 'string', description: 'e.g. Evocation, Necromancy' },
          class:  { type: 'string', description: 'e.g. Wizard, Cleric' },
          source: { type: 'string', description: 'e.g. XPHB' },
          page:   { type: 'integer', default: 1 },
          limit:  { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { name, level, school, class: cls, source, page, limit } = req.query as any;
    return searchSpells(
      { name, level: level !== undefined ? Number(level) : undefined, school, class: cls, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/spells/:name', {
    schema: {
      tags: ['Spells'],
      description: 'Get full details of a spell by name.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const spell = getSpell(name);
    if (!spell) return reply.status(404).send({ error: `Spell '${name}' not found` });
    return spell;
  });
};

export default spellsPlugin;
