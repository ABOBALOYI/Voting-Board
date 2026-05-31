"use client";

import { Avatar, Card, CardBody, Tooltip } from "@heroui/react";
import { ChevronUp } from "lucide-react";
import type { Idea } from "@/lib/apiClient";

interface IdeaCardProps {
  idea: Idea;
  // Whether the current user may vote. The control is gated behind auth, so an
  // unauthenticated viewer sees the count but cannot toggle a vote (Req 4.5).
  canVote: boolean;
  // IdeasBoard owns the optimistic vote logic; this card only reports intent.
  onToggleVote: (idea: Idea) => void;
}

export function IdeaCard({ idea, canVote, onToggleVote }: IdeaCardProps) {
  const voted = idea.has_voted;

  // The vote pill carries its own visual state: active (voted) is solid blue,
  // idle is a soft outline that fills on hover. Disabled when unauthenticated.
  const voteButton = (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={voted ? "Remove your vote" : "Upvote this idea"}
      disabled={!canVote}
      onClick={() => onToggleVote(idea)}
      className={[
        "group/vote flex h-16 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-large border transition-all",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        !canVote ? "cursor-not-allowed opacity-50" : "active:scale-95",
        voted
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
          : "border-default-200 bg-default-50 text-default-600 hover:border-primary hover:bg-primary-50 hover:text-primary",
      ].join(" ")}
    >
      <span className={canVote && !voted ? "transition-transform group-hover/vote:-translate-y-0.5" : ""}>
        <ChevronUp className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-medium font-semibold tabular-nums leading-none">
        {idea.vote_count}
      </span>
    </button>
  );

  return (
    <Card
      shadow="none"
      className="border border-default-200/70 transition-shadow hover:shadow-md hover:shadow-default-200/50"
    >
      <CardBody className="flex flex-row items-center gap-4 p-4">
        {canVote ? (
          voteButton
        ) : (
          <Tooltip content="Sign in to vote" placement="right" size="sm">
            {/* Wrapper keeps the tooltip working over a disabled button. */}
            <span>{voteButton}</span>
          </Tooltip>
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-medium font-semibold leading-snug text-foreground">
            {idea.title}
          </h3>
          {idea.description ? (
            <p className="line-clamp-2 text-small text-default-500">
              {idea.description}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-1.5 text-tiny text-default-400">
            <Avatar
              name={idea.created_by}
              size="sm"
              className="h-4 w-4 text-[8px]"
              classNames={{ base: "bg-default-200", name: "text-default-600" }}
            />
            <span>{idea.created_by}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
