import 'dotenv/config';
import { loadData } from './loader.js';
import { startMcpServer } from './mcp/index.js';

const DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';

loadData(DATA_PATH)
  .then(startMcpServer)
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
