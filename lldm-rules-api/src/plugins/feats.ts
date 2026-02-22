import type { FastifyPluginAsync } from 'fastify';
import { searchFeats, getFeat } from '../services/feats.js';

const featsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/feats', async (req) => {
    const { name, category, source, page, limit } = req.query as any;
    return searchFeats(
      { name, category, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/feats/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const feat = getFeat(name);
    if (!feat) return reply.status(404).send({ error: `Feat '${name}' not found` });
    return feat;
  });
};

export default featsPlugin;
