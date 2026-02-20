const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type AuthUser = { id: string; email: string; name: string | null };

let authToken: string | null = localStorage.getItem(TOKEN_KEY);
let authUser: AuthUser | null = (() => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? (JSON.parse(s) as AuthUser) : null;
  } catch {
    return null;
  }
})();

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuth(token: string, user: AuthUser): void {
  authToken = token;
  authUser = user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  authToken = null;
  authUser = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthUser(): AuthUser | null {
  return authUser;
}
