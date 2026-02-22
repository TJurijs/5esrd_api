import type { FastifyPluginAsync } from 'fastify';
import { searchMonsters, getMonster } from '../services/monsters.js';

const monstersPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/monsters', async (req) => {
    const { name, cr, type, size, source, page, limit } = req.query as any;
    return searchMonsters(
      { name, cr, type, size, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/monsters/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const monster = getMonster(name);
    if (!monster) return reply.status(404).send({ error: `Monster '${name}' not found` });
    return monster;
  });
};

export default monstersPlugin;
