import type { Auth } from '../../application/auth.ts';
import { AuthError } from '../../domain/users/auth-error.ts';

const ACTIONS = ['create', 'reset-password', 'deactivate'] as const;

type Action = (typeof ACTIONS)[number];

export interface Prompt {
  ask(label: string, secret?: boolean): Promise<string>;
}

function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

async function askNewPassword(prompt: Prompt) {
  const password = await prompt.ask('Password: ', true);
  const confirmation = await prompt.ask('Confirm password: ', true);
  if (password !== confirmation) throw new AuthError('Passwords do not match');

  return password;
}

export async function provision(auth: Auth, prompt: Prompt, action: string) {
  if (!isAction(action)) throw new AuthError('Use create, reset-password or deactivate');

  const username = await prompt.ask('Username: ');

  if (action === 'deactivate') return auth.deactivate(username);

  if (action === 'reset-password')
    return auth.resetPassword(username, await askNewPassword(prompt));

  const displayName = await prompt.ask('Display name: ');
  return auth.createUser(username, displayName, await askNewPassword(prompt));
}
