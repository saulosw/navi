import { useState } from 'react';
import type { Member } from '@navi/contracts';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Sidebar } from './sidebar';
import type { Tab } from './sidebar';
import { Home } from './home';
import { Chat } from './chat';
import { ChannelModal } from './channel-modal';
import { DirectList } from './direct';
import { useConversations } from './use-conversations';
import type { Category, Channel } from './model';
import * as s from './styles.css';

interface Props {
  user: Member;
  members: Member[];
  onLogout: () => void;
  onRefresh: () => void;
}

export function Social({ user, members, onLogout, onRefresh }: Readonly<Props>) {
  const [tab, setTab] = useState<Tab>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([
    { id: 'general', name: 'general', category: 'Text' },
  ]);
  const [channel, setChannel] = useState('general');
  const [direct, setDirect] = useState<string | null>(null);
  const [creating, setCreating] = useState<Category | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const conversations = useConversations(user.id);
  const friends = members.filter((member) => member.id !== user.id);
  const recipient = friends.find((member) => member.id === direct);
  const conversation = tab === 'group' ? `channel:${channel}` : `direct:${direct ?? ''}`;

  const title =
    tab === 'group'
      ? `# ${channels.find((item) => item.id === channel)?.name ?? 'general'}`
      : (recipient?.displayName ?? 'Direct');
  const draft = conversations.draftOf(conversation);

  function navigate(next: Tab) {
    setTab(next);
    setMobileOpen(false);
  }

  function openDirect(id: string) {
    setDirect(id);
    setRecent((previous) => [id, ...previous.filter((item) => item !== id)]);
    navigate('direct');
  }

  return (
    <div className={s.shell}>
      {mobileOpen && (
        <button
          className={s.scrim}
          aria-label="Dismiss navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        user={user}
        tab={tab}
        channels={channels}
        selected={channel}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onTab={navigate}
        onChannel={(id) => {
          setChannel(id);
          setMobileOpen(false);
        }}
        onCreate={setCreating}
        onLogout={onLogout}
      />
      <main className={s.main} inert={creating !== null || mobileOpen}>
        <header className={s.header}>
          <div className={s.headerLeft}>
            <Button
              variant="quiet"
              className={s.mobile}
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </Button>
            {tab === 'direct' && direct && (
              <Button
                variant="quiet"
                className={s.mobile}
                aria-label="Back to friends"
                onClick={() => setDirect(null)}
              >
                <Icon name="direct" />
              </Button>
            )}
            <Icon name={tab === 'group' ? 'hash' : tab} />
            <h1 className={s.headerTitle}>{tab === 'home' ? 'Home' : title}</h1>
          </div>
          <span className={s.preview}>Local preview</span>
        </header>
        {tab === 'home' ? (
          <Home
            user={user}
            members={friends}
            recent={recent.flatMap((id) => {
              const found = friends.find((member) => member.id === id);
              return found ? [found] : [];
            })}
            onGeneral={() => {
              setChannel('general');
              navigate('group');
            }}
            onDirect={openDirect}
            onRefresh={onRefresh}
          />
        ) : (
          <div className={s.split}>
            {tab === 'direct' && (
              <DirectList
                members={friends}
                selected={recipient?.id ?? null}
                onSelect={openDirect}
              />
            )}
            {tab === 'group' || recipient ? (
              <Chat
                key={conversation}
                title={title}
                people={members}
                messages={conversations.messagesOf(conversation)}
                draft={draft}
                onDraft={(value) => conversations.setDraft(conversation, value)}
                onSend={() => conversations.send(conversation, draft)}
              />
            ) : (
              <div className={`${s.empty} ${s.directHidden}`}>
                <h2>One friend. One conversation.</h2>
                <p>Choose someone from your crew to start a local chat.</p>
              </div>
            )}
          </div>
        )}
      </main>
      {creating && (
        <ChannelModal
          category={creating}
          channels={channels}
          onClose={() => setCreating(null)}
          onCreate={(name, category) => {
            const id = crypto.randomUUID();
            setChannels((previous) => [...previous, { id, name, category }]);
            setChannel(id);
            setCreating(null);
          }}
        />
      )}
    </div>
  );
}
