import type { FastifyPluginAsync } from 'fastify';
import { getClasses, getClass, getSubclasses } from '../services/classes.js';

const classesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/classes', async (req) => {
    const { page, limit } = req.query as any;
    return getClasses({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/classes/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const cls = getClass(name);
    if (!cls) return reply.status(404).send({ error: `Class '${name}' not found` });
    return cls;
  });

  fastify.get('/classes/:name/subclasses', async (req) => {
    const { name } = req.params as { name: string };
    return { data: getSubclasses(name) };
  });
};

export default classesPlugin;
