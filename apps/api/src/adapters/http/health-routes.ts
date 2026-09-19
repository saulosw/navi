import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@navi/contracts';

export function registerHealthRoutes(app: FastifyInstance, isReady: () => Promise<boolean>): void {
  app.get('/health', (): Promise<HealthResponse> => Promise.resolve({ status: 'ok' }));
  app.get('/ready', async (_request, reply): Promise<HealthResponse> => {
    const ready = await isReady();
    reply.code(ready ? 200 : 503);
    return { status: ready ? 'ok' : 'unavailable' };
  });
}
