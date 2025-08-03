# Tinker-Box Agent Guide

## Build & Commands
- `pnpm dev` - Start development server with turbopack
- `pnpm build` - Build for production
- `pnpm lint` - ESLint checking
- `pnpm typecheck` - TypeScript type checking
- `pnpm test` - Run all tests with vitest
- `pnpm test [test-file-path]` - Run single test file
- `pnpm test:integration` - Run integration tests only
- `pnpm test:db` - Run database tests

## Architecture
- Next.js 15 App Router with TypeScript & Tailwind CSS
- Supabase for database/auth (use server actions, not direct client calls)
- React 19 with functional components only
- Data layer in `/src/data` always tested with integration tests
- Forms: Consult `/product/eng/training-editing-architecture` unless told otherwise

## Code Style (from .cursorrules & CLAUDE.md)
- TypeScript strict mode, prefer types over interfaces, avoid enums
- Functional components with hooks, minimize 'use client'
- Use `@/*` imports for src directory
- camelCase for variables/functions, PascalCase for components/types
- Early returns for error conditions, guard clauses for validation
- Use Zod for form validation with useActionState + react-hook-form
- Always use Supabase MCP to inspect database schema
- NO tool calls for migrations - done manually
