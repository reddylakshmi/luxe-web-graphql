import type { IUserRepository, User, AuthPayload, RegisterInput } from '../types';
import type { JavaApiClient } from './JavaApiClient';

/**
 * Java REST API mapping:
 *
 *   POST /api/auth/login      → login(email, password)
 *   POST /api/auth/register   → register(input)
 *   GET  /api/users/:id       → findById(id)
 *
 * In production this will integrate with Okta's Authorization Server via the
 * Resource Owner Password Credentials (ROPC) flow or Authorization Code + PKCE.
 * The Java backend validates the Okta token and returns a session-scoped user.
 */
export class JavaUserRepository implements IUserRepository {
  constructor(private readonly client: JavaApiClient) {}

  async login(email: string, password: string): Promise<AuthPayload> {
    try {
      return await this.client.post<AuthPayload>('/api/auth/login', { email, password });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      return { user: null, token: null, error: msg };
    }
  }

  async register(input: RegisterInput): Promise<AuthPayload> {
    try {
      return await this.client.post<AuthPayload>('/api/auth/register', input);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return { user: null, token: null, error: msg };
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.client.get<User>(`/api/users/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }
}
