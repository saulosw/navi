import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Auth } from '../../application/auth.ts';
import { AuthError } from '../../domain/users/auth-error.ts';
import type { AuthErrorKind } from '../../domain/users/auth-error.ts';

const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(32),
    password: z.string().min(1).max(128),
    remember: z.boolean(),
  })
  .strict();

const STATUS_BY_KIND: Record<AuthErrorKind, number> = {
  invalid: 400,
  unauthorized: 401,
  'rate-limited': 429,
  'not-found': 404,
};

const BEARER_PATTERN = /^Bearer [A-Za-z0-9_-]{43}$/;

function bearer(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header || !BEARER_PATTERN.test(header))
    throw new AuthError('Session expired. Sign in again.', 'unauthorized');
  return header.slice('Bearer '.length);
}

function statusOf(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  )
    return error.statusCode;
  return 500;
}

export function registerAuthRoutes(app: FastifyInstance, auth: Auth) {
  void app.register((scope) => {
    scope.setErrorHandler((error, request, reply) => {
      if (error instanceof AuthError)
        return reply.code(STATUS_BY_KIND[error.kind]).send({ message: error.message });
      const status = statusOf(error);
      if (status >= 500) request.log.error({ err: error }, 'Unhandled failure on an auth route');

      return reply
        .code(status)
        .send({ message: status >= 500 ? 'Service unavailable. Try again.' : 'Invalid request' });
    });
    scope.addHook('onSend', async (_request, reply) => {
      reply.header('Cache-Control', 'no-store');
    });
    scope.post('/auth/login', async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) throw new AuthError('Invalid request');
      const { username, password, remember } = parsed.data;
      return reply.send(await auth.login(username, password, remember, request.ip));
    });
    scope.get('/auth/session', async (request) => auth.session(bearer(request)));
    scope.get('/members', async (request) => auth.members(bearer(request)));
    scope.post('/auth/logout', async (request, reply) => {
      await auth.logout(bearer(request));
      return reply.code(204).send();
    });
    return Promise.resolve();
  });
}
