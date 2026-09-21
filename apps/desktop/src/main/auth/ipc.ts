import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { isLoginInput } from '@navi/contracts/validation';
import type { SessionClient } from './session-client';

function sameUrl(actual: string, expected: string) {
  try {
    return new URL(actual).href === new URL(expected).href;
  } catch {
    return false;
  }
}

export function trustedSender(
  event: Pick<IpcMainInvokeEvent, 'sender' | 'senderFrame'>,
  expectedUrl: string,
  expectedId: number,
) {
  return (
    event.sender.id === expectedId &&
    event.senderFrame !== null &&
    event.senderFrame === event.sender.mainFrame &&
    sameUrl(event.senderFrame.url, expectedUrl)
  );
}

export function registerSessionIpc(
  ipc: Pick<IpcMain, 'handle' | 'removeHandler'>,
  client: SessionClient,
  expectedUrl: string,
  expectedId: number,
) {
  const channels = ['login', 'restoreSession', 'logout', 'listMembers'] as const;
  for (const operation of channels) {
    ipc.removeHandler(`navi:${operation}`);
    ipc.handle(`navi:${operation}`, (event, input: unknown) => {
      if (!trustedSender(event, expectedUrl, expectedId))
        return { ok: false, code: 'invalid', message: 'Untrusted request' };
      if (operation === 'login')
        return isLoginInput(input)
          ? client.login(input)
          : { ok: false, code: 'invalid', message: 'Invalid login request' };
      if (input !== undefined) return { ok: false, code: 'invalid', message: 'Invalid request' };
      return client[operation]();
    });
  }
}
