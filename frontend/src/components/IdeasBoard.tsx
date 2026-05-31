"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button, Card, CardBody, Skeleton, addToast } from "@heroui/react";
import { AlertCircle, Lightbulb } from "lucide-react";
import type { Idea, Sort } from "../lib/apiClient";
import { castVote, fetchIdeas, removeVote } from "../lib/apiClient";
import { useAuth } from "../auth/useAuth";
import { IdeaCard } from "./IdeaCard";

interface IdeasBoardProps {
  // The page owns the active sort (it composes SortControls); the board reacts
  // to it by refetching. Keeps a single source of truth for sort.
  sort: Sort;
}

// Imperative handle so the page can compose CreateIdeaForm and IdeasBoard side
// by side while IdeasBoard remains the single owner of the ideas array: a newly
// created idea is prepended into that owned state without a reload (Req 3.4).
export interface IdeasBoardHandle {
  addIdea: (idea: Idea) => void;
}

// Placeholder rows that mirror the IdeaCard layout, so the loading state has the
// same shape as the loaded list (less layout shift than a centered spinner).
function BoardSkeleton() {
  return (
    <div role="status" aria-label="Loading ideas" className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} shadow="none" className="border border-default-200/70">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <Skeleton className="h-16 w-14 rounded-large" />
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export const IdeasBoard = forwardRef<IdeasBoardHandle, IdeasBoardProps>(
  function IdeasBoard({ sort }, ref) {
    const { token, isAuthenticated } = useAuth();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        // Prepend so the just-created idea is immediately visible at the top.
        addIdea: (idea: Idea) => setIdeas((cur) => [idea, ...cur]),
      }),
      [],
    );

    function load() {
      let cancelled = false;
      setLoading(true);
      setError(null);
      fetchIdeas(sort, token)
        .then((result) => {
          if (!cancelled) setIdeas(result);
        })
        .catch(() => {
          if (!cancelled) setError("We couldn't load the ideas. Please try again.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    // Fetch after mount and refetch whenever sort (or token) changes — board
    // data is only ever loaded client-side, post-mount (Req 9.2, 7.1, 7.2).
    // Passing the token lets the API return has_voted on first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, [sort, token]);

    async function onToggleVote(idea: Idea) {
      if (!token) return; // control is gated behind auth anyway
      const snapshot = ideas;
      const delta = idea.has_voted ? -1 : 1;

      // Optimistic update first, before any network response (Req 6.1).
      setIdeas((cur) =>
        cur.map((i) =>
          i.id === idea.id
            ? { ...i, has_voted: !i.has_voted, vote_count: i.vote_count + delta }
            : i,
        ),
      );

      try {
        if (idea.has_voted) {
          await removeVote(token, idea.id);
        } else {
          await castVote(token, idea.id);
        }
        // Success: retain the optimistic state, no refetch needed (Req 6.3).
      } catch {
        setIdeas(snapshot); // Roll back to the snapshot (Req 6.2).
        // A toast keeps the list visible while signalling the failure (Req 6.2).
        addToast({
          title: "Vote didn't go through",
          description: "We reverted the change. Please try again.",
          color: "danger",
        });
      }
    }

    // Loading indication while the list loads (Req 7.1).
    if (loading) return <BoardSkeleton />;

    // Error indication when the list fails to load (Req 7.2).
    if (error) {
      return (
        <Card
          shadow="none"
          className="border border-danger-200 bg-danger-50"
          role="alert"
        >
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
            <p className="text-small text-danger-600">{error}</p>
            <Button color="danger" variant="flat" size="sm" onPress={load}>
              Retry
            </Button>
          </CardBody>
        </Card>
      );
    }

    if (ideas.length === 0) {
      return (
        <Card shadow="none" className="border border-dashed border-default-300">
          <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
              <Lightbulb className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="text-medium font-medium text-default-700">No ideas yet</p>
            <p className="max-w-xs text-small text-default-400">
              {isAuthenticated
                ? "Be the first to propose a feature for the team to vote on."
                : "Sign in to propose the first feature idea."}
            </p>
          </CardBody>
        </Card>
      );
    }

    return (
      <section className="flex flex-col gap-3">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            canVote={isAuthenticated}
            onToggleVote={onToggleVote}
          />
        ))}
      </section>
    );
  },
);
