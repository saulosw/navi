export interface HealthResponse {
  status: 'ok' | 'unavailable';
}

export interface Member {
  id: string;
  username: string;
  displayName: string;
}

export interface LoginInput {
  username: string;
  password: string;
  remember: boolean;
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'invalid' | 'unauthorized' | 'rate-limit' | 'unavailable'; message: string };

export interface SessionView {
  user: Member | null;
  expiresAt: string | null;
  persistenceAvailable: boolean;
  warning?: string;
}

export interface DesktopBridge {
  platform: 'linux' | 'darwin' | 'win32' | 'other';
}
