import type { FastifyPluginAsync } from 'fastify';
import { searchItems, getItem } from '../services/items.js';

const itemsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/items', async (req) => {
    const { name, type, rarity, attunement, source, page, limit } = req.query as any;
    return searchItems(
      { name, type, rarity, attunement: attunement === 'true' ? true : attunement === 'false' ? false : undefined, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/items/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const item = getItem(name);
    if (!item) return reply.status(404).send({ error: `Item '${name}' not found` });
    return item;
  });
};

export default itemsPlugin;
