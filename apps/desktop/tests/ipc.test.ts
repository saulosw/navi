import { expect, it, vi } from 'vitest';
import type { IpcMainInvokeEvent } from 'electron';
import { registerSessionIpc } from '../src/main/auth/ipc';
import { createSessionClient } from '../src/main/auth/session-client';

it('rejects foreign webContents, subframes and untrusted URLs before invoking operations', async () => {
  const handlers = new Map<string, (event: IpcMainInvokeEvent, input?: unknown) => unknown>();

  const ipc = {
    removeHandler: () => {},
    handle: (channel: string, handler: (event: IpcMainInvokeEvent, input?: unknown) => unknown) => {
      handlers.set(channel, handler);
    },
  };

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(false),
      read: () => Promise.resolve(null),
      write: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
    vi.fn(),
  );
  registerSessionIpc(ipc, client, 'file:///app.html', 1);
  const frame = { url: 'file:///app.html' };

  const event = {
    sender: { id: 1, mainFrame: frame },
    senderFrame: frame,
  } as unknown as IpcMainInvokeEvent;
  const restore = handlers.get('navi:restoreSession')!;
  expect(await restore(event)).toMatchObject({ ok: true, value: { user: null } });
  expect(restore({ ...event, senderFrame: null })).toMatchObject({ ok: false });
  expect(
    restore({
      ...event,
      sender: Object.assign(Object.create(event.sender) as typeof event.sender, { id: 2 }),
    }),
  ).toMatchObject({ ok: false });
  expect(
    restore({
      ...event,
      senderFrame: { url: 'https://other.example' } as IpcMainInvokeEvent['senderFrame'],
    }),
  ).toMatchObject({ ok: false });
  expect(restore(event, {})).toMatchObject({ ok: false });
  expect(handlers.get('navi:login')!(event, {})).toMatchObject({ ok: false });
  expect(
    await handlers.get('navi:login')!(event, {
      username: 'player_1',
      password: 'password',
      remember: false,
    }),
  ).toMatchObject({ ok: false, code: 'unavailable' });
  expect(await handlers.get('navi:listMembers')!(event)).toMatchObject({
    ok: false,
    code: 'unauthorized',
  });
  expect(await handlers.get('navi:logout')!(event)).toMatchObject({ ok: true });
});

it('accepts the renderer URL in whichever spelling the browser reports', async () => {
  const handlers = new Map<string, (event: IpcMainInvokeEvent, input?: unknown) => unknown>();

  const ipc = {
    removeHandler: () => {},
    handle: (channel: string, handler: (event: IpcMainInvokeEvent, input?: unknown) => unknown) => {
      handlers.set(channel, handler);
    },
  };

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(false),
      read: () => Promise.resolve(null),
      write: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
    vi.fn(),
  );
  registerSessionIpc(ipc, client, 'http://127.0.0.1:5173', 1);
  const restore = handlers.get('navi:restoreSession')!;

  const frameOf = (url: string) => {
    const frame = { url };

    return {
      sender: { id: 1, mainFrame: frame },
      senderFrame: frame,
    } as unknown as IpcMainInvokeEvent;
  };

  expect(await restore(frameOf('http://127.0.0.1:5173/'))).toMatchObject({ ok: true });
  expect(await restore(frameOf('http://127.0.0.1:5173'))).toMatchObject({ ok: true });
  expect(restore(frameOf('http://127.0.0.1:5173/other'))).toMatchObject({ ok: false });
  expect(restore(frameOf('http://localhost:5173/'))).toMatchObject({ ok: false });
  expect(restore(frameOf('not a url'))).toMatchObject({ ok: false });
});
