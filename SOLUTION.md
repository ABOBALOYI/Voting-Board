# Solution: Feature Voting Board — Design & Trade-offs

This is a single-repository vertical slice: a Django + DRF backend (`backend/`) and a
client-rendered Next.js App Router frontend (`frontend/`). The goal was correctness and
clean, modular code over breadth, so most of the interesting decisions are about *what
not to build* and where to put the one rule that really matters. This document explains
the choices that shaped the implementation and the trade-offs each one carries.

## 1. Query-time `vote_count` annotation vs a denormalized counter column

`Vote_Count` is never stored on `Idea`. It is derived per request in the list query:

```python
qs = Idea.objects.annotate(vote_count=Count("votes")).order_by(order)
```

The alternative would be a denormalized `vote_count` integer column on `Idea`, bumped
`+1`/`-1` whenever a vote is cast or removed.

**Why annotate at query time:**

- **Votes are the single source of truth.** The count is always exactly the number of
  `Vote` rows, computed from those rows. There is no second place for the truth to live.
- **No drift, no reconciliation.** A counter column can fall out of sync with reality
  through a missed increment, a failed transaction, a cascade delete, or a bug in one of
  several write paths. With a derived count, that entire class of "the number is wrong
  and nobody knows why" bugs simply cannot occur — there is nothing to keep in sync.
- **Adequate at this scale.** This is an internal team tool. A `COUNT(*)` grouped over a
  small votes table is trivially fast and needs no caching.

**The trade-off:** every list read does aggregation work (a join + group/count across the
votes table) instead of reading one cheap pre-computed integer. At very high read volume
or very large vote tables, a denormalized counter (kept correct with care, e.g. `F()`
expressions inside transactions) would win on read latency. At internal-tool scale that
cost is negligible, and we deliberately traded a small, bounded read cost for the
elimination of drift bugs.

## 2. `localStorage` token storage and the XSS trade-off

The auth token is persisted in the browser's `localStorage` (`AuthContext.tsx`):

```ts
function signedIn(newToken: string) {
  localStorage.setItem(TOKEN_KEY, newToken);
  setToken(newToken);
}
```

**Why `localStorage`:**

- It **survives reloads**, so a signed-in member stays signed in without re-authenticating.
- It is **simple**: the client reads and writes a string, the token hydrates in a
  post-mount `useEffect`, and it pairs naturally with DRF's `Authorization: Token <key>`
  header. No cookie plumbing, no CSRF token exchange.

**The trade-off — exposure to XSS:** anything in `localStorage` is readable by *any*
JavaScript running on the page. If an attacker could inject script (a cross-site scripting
flaw, a compromised dependency), they could read the token and impersonate the user. This
is an accepted trade-off for the exercise, not a production-grade choice.

**What production would do instead:** store the credential in an `HttpOnly`, `Secure`,
`SameSite` cookie so it is never reachable from JavaScript, and add CSRF protection
(needed once auth rides on a cookie the browser attaches automatically). That is more
moving parts than this slice needs, so we documented the gap rather than building it.

## 3. Idempotent vote / unvote endpoints

Both directions of voting are idempotent, and the single-vote rule is enforced in the
database rather than in application code (see §5). A member's vote is modeled as a
sub-resource of an idea: `POST .../vote/` casts it, `DELETE .../vote/` removes it.

```python
@action(detail=True, methods=["post", "delete"])
def vote(self, request, pk=None):
    idea = self.get_object()
    if request.method == "POST":
        _, created = Vote.objects.get_or_create(idea=idea, user=request.user)
        return Response(
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
    Vote.objects.filter(idea=idea, user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
```

- **`POST` uses `get_or_create`.** A first vote creates the row and returns `201`; a repeat
  vote is a no-op and returns `200`. Either way the member ends with exactly one vote and
  the count is unchanged on the repeat — no duplicate row is ever written.
- **`DELETE` is idempotent.** Removing a vote that exists deletes it; removing a vote that
  was never there still returns `204`. The end state ("this member has no vote on this
  idea") is the same regardless of the starting state.

**Why this matters:** idempotency makes the API safe against the messy reality of clients.
Rapid double-clicks, retried requests after a flaky network, and the frontend's optimistic
UI (which flips state *before* the server responds) all converge on the same correct
result. The client never has to reason about "did my first click already land?" — sending
the request again is always safe. The optimistic UI also doesn't depend on the response
body; the endpoints return status only.

**Race condition backstop:** two simultaneous `POST`s from the same member could both pass
an application-level "already voted?" check, so we deliberately avoid check-then-insert.
`get_or_create` collapses the race, and the database unique constraint (§5) is the final
guarantee that no duplicate row can exist even under concurrency.

## 4. Client-rendered Next.js (App Router as a CSR SPA)

The frontend uses the Next.js App Router but operates strictly as a **client-rendered
single-page-style app**. There is no server-side rendering of board data, no Server
Actions, and no server-side data fetching.

- Data-driven pages (`app/page.tsx`, `app/sign-in/page.tsx`) open with the `"use client"`
  directive.
- Board data is fetched in the browser inside a post-mount `useEffect`, never during
  render and never on the server.
- The App Router is used here essentially as a router + bundler around a client React tree.

**Why:** keeping rendering on the client keeps the slice focused on what the exercise is
actually about — correct API integration and clean React patterns (a single transport
boundary in `lib/apiClient.ts`, auth state isolated in `AuthContext`, view components that
own only their UI state). Introducing SSR or Server Actions would add a server data-fetching
layer, hydration concerns, and a second place for auth to live, none of which earn their
keep at this scope.

**The trade-off:** giving up SSR means no server-rendered first paint and no SEO benefit
for board content — the page shows a loading state until the client fetch resolves. For an
authenticated internal tool that is the right call; SEO is irrelevant and the simpler model
is easier to reason about and review.

## 5. Where the single-vote rule lives: the database

The most important correctness rule — *at most one vote per member per idea* — is enforced
by a database constraint, not just by application logic:

```python
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=["user", "idea"], name="unique_user_idea_vote"
        )
    ]
```

Putting the rule in the schema means it holds no matter how a vote is written — through the
viewset, the admin, a shell, or two concurrent requests interleaving. Application code
(`get_or_create`) cooperates with this constraint rather than substituting for it, so the
guarantee survives races that an in-Python check would miss.

## 6. Testing: one focused test

Per the spec, the slice ships **exactly one** focused automated test
(`backend/board/tests/test_voting.py`). It authenticates a seeded member, casts a vote,
attempts a second vote, and asserts no additional `Vote` row is created and the annotated
`vote_count` is unchanged — and that a direct duplicate insert raises `IntegrityError`,
confirming the database constraint (§5), not just the view, is doing the enforcing. This
targets the one rule whose violation would be a genuine correctness bug; the other
behaviors are straightforward enough to verify by reading the code and exercising the
running app.
