"use client";

import { useRef, useState } from "react";
import { Avatar, Button, Link } from "@heroui/react";
import { ChevronUp, LogOut } from "lucide-react";
import type { Idea, Sort } from "@/lib/apiClient";
import { useAuth } from "@/auth/useAuth";
import SortControls from "@/components/SortControls";
import { CreateIdeaForm } from "@/components/CreateIdeaForm";
import { IdeasBoard } from "@/components/IdeasBoard";
import type { IdeasBoardHandle } from "@/components/IdeasBoard";

export default function HomePage() {
  const { isAuthenticated, username, signOut } = useAuth();
  // The page owns the active sort so SortControls and IdeasBoard share one
  // source of truth; popularity is the default ordering (Req 4.4).
  const [sort, setSort] = useState<Sort>("popularity");
  // Imperative handle to the board so a created idea is pushed into the board's
  // owned list and appears without a reload (Req 3.4) — the page never holds
  // the ideas array itself.
  const boardRef = useRef<IdeasBoardHandle>(null);

  return (
    <div className="min-h-screen">
      {/* Sticky app bar keeps brand + identity in reach while scrolling ideas. */}
      <header className="sticky top-0 z-20 border-b border-default-200/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-medium bg-primary text-primary-foreground">
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="text-medium font-semibold tracking-tight">
              Voting Board
            </span>
          </div>

          {/* Reads are open, so the board always renders; only write controls are
              gated behind auth. */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar
                  name={username ?? undefined}
                  size="sm"
                  className="h-7 w-7 text-tiny"
                  classNames={{ base: "bg-primary-100", name: "text-primary-700" }}
                />
                <span className="hidden text-small font-medium text-default-600 sm:inline">
                  {username}
                </span>
              </div>
              <Button
                variant="flat"
                size="sm"
                onPress={signOut}
                startContent={<LogOut className="h-4 w-4" aria-hidden="true" />}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button as={Link} href="/sign-in" color="primary" size="sm">
              Sign in
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Feature ideas</h1>
          <p className="text-small text-default-500">
            Propose features and upvote what matters most to the team.
          </p>
        </div>

        {/* Creating ideas requires a token, so the form only shows when signed in. */}
        {isAuthenticated ? (
          <CreateIdeaForm
            onCreated={(idea: Idea) => boardRef.current?.addIdea(idea)}
          />
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-large border border-dashed border-default-300 bg-content1 px-5 py-4">
            <p className="text-small text-default-500">
              Got an idea? Sign in to add it to the board.
            </p>
            <Button as={Link} href="/sign-in" color="primary" variant="flat" size="sm">
              Sign in
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-small font-semibold uppercase tracking-wide text-default-400">
            All ideas
          </h2>
          <SortControls sort={sort} onChange={setSort} />
        </div>

        <IdeasBoard ref={boardRef} sort={sort} />
      </main>
    </div>
  );
}
