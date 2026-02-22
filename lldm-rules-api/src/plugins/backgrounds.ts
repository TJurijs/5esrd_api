import type { FastifyPluginAsync } from 'fastify';
import { searchBackgrounds, getBackground } from '../services/backgrounds.js';

const backgroundsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/backgrounds', {
    schema: {
      tags: ['Backgrounds'],
      description: 'Search backgrounds.',
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
    return searchBackgrounds(
      { name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/backgrounds/:name', {
    schema: {
      tags: ['Backgrounds'],
      description: 'Get background features, proficiencies, and starting equipment.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const bg = getBackground(name);
    if (!bg) return reply.status(404).send({ error: `Background '${name}' not found` });
    return bg;
  });
};

export default backgroundsPlugin;
