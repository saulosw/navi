import { parseEnv } from '../infrastructure/config/env.ts';
import { createPool } from '../infrastructure/database/pool.ts';
import { postgresHealthProbe } from '../infrastructure/database/postgres-health-probe.ts';
import { buildApp } from './build-app.ts';

const env = parseEnv(process.env);
const pool = createPool(env.DATABASE_URL);
const app = buildApp(postgresHealthProbe(pool), env.LOG_LEVEL);
pool.on('error', () => app.log.error('Unexpected idle database connection error'));
app.addHook('onClose', async () => {
  await pool.end();
});

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await app.close();
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown();
  });
}

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch {
  app.log.error('API failed to start; check the host and port configuration');
  await shutdown();
  process.exitCode = 1;
}
