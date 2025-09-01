# Tinker-Box Development Guide

## Build & Development Commands
- 🚀 `pnpm dev` - Run development server with turbopack
- 🔨 `pnpm build` - Build for production
- 🧹 `pnpm lint` - Run ESLint
- 🧪 `pnpm typecheck` - Run typecheck
- 🧪 `pnpm test` - Run all tests with vitest
- 🧪 `pnpm test:integration` - Run integration tests only
- 🧪 `pnpm test:db` - Run database tests
- 🧪 `pnpm test [test-file-path]` - Run a single test file

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, use explicit types (avoid `any`)
- **React**: Use functional components with hooks, follow Next.js 15 form practices
- **File Structure**: Follow existing patterns in `/src` directory
- **Imports**: Use absolute imports with `@/*` alias for src directory
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types
- **Forms**: Always consult the architecture documentation in `/product/eng/training-editing-architecture` unless specifically instructed not to.
- **Error Handling**: Use try-catch with specific error types
- **Styling**: Use Tailwind with appropriate UI components from `/src/components/ui`
- **Markdown**: Follow conventions in `.cursor/rules/400-md-docs.mdc`

## Database & Authentication
- Always use Supabase MCP to inspect the most recent database schema
- Use server actions instead of direct Supabase calls
- Follow RLS policies in migrations
- Always use integration tests for testing the data layer functions in `/src/data` folder.
- When writing integration tests for data layer, always consult the architecture and patterns document in `product/eng/integration-testing-architecture.md`
- DO NOT use tool calls to create or push migrations. They are done manually.
- Always search for the real types. Do not use any, do not cast using "as", search the SDK, find the right exported types and use them. If you cannot find them, then first warn the user without making changes and resorting to "any" or casting "as" or using made up type definitions in the file by redeclaring them.