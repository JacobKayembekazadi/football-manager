# DOCS MANIFEST: VIBESTACK GEN-3
**Version:** 1.0 (God Mode)
**Instructions for Cursor:** Index the following documentation URLs using `@Docs` to align with the project's agentic architecture.

## 1. INTERACTION PROTOCOLS (The Nervous System)
### AG-UI Protocol
* **URL:** `https://github.com/ag-ui-protocol/ag-ui`
* **Description:** Standard protocol for agent-to-user events (Thinking, Tool Calling, State Sync).
* **Cursor Focus:** Event schemas, middleware adapters for Python/Node, and bi-directional state sync patterns.

### A2UI (Agent-to-User Interface)
* **URL:** `https://a2ui.org/`
* **Alternative (GitHub):** `https://github.com/google/A2UI`
* **Description:** Google's declarative UI standard for agents.
* **Cursor Focus:** The Standard Component Catalog (JSON specs), Lit/Angular renderers, and "Painting" logic for agents.

## 2. COGNITIVE ORCHESTRATION (The Brain)
### Google Agent Development Kit (ADK)
* **URL:** `https://google.github.io/adk-docs/`
* **Codelab Context:** `https://goo.gle/adk-foundation`
* **Description:** Framework for defining high-level agent goals, constraints, and toolsets.
* **Cursor Focus:** `Agent`, `Goal`, `Constraint` classes, and multi-agent delegation logic.

### CopilotKit v2
* **URL:** `https://docs.copilotkit.ai/whats-new/v1-50`
* **Description:** Agentic UI glue layer for React with built-in thread persistence.
* **Cursor Focus:** `useAgent` hook, `@copilotkit/react-core/v2` subpaths, and thread/session management.

### Model Context Protocol (MCP)
* **URL:** `https://modelcontextprotocol.io/`
* **Description:** Anthropic’s standard for connecting agents to data sources.
* **Cursor Focus:** Building MCP Servers, resource schemas, and tool-sharing across models.

## 3. SENSORY & MEDIA (The Senses & Soul)
### Vision-Agents (GetStream)
* **URL:** `https://github.com/GetStream/Vision-Agents`
* **Description:** Low-latency video/audio AI agents for real-time processing.
* **Cursor Focus:** SFU event handling, WebRTC integration, and vision model prompts.

### Remotion
* **URL:** `https://www.remotion.dev/docs/`
* **Description:** Programmatic video generation using React components.
* **Cursor Focus:** Server-side rendering (SSR) of MP4s, composition logic, and Inngest triggers.

## 4. RELIABILITY & DX (The Immune System)
### Inngest
* **URL:** `https://www.inngest.com/docs`
* **Description:** Durable execution and event-driven flow control.
* **Cursor Focus:** `step.run` logic, retry strategies, and background AI workflow orchestration.

### Biome
* **URL:** `https://biomejs.dev/guides/getting-started/`
* **Description:** High-speed Rust-based tool for formatting and linting.
* **Cursor Focus:** Performance-first code hygiene.