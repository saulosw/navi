import { useCallback, useState } from 'react';
import { validMessage } from './model';
import type { Message } from './model';

const NO_MESSAGES: readonly Message[] = [];

export function useConversations(authorId: string) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, Message[]>>({});

  const setDraft = useCallback((conversation: string, value: string) => {
    setDrafts((previous) => ({ ...previous, [conversation]: value }));
  }, []);

  const send = useCallback(
    (conversation: string, text: string) => {
      if (!validMessage(text)) return;

      const message: Message = {
        id: crypto.randomUUID(),
        authorId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setHistory((previous) => ({
        ...previous,
        [conversation]: [...(previous[conversation] ?? []), message],
      }));
      setDrafts((previous) => ({ ...previous, [conversation]: '' }));
    },
    [authorId],
  );

  return {
    setDraft,
    send,
    draftOf: (conversation: string) => drafts[conversation] ?? '',
    messagesOf: (conversation: string) => history[conversation] ?? NO_MESSAGES,
  };
}
