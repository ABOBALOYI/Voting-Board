"use client";

import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const TOKEN_KEY = "voting_board_token";
const USERNAME_KEY = "voting_board_username";

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  signedIn: (token: string, username: string) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  // Username is persisted alongside the token purely for display (greeting the
  // signed-in member); it is never used for authorization.
  const [username, setUsername] = useState<string | null>(null);

  // Hydrate from localStorage after mount — localStorage is unavailable during
  // any server pass, so we read it in an effect to stay client-only (Req 9).
  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setUsername(localStorage.getItem(USERNAME_KEY));
  }, []);

  function signedIn(newToken: string, newUsername: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USERNAME_KEY, newUsername);
    setToken(newToken);
    setUsername(newUsername);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: Boolean(token),
        signedIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
