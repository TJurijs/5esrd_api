import type { FastifyPluginAsync } from 'fastify';
import { getClasses, getClass, getSubclasses } from '../services/classes.js';

const classesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/classes', {
    schema: {
      tags: ['Classes'],
      description: 'List all classes.',
      querystring: {
        type: 'object',
        properties: {
          page:  { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20, maximum: 100 },
        },
      },
    },
  }, async (req) => {
    const { page, limit } = req.query as any;
    return getClasses({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/classes/:name', {
    schema: {
      tags: ['Classes'],
      description: 'Get class features, hit die, proficiencies, and spell slot progression.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const cls = getClass(name);
    if (!cls) return reply.status(404).send({ error: `Class '${name}' not found` });
    return cls;
  });

  fastify.get('/classes/:name/subclasses', {
    schema: {
      tags: ['Classes'],
      description: 'Get all subclasses for a given class.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req) => {
    const { name } = req.params as { name: string };
    return { data: getSubclasses(name) };
  });
};

export default classesPlugin;
