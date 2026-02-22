import type { FastifyPluginAsync } from 'fastify';
import { listConditions, getCondition } from '../services/conditions.js';

const conditionsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/conditions', async () => {
    const all = listConditions();
    return { total: all.length, page: 1, limit: all.length, data: all };
  });

  fastify.get('/conditions/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const condition = getCondition(name);
    if (!condition) return reply.status(404).send({ error: `Condition '${name}' not found` });
    return condition;
  });
};

export default conditionsPlugin;
