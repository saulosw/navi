import { mkdtemp, readFile, stat, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createTokenStore } from '../src/main/auth/token-store';

it('binds persisted tokens to the endpoint and removes malformed records', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'navi-store-'));
  const path = join(dir, 'session.enc');

  const crypto = {
    available: () => Promise.resolve(true),
    encrypt: (s: string) => Promise.resolve(Buffer.from(s).reverse()),
    decrypt: (b: Buffer) => Promise.resolve(Buffer.from(b).reverse().toString()),
  };
  try {
    const store = createTokenStore(path, 'https://example.com', crypto);
    expect(await store.read()).toBeNull();
    await store.write('a'.repeat(43));
    expect((await readFile(path)).toString()).not.toContain('https://example.com');
    expect(await store.read()).toBe('a'.repeat(43));
    expect(await createTokenStore(path, 'https://other.example', crypto).read()).toBeNull();
    await writeFile(
      path,
      await crypto.encrypt(JSON.stringify({ endpoint: 'https://example.com', token: 'bad' })),
    );
    expect(await store.read()).toBeNull();
    await store.clear();
    expect(await store.available()).toBe(true);
    await expect(
      createTokenStore(path, 'https://example.com', {
        ...crypto,
        available: () => Promise.resolve(false),
      }).write('a'.repeat(43)),
    ).rejects.toThrow('unavailable');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('preserves inaccessible or undecryptable storage for retry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'navi-store-'));
  const path = join(dir, 'session.enc');
  try {
    await writeFile(path, 'encrypted');

    const store = createTokenStore(path, 'https://example.com', {
      available: () => Promise.resolve(true),
      encrypt: () => Promise.resolve(Buffer.from('')),
      decrypt: () => Promise.reject(new Error('locked')),
    });
    await expect(store.read()).rejects.toThrow('locked');
    expect(await readFile(path, 'utf8')).toBe('encrypted');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('writes the session file readable only by its owner', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'navi-store-'));
  const path = join(dir, 'session.enc');
  try {
    await createTokenStore(path, 'https://example.com', {
      available: () => Promise.resolve(true),
      encrypt: (value: string) => Promise.resolve(Buffer.from(value)),
      decrypt: (value: Buffer) => Promise.resolve(value.toString()),
    }).write('a'.repeat(43));
    expect((await stat(path)).mode & 0o077).toBe(0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
