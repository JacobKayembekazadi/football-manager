# LLM Working Instructions

**IMPORTANT: Read this file FIRST before making any changes to this codebase.**

## Mandatory Context Update Rule

After completing ANY work session on this project, you MUST:

1. Update `docs/CONTEXT.md` with:
   - What you changed
   - Why you changed it
   - Any new patterns or conventions introduced

2. Update `docs/CHANGELOG.md` with:
   - Date and brief summary
   - Files modified
   - Features added/changed

3. If you modified architecture, update `docs/ARCHITECTURE.md`

## Before Starting Work

1. Read `docs/CONTEXT.md` to understand current state
2. Read `docs/ARCHITECTURE.md` to understand technical decisions
3. Check `docs/CHANGELOG.md` for recent changes
4. Review `docs/FEATURE_SPECS.md` for planned features

## Code Style Requirements

- **UI**: All user-facing output must be styled (glass-card pattern, proper typography)
- **No raw code appearance**: Everything should look designed, not like data dumps
- **Tailwind CSS**: Use existing utility classes, extend in `index.css` if needed
- **TypeScript**: Strict types, no `any` unless absolutely necessary
- **Components**: Functional React with hooks

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- Services: `camelCase.ts` (e.g., `userService.ts`)
- Types: Define in `types.ts` or co-locate with service
- Docs: `UPPER_SNAKE_CASE.md`

## Testing Changes

Always run `npm run build` before committing to catch TypeScript errors.

## Git Workflow

- Commit with clear messages: `feat:`, `fix:`, `docs:`, `refactor:`
- Push to the designated branch
- Update context docs BEFORE final commit

---

**Last updated by:** Claude (Opus 4.5)  
**Date:** 2026-01-21  
**Session:** Independence & Leverage implementation - Phase 1
