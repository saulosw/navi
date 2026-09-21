import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { isRecord } from '@navi/contracts/validation';
import type { TokenStore } from './session-client';

export interface Encryption {
  available: () => Promise<boolean>;
  encrypt(value: string): Promise<Buffer>;
  decrypt(value: Buffer): Promise<string>;
}

export function createTokenStore(
  path: string,
  endpoint: string,
  encryption: Encryption,
): TokenStore {
  return {
    available: () => encryption.available(),
    async read() {
      let encrypted: Buffer;
      try {
        encrypted = await readFile(path);
      } catch (error) {
        if (isRecord(error) && error.code === 'ENOENT') return null;
        throw error;
      }
      const value: unknown = JSON.parse(await encryption.decrypt(encrypted));
      if (
        !isRecord(value) ||
        value.endpoint !== endpoint ||
        typeof value.token !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/.test(value.token)
      ) {
        await rm(path, { force: true });
        return null;
      }
      return value.token;
    },
    async write(token) {
      if (!(await encryption.available())) throw new Error('Secure storage unavailable');
      const buffer = await encryption.encrypt(JSON.stringify({ endpoint, token }));
      await writeFile(`${path}.tmp`, buffer, { mode: 0o600 });
      await rename(`${path}.tmp`, path);
    },
    async clear() {
      await rm(path, { force: true });
    },
  };
}
