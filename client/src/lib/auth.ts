/** Auth token helpers — memory + localStorage (MVP demo pattern). */

const TOKEN_KEY = "campushub_token";
const USER_KEY = "campushub_user";

let memoryToken: string | null = null;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  major: string | null;
};

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export function setAuth(token: string, user: AuthUser): void {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // private mode / storage blocked — memory still works for this session
  }
}

export function clearAuth(): void {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}
