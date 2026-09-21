// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Social } from '../src/renderer/features/social';
import { Chat } from '../src/renderer/features/social/chat';

const user = { id: '1', username: 'player_1', displayName: 'Player One' };

const friend = { id: '2', username: 'player_2', displayName: 'Player Two' };

function renderSocial(members = [user, friend]) {
  const onLogout = vi.fn();
  const onRefresh = vi.fn();
  render(<Social user={user} members={members} onLogout={onLogout} onRefresh={onRefresh} />);

  return { onLogout, onRefresh };
}

const composer = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Message' });

afterEach(cleanup);

it('keeps drafts and messages separate per conversation', () => {
  renderSocial();
  fireEvent.click(screen.getByRole('button', { name: 'Open general' }));
  fireEvent.change(composer(), { target: { value: 'Hello general' } });
  fireEvent.keyDown(composer(), { key: 'Enter' });
  expect(screen.getByText('Hello general')).toBeTruthy();

  fireEvent.change(composer(), { target: { value: 'Draft for general' } });
  fireEvent.click(screen.getByRole('button', { name: 'Direct' }));
  fireEvent.click(screen.getByRole('button', { name: 'Message Player Two' }));
  expect(screen.queryByText('Hello general')).toBeNull();
  expect(composer().value).toBe('');

  fireEvent.click(screen.getByRole('button', { name: 'Group' }));
  expect(composer().value).toBe('Draft for general');
  expect(screen.getByText('Hello general')).toBeTruthy();
});

it('sends on Enter but not on Shift+Enter, during composition, or when empty', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));

  fireEvent.keyDown(composer(), { key: 'Enter' });
  expect(screen.queryByRole('article')).toBeNull();

  fireEvent.change(composer(), { target: { value: 'hello' } });
  fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true });
  fireEvent.keyDown(composer(), { key: 'Enter', isComposing: true });
  expect(screen.queryByRole('article')).toBeNull();
  expect(composer().value).toBe('hello');

  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(screen.getByText('hello')).toBeTruthy();
  expect(composer().value).toBe('');
});

it('normalizes a new channel name and rejects a duplicate without losing the form', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add channel to Play' }));

  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Channel name'), {
    target: { value: 'GAME-NIGHT' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create channel' }));
  expect(screen.getByRole('heading', { name: '# game-night' })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Add channel to Play' }));
  fireEvent.change(screen.getByLabelText('Channel name'), { target: { value: 'GENERAL' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create channel' }));
  expect(screen.getByRole('alert').textContent).toContain('already exists');
  expect(screen.getByLabelText<HTMLInputElement>('Channel name').value).toBe('GENERAL');
});

it('rejects a channel name that is not lowercase letters, digits or hyphens', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add channel to Lounge' }));
  fireEvent.change(screen.getByLabelText('Channel name'), { target: { value: 'invalid name' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create channel' }));

  expect(screen.getByRole('alert').textContent).toContain('letters');
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it.each([
  ['Escape', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
  ['Cancel', () => fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
  ['Close dialog', () => fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))],
])('dismisses the channel dialog with %s', (_label, dismiss) => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add channel to Play' }));
  expect(screen.getByRole('dialog')).toBeTruthy();

  dismiss();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('opens the dialog on its first field, traps Tab and restores focus to the opener', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));

  const add = screen.getByRole('button', { name: 'Add channel to Lounge' });
  add.focus();
  fireEvent.click(add);
  expect(document.activeElement).toBe(screen.getByLabelText('Channel name'));

  const dialog = screen.getByRole('dialog');
  const first = within(dialog).getByRole('button', { name: 'Close dialog' });
  const last = within(dialog).getByRole('button', { name: 'Create channel' });
  first.focus();
  fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(dialog, { key: 'Tab' });
  expect(document.activeElement).toBe(first);

  fireEvent.click(first);
  expect(document.activeElement).toBe(add);
});

it('collapses a category to hide its channels and expands it again', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));

  const toggle = screen.getByRole('button', { name: 'Text' });
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('button', { name: 'general' })).toBeTruthy();

  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: 'general' })).toBeNull();

  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'general' })).toBeTruthy();
});

it('filters the friend list and reports when nothing matches', () => {
  renderSocial();
  fireEvent.click(screen.getByRole('button', { name: 'Direct' }));

  const search = screen.getByRole('textbox', { name: 'Find a friend' });
  fireEvent.change(search, { target: { value: 'absent' } });
  expect(screen.getByText('No friends found.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Message Player Two' })).toBeNull();

  fireEvent.change(search, { target: { value: 'player_2' } });
  expect(screen.getByRole('button', { name: 'Message Player Two' })).toBeTruthy();
});

it('records an opened conversation as recent and offers it again from home', () => {
  renderSocial();
  expect(screen.getByText(/No recent conversations/)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Message Player Two' }));
  expect(screen.getByRole('heading', { name: 'Player Two' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  const recent = screen.getByRole('button', { name: 'Player Two' });
  expect(recent).toBeTruthy();

  fireEvent.click(recent);
  expect(screen.getByRole('heading', { name: 'Player Two' })).toBeTruthy();
});

it('returns from a direct conversation to the friend list', () => {
  renderSocial();
  fireEvent.click(screen.getByRole('button', { name: 'Message Player Two' }));
  expect(screen.getByRole('textbox', { name: 'Message' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Back to friends' }));
  expect(screen.queryByRole('button', { name: 'Back to friends' })).toBeNull();
  expect(screen.getByRole('textbox', { name: 'Find a friend' })).toBeTruthy();
});

it('opens and dismisses the compact navigation', () => {
  renderSocial();
  expect(screen.queryByRole('button', { name: 'Dismiss navigation' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  expect(screen.getByRole('button', { name: 'Dismiss navigation' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
  expect(screen.queryByRole('button', { name: 'Dismiss navigation' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss navigation' }));
  expect(screen.queryByRole('button', { name: 'Dismiss navigation' })).toBeNull();
});

it('reports refresh and sign out to its owner', () => {
  const { onLogout, onRefresh } = renderSocial();

  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  expect(onRefresh).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(onLogout).toHaveBeenCalledOnce();
});

it('attributes every message to its own author, not to the viewer', () => {
  render(
    <Chat
      title="Player Two"
      people={[user, friend]}
      messages={[
        { id: 'a', authorId: user.id, text: 'mine', createdAt: '2026-01-01T10:00:00Z' },
        { id: 'b', authorId: friend.id, text: 'theirs', createdAt: '2026-01-01T10:01:00Z' },
        { id: 'c', authorId: 'departed', text: 'orphan', createdAt: '2026-01-01T10:02:00Z' },
      ]}
      draft=""
      onDraft={() => {}}
      onSend={() => {}}
    />,
  );

  const [mine, theirs, orphan] = screen.getAllByRole('article');
  expect(within(mine!).getByText('Player One')).toBeTruthy();
  expect(within(theirs!).getByText('Player Two')).toBeTruthy();
  expect(within(orphan!).getByText('Former member')).toBeTruthy();
});

it('stamps a sent message with the signed-in author', () => {
  renderSocial();
  fireEvent.click(screen.getByRole('button', { name: 'Message Player Two' }));
  fireEvent.change(composer(), { target: { value: 'from me' } });
  fireEvent.keyDown(composer(), { key: 'Enter' });

  const sent = screen.getByRole('article');
  expect(within(sent).getByText('from me')).toBeTruthy();
  expect(within(sent).getByText('Player One')).toBeTruthy();
  expect(within(sent).queryByText('Former member')).toBeNull();
});

it('switches conversation when another channel is chosen in the sidebar', () => {
  renderSocial([]);
  fireEvent.click(screen.getByRole('button', { name: 'Group' }));
  fireEvent.change(composer(), { target: { value: 'in general' } });
  fireEvent.keyDown(composer(), { key: 'Enter' });

  fireEvent.click(screen.getByRole('button', { name: 'Add channel to Play' }));
  fireEvent.change(screen.getByLabelText('Channel name'), { target: { value: 'game-night' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create channel' }));
  expect(screen.queryByText('in general')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'general' }));
  expect(screen.getByRole('heading', { name: '# general' })).toBeTruthy();
  expect(screen.getByText('in general')).toBeTruthy();
});
