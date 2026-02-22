import type { FastifyPluginAsync } from 'fastify';
import { searchRaces, getRace } from '../services/races.js';

const racesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/races', async (req) => {
    const { name, source, page, limit } = req.query as any;
    return searchRaces(
      { name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/races/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const race = getRace(name);
    if (!race) return reply.status(404).send({ error: `Race '${name}' not found` });
    return race;
  });
};

export default racesPlugin;
