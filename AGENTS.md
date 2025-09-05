# Repository Guidelines

## Project Structure & Modules
- `src/app`: Next.js routes and server actions.
- `src/components`: Reusable UI; files use kebab-case (e.g., `openai-chat.tsx`).
- `src/lib`, `src/utils`, `src/hooks`: Shared logic and helpers.
- `src/tests`: `unit/` and `integration/` tests, plus setup utils.
- `src/scripts`: Node/TS scripts (run with `tsx`).
- `public/`: Static assets. `supabase/`: Local config and migrations.

## Build, Test, and Dev
- `pnpm dev`: Run Next.js locally with Turbopack.
- `pnpm build`: Production build; typecheck during build.
- `pnpm start`: Start the built app.
- `pnpm lint`: ESLint (Next config + TS rules).
- `pnpm typecheck`: TypeScript no‑emit check.
- `pnpm test`, `pnpm test:unit`, `pnpm test:integration`: Vitest suites.
- `pnpm test [test-file-path]`: Run single test file.
- `pnpm test:db`: Supabase test DB; `pnpm test:cleanup`: remove test data.
- `pnpm email:dev`: Email preview server from `src/emails` on port 3001.

## Coding Style & Naming
- TypeScript strict mode; prefer types over interfaces, avoid enums.
- Components/hooks: default exports allowed; prefer function components.
- Filenames: kebab-case for `.ts/.tsx`; tests end with `.test.ts`.
- Imports: use `@/*` alias for `src/*`; use absolute imports.
- Formatting: Prettier defaults; enable format‑on‑save.
- Variables/functions: camelCase; Components/types: PascalCase.
- Error handling: Early returns for error conditions, guard clauses for validation.
- Use Zod for form validation with useActionState + react-hook-form.
- Minimize 'use client'; favor server components.

## Testing Guidelines
- Framework: Vitest (`node` env). Setup file: `src/tests/setup.ts`.
- Integration tests hit Supabase; use a test instance and `.env.local`.
- Minimum: cover new logic with unit tests; add integration tests when touching DB/storage.
- Run: `pnpm test:unit` locally; CI runs `pnpm test`.

## Commits & Pull Requests
- Conventional commits seen in history: `feat:`, `fix:`, `chore:`.
- PRs: include purpose, linked issues, and screenshots/GIFs for UI.
- Before opening: `pnpm lint && pnpm typecheck && pnpm test`.

## Security & Configuration
- Do not commit secrets. Use `.env.local` for dev/testing.
- Required vars for tests: Supabase URL/Anon key; service role key for admin test helpers.
- Prefer test projects/data; cleanup with `pnpm test:cleanup` after integration runs.
- Always use Supabase MCP to inspect database schema.
- NO tool calls for migrations - done manually.

