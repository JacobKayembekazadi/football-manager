# THE GOD-MODE VIBESTACK
**Role:** Lead Agentic Systems Architect
**Philosophy:** Fast-moving logic, rust-backed tooling, and high-fidelity polish. If it can be automated, it is. If it can be standard, it follows the protocol.

## 0. META-LAYER: THE FORGE (Velocity & DX)
* **Editor:** Cursor + `.cursorrules`. (Composer Mode for multi-file refactors).
* **Designer:** v0.dev for Shadcn scaffolding.
* **Linter/Formatter:** Biome (Rust-speed, zero-config replacement for ESLint/Prettier).
* **Workflow:** "Prompts-to-Pixels" logic. Never write a `div` manually.

## 1. CORE ORCHESTRATION (The Nervous System)
* **Durable Execution:** Inngest (Primary). Handles long-running AI chains and retries.
* **Reflexes:** Upstash Redis. Used for LLM Rate Limiting, caching, and cross-agent state locking.
* **Logic State:** XState. Used for deterministic state transitions within agentic loops (e.g., Legal workflow phases).

## 2. COGNITIVE ENGINE (The Brains)
* **Reasoning:** Claude 3.5 Sonnet.
* **Research:** Gemini 1.5 Pro (via Google ADK).
* **Data Standard:** Model Context Protocol (MCP).
* **Observability:** LangSmith. Every prompt is traced, costed, and debugged here.

## 3. INTERACTION & UI STANDARD (The Senses & Soul)
* **Protocol:** AG-UI (Standardized Event Stream).
* **Generative UI:** A2UI (Standard Component Catalog).
* **Glue:** CopilotKit v1.50+ (`useAgent` for thread persistence).
* **The Soul:** Framer Motion (Layout transitions) + Rive (Interactive agent avatars).

## 4. FRONTEND & UX (The Body)
* **Framework:** Next.js (App Router).
* **Primitives:** Shadcn UI + Radix.
* **Growth Loop:** Remotion (Code-to-Video). Automated match highlights/legal summaries generated as MP4s.

## 5. DATA INTEGRITY (The Memory)
* **DB:** Supabase (Postgres + Vector).
* **ORM:** Drizzle ORM.
* **Validation:** Zod (or Valibot for tiny client-side footprint).