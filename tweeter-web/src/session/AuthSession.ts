import { User, AuthToken } from "tweeter-shared";

export const CURRENT_USER_KEY = "CurrentUserKey";
export const AUTH_TOKEN_KEY = "AuthTokenKey";
const UNAUTHORIZED_TOAST_KEY = "UnauthorizedToastMessage";
const UNAUTHORIZED_TOAST_MESSAGE = "Session expired. Please sign in again.";

export function saveAuthSession(currentUser: User, authToken: AuthToken): void {
  localStorage.setItem(CURRENT_USER_KEY, currentUser.toJson());
  localStorage.setItem(AUTH_TOKEN_KEY, authToken.toJson());
}

export function restoreAuthSession(): {
  currentUser: User | null;
  authToken: AuthToken | null;
} {
  return {
    currentUser: User.fromJson(localStorage.getItem(CURRENT_USER_KEY)),
    authToken: AuthToken.fromJson(localStorage.getItem(AUTH_TOKEN_KEY)),
  };
}

export function clearAuthSession(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function consumeUnauthorizedToastMessage(): string | null {
  const message = sessionStorage.getItem(UNAUTHORIZED_TOAST_KEY);
  if (message) {
    sessionStorage.removeItem(UNAUTHORIZED_TOAST_KEY);
  }

  return message;
}

export function handleUnauthorizedSession(): void {
  clearAuthSession();
  sessionStorage.setItem(UNAUTHORIZED_TOAST_KEY, UNAUTHORIZED_TOAST_MESSAGE);

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}
