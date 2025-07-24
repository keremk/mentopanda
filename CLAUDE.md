# Tinker-Box Development Guide

## Build & Development Commands
- 🚀 `pnpm dev` - Run development server with turbopack
- 🔨 `pnpm build` - Build for production
- 🧹 `pnpm lint` - Run ESLint
- 🧪 `pnpm typecheck` - Run typecheck
- 🧪 `pnpm test` - Run all tests with vitest
- 🧪 `pnpm test:integration` - Run integration tests only
- 🧪 `pnpm test:db` - Run database tests
- 🧪 `vitest [test-file-path]` - Run a single test file

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, use explicit types (avoid `any`)
- **React**: Use functional components with hooks, follow Next.js 15 form practices
- **File Structure**: Follow existing patterns in `/src` directory
- **Imports**: Use absolute imports with `@/*` alias for src directory
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types
- **Forms**: Use autosaving pattern with debounce (1000ms) and userModified state
- **Error Handling**: Use try-catch with specific error types
- **Styling**: Use Tailwind with appropriate UI components from `/src/components/ui`
- **Markdown**: Follow conventions in `.cursor/rules/400-md-docs.mdc`

## Database & Authentication
- Use server actions instead of direct Supabase calls
- Follow RLS policies in migrations
- Run database tests with transaction isolation