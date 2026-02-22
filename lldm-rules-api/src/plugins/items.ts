import type { FastifyPluginAsync } from 'fastify';
import { searchItems, getItem } from '../services/items.js';

const itemsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/items', {
    schema: {
      tags: ['Items'],
      description: 'Search and filter items.',
      querystring: {
        type: 'object',
        properties: {
          name:       { type: 'string', description: 'Case-insensitive substring match' },
          type:       { type: 'string', description: 'e.g. Heavy Armor, Martial Weapon' },
          rarity:     { type: 'string', description: 'e.g. common, rare, legendary' },
          attunement: { type: 'string', enum: ['true', 'false'], description: 'Filter by attunement requirement' },
          source:     { type: 'string', description: 'e.g. XPHB, XMM' },
          page:       { type: 'integer', default: 1 },
          limit:      { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { name, type, rarity, attunement, source, page, limit } = req.query as any;
    return searchItems(
      { name, type, rarity, attunement: attunement === 'true' ? true : attunement === 'false' ? false : undefined, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/items/:name', {
    schema: {
      tags: ['Items'],
      description: 'Get full details of an item by name.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const item = getItem(name);
    if (!item) return reply.status(404).send({ error: `Item '${name}' not found` });
    return item;
  });
};

export default itemsPlugin;
