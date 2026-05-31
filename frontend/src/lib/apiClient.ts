// The single transport boundary: the only module that knows about URLs, HTTP,
// and the Authorization header. Components call these functions, never fetch.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Idea {
  id: number;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  vote_count: number;
  has_voted: boolean;
}

export type Sort = "popularity" | "recent";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function signIn(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid username or password");
  const data = await res.json();
  return data.token as string;
}

export async function fetchIdeas(sort: Sort, token: string | null): Promise<Idea[]> {
  // Token is optional for reads, but when present it lets the API return
  // has_voted so the toggle renders correctly on first paint.
  const res = await fetch(`${BASE_URL}/api/ideas/?sort=${sort}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load ideas");
  return res.json();
}

export async function createIdea(
  token: string,
  input: { title: string; description: string },
): Promise<Idea> {
  const res = await fetch(`${BASE_URL}/api/ideas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create idea");
  return res.json();
}

export async function castVote(token: string, ideaId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/ideas/${ideaId}/vote/`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to vote");
}

export async function removeVote(token: string, ideaId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/ideas/${ideaId}/vote/`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to remove vote");
}
