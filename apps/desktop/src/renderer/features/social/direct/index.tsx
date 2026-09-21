import { useState } from 'react';
import type { Member } from '@navi/contracts';
import { Avatar } from '../../../components/avatar';
import { Icon } from '../../../components/icon';
import * as s from '../styles.css';

export function DirectList({
  members,
  selected,
  onSelect,
}: Readonly<{
  members: Member[];
  selected: string | null;
  onSelect: (id: string) => void;
}>) {
  const [query, setQuery] = useState('');

  const filtered = members.filter((member) =>
    `${member.displayName} ${member.username}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside
      className={`${s.directList} ${selected ? s.directHidden : ''}`}
      aria-label="Direct conversations"
    >
      <div className={s.search}>
        <Icon name="search" />
        <input
          aria-label="Find a friend"
          className={s.searchInput}
          placeholder="Find a friend…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className={s.friendList}>
        {filtered.map((member) => (
          <button
            key={member.id}
            aria-label={`Message ${member.displayName}`}
            className={`${s.member} ${selected === member.id ? s.active : ''}`}
            onClick={() => onSelect(member.id)}
          >
            <Avatar name={member.displayName} />
            <span className={s.profileText}>
              <strong className={s.truncate}>{member.displayName}</strong>
              <span className={s.small}>@{member.username}</span>
            </span>
          </button>
        ))}
        {!filtered.length && <p className={s.small}>No friends found.</p>}
      </div>
    </aside>
  );
}
