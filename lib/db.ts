import fs from 'fs';
import path from 'path';

export interface UserDB {
  email: string;
  name: string;
  password_hash: string;
  is_verified: boolean;
  verification_token?: string;
  token_expiry?: number;
}

const dbPath = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

export function getAllUsers(): UserDB[] {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function saveUsers(users: UserDB[]) {
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): UserDB | undefined {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: UserDB): void {
  const users = getAllUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(email: string, updates: Partial<UserDB>): void {
  const users = getAllUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
  }
}
