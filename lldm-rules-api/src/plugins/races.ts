import type { FastifyPluginAsync } from 'fastify';
import { searchRaces, getRace } from '../services/races.js';

const racesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/races', {
    schema: {
      tags: ['Races'],
      description: 'Search races and species.',
      querystring: {
        type: 'object',
        properties: {
          name:   { type: 'string', description: 'Case-insensitive substring match' },
          source: { type: 'string', description: 'e.g. XPHB' },
          page:   { type: 'integer', default: 1 },
          limit:  { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { name, source, page, limit } = req.query as any;
    return searchRaces(
      { name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/races/:name', {
    schema: {
      tags: ['Races'],
      description: 'Get racial traits and ability score improvements.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const race = getRace(name);
    if (!race) return reply.status(404).send({ error: `Race '${name}' not found` });
    return race;
  });
};

export default racesPlugin;
