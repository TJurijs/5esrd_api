import type { FastifyPluginAsync } from 'fastify';
import { listSkills, getSkill } from '../services/skills.js';

const skillsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/skills', {
    schema: {
      tags: ['Skills'],
      description: 'List all skills with their governing ability scores.',
    },
  }, async () => {
    const all = listSkills();
    return { total: all.length, page: 1, limit: all.length, data: all };
  });

  fastify.get('/skills/:name', {
    schema: {
      tags: ['Skills'],
      description: 'Look up which ability score a skill uses and what it covers.',
      params: { type: 'object', properties: { name: { type: 'string' } } },
    },
  }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const skill = getSkill(name);
    if (!skill) return reply.status(404).send({ error: `Skill '${name}' not found` });
    return skill;
  });
};

export default skillsPlugin;
