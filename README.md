# Full-Stack Recommendation Platform — MeetEat Hackathon Project

MeetEat is a full-stack group restaurant recommendation app for London dining plans: a host creates a shared room, participants add their location and dining constraints, the backend ranks restaurants with a deterministic consensus algorithm, and the group votes on the final choice. The project was originally built during a hackathon (HackLondon), and this repository presents the finished implementation — React frontend, FastAPI backend, PostgreSQL persistence, Docker, CI, and an optional AI explanation layer — as a full-stack software engineering project.

## Overview

Group dining decisions are awkward because every person has different travel limits, budgets, cuisines, dietary requirements, and occasion expectations. MeetEat turns those constraints into a shared decision workflow: collect each participant's constraints in one room, rank restaurants deterministically and transparently, explain why each recommendation fits the group, and persist votes so the group can retrieve the winning option later from the same room URL.

## System Architecture

![System Architecture](docs/images/system-architecture.svg)

- **Frontend** — a React 19 + TypeScript + Vite single-page app that talks to the backend through a typed `fetch`-based API client.
- **Backend / API boundary** — a FastAPI service exposing REST endpoints for rooms, participants, recommendations, and votes.
- **Recommendation layer** — a deterministic scoring engine (pure Python, no framework dependencies) that ranks a static London restaurant seed dataset against each room's participants.
- **Persistence** — PostgreSQL, accessed through SQLAlchemy 2.x and versioned with Alembic migrations.
- **External integration** — an optional, server-side-only call to the Z.AI (`glm-5.1`) API that generates a natural-language explanation for an already-ranked result. The AI never selects restaurants, changes rankings, or overrides hard filters — it only explains persisted results using structured context the backend supplies, and the app falls back to a deterministic explanation whenever the key is missing or the call fails.

## Key Features

- Shared room creation with shareable room-code URLs (`/room/{code}`), so a group can reopen the same session later.
- Anonymous, browser-local participant identity (hashed token) used to authorize edits and votes without accounts or passwords.
- Participant persistence covering location, cuisine preferences, budget, dietary needs, minimum rating, and travel mode/time.
- Deterministic restaurant recommendation engine with hard filtering and weighted scoring.
- PostgreSQL persistence for rooms, participants, recommendation runs, ranked results, votes, and AI explanation metadata.
- Optional Z.AI / GLM explanations generated server-side, cached per result, with graceful fallback when unavailable.
- Dockerized backend + database environment via Docker Compose.
- GitHub Actions CI covering frontend tests/build/E2E, backend tests, and a PostgreSQL integration check.

## Recommendation Workflow

![Recommendation and Data Flow](docs/images/recommendation-flow.svg)

The scoring engine (`backend/app/domain/scoring.py`) is the single source of truth for ranking, and it is deliberately isolated from FastAPI, React, and the database so it stays independently testable:

1. **Hard filters** remove restaurants that exceed a participant's budget, fall below their minimum rating, match a disliked cuisine, miss a dietary requirement, aren't open (when open-now is set), or exceed anyone's maximum travel time.
2. **Weighted scoring** combines a geography score (average travel time and cross-participant variance), a cuisine-match score, a quality score (rating + review volume), and an occasion-fit score into a single total.
3. Results are sorted deterministically by total score, and the top three are labelled `best`, `close`, and `taste` archetypes.
4. The ranked run is persisted, and an explanation is optionally generated server-side and cached against that result before being returned to the frontend.

## Full-Stack Application Flow

![Application Flow](docs/images/application-flow.svg)

From the landing screen, a host starts a room from scratch or with a demo sandbox of five simulated participants. Each participant is added through a modal that geocodes a UK postcode to coordinates and persists their constraints to the room. Triggering analysis calls the recommendations endpoint, the loading screen waits for the deterministic engine to run, and the results screen renders the ranked list with score breakdowns and optional AI explanations. Each participant can cast one vote (a later vote from the same participant updates their choice), and the winner screen reflects the room's persisted winning result — reachable again later via the same room URL. API failures surface through a reusable error banner rather than failing silently.

## Tech Stack

**Frontend**
- React 19, TypeScript, Vite 6
- Tailwind CSS 4, Motion (animation), Lucide icons
- `@vis.gl/react-google-maps` for a lazy-loaded map visualization

**Backend**
- Python, FastAPI, Pydantic
- SQLAlchemy 2.x, Alembic migrations

**Database / Persistence**
- PostgreSQL (SQLite used only as the fast local backend for unit tests)

**AI Integration**
- Z.AI OpenAI-compatible API, model `glm-5.1` (optional, server-side only)

**Testing**
- Vitest + React Testing Library (frontend unit/component tests)
- Playwright + `@axe-core/playwright` (end-to-end and accessibility tests, Chromium/Firefox/WebKit)
- Pytest + FastAPI `TestClient` (backend unit/API tests), plus a PostgreSQL integration verification script

**Tooling / Deployment**
- Docker Compose (backend + PostgreSQL)
- GitHub Actions CI (frontend, backend, PostgreSQL integration jobs)
- pnpm workspaces

## Engineering Highlights

- **API design** — REST endpoints are organized by resource (`rooms`, `participants`, `recommendations`, `votes`) with a typed frontend client wrapping every call.
- **Separation of concerns** — the recommendation domain logic has no FastAPI, database, or React dependencies, so it can be unit-tested in isolation from the web layer.
- **Auth without accounts** — participant edits and votes are authorized with a per-participant token that is hashed (SHA-256) before storage and compared with `hmac.compare_digest`, rather than storing the raw token.
- **Graceful AI degradation** — the AI explanation path is designed to fail safely: a missing key, timeout, rate limit, or malformed response all fall back to a deterministic explanation instead of breaking recommendation generation.
- **Frontend accessibility** — dialog semantics, initial focus and Escape handling, labelled inputs, grouped toggle choices, accessible icon buttons, pressed-state switches, semantic landmarks/headings, and higher-contrast text tokens, verified with automated `axe-core` checks in Playwright.
- **Bundle discipline** — the Google Maps visualization is lazy-loaded out of the initial bundle, and a bundle-size budget script checks the built output.
- **Reproducible environment** — Docker Compose runs Alembic migrations before starting the API, and CI runs a real PostgreSQL integration check in addition to the fast SQLite-backed unit test suite.

## Database Model

Core tables (see `backend/alembic/versions/` for the migration history):

- `rooms` — shared room code, title, occasion, rain mode, open-now setting.
- `participants` — room member constraints, travel preferences, and hashed participant token.
- `recommendation_runs` — a persisted execution of the deterministic algorithm.
- `recommendation_results` — ranked restaurant snapshots, score breakdowns, fallback reasons, and AI explanation metadata.
- `votes` — one active vote per participant per recommendation run.

## API Overview

```http
GET  /health

POST   /api/rooms
GET    /api/rooms/{room_code}
PATCH  /api/rooms/{room_code}

POST   /api/rooms/{room_code}/participants
PATCH  /api/participants/{participant_id}
DELETE /api/participants/{participant_id}

POST /api/rooms/{room_code}/recommendations
GET  /api/rooms/{room_code}/recommendations/latest
POST /api/recommendations/{result_id}/explain

POST /api/rooms/{room_code}/votes
GET  /api/rooms/{room_code}/winner
```

## Repository Structure

```
.
├── src/                    # React + TypeScript frontend
│   ├── api/                #   typed fetch client for the FastAPI backend
│   ├── components/         #   screens (Landing, Room, Loading, Results, Winner) + UI
│   ├── data/                #   postcode → coordinate helper + local demo data
│   └── utils/               #   i18n strings
├── backend/
│   ├── app/
│   │   ├── domain/          #   deterministic scoring engine (framework-independent)
│   │   ├── services/        #   room, recommendation, vote, and AI explanation services
│   │   ├── routes/          #   FastAPI routers per resource
│   │   ├── db/               #   SQLAlchemy models + session
│   │   └── data/             #   static London restaurant seed data
│   ├── alembic/              #   database migrations
│   ├── tests/                 #   Pytest unit/API tests
│   └── scripts/verify_postgres.py  # PostgreSQL integration check used by CI
├── e2e/                     # Playwright end-to-end + accessibility specs
├── docs/images/             # architecture and workflow diagrams (this README)
├── docker-compose.yml       # backend + PostgreSQL
└── .github/workflows/ci.yml # CI: frontend, backend, PostgreSQL integration
```

## Local Setup

**Backend**

```sh
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

**Environment** (see `.env.example`)

```sh
DATABASE_URL="postgresql+psycopg://meeteat:meeteat@localhost:5432/meeteat"
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
VITE_API_BASE_URL="http://localhost:8000"
ZAI_API_KEY=""   # optional — leave empty for deterministic fallback explanations
```

## Running the Application

**Docker (backend + database)**

```sh
docker compose up --build
curl http://localhost:8000/health
```

The backend container runs Alembic migrations before starting Uvicorn.

**Frontend** (run separately)

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

## Tests / Validation

**Backend**

```sh
cd backend
PYTHONPATH=. pytest
```

**PostgreSQL integration verification**

```sh
docker compose up -d postgres
cd backend
DATABASE_URL=postgresql+psycopg://meeteat:meeteat@localhost:5432/meeteat \
PYTHONPATH=. python scripts/verify_postgres.py
```

**Frontend**

```sh
pnpm run lint          # tsc --noEmit
pnpm test              # Vitest unit/component tests
pnpm run build         # production build
pnpm run check:bundle  # bundle-size budget check
pnpm run test:e2e      # Playwright end-to-end + accessibility tests
```

CI (`.github/workflows/ci.yml`) runs all of the above — frontend type-checking, unit tests, production build, Playwright E2E, backend tests, and the PostgreSQL integration check — on every push and pull request.

## Security Considerations

- `ZAI_API_KEY` is backend-only and is never exposed through `VITE_*` variables.
- `.env` files are excluded from version control (`.env.example` documents the required variables).
- AI provider failures never break recommendation generation.
- The `/health` endpoint exposes only high-level status, not credentials or environment values.
- Participant identity is an anonymous, browser-local hashed token, not account-based authentication.
- Room codes are convenient sharing tokens, not an access-control boundary.

## Known Limitations

- No full user authentication or authorization — participant identity is anonymous and browser-local.
- No production-managed restaurant catalogue; recommendation data is a static London seed dataset.
- The Google Maps visualization requires a separately configured frontend API key.
- The AI layer is a result-explanation service, not a conversational assistant.

## Future Improvements

- A stronger room-membership/session model.
- A managed PostgreSQL deployment target.
- Production observability and structured logging.
- An admin workflow for maintaining the restaurant catalogue.
- Broader end-to-end coverage for shared-room edge cases.

## Deployment Notes

A simple deployment split:

- **Frontend**: Vercel or Netlify (`pnpm run build`).
- **Backend**: Render, Railway, or Fly.io (`alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Database**: managed PostgreSQL.

Required environment variables: `DATABASE_URL`, `VITE_API_BASE_URL`, and `ZAI_API_KEY` only if AI explanations should be enabled.

## Hackathon Background

MeetEat began as a hackathon project (HackLondon) built to solve a real, recognizable group-decision problem under time constraints. This repository keeps that origin as background context while presenting the finished, working implementation — the React/FastAPI/PostgreSQL application, its deterministic recommendation engine, its test suite, and its CI pipeline — as the primary technical artifact.
