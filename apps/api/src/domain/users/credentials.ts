// Kept apart from User so that ordinary reads cannot carry a password hash into
// application, transport or log code by accident.
export interface Credentials {
  userId: string;
  passwordHash: string;
}
