import type { FastifyPluginAsync } from 'fastify';
import { listLanguages, getLanguage } from '../services/languages.js';

const languagesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/languages', async () => {
    const all = listLanguages();
    return { total: all.length, page: 1, limit: all.length, data: all };
  });

  fastify.get('/languages/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const lang = getLanguage(name);
    if (!lang) return reply.status(404).send({ error: `Language '${name}' not found` });
    return lang;
  });
};

export default languagesPlugin;
