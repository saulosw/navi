export type AuthErrorKind = 'invalid' | 'unauthorized' | 'rate-limited' | 'not-found';

export class AuthError extends Error {
  readonly kind: AuthErrorKind;
  constructor(message: string, kind: AuthErrorKind = 'invalid') {
    super(message);
    this.kind = kind;
  }
}
