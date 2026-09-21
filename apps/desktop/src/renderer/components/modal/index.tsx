import { useEffect, useRef } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { Button } from '../button';
import { Icon } from '../icon';
import * as styles from './styles.css';

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

export function Modal({
  title,
  children,
  onClose,
}: Readonly<{
  title: string;
  children: ReactNode;
  onClose: () => void;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    (
      content.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      ref.current?.querySelector<HTMLElement>(FOCUSABLE)
    )?.focus();

    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const items = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = items?.[0];
    const last = items?.[items.length - 1];
    if (event.shiftKey && first?.isSameNode(document.activeElement)) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && last?.isSameNode(document.activeElement)) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div className={styles.overlay}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.dialog}
        onKeyDown={onKeyDown}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button variant="quiet" aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </header>
        <div ref={content}>{children}</div>
      </div>
    </div>
  );
}
