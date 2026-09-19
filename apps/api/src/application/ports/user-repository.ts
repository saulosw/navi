import type { Credentials } from '../../domain/users/credentials.ts';
import type { User } from '../../domain/users/user.ts';

// Contract for the login phase; no adapter implements it yet. Credentials are a
// deliberate second lookup so that only the authentication use case reads hashes.
export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findCredentials(userId: string): Promise<Credentials | null>;
}
