import type { Member } from '@navi/contracts';
import { Avatar } from '../../../components/avatar';
import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
import * as s from '../styles.css';

interface Props {
  user: Member;
  members: Member[];
  recent: Member[];
  onGeneral: () => void;
  onDirect: (id: string) => void;
  onRefresh: () => void;
}

export function Home({ user, members, recent, onGeneral, onDirect, onRefresh }: Readonly<Props>) {
  return (
    <div className={s.scroll}>
      <div className={s.home}>
        <p className={s.greeting}>Good to have you here, {user.displayName}.</p>
        <h1 className={s.title}>
          Same friends.
          <br />
          Our own little corner.
        </h1>
        <p className={s.description}>
          Drop a thought, plan the next game, or pick up where you left off. This place is yours.
        </p>
        <section className={s.hero}>
          <div className={s.row}>
            <span className={s.heroMark} aria-hidden="true">
              #
            </span>
            <div>
              <h2 className={s.heroHeading}>The usual spot.</h2>
              <p className={s.description}>General is where everyone comes together.</p>
            </div>
          </div>
          <Button aria-label="Open general" onClick={onGeneral}>
            Open general <Icon name="arrow" />
          </Button>
        </section>
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>
              The crew <span className={s.small}>· {members.length}</span>
            </h2>
            <Button variant="quiet" aria-label="Refresh members" onClick={onRefresh}>
              <Icon name="refresh" />
            </Button>
          </div>
          {members.length ? (
            <div className={s.members}>
              {members.map((member) => (
                <button
                  className={s.member}
                  key={member.id}
                  aria-label={`Message ${member.displayName}`}
                  onClick={() => onDirect(member.id)}
                >
                  <Avatar name={member.displayName} />
                  <span className={s.profileText}>
                    <strong className={s.truncate}>{member.displayName}</strong>
                    <span className={s.small}>@{member.username}</span>
                  </span>
                  <Icon name="direct" />
                </button>
              ))}
            </div>
          ) : (
            <p className={s.description}>
              Your crew will appear here when their accounts are ready.
            </p>
          )}
        </section>
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Pick up a conversation</h2>
          {recent.length ? (
            <div className={s.friendList}>
              {recent.map((member) => (
                <button className={s.member} key={member.id} onClick={() => onDirect(member.id)}>
                  <Avatar name={member.displayName} />
                  <span>{member.displayName}</span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          ) : (
            <p className={s.small}>No recent conversations. Choose a friend to try a local chat.</p>
          )}
        </section>
        <p className={s.note}>
          <Icon name="lock" />
          Private space. Familiar faces. No public sign-ups.
        </p>
      </div>
    </div>
  );
}
