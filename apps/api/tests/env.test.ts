import { expect, it } from 'vitest';
import { parseEnv } from '../src/infrastructure/config/env.ts';
const DATABASE_URL = 'postgresql://navi:local@localhost:5432/navi';
it('uses safe local defaults', () => {
  expect(parseEnv({ DATABASE_URL })).toMatchObject({ HOST: '127.0.0.1', PORT: 3001 });
});
it.each([
  {},
  { DATABASE_URL, PORT: '0' },
  { DATABASE_URL, PORT: '65536' },
  { DATABASE_URL: 'https://example.com' },
  { DATABASE_URL, NODE_ENV: 'unknown' },
])('rejects invalid configuration', (env) => {
  expect(() => parseEnv(env)).toThrow();
});
