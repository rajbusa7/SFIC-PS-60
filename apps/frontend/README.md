# ShikshaSetu AI - Frontend Application

## Overview
The frontend of ShikshaSetu AI is built with Next.js 16 (App Router), React 19, Tailwind CSS, Three.js / React Three Fiber (for the cinematic 3D ShikshaBot humanoid), Lucide icons, and Recharts.

## Architecture
- **Centralized API Client**: Communicates with the backend REST API via `src/services/apiClient.ts`.
- **Environment Driven**: `NEXT_PUBLIC_API_URL` controls the API target (defaults to same-origin `/api/v1` for zero-config Vercel deployment, or `http://localhost:5000/api/v1` when developing with the standalone backend).
- **Multi-Role Support**: Teacher dashboard and Principal administrative dashboard with role-based feature gating.
- **Bilingual Interface**: Native English and Gujarati (ગુજરાતી) support across all views.
- **Client-Side State**: Context providers for authentication, theme (dark/light/system), language, and classroom filters.

## Key Modules & Features
1. **Public Landing Page**: Interactive 3D ShikshaBot with real-time mouse tracking and lighting.
2. **Teacher & Principal Dashboards**: Telemetry metrics, active gaps, and class performance trends.
3. **Student Directory**: Student management, enrollment tracking, and profile drill-downs.
4. **Assessment Management**: Creation of formative tests and multi-student mark entry.
5. **Learning Gap Analyzer**: Evidence-based diagnostic cards with deterministic calculations and AI insights.
6. **Remedial Plan Workspace**: 5-step concrete intervention workflows with low-cost teaching materials.
7. **AI Workspace**: AI Tutor, Teacher Pedagogical Assistant, and Printable Worksheet Generator.
8. **Interactive Activities**: Gamified student learning activities and progress recording.
