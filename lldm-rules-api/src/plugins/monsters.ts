import type { FastifyPluginAsync } from 'fastify';
import { searchMonsters, getMonster } from '../services/monsters.js';

const monstersPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/monsters', {
    schema: {
      tags: ['Monsters'],
      description: 'Search and filter monsters.',
      querystring: {
        type: 'object',
        properties: {
          name:   { type: 'string', description: 'Case-insensitive substring match' },
          cr:     { type: 'string', description: 'Challenge rating e.g. 1, 0.5, 10' },
          type:   { type: 'string', description: 'e.g. undead, dragon, humanoid' },
          size:   { type: 'string', description: 'e.g. Medium, Large, Huge' },
          source: { type: 'string', description: 'e.g. XMM' },
          page:   { type: 'integer', default: 1 },
          limit:  { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { name, cr, type, size, source, page, limit } = req.query as any;
    return searchMonsters(
      { name, cr, type, size, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/monsters/:name', {
    schema: {
      tags: ['Monsters'],
      description: 'Get full stat block for a monster by name.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const monster = getMonster(name);
    if (!monster) return reply.status(404).send({ error: `Monster '${name}' not found` });
    return monster;
  });
};

export default monstersPlugin;
