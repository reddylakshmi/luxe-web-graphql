import path from 'path';
import fs   from 'fs';

import type { IUserRepository, User, AuthPayload, RegisterInput } from '../types';
import { signMockToken } from '../../lib/jwt';

type UserRecord = User & { passwordHash: string };

function loadUsers(): UserRecord[] {
  const file = path.resolve(__dirname, '../../../data/users.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as UserRecord[];
}

// Loaded once at startup; users added via register() live only for the
// duration of the process (no persistence in mock mode).
const USERS: UserRecord[] = loadUsers();

function strip(u: UserRecord): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, ...rest } = u;
  return rest;
}

export class MockUserRepository implements IUserRepository {
  async login(email: string, password: string): Promise<AuthPayload> {
    const found = USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );
    if (!found) {
      return { user: null, token: null, error: 'Invalid email or password.' };
    }
    // In production Okta issues a JWT; here we mint a deterministic mock token
    const token = signMockToken(strip(found));
    return { user: strip(found), token, error: null };
  }

  async register(input: RegisterInput): Promise<AuthPayload> {
    const exists = USERS.find(u => u.email.toLowerCase() === input.email.toLowerCase());
    if (exists) {
      return { user: null, token: null, error: 'An account with this email already exists.' };
    }
    if (input.password.length < 8) {
      return { user: null, token: null, error: 'Password must be at least 8 characters.' };
    }

    const newUser: UserRecord = {
      id:           `user_${Date.now()}`,
      email:        input.email,
      passwordHash: input.password,
      firstName:    input.firstName,
      lastName:     input.lastName,
      tier:         'Bronze',
      points:       0,
      orders:       [],
      createdAt:    new Date().toISOString(),
    };
    USERS.push(newUser);

    const token = signMockToken(strip(newUser));
    return { user: strip(newUser), token, error: null };
  }

  async findById(id: string): Promise<User | null> {
    const found = USERS.find(u => u.id === id);
    return found ? strip(found) : null;
  }
}
