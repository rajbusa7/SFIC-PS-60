# ShikshaSetu AI - Database Architecture & Migration Guide

## 1. Current Storage Overview

In the development and demonstration environment, ShikshaSetu AI uses a dual-layer store:
- **JSON File Store** (`data/shikshasetu_store.json`): Pre-seeded with realistic Gujarat Primary School data (Model Primary School, Gandhinagar - Class 4A, student Aarav Patel, assessments, division learning gaps, remedial plans, and interactive activities).
- **In-Memory Cache**: Eliminates redundant disk I/O and provides sub-millisecond query responses for teacher and principal dashboards.

## 2. Production Deployment & Vercel Filesystem Considerations

> [!WARNING]
> **Vercel Serverless Function Filesystem is Ephemeral.**
> When running serverless functions on Vercel, the filesystem `/tmp` or project root is read-only or recycled across invocations. Any writes to a local JSON file will NOT persist across serverless function lifecycles or multiple regional instances.

For production multi-school deployment, **PostgreSQL** is the strongly recommended database.

### Why PostgreSQL?
1. **Relational Integrity**: Foreign keys strictly safeguard that assessments, results, learning gaps, and remedial plans always link to valid students and concepts.
2. **ACID Transactions**: Atomic commits ensure that recording reassessment marks and auto-recalculating student gaps happen in a single, rollback-safe transaction.
3. **JSONB Support**: Allows flexible storage of dynamic remedial steps, activity questions, and prompt parameters while maintaining fast relational queries.
4. **Vercel / Cloud Ecosystem**: Works out of the box with **Vercel Postgres**, **Neon**, **Supabase**, or **AWS RDS**.

## 3. Database Schema & Migrations

The database migration files are located in `database/migrations/`:
- `001_initial_schema.sql`: Full DDL schema for schools, classrooms, subjects, concepts, students, assessments, results, learning gaps, remedial plans, activities, and attempts.
- `002_add_indexes.sql`: Composite performance indexes for gap tracking, student progress lookups, and report generation.

Seeds are located in `database/seeds/`:
- `001_seed_data.sql`: Seed data for initial school setup, classes 3A, 4A, 5A, subjects, concepts, and student profiles.
- `seedData.ts`: TypeScript typed seed fixtures.

## 4. Connecting PostgreSQL in Production

To switch from the local JSON store to PostgreSQL in production:
1. Provision a PostgreSQL instance (e.g., Supabase, Neon, or Vercel Postgres).
2. Execute the migrations in order:
   ```bash
   psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
   psql $DATABASE_URL -f database/migrations/002_add_indexes.sql
   psql $DATABASE_URL -f database/seeds/001_seed_data.sql
   ```
3. Set the environment variable in your production deployment (Vercel Project Settings):
   ```env
   DATABASE_URL=postgres://user:password@hostname:5432/shikshasetu_db?sslmode=require
   ```
4. The repository layer (`StudentRepository`, `AssessmentRepository`, `LearningGapRepository`, etc.) provides an abstraction that delegates queries to PostgreSQL when `DATABASE_URL` is configured, while seamlessly falling back to the local JSON store during offline hackathon demonstrations.

## 5. Repository Pattern Architecture

All data operations are encapsulated in repository classes:
```
Controller -> Service -> Repository -> [JsonFileAdapter | PostgresAdapter]
```
No frontend component or API route directly touches disk files or raw queries, preserving testability and safe database migration.
