import { useState } from 'react';
import type { Member } from '@navi/contracts';
import { Brand } from '../../../components/brand';
import { Avatar } from '../../../components/avatar';
import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
import type { Category, Channel } from '../model';
import * as s from '../styles.css';

export type Tab = 'home' | 'direct' | 'group';

interface Props {
  user: Member;
  tab: Tab;
  channels: Channel[];
  selected: string;
  open: boolean;
  onClose: () => void;
  onTab: (tab: Tab) => void;
  onChannel: (id: string) => void;
  onCreate: (category: Category) => void;
  onLogout: () => void;
}

export function Sidebar(props: Readonly<Props>) {
  const [collapsed, setCollapsed] = useState<Partial<Record<Category, boolean>>>({});

  return (
    <aside className={`${s.sidebar} ${props.open ? s.sidebarOpen : ''}`} aria-label="Sidebar">
      <div className={s.brand}>
        <Brand />
        <Button
          className={s.mobile}
          variant="quiet"
          aria-label="Close navigation"
          onClick={props.onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      <nav className={s.nav} aria-label="Main navigation">
        {(['home', 'direct', 'group'] as const).map((tab) => (
          <button
            key={tab}
            className={`${s.navItem} ${tab === props.tab ? s.active : ''}`}
            aria-current={tab === props.tab ? 'page' : undefined}
            onClick={() => props.onTab(tab)}
          >
            <Icon name={tab} />
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
      <div className={s.sidebarContent}>
        {props.tab === 'group' ? (
          (['Text', 'Play', 'Lounge'] as const).map((category) => (
            <section key={category} className={s.category}>
              <div className={s.categoryHeader}>
                <button
                  className={s.categoryToggle}
                  aria-label={category}
                  aria-expanded={!collapsed[category]}
                  onClick={() =>
                    setCollapsed((previous) => ({ ...previous, [category]: !previous[category] }))
                  }
                >
                  <Icon name="chevron" className={collapsed[category] ? '' : s.chevronOpen} />
                  {category}
                </button>
                <Button
                  variant="quiet"
                  className={s.add}
                  aria-label={`Add channel to ${category}`}
                  onClick={() => props.onCreate(category)}
                >
                  <Icon name="plus" />
                </Button>
              </div>
              {!collapsed[category] && (
                <div>
                  {props.channels
                    .filter((channel) => channel.category === category)
                    .map((channel) => (
                      <button
                        className={`${s.channel} ${props.selected === channel.id ? s.active : ''}`}
                        key={channel.id}
                        onClick={() => props.onChannel(channel.id)}
                      >
                        <Icon name="hash" />
                        {channel.name}
                      </button>
                    ))}
                  {!props.channels.some((channel) => channel.category === category) && (
                    <p className={s.emptyCategory}>Room for something new.</p>
                  )}
                </div>
              )}
            </section>
          ))
        ) : (
          <div>
            <p className={s.small}>Just our crew.</p>
            <p className={s.emptyCategory}>
              A little less noise.
              <br />A little more us.
            </p>
          </div>
        )}
      </div>
      <div className={s.profile}>
        <Avatar name={props.user.displayName} />
        <div className={s.profileText}>
          <strong className={s.truncate}>{props.user.displayName}</strong>
          <span className={s.small}>@{props.user.username}</span>
        </div>
        <Button variant="quiet" aria-label="Sign out" onClick={props.onLogout}>
          <Icon name="logout" />
        </Button>
      </div>
    </aside>
  );
}
