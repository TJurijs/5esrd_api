import type { FastifyPluginAsync } from 'fastify';
import { searchFeats, getFeat } from '../services/feats.js';

const featsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/feats', {
    schema: {
      tags: ['Feats'],
      description: 'Search and filter feats.',
      querystring: {
        type: 'object',
        properties: {
          name:     { type: 'string', description: 'Case-insensitive substring match' },
          category: { type: 'string', description: 'e.g. General, Origin, Epic Boon, Fighting Style' },
          source:   { type: 'string', description: 'e.g. XPHB' },
          page:     { type: 'integer', default: 1 },
          limit:    { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { name, category, source, page, limit } = req.query as any;
    return searchFeats(
      { name, category, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/feats/:name', {
    schema: {
      tags: ['Feats'],
      description: 'Get feat prerequisites and full description.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const feat = getFeat(name);
    if (!feat) return reply.status(404).send({ error: `Feat '${name}' not found` });
    return feat;
  });
};

export default featsPlugin;
