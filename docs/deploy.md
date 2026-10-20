# Deployment & Compose Guide

This guide covers running the Incursion Track 3 platform using Docker Compose for local development and demos, details the container setup, and identifies the missing architecture required before production deployment.

---

## 1. Local Full-Stack Compose (Development & Demo)

The repository provides a [`docker-compose.yml`](file:///docker-compose.yml) specification designed for rapid local testing and demo walkthroughs.

### 1.1 Prerequisites
1. **Docker Engine & Docker Compose**: Installed and running.
2. **Environment File**: A `.env` file present in the project root based on [`.env.example`](file:///.env.example):
   ```ini
   SUPABASE_URL=http://host.docker.internal:54321
   SUPABASE_KEY=your_anon_or_service_key
   DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres
   GITHUB_TOKEN=your_github_token_here
   GEMINI_API_KEY=your_gemini_key_here
   ```
   *(Note: If connecting to a local Supabase CLI instance from inside a Docker container on macOS or Windows, use `host.docker.internal` instead of `localhost` or `127.0.0.1`).*
3. **Database Setup**: Ensure PostgreSQL/Supabase is initialized and has executed [`temp_supabase/schema.sql`](file:///temp_supabase/schema.sql) and [`temp_supabase/seed.sql`](file:///temp_supabase/seed.sql).

### 1.2 Running the Stack
Run the following command from the repository root:
```bash
docker-compose up --build
```

### 1.3 Container Architecture in Compose
- **Backend Service (`backend`)**:
  - Built from [`backend/Dockerfile`](file:///backend/Dockerfile) with build context `.`.
  - Exposes port `8000:8000`.
  - Mounted volumes: `./backend`, `./integrations`, `./cache`, and `./samples` are mounted into `/app/` for hot-reloading.
  - Loads environment variables from `.env`.
  - Starts with: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Frontend Service (`frontend`)**:
  - Built from [`frontend/Dockerfile`](file:///frontend/Dockerfile) with build context `./frontend`.
  - Exposes port `3000:3000`.
  - Mounted volumes: `./frontend:/app` and anonymous `/app/node_modules`.
  - Environment: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
  - Depends on `backend`.
  - Starts with: `npm run dev`.

### 1.4 Accessing the Services
- **Web User Interface**: `http://localhost:3000`
- **FastAPI Backend API**: `http://localhost:8000`
- **Interactive API Swagger UI**: `http://localhost:8000/docs`
- **Backend Health Check**: `http://localhost:8000/health`

---

## 2. Production Deployment Readiness

> [!WARNING]
> The current repository configuration is designed strictly for **local development and demonstration scenarios**. It is **not** production-ready.

The following sections document the specific gaps and configuration changes required prior to any production rollout:

### 2.1 Missing Production Container Configurations
1. **Frontend Production Mode**:
   - [`frontend/Dockerfile`](file:///frontend/Dockerfile) currently sets `ENV NODE_ENV=development` and executes `CMD ["npm", "run", "dev"]`.
   - **Production Requirement**: A multi-stage Docker build that runs `npm run build` and serves static optimized assets using `next start` or an Nginx/Node standalone server.
2. **Backend Server Optimization**:
   - The backend currently runs Uvicorn with `--reload` enabled and a single process worker.
   - **Production Requirement**: Remove `--reload`, configure a process supervisor (e.g. Gunicorn with multiple Uvicorn worker processes: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app.main:app`), and tune keep-alive and request timeout settings.

### 2.2 Security & Authentication Gaps
1. **API Authentication & Authorization**:
   - As documented in the [API Contract](file:///docs/api-contract.md), the backend provides **no authentication**. Any user with network access can execute runs, alter overrides, or upload datasets.
   - **Production Requirement**: Implement JWT or OAuth2 Bearer authentication across all `/api/*` routes, integrate Supabase Auth tokens, and add role-based access control (RBAC) separating Reviewers from Organizers.
2. **CORS Restrictions**:
   - [`backend/app/main.py`](file:///backend/app/main.py) configures `allow_origins=["*"]`.
   - **Production Requirement**: Restrict CORS origins strictly to the authorized production frontend domain.
3. **Database Row Level Security (RLS)**:
   - In [`temp_supabase/schema.sql`](file:///temp_supabase/schema.sql), RLS is disabled across all tables (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY`).
   - **Production Requirement**: Enable RLS policies requiring authenticated user IDs or service role claims for all database operations.

### 2.3 Distributed State & Worker Architecture
1. **Background Job Persistence**:
   - Background enrichment jobs in [`backend/app/core/jobs.py`](file:///backend/app/core/jobs.py) store state in an in-memory dictionary `JOBS_MEMORY` backed by a local JSON file in `cache/`.
   - **Production Requirement**: Replace in-memory state with a persistent message broker and worker queue (e.g., Celery, Redis Queue, or AWS SQS) backed by database job records.
2. **Distributed Cache & Storage**:
   - Resume text and external API responses are cached as flat files in `cache/`.
   - **Production Requirement**: Use a centralized distributed cache (e.g., Redis or Valkey) and dedicated object storage (e.g., Supabase Storage, AWS S3, or Google Cloud Storage) for resume binaries.

### 2.4 Infrastructure, Ingress & CI/CD
1. **TLS & Ingress**:
   - No reverse-proxy, TLS termination, or API gateway is configured in the repository.
   - **Production Requirement**: Place the application behind an Ingress Controller, Nginx/Caddy reverse proxy, or Cloudflare with automated HTTPS certificates and rate limiting.
2. **Infrastructure as Code & CI/CD**:
   - No Kubernetes manifests, Terraform scripts, or automated deployment pipelines exist in the repository.
   - **Production Requirement**: Establish automated GitHub Actions / GitLab CI workflows for testing, container image scanning, and deployment.

---

## 3. Related Documents

- [README Setup Instructions](file:///README.MD)
- [API Specification Contract](file:///docs/api-contract.md)
- [Scale & Benchmark Report](file:///docs/test-report.md)