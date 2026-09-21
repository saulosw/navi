import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesktopBridge, LoginInput, Member, SessionView } from '@navi/contracts';
import { isMember } from '@navi/contracts/validation';
import { Login } from '../login';
import { Social } from '../social';
import { Brand } from '../../components/brand';
import { Button } from '../../components/button';
import * as s from './styles.css';

type Phase = 'restoring' | 'login' | 'members' | 'ready' | 'error';

const SIGNED_OUT: SessionView = { user: null, expiresAt: null, persistenceAvailable: false };

const MAX_TIMEOUT_DELAY = 2_147_483_647;

export function App({ bridge = window.navi }: Readonly<{ bridge?: DesktopBridge }>) {
  const epoch = useRef(0);
  const [phase, setPhase] = useState<Phase>('restoring');
  const [session, setSession] = useState<SessionView>(SIGNED_OUT);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  const loadMembers = useCallback(
    async (initial = false) => {
      if (!bridge) return;
      const requestEpoch = epoch.current;
      try {
        const result = await bridge.listMembers();
        if (requestEpoch !== epoch.current) return;
        if (!result.ok) {
          if (result.code === 'unauthorized') {
            setSession((previous) => ({ ...previous, user: null, expiresAt: null }));
            setMembers([]);
            setPhase('login');
            setError(result.message);
            return;
          }
          throw new Error(result.message);
        }
        if (!Array.isArray(result.value) || !result.value.every(isMember))
          throw new Error('Invalid member response');
        setMembers(result.value);
        setPhase('ready');
      } catch {
        if (requestEpoch !== epoch.current) return;
        if (initial) {
          setPhase('error');
          setError('Could not load your crew. Try again.');
        } else setNotice('Could not refresh your crew. Try again.');
      }
    },
    [bridge],
  );

  const restore = useCallback(async () => {
    const requestEpoch = ++epoch.current;
    setPhase('restoring');
    setError('');
    if (!bridge) {
      setPhase('error');
      setError('The desktop connection is unavailable. Restart Navi.');
      return;
    }
    try {
      const result = await bridge.restoreSession();
      if (requestEpoch !== epoch.current) return;
      if (!result.ok) {
        setPhase(result.code === 'unauthorized' ? 'login' : 'error');
        setError(result.message);
        return;
      }
      setSession(result.value);
      if (result.value.user) {
        setPhase('members');
        await loadMembers(true);
      } else setPhase('login');
    } catch {
      if (requestEpoch !== epoch.current) return;
      setPhase('error');
      setError('Cannot restore your session. Try again.');
    }
  }, [bridge, loadMembers]);
  useEffect(() => {
    void Promise.resolve().then(restore);
  }, [restore]);

  const expireSession = useCallback(() => {
    epoch.current++;
    setSession((previous) => ({ ...previous, user: null, expiresAt: null }));
    setMembers([]);
    setPending(false);
    setPhase('login');
    setError('Your session expired. Sign in again.');
  }, []);

  useEffect(() => {
    const deadline = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
    if (!session.user || !Number.isFinite(deadline)) return;

    let timer: ReturnType<typeof setTimeout>;

    const arm = () => {
      const remaining = deadline - Date.now();
      timer =
        remaining > MAX_TIMEOUT_DELAY
          ? setTimeout(arm, MAX_TIMEOUT_DELAY)
          : setTimeout(expireSession, Math.max(remaining, 0));
    };
    arm();

    return () => clearTimeout(timer);
  }, [session.user, session.expiresAt, expireSession]);

  async function login(input: LoginInput) {
    if (!bridge) return;
    const requestEpoch = ++epoch.current;
    setPending(true);
    setError('');
    try {
      const result = await bridge.login(input);
      if (requestEpoch !== epoch.current) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSession(result.value);
      setNotice(result.value.warning ?? '');
      setPhase('members');
      await loadMembers(true);
    } catch {
      if (requestEpoch !== epoch.current) return;
      setError('Cannot sign in. Try again.');
    } finally {
      if (requestEpoch === epoch.current) setPending(false);
    }
  }

  async function logout() {
    epoch.current++;
    setSession((previous) => ({ ...previous, user: null, expiresAt: null }));
    setMembers([]);
    setPhase('login');
    setError('');
    setPending(true);
    try {
      const result = await bridge?.logout();
      if (result?.ok) setNotice(result.value.warning ?? '');
    } catch {
      setNotice('Signed out here. Server session revocation could not be confirmed.');
    } finally {
      setPending(false);
    }
  }

  let content;
  if (phase === 'ready' && session.user) {
    content = (
      <Social
        key={session.user.id}
        user={session.user}
        members={members}
        onLogout={() => {
          void logout();
        }}
        onRefresh={() => {
          void loadMembers();
        }}
      />
    );
  } else if (phase === 'login') {
    content = (
      <Login
        available={session.persistenceAvailable}
        pending={pending}
        error={error}
        onLogin={(input) => {
          void login(input);
        }}
      />
    );
  } else {
    content = (
      <main className={s.center}>
        <Brand />
        {phase === 'error' ? (
          <>
            <p role="alert">{error}</p>
            <Button
              onClick={() => {
                if (session.user) void loadMembers(true);
                else void restore();
              }}
            >
              Try again
            </Button>
            {session.user && (
              <Button
                variant="quiet"
                onClick={() => {
                  void logout();
                }}
              >
                Sign out
              </Button>
            )}
          </>
        ) : (
          <p role="status">
            {phase === 'members' ? 'Finding your crew…' : 'Getting your space ready…'}
          </p>
        )}
      </main>
    );
  }

  return (
    <>
      {content}
      {notice && (
        <div className={s.notice} role="status">
          <span>{notice}</span>
          <Button variant="quiet" onClick={() => setNotice('')}>
            Dismiss
          </Button>
        </div>
      )}
    </>
  );
}
