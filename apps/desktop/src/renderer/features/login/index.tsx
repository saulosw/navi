import { useState } from 'react';
import type { LoginInput } from '@navi/contracts';
import { Brand } from '../../components/brand';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import * as s from './styles.css';

export function Login({
  available,
  pending,
  error,
  onLogin,
}: Readonly<{
  available: boolean;
  pending: boolean;
  error: string;
  onLogin: (input: LoginInput) => void;
}>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <main className={s.page}>
      <header className={s.header}>
        <Brand />
        <span className={s.small}>Just our crew.</span>
      </header>
      <div className={s.layout}>
        <section>
          <h1 className={s.title}>
            Your people.
            <br />
            Your place.
          </h1>
          <p className={s.intro}>
            For the late-night games, the everyday catch-ups, and everything in between.
          </p>
          <div className={s.conversation} aria-hidden="true">
            <span className={s.bubble}>you in?</span>
            <span className={s.reply}>always.</span>
          </div>
        </section>
        <section className={s.card} aria-labelledby="login-title">
          <h2 id="login-title" className={s.heading}>
            Welcome back.
          </h2>
          <p className={s.description}>A familiar face is all it takes.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!pending) {
                onLogin({ username: username.trim(), password, remember: remember && available });
                setPassword('');
              }
            }}
          >
            <label className={s.field}>
              Username
              <input
                className={s.input}
                autoComplete="username"
                required
                maxLength={32}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={pending}
              />
            </label>
            <label className={s.field} htmlFor="password">
              Password
            </label>
            <div className={s.password}>
              <input
                id="password"
                className={s.input}
                autoComplete="current-password"
                required
                maxLength={128}
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
              />
              <Button
                variant="secondary"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                onClick={() => setVisible((previous) => !previous)}
              >
                <Icon name={visible ? 'eyeOff' : 'eye'} />
              </Button>
            </div>
            <label className={s.checkbox}>
              <input
                className={s.check}
                type="checkbox"
                checked={remember && available}
                onChange={(event) => setRemember(event.target.checked)}
                disabled={!available || pending}
              />
              Keep me signed in
            </label>
            {!available && (
              <p className={s.small}>
                Secure storage is unavailable. You can still sign in for this session.
              </p>
            )}
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <Button className={s.submit} type="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
              <Icon name="arrow" />
            </Button>
          </form>
          <p className={s.help}>
            Need access or a password reset?
            <br />
            Ask the person who manages your crew.
          </p>
        </section>
      </div>
      <footer className={s.footer}>
        <Icon name="lock" />A private space, made by friends.
      </footer>
    </main>
  );
}
