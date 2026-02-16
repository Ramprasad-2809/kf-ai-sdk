# Code Style Rules

## TypeScript Conventions

- Use `type` imports for type-only imports: `import type { Foo } from "./bar"`
- Suffix all type aliases with `Type`: `UserFieldType`, `ListOptionsType`, `ValidationResultType`
- Suffix all interface names with `Type` as well (project convention): `BaseFieldMetaType`
- Use PascalCase for backend-facing property names: `Name`, `Type`, `Constraint`, `ReadOnly`
- Use camelCase for SDK-facing properties and methods: `readOnly`, `defaultValue`, `integerPart`
- Use `readonly` on class field declarations that hold field instances
- Use `as const` on BDO `meta` objects for literal types

## Path Aliases

- Use relative imports within the SDK source. `@sdk/*` alias is configured but not used in practice. Deeper nesting (3 levels) is acceptable for hooks/workflow components.

## Export Patterns

- Most modules have paired entry points: `sdk/module.ts` (runtime) and `sdk/module.types.ts` (type-only). Exceptions: `utils` (no `.types.ts`), `types` (uses `base-types.ts`)
- Re-export from barrel `index.ts` files within each module
- Field classes are all exported from `sdk/bdo/fields/index.ts`

## Formatting

- Prettier handles all formatting (auto-run via PostToolUse hook)
- No need to manually format — files are formatted on save
- Single quotes for strings, trailing commas (es5), 2-space indent

## General

- Always use `pnpm`, never `npm` or `yarn`
- Prefer `unknown` over `any` in public API surfaces
- Use explicit return types on public/protected methods
