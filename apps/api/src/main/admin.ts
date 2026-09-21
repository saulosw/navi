import { createAuth } from '../application/auth.ts';
import { provision } from '../adapters/cli/provision.ts';
import { parseEnv } from '../infrastructure/config/env.ts';
import { createPool } from '../infrastructure/database/pool.ts';
import { postgresAccounts } from '../infrastructure/database/accounts.ts';
import { passwordHasher, tokenService } from '../infrastructure/security/crypto.ts';
import { terminalPrompt } from '../infrastructure/security/terminal-prompt.ts';
import { AuthError } from '../domain/users/auth-error.ts';

let prompt: ReturnType<typeof terminalPrompt> | undefined;
let pool: ReturnType<typeof createPool> | undefined;

try {
  prompt = terminalPrompt();
  pool = createPool(parseEnv(process.env).DATABASE_URL);

  const auth = createAuth({
    accounts: postgresAccounts(pool),
    passwords: passwordHasher,
    tokens: tokenService,
    clock: Date.now,
  });

  await provision(auth, prompt, process.argv[2] ?? '');
  console.log('Account updated.');
} catch (error) {
  console.error(
    error instanceof AuthError
      ? error.message
      : 'Account update failed. Check the action, inputs and database availability.',
  );
  process.exitCode = 1;
} finally {
  prompt?.close();
  await pool?.end();
}
