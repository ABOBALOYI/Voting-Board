"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { ChevronUp } from "lucide-react";
import { signIn } from "@/lib/apiClient";
import { useAuth } from "@/auth/useAuth";

// The seeded demo accounts (see backend seed_users). Offered as one-tap fills so
// reviewers can sign in without hunting through the README.
const DEMO_ACCOUNTS = ["alice", "bob", "abo", "ako"];
const DEMO_PASSWORD = "password123";

// Credential form for Team_Member sign-in (Req 1.5, 7.3). Holds its own field
// state, delegates the network call to the apiClient transport boundary, and
// stores the returned token through useAuth so it persists for later requests.
export function SignInForm() {
  const { signedIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Inline failure message; null means "no error to show".
  const [error, setError] = useState<string | null>(null);
  // Gate the submit control so a slow request can't be fired twice.
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser's default navigation so the member stays on this
    // view, which Req 7.3 requires even when sign-in fails.
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Trim the username (not the password) so stray whitespace from
      // autofill/paste doesn't cause a spurious 400 on an otherwise valid login.
      const trimmed = username.trim();
      const token = await signIn(trimmed, password);
      signedIn(token, trimmed);
      // Land the member on the board now that they're authenticated. `replace`
      // (not push) so the back button doesn't return to this sign-in view.
      router.replace("/");
    } catch {
      // Surface the failure inline without navigating away (Req 7.3).
      setError("Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  }

  function useDemoAccount(name: string) {
    setUsername(name);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <Card className="w-full max-w-sm border border-default-200/70" shadow="sm">
      <CardBody className="gap-6 px-6 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Brand mark — a simple upvote glyph in the accent color. */}
          <div className="flex h-12 w-12 items-center justify-center rounded-large bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <ChevronUp className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-small text-default-500">
              Sign in to propose and vote on ideas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            value={username}
            onValueChange={setUsername}
            autoComplete="username"
            // Django usernames are case-sensitive; stop the browser from
            // auto-capitalizing/correcting "alice" into "Alice" (a 400 on submit).
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            variant="bordered"
            isDisabled={submitting}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
            variant="bordered"
            isDisabled={submitting}
            // Surface the failure on the field itself (Req 7.3); role is kept for a11y.
            isInvalid={Boolean(error)}
            errorMessage={error ?? undefined}
          />
          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={submitting}
            className="font-medium"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2">
          <span className="text-tiny text-default-400">Try a demo account</span>
          <div className="flex gap-2">
            {DEMO_ACCOUNTS.map((name) => (
              <Chip
                key={name}
                as="button"
                variant="flat"
                color="primary"
                size="sm"
                className="cursor-pointer"
                onClick={() => useDemoAccount(name)}
              >
                {name}
              </Chip>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
