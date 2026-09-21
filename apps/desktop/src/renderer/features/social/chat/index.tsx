import { useEffect, useMemo, useRef } from 'react';
import type { Member } from '@navi/contracts';
import { Avatar } from '../../../components/avatar';
import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
import { validMessage } from '../model';
import type { Message } from '../model';
import * as s from '../styles.css';

interface Props {
  title: string;
  people: readonly Member[];
  messages: readonly Message[];
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
}

export function Chat({ title, people, messages, draft, onDraft, onSend }: Readonly<Props>) {
  const end = useRef<HTMLDivElement>(null);
  const authors = useMemo(
    () => new Map(people.map((person) => [person.id, person.displayName])),
    [people],
  );
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length]);

  return (
    <section className={s.chat} aria-label={`Conversation ${title}`}>
      <div className={s.messages} role="log" aria-label="Messages" aria-live="polite">
        {messages.length ? (
          messages.map((message) => {
            const author = authors.get(message.authorId) ?? 'Former member';

            return (
              <article className={s.message} key={message.id}>
                <Avatar name={author} />
                <div className={s.messageBody}>
                  <div className={s.messageMeta}>
                    <strong>{author}</strong>
                    <time className={s.small} dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <p className={s.messageText}>{message.text}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className={s.empty}>
            <span className={s.emptySymbol} aria-hidden="true">
              {title.startsWith('#') ? '#' : '↗'}
            </span>
            <h2 className={s.heroHeading}>A fresh conversation.</h2>
            <p>This is the beginning of {title}. Try a message to make yourself at home.</p>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className={s.composerWrap}>
        <form
          className={s.composer}
          onSubmit={(event) => {
            event.preventDefault();
            if (validMessage(draft)) onSend();
          }}
        >
          <textarea
            aria-label="Message"
            className={s.textarea}
            rows={2}
            maxLength={2000}
            placeholder={`Message ${title}`}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (validMessage(draft)) onSend();
              }
            }}
          />
          <Button type="submit" aria-label="Send message" disabled={!validMessage(draft)}>
            <Icon name="send" />
          </Button>
        </form>
        <p className={s.composerHint}>
          <span>Local preview · Messages are not delivered or saved.</span>
          <span>{draft.length}/2000</span>
        </p>
      </div>
    </section>
  );
}
