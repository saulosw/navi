import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

interface Cost {
  N: number;
  r: number;
  p: number;
}

const CURRENT_COST: Cost = { N: 131072, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const TOKEN_BYTES = 32;
const MAX_MEMORY = 256 * 1024 * 1024;
const HASH_PATTERN = /^scrypt\$N=(\d+),r=(\d+),p=(\d+)\$([\w-]+)\$([\w-]+)$/;

function derive(password: string, salt: Buffer, cost: Cost): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_BYTES, { ...cost, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

function usable(cost: Cost): boolean {
  const powerOfTwo = cost.N > 1 && (cost.N & (cost.N - 1)) === 0;
  return (
    powerOfTwo && cost.r >= 1 && cost.p >= 1 && cost.p <= 16 && 128 * cost.N * cost.r <= MAX_MEMORY
  );
}

function parse(hash: string) {
  const match = HASH_PATTERN.exec(hash);
  if (!match) return null;

  const [, n, r, p, salt, key] = match;
  const cost: Cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!usable(cost)) return null;

  const stored = Buffer.from(key!, 'base64url');
  return stored.length === KEY_BYTES
    ? { cost, salt: Buffer.from(salt!, 'base64url'), key: stored }
    : null;
}

export const passwordHasher = {
  async hash(password: string) {
    const salt = randomBytes(SALT_BYTES);
    const key = await derive(password, salt, CURRENT_COST);
    const { N, r, p } = CURRENT_COST;
    return `scrypt$N=${N},r=${r},p=${p}$${salt.toString('base64url')}$${key.toString('base64url')}`;
  },

  async verify(password: string, hash: string) {
    const stored = parse(hash);
    if (!stored) return false;

    const actual = await derive(password, stored.salt, stored.cost);
    return timingSafeEqual(actual, stored.key);
  },
};

export const tokenService = {
  create: () => randomBytes(TOKEN_BYTES).toString('base64url'),
  digest: (token: string) => createHash('sha256').update(token).digest('hex'),
};
