import { useState } from 'react';
import { Modal } from '../../../components/modal';
import { Button } from '../../../components/button';
import { channelName } from '../model';
import type { Channel, Category } from '../model';
import * as s from '../styles.css';

export function ChannelModal({
  category,
  channels,
  onCreate,
  onClose,
}: Readonly<{
  category: Category;
  channels: Channel[];
  onCreate: (name: string, category: Category) => void;
  onClose: () => void;
}>) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(category);
  const [error, setError] = useState('');

  return (
    <Modal title="Create a channel" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onCreate(channelName(name, channels), selected);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Cannot create channel');
          }
        }}
      >
        <label className={s.field}>
          Channel name
          <input
            className={s.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={32}
            placeholder="game-night"
          />
        </label>
        <label className={s.field}>
          Category
          <select
            className={s.input}
            value={selected}
            onChange={(event) => setSelected(event.target.value as Category)}
          >
            {(['Text', 'Play', 'Lounge'] as const).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <p className={s.small}>
          A text channel for this local preview. It disappears when you sign out or reload.
        </p>
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        <div className={s.formActions}>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create channel</Button>
        </div>
      </form>
    </Modal>
  );
}
