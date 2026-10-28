# StudySaathi AI (StudySaathi AI)

> **"Every Gap Identified. Every Child Supported."**  
> *Smart Tracking and Remedial Action System for Student Learning Gaps in Primary Schools.*  
> **SFIC Gujarat Hackathon 2026 • Problem Statement: PS-60**  
> **Live Website**: [https://shikshasetu-ai-iota.vercel.app](https://shikshasetu-ai-iota.vercel.app)

---

## 1. Executive Summary & Product Vision

**StudySaathi AI** is a modern, responsive, accessible web application designed to empower primary-school teachers, headmasters, and parents across Gujarat in identifying individual student learning gaps, diagnosing underlying conceptual bottlenecks, executing targeted 5-step concrete remedial plans, and measuring empirical growth over time.

### Core Workflow:
```
Student Registration
  ↓
Diagnostic Assessment (Concept-Level)
  ↓
Concept-Level Analysis
  ↓
Learning-Gap Detection Engine (Rule-based & Explainable)
  ↓
Personalized Remedial Plan (5 Steps + Concrete Low-Cost Manipulatives)
  ↓
Practice Activities (Digital Interactive Quiz & Printable Worksheets)
  ↓
Reassessment & Empirical Verification
  ↓
Progress Tracking (True Percentage-Point Gains)
  ↓
Teacher Intervention & Parent Partnership
```

---

## 2. Project Folder Structure

The project code is organized into clean, dedicated modules separating presentation, business logic, contracts, database persistence, and documentation:

```
shikshasetu-ai/
|
|-- apps/
|   |
|   |-- frontend/                       # Frontend application metadata & client module
|   |   |-- src/                        # Modular frontend architecture
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- README.md
|   |
|   |-- backend/                        # Standalone Node.js & TypeScript Express REST API
|       |-- src/
|       |   |-- routes/                 # Express REST routes (/api/v1/*)
|       |   |-- controllers/            # Route controllers formatting responses
|       |   |-- services/               # Pedagogical, gap analysis, and AI services
|       |   |-- repositories/           # Data access repository layer
|       |   |-- middleware/             # Auth RBAC, rate limiting, CORS, error handling
|       |   |-- validators/             # Request body & parameter validators
|       |   |-- config/                 # Typed environment configuration
|       |   |-- app.ts                  # Express application factory
|       |   |-- server.ts               # Standalone server startup (port 5000)
|       |-- tests/                      # Standalone backend integration tests
|       |-- package.json
|       |-- tsconfig.json
|
|-- packages/
|   |-- shared/                         # Contract specifications shared by frontend & backend
|       |-- src/
|       |   |-- types/                  # Single source of truth for domain types
|       |   |-- schemas/                # Shared validation schemas & rules
|       |   |-- constants/              # Thresholds, subject codes, demo users
|       |   |-- index.ts
|       |-- package.json
|
|-- database/                           # Persistence layer, migrations, and seeds
|   |-- migrations/                     # PostgreSQL schema DDL (001_initial_schema.sql, 002_add_indexes.sql)
|   |-- seeds/                          # SQL seed statements & JSON fixtures
|   |-- README.md                       # Migration and persistence guide
|
|-- src/                                # Next.js Fullstack & UI Layer (Vercel-native)
|   |-- app/
|   |   |-- api/v1/                     # REST API v1 endpoints (Next.js serverless functions)
|   |   |-- dashboard/                  # Teacher & Principal dashboard
|   |   |-- students/                   # Student directory & profile views
|   |   |-- assessments/                # Formative assessment manager & mark entry
|   |   |-- learning-gaps/              # Gap detection & analytics workspace
|   |   |-- remedial-plans/             # 5-step remedial intervention plans
|   |   |-- ai/                         # AI Tutor, Gap Analyzer, Worksheet Generator
|   |   |-- reports/                    # School overview & parent-friendly reports
|   |   |-- page.tsx                    # Landing page with 3D Cinematic ShikshaBot
|   |-- components/                     # Reusable UI & 3D Three.js components
|   |-- services/
|   |   |-- apiClient.ts                # Centralized typed API client
|   |-- context/                        # Auth, Language (EN/GU), Theme, Filter contexts
|   |-- lib/                            # Engines: calculations, gap detection, remedial, AI
|
|-- tests/                              # Root integration test suites
|-- docs/
|   |-- AI_API_SETUP.md                 # Centralized AI Integration, Provider Registry & Security Guide
|   |-- ARCHITECTURE.md                 # 5-tier architecture & request flow
|   |-- API.md                          # Comprehensive REST API v1 reference
|   |-- DEPLOYMENT.md                   # Vercel & standalone cloud deployment guide
|
|-- data/                               # Local persistent demonstration data store
|-- .env.example                        # Documented environment variables template
|-- package.json                        # Root commands (dev, dev:frontend, dev:backend, build, test, lint, typecheck)
|-- tsconfig.json                       # Path aliases (@/*, @backend/*, @shared/*)
|-- README.md
```

---

## 3. Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript.
* **3D & Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), GSAP for cinematic animations.
* **Styling**: Tailwind CSS v4, accessible color contrast tokens, dark/light theme toggle, and print CSS.
* **Backend**:
  - Unified Serverless API: Next.js Route Handlers (`/api/v1/*`)
  - Standalone API: Node.js, Express, TypeScript (`apps/backend`)
* **Layered Architecture**: Route -> Controller -> Service -> Repository -> Database.
* **Database**:
  - Demo/Dev: In-memory store with file-backed JSON (`data/shikshasetu_store.json`)
  - Production: PostgreSQL 14+ (Supabase, Neon, AWS RDS, Vercel Postgres) with migrations in `database/migrations/`
* **Real AI Provider**: Google Gemini (`gemini-1.5-flash`) with child-privacy sanitization, fallback to deterministic pedagogical rule engine when API keys are absent.
* **Test Runner**: Native Node.js test runner via `tsx` (`npm test`).

---

## 4. Installation & Local Development

### Prerequisites:
- Node.js version 20+ (Node 24 supported)
- npm version 10+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Optional)* Add your free Google Gemini API key from [https://aistudio.google.com](https://aistudio.google.com) to enable live generative AI responses. If omitted, the built-in pedagogical rule engine runs transparently.

---

## 5. Development Commands

| Command | Description | Local URL |
|---|---|---|
| `npm run dev` | Runs the unified Next.js fullstack dev server (UI + `/api/v1` APIs) | `http://localhost:3000` |
| `npm run dev:frontend` | Runs the Next.js frontend application | `http://localhost:3000` |
| `npm run dev:backend` | Runs the standalone Express backend server | `http://localhost:5000` |
| `npm run build` | Builds the optimized production bundle with Next.js Turbopack | - |
| `npm run test` | Executes all 50 unit and integration tests across backend, engine, and APIs | - |
| `npm run typecheck` | Validates TypeScript across all workspaces (`tsc --noEmit`) | - |
| `npm run lint` | Runs ESLint | - |

---

## 6. Standalone Backend Startup

To run the standalone Express backend independently:
```bash
npm run dev:backend
```
The server will start on port 5000:
- Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/v1/health`
- Student list: `http://localhost:5000/api/v1/students`

To point the Next.js frontend to the standalone backend, set in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 7. REST API Documentation (v1)

All endpoints use the prefix `/api/v1`. A comprehensive guide is available in [`docs/API.md`](docs/API.md).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health, uptime, and AI provider status |
| `POST` | `/api/v1/auth/login` | Teacher / Principal login |
| `POST` | `/api/v1/auth/logout` | Session logout |
| `GET` | `/api/v1/auth/me` | Current session user |
| `GET` | `/api/v1/students` | List students with classroom and grade filters |
| `GET` | `/api/v1/students/:id` | Student profile details |
| `POST` | `/api/v1/students` | Enroll a new student |
| `PUT` | `/api/v1/students/:id` | Update student profile |
| `DELETE` | `/api/v1/students/:id` | Delete student record (Admin only) |
| `GET` | `/api/v1/students/:id/learning-gaps` | Learning gaps for a specific student |
| `GET` | `/api/v1/students/:id/remedial-plans` | Remedial plans for a specific student |
| `GET` | `/api/v1/assessments` | Formative assessments list |
| `POST` | `/api/v1/assessments` | Create assessment |
| `POST` | `/api/v1/assessments/results` | Submit marks / record post-remediation reassessment |
| `GET` | `/api/v1/learning-gaps` | List learning gaps |
| `POST` | `/api/v1/learning-gaps/analyze` | AI & deterministic learning-gap diagnosis |
| `GET` | `/api/v1/remedial-plans` | List remedial plans |
| `POST` | `/api/v1/remedial-plans/generate` | Generate 5-step concrete remedial action plan |
| `POST` | `/api/v1/worksheets/generate` | Generate printable worksheet with answer key |
| `POST` | `/api/v1/ai/tutor` | Primary pedagogical concept tutor (EN & GU) |
| `POST` | `/api/v1/ai/chat` | Teacher assistant based on real-time classroom telemetry |
| `GET` | `/api/v1/reports/overview` | School-wide mastery distribution and telemetry |

---

## 8. Database Configuration & Migrations

For detailed persistence architecture and PostgreSQL setup, see [`database/README.md`](database/README.md).

To connect PostgreSQL in production:
1. Run migrations in order:
   ```bash
   psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
   psql $DATABASE_URL -f database/migrations/002_add_indexes.sql
   psql $DATABASE_URL -f database/seeds/001_seed_data.sql
   ```
2. Set `DATABASE_URL` in your production environment variables:
   ```env
   DATABASE_URL=postgres://user:password@hostname:5432/shikshasetu_db?sslmode=require
   ```

---

## 9. Vercel Deployment

The live website is deployed at:
[https://shikshasetu-ai-iota.vercel.app](https://shikshasetu-ai-iota.vercel.app)

Deploying updates to Vercel requires **zero special configuration**:
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Organize architecture into frontend, backend, api, database, and shared"
   git push origin main
   ```
2. Vercel automatically detects Next.js at the root, installs dependencies, and runs `npm run build`.
3. All `/api/v1` endpoints and existing features deploy automatically as serverless functions.
4. For details on hosting the standalone Express backend separately on Render or Railway, refer to [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 10. Troubleshooting

| Issue | Cause | Resolution |
|---|---|---|
| `No AI key configured` note in response | `GEMINI_API_KEY` is not defined in `.env.local` | Add `GEMINI_API_KEY=...` to `.env.local` for live AI, or use the transparent built-in pedagogical fallback. |
| Port 5000 in use | Another service is using port 5000 | Set `PORT=5001` in your environment or kill the conflicting process. |
| Reassessment marks not saving | Missing student or concept ID in result payload | Verify payload format in `POST /api/v1/assessments/results` matches `{ results: [{ assessmentId, studentId, conceptId, marksObtained, maximumMarks }] }`. |
