import { Brand } from '../../components/brand';
import * as styles from './styles.css';

export function Welcome() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <span className={styles.privateLabel}>Just our crew.</span>
      </header>
      <section className={styles.content} aria-labelledby="welcome-title">
        <div className={styles.introduction}>
          <h1 id="welcome-title" className={styles.title}>
            Our place to hang out.
          </h1>
          <p className={styles.description}>Catch up. Plan the next game. Or just hang around.</p>
          <div className={styles.illustration} aria-hidden="true">
            <span className={styles.bubble}>you in?</span>
            <span className={styles.reply}>I'm here.</span>
          </div>
        </div>
        <aside className={styles.panel} aria-labelledby="access-title">
          <span className={styles.symbol} aria-hidden="true">
            ↗
          </span>
          <h2 id="access-title" className={styles.panelTitle}>
            A place of our own.
          </h2>
          <p className={styles.panelText}>
            Access is being prepared. Soon, you'll sign in with the account we've created for you.
          </p>
          <p className={styles.note}>No public sign-ups. No searching for your crew.</p>
        </aside>
      </section>
      <footer className={styles.footer}>Made by friends, for friends.</footer>
    </main>
  );
}
