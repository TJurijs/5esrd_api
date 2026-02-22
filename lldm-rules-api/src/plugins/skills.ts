import type { FastifyPluginAsync } from 'fastify';
import { listSkills, getSkill } from '../services/skills.js';

const skillsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/skills', async () => {
    const all = listSkills();
    return { total: all.length, page: 1, limit: all.length, data: all };
  });

  fastify.get('/skills/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const skill = getSkill(name);
    if (!skill) return reply.status(404).send({ error: `Skill '${name}' not found` });
    return skill;
  });
};

export default skillsPlugin;
