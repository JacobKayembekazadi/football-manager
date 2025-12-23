# THE PHYSICS OF SOFTWARE: AGENTIC LAWS & CONSTRAINTS
**Version:** 2026.1 (God Mode)
**Context:** These are the immutable laws for this project. All code suggestions must be audited against these principles.

## 1. THE LAW OF IDEMPOTENCY (Distributed Resilience)
- **Problem:** AI Agents retry actions when they timeout or get confused.
- **Law:** Every non-GET API route and Inngest function MUST be idempotent.
- **Requirement:** Implement `idempotencyKey` checking for all database writes and third-party integrations (Stripe, FedEx, etc.). If a key is reused, return the original success result, do not re-run the logic.

## 2. THE LAW OF EVENTUAL CONSISTENCY (Nervous System)
- **Problem:** Waiting for deep AI chains or carrier APIs inside an HTTP request kills UX.
- **Law:** "Fire and Forget" for heavy lifting.
- **Requirement:** - Use **Inngest** for any task taking >2 seconds. 
    - The API should return `202 Accepted` immediately with a `jobId`.
    - The UI must use **AG-UI events** to update the user when the background job completes.

## 3. THE LAW OF DETERMINISTIC STATE (Immune System)
- **Problem:** Boolean spaghetti (`isLoading`, `isError`, `isSuccess`) creates "Impossible States."
- **Law:** Logic must be modeled as a Finite State Machine (FSM).
- **Requirement:** - Use **XState** or a strict TypeScript `status` union (e.g., `status: 'idle' | 'scanning' | 'resolving' | 'complete'`). 
    - The UI components must only render based on these explicit states.

## 4. THE LAW OF THE AST (The DNA)
- **Problem:** Manual refactoring of boilerplate is slow and error-prone.
- **Law:** Automate the mundane via the Syntax Tree.
- **Requirement:** If a refactor affects >10 files (e.g., changing Zod to Valibot), propose a **ts-morph** or **jscodeshift** script instead of manual editing.

## 5. THE LAW OF NATIVE TASTE (The Soul)
- **Problem:** AI generates generic, static "Bootstrap-style" interfaces.
- **Law:** Motion and Typography are first-class features.
- **Requirement:** - **Micro-interactions:** Every state transition must use **Framer Motion** `layoutId` or `AnimatePresence`. 
    - **A2UI Compliance:** Agents must never send raw Markdown for data visualization; they must "speak" **A2UI JSON** to trigger native dashboard widgets.
    - **Copywriting:** Use human-centric, high-utility microcopy. No "Error 500"; use "The agent is re-routing your request, give us 5 seconds."

## 6. THE LAW OF OBSERVABILITY (The Microscope)
- **Problem:** You cannot debug a non-deterministic AI agent turn-by-turn.
- **Law:** Traces over Logs.
- **Requirement:** Every Agent action MUST be wrapped in a **LangSmith** or **OpenTelemetry** span. If a tool fails, the trace must capture the exact input/output that caused the hallucination.