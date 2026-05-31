# Feature Voting Board

An internal tool that lets a product team sign in, propose feature ideas, and vote
on the ideas they support. It is a single repository containing two independently
runnable applications:

- **`backend/`** — a Django + Django REST Framework service (token auth, SQLite),
  serving the API on port `8000`.
- **`frontend/`** — a Next.js (App Router) app operated as a client-rendered SPA,
  served by the Next.js dev server on port `3000`.

Vote counts are derived at query time (never stored), and the single-vote rule is
enforced by a database uniqueness constraint. See `SOLUTION.md` for the design
write-up and trade-offs.

## Prerequisites

- Python 3.10+ (Django 5.2)
- Node.js 18.18+ (Next.js 14)

## Backend setup (Django, port 8000)

Run these from the `backend/` directory.

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies (Django, djangorestframework, django-cors-headers)
pip install -r requirements.txt

# Create the SQLite schema (includes the unique-vote constraint)
python manage.py migrate

# Seed demo team members and their auth tokens
python manage.py seed_users

# Start the API server on http://localhost:8000
python manage.py runserver
```

### Seeded credentials

`seed_users` creates two demo team members you can sign in with:

| Username | Password      |
| -------- | ------------- |
| `alice`  | `password123` |
| `bob`    | `password123` |
| `abo`    | `password123` |
| `ako`    | `password123` |

The command is safe to re-run; it uses `get_or_create` and does not reset existing
passwords.

## Frontend setup (Next.js, port 3000)

Run these from the `frontend/` directory, with the backend already running.

```bash
cd frontend

# Point the app at the backend (defaults to http://localhost:8000)
cp .env.local.example .env.local

# Install dependencies
npm install

# Start the Next.js dev server on http://localhost:3000
npm run dev
```

Then open http://localhost:3000 in your browser.

### Environment variable

`NEXT_PUBLIC_API_URL` is the base URL of the Django backend the frontend talks to.
`.env.local.example` sets it to `http://localhost:8000`; copy that file to
`.env.local` and adjust only if the backend runs elsewhere. If the variable is
unset, the API client falls back to `http://localhost:8000`.

## API endpoints

| Method & Path                      | Auth  | Purpose                                                  |
| ---------------------------------- | ----- | -------------------------------------------------------- |
| `POST /api/auth/token/`            | open  | Sign in; returns the member's persistent token           |
| `GET /api/ideas/?sort=popularity\|recent` | open  | List ideas with annotated `vote_count` (defaults to popularity) |
| `POST /api/ideas/`                 | token | Create an idea                                           |
| `POST /api/ideas/{id}/vote/`       | token | Cast the caller's vote on an idea (idempotent)           |
| `DELETE /api/ideas/{id}/vote/`     | token | Remove the caller's vote from an idea (idempotent)       |

Authenticated requests pass the token in the `Authorization: Token <key>` header.

## CORS

Because the two apps run on different origins in development, the backend uses
`django-cors-headers` and allows requests from `http://localhost:3000`
(`CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`). If you run the frontend
on a different origin, update that setting accordingly.
