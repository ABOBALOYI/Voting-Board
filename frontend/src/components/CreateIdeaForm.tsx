"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Textarea,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { createIdea } from "../lib/apiClient";
import type { Idea } from "../lib/apiClient";
import { useAuth } from "../auth/useAuth";

interface CreateIdeaFormProps {
  // Report the created idea up to the parent (IdeasBoard) so it appears in the
  // list without a manual page reload (Req 3.4).
  onCreated: (idea: Idea) => void;
}

export function CreateIdeaForm({ onCreated }: CreateIdeaFormProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Lightweight client-side non-empty check so the board never submits a blank
    // title; the backend remains the authoritative validator.
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    // Creating an idea requires a token; the form is only useful when signed in.
    if (!token) {
      setError("You must be signed in to create an idea.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const idea = await createIdea(token, {
        title: title.trim(),
        description: description.trim(),
      });
      onCreated(idea);
      // Reset so the form is ready for the next idea.
      setTitle("");
      setDescription("");
    } catch {
      setError("Failed to create idea. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border border-default-200/70" shadow="none">
      <CardBody className="gap-3 p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Title"
            placeholder="What should we build?"
            value={title}
            onValueChange={setTitle}
            variant="bordered"
            isDisabled={submitting}
            isInvalid={Boolean(error)}
            errorMessage={error ?? undefined}
          />
          <Textarea
            label="Description"
            placeholder="Add a little detail (optional)"
            value={description}
            onValueChange={setDescription}
            variant="bordered"
            minRows={2}
            isDisabled={submitting}
          />
          <Button
            type="submit"
            color="primary"
            isLoading={submitting}
            className="self-end font-medium"
            startContent={
              !submitting ? <Plus className="h-4 w-4" aria-hidden="true" /> : undefined
            }
          >
            {submitting ? "Adding…" : "Add idea"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
