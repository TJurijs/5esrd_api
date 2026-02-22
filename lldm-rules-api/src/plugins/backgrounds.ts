import type { FastifyPluginAsync } from 'fastify';
import { searchBackgrounds, getBackground } from '../services/backgrounds.js';

const backgroundsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/backgrounds', async (req) => {
    const { name, source, page, limit } = req.query as any;
    return searchBackgrounds(
      { name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/backgrounds/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const bg = getBackground(name);
    if (!bg) return reply.status(404).send({ error: `Background '${name}' not found` });
    return bg;
  });
};

export default backgroundsPlugin;
