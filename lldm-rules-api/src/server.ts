import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadData } from './loader.js';
import spellsPlugin from './plugins/spells.js';
import monstersPlugin from './plugins/monsters.js';
import itemsPlugin from './plugins/items.js';
import classesPlugin from './plugins/classes.js';
import featsPlugin from './plugins/feats.js';
import backgroundsPlugin from './plugins/backgrounds.js';
import racesPlugin from './plugins/races.js';
import conditionsPlugin from './plugins/conditions.js';
import skillsPlugin from './plugins/skills.js';
import languagesPlugin from './plugins/languages.js';

const PORT = Number(process.env.PORT ?? 3000);
const DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';

async function start(): Promise<void> {
  await loadData(DATA_PATH);

  const app = Fastify({ logger: true });

  await app.register(cors);

  const prefix = '/api/v1';
  await app.register(spellsPlugin, { prefix });
  await app.register(monstersPlugin, { prefix });
  await app.register(itemsPlugin, { prefix });
  await app.register(classesPlugin, { prefix });
  await app.register(featsPlugin, { prefix });
  await app.register(backgroundsPlugin, { prefix });
  await app.register(racesPlugin, { prefix });
  await app.register(conditionsPlugin, { prefix });
  await app.register(skillsPlugin, { prefix });
  await app.register(languagesPlugin, { prefix });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
