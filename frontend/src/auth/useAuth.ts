"use client";

import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  // Throw instead of returning null so misuse outside <AuthProvider> fails loudly
  // at the call site rather than surfacing as confusing null-access errors later.
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
