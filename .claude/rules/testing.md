# Testing Rules

## Framework

- Vitest for all tests
- Run: `pnpm run test` (watch mode by default) or `npx vitest run` (single run)

## File Placement

- Test files go in `sdk/__tests__/` mirroring the source structure
- Name pattern: `{Module}.test.ts` or `{Module}.spec.ts`

## What to Test Per Module

| Module | What to test |
|--------|-------------|
| `bdo/fields/*` | Constructor, getters (`length`, `options`, etc.), `validate()` method |
| `bdo/core/BaseBdo` | CRUD method delegation, `createItem()`, system fields |
| `bdo/core/Item` | Proxy accessor behavior, `get()`/`set()`, `toJSON()`, `validate()` |
| `bdo/expressions/` | Expression evaluation, built-in functions, edge cases |
| `components/hooks/` | Hook behavior with `renderHook` from `@testing-library/react` |
| `api/` | Request construction, response parsing, error handling |

## Mocking Patterns

- Mock `api()` client for BDO tests — never make real API calls
- Use `vi.mock()` for module-level mocks
- For hooks, wrap in `QueryClientProvider` with a test `QueryClient`

## Conventions

- Each test should be independent — no shared mutable state
- Use descriptive `describe`/`it` blocks: `describe("StringField") > it("validates non-string values")`
- Test both happy path and error cases
