import type { FastifyPluginAsync } from 'fastify';
import { searchSpells, getSpell } from '../services/spells.js';

const spellsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/spells', async (req) => {
    const { name, level, school, class: cls, source, page, limit } = req.query as any;
    return searchSpells(
      { name, level: level !== undefined ? Number(level) : undefined, school, class: cls, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/spells/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const spell = getSpell(name);
    if (!spell) return reply.status(404).send({ error: `Spell '${name}' not found` });
    return spell;
  });
};

export default spellsPlugin;
