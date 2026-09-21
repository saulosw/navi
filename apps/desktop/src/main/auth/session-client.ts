import type { LoginInput, Member, Result, SessionView } from '@navi/contracts';
import { isLoginInput, isMember, isRecord } from '@navi/contracts/validation';

export interface TokenStore {
  available(): Promise<boolean>;
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

export function validateEndpoint(value: string, packaged: boolean) {
  const url = new URL(value);
  const local = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && !packaged))
  )
    throw new Error('Invalid API endpoint');
  return url.origin;
}

function expiryOf(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super('API request failed');
    this.status = status;
  }
}

function failure(error: unknown): Result<never> {
  if (error instanceof ApiError && error.status === 401)
    return {
      ok: false,
      code: 'unauthorized',
      message: 'Invalid credentials or expired session. Sign in again.',
    };
  if (error instanceof ApiError && error.status === 429)
    return { ok: false, code: 'rate-limit', message: 'Too many attempts. Try again later.' };

  return {
    ok: false,
    code: 'unavailable',
    message: 'Cannot reach Navi. Check your connection and try again.',
  };
}

export function createSessionClient(
  endpoint: string,
  store: TokenStore,
  fetcher: typeof fetch = fetch,
) {
  let token: string | null = null;
  let generation = 0;

  async function request(
    path: string,
    method = 'GET',
    body?: LoginInput,
    credential = token,
  ): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (credential) headers.Authorization = `Bearer ${credential}`;
    if (body) headers['Content-Type'] = 'application/json';

    const response = await fetcher(`${endpoint}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    if (!response.ok) throw new ApiError(response.status);
    if (response.status === 204) return null;
    return response.json() as Promise<unknown>;
  }

  async function clear() {
    token = null;
    await store.clear().catch(() => undefined);
  }

  const operations = {
    async login(input: LoginInput): Promise<Result<SessionView>> {
      if (!isLoginInput(input))
        return { ok: false, code: 'invalid', message: 'Enter a username and password.' };
      const attempt = ++generation;
      try {
        const available = await store.available();
        const remember = input.remember && available;
        const response = await request('/auth/login', 'POST', { ...input, remember }, null);
        const expiresAt = isRecord(response) ? expiryOf(response.expiresAt) : null;
        if (
          !isRecord(response) ||
          !isMember(response.user) ||
          typeof response.token !== 'string' ||
          !/^[A-Za-z0-9_-]{43}$/.test(response.token) ||
          !expiresAt
        )
          throw new Error('Invalid response');
        if (attempt !== generation) throw new Error('Cancelled login');
        await clear();
        token = response.token;
        let warning: string | undefined;
        if (remember) {
          try {
            await store.write(token);
          } catch {
            warning = 'Signed in for this session only. Secure storage is unavailable.';
          }
        }

        return {
          ok: true,
          value: {
            user: response.user,
            expiresAt,
            persistenceAvailable: available,
            ...(warning ? { warning } : {}),
          },
        };
      } catch (error) {
        return failure(error);
      }
    },
    async restoreSession(): Promise<Result<SessionView>> {
      try {
        const persistenceAvailable = await store.available();
        if (token === null && persistenceAvailable) {
          try {
            token = await store.read();
          } catch {
            await clear();

            return {
              ok: false,
              code: 'unauthorized',
              message: 'Your saved session could not be read. Sign in again.',
            };
          }
        }
        if (!token)
          return { ok: true, value: { user: null, expiresAt: null, persistenceAvailable } };
        try {
          const response = await request('/auth/session');
          const expiresAt = isRecord(response) ? expiryOf(response.expiresAt) : null;
          if (!isRecord(response) || !isMember(response.user) || !expiresAt)
            throw new Error('Invalid response');
          return { ok: true, value: { user: response.user, expiresAt, persistenceAvailable } };
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await clear();
            return { ok: true, value: { user: null, expiresAt: null, persistenceAvailable } };
          }
          throw error;
        }
      } catch (error) {
        return failure(error);
      }
    },
    async listMembers(): Promise<Result<Member[]>> {
      if (!token)
        return {
          ok: false,
          code: 'unauthorized',
          message: 'Invalid credentials or expired session. Sign in again.',
        };
      try {
        const response = await request('/members');
        if (!Array.isArray(response) || !response.every(isMember))
          throw new Error('Invalid response');
        return { ok: true, value: response };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await clear();
        return failure(error);
      }
    },
    async logout(): Promise<Result<{ warning?: string }>> {
      generation++;
      const previous = token;
      token = null;
      let warning: string | undefined;
      try {
        await store.clear();
      } catch {
        warning = 'Local session storage could not be removed.';
      }
      try {
        if (previous) await request('/auth/logout', 'POST', undefined, previous);
      } catch {
        warning = 'Signed out here. Server session revocation could not be confirmed.';
      }
      return { ok: true, value: warning ? { warning } : {} };
    },
  };
  let queue = Promise.resolve();

  function run<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(operation);
    queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return {
    login: (input: LoginInput) => run(() => operations.login(input)),
    restoreSession: () => run(() => operations.restoreSession()),
    listMembers: () => run(() => operations.listMembers()),
    logout: () => run(() => operations.logout()),
  };
}

export type SessionClient = ReturnType<typeof createSessionClient>;
