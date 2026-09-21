import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { AuthError } from '../../domain/users/auth-error.ts';

export function terminalPrompt() {
  if (!process.stdin.isTTY) throw new AuthError('Provisioning requires an interactive terminal');

  let echoing = true;

  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (echoing) process.stdout.write(chunk);
      callback();
    },
  });

  const terminal = createInterface({ input: process.stdin, output, terminal: true });

  terminal.on('SIGINT', () => {
    terminal.close();
    process.stdout.write('\nCancelled.\n');
    process.exit(130);
  });

  return {
    async ask(label: string, secret = false) {
      process.stdout.write(label);
      echoing = !secret;
      try {
        return await terminal.question('');
      } finally {
        echoing = true;
        if (secret) process.stdout.write('\n');
      }
    },

    close() {
      terminal.close();
    },
  };
}
