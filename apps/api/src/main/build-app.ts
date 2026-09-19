import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import type { HealthProbe } from '../application/ports/health-probe.ts';
import { createReadinessCheck } from '../application/check-readiness.ts';
import { registerHealthRoutes } from '../adapters/http/health-routes.ts';

export function buildApp(probe: HealthProbe, logLevel?: string) {
  const app = Fastify({
    logger: logLevel
      ? {
          level: logLevel,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        }
      : false,
    bodyLimit: 64 * 1024,
    requestTimeout: 10000,
  });
  app.register(helmet);
  registerHealthRoutes(app, createReadinessCheck(probe));
  return app;
}
