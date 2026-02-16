# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

**Always use `pnpm`, never `npm` or `yarn`.**

## Build and Development Commands

```bash
pnpm run build        # Vite build + TypeScript declarations → dist/
pnpm run dev          # Development server
pnpm run typecheck    # tsc --noEmit
pnpm run lint         # ESLint
pnpm run lint:fix     # ESLint with auto-fix
pnpm run format       # Prettier write
pnpm run format:check # Prettier check
pnpm run test         # Vitest
pnpm run test:watch   # Vitest watch mode
```

## Architecture Overview

React SDK (`@ram_28/kf-ai-sdk`) providing type-safe hooks for building web applications with a backend API. Modular entry point pattern for tree-shaking.

### Directory Structure

- **`sdk/`** — Source code
  - **`components/hooks/`** — React hooks (`useForm`, `useTable`, `useFilter`)
  - **`api/`** — API client for CRUD operations against Business Objects
  - **`auth/`** — Authentication (AuthProvider, useAuth hook)
  - **`bdo/`** — Business Data Object module (type-safe data access layer)
  - **`types/`** — Shared type definitions (base field types, common types)
  - **`utils/`** — Formatting helpers, error handling, API utilities
  - **`workflow/`** — Workflow engine (Activity, ActivityInstance, useActivityForm)
- **`config/`** — Vite build configuration
- **`docs/`** — Module documentation

### Module Entry Points

Most modules have paired entry files in `sdk/`: `module.ts` (runtime) + `module.types.ts` (types). Exceptions: `utils` (no `.types.ts`), `types` (uses `base-types.ts`).

Entry points: `form`, `table`, `filter`, `auth`, `api`, `workflow`, `utils`, `bdo`, `types`

Build output: `dist/` with ESM (`.mjs`) and CJS (`.cjs`) formats.

### Path Aliases

Use `@sdk/*` to import from SDK source (configured in `tsconfig.json` and `vite.config.js`).

---

## Key Patterns (Brief)

### API Client

```typescript
api("bo_id").get(id)
api("bo_id").list({ Filter, Sort, Page, PageSize })
api("bo_id").create(data)
api("bo_id").update(id, data)
api("bo_id").delete(id)
```

Base path is `/api/app/{bo_id}/` with operation suffixes (`/read`, `/create`, `/update`, `/delete`, `/list`, etc.). See `@docs/api.md` for full details.

### BDO Module

Type-safe, role-based data access layer. Three generics pattern: `BaseBdo<TEntity, TEditable, TReadonly>`. Protected CRUD methods exposed selectively per role. `create()` returns `ItemType`, not `CreateUpdateResponseType`.

See `@docs/bdo.md` for full documentation including field classes, Item proxy, expressions, and implementation patterns.

### Hooks

Integrate with `@tanstack/react-query` (useTable, useForm) or plain React state (useFilter):
- **useTable** — Table state (sorting, pagination, filtering). See `@docs/useTable.md`
- **useForm** — BDO-integrated forms with 3-phase validation (type + constraint + expression). See `@docs/useForm.md`
- **useFilter** — Filter condition builder. See `@docs/useFilter.md`

---

## Field Value Types (`sdk/types/base-fields.ts`)

| Type | Resolves To |
|------|-------------|
| `StringFieldType` | `string` |
| `TextFieldType` | `string` |
| `NumberFieldType` | `number` |
| `BooleanFieldType` | `boolean` |
| `DateFieldType` | `"YYYY-MM-DD"` |
| `DateTimeFieldType` | `"YYYY-MM-DDThh:mm:ss"` |
| `SelectFieldType<T>` | `T` |
| `ReferenceFieldType<T>` | `T` |
| `UserFieldType` | `{ _id: string; _name: string }` |
| `FileFieldType` | `Record<string, unknown>` |
| `ArrayFieldType<T>` | `T[]` |
| `ObjectFieldType<T>` | `T` |

**Deprecated:** `UserRefType` (use `UserFieldType`), `TextAreaFieldType` (use `TextFieldType`)

## Field Classes (`sdk/bdo/fields/`)

| Class | Type | Extra Getters |
|-------|------|---------------|
| `StringField` | `"String"` | `length` |
| `NumberField` | `"Number"` | `integerPart`, `fractionPart` |
| `BooleanField` | `"Boolean"` | — |
| `DateField` | `"Date"` | — |
| `DateTimeField` | `"DateTime"` | `precision` |
| `SelectField<T>` | `"String"` | `options` |
| `ReferenceField<T>` | `"Reference"` | `referenceBdo`, `referenceFields`, `searchFields` |
| `TextField` | `"Text"` | `format` |
| `UserField` | `"User"` | `businessEntity` |
| `FileField` | `"File"` | — |
| `ArrayField<T>` | `"Array"` | `elementType` |
| `ObjectField<T>` | `"Object"` | `properties` |

All extend `BaseField<T>`, store raw backend meta, expose: `id`, `label`, `readOnly`, `required`, `defaultValue`, `primaryKey`, `meta`.

## System Fields (inherited from `BaseBdo`, never redeclare)

`_id`, `_created_at`, `_modified_at`, `_created_by`, `_modified_by`, `_version`, `_m_version`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `sdk/bdo/core/BaseBdo.ts` | Abstract base class with protected CRUD + 3-generic pattern |
| `sdk/bdo/core/Item.ts` | Proxy wrapper, ItemType, runtime accessor construction |
| `sdk/bdo/core/types.ts` | Raw meta types, accessor types, validation types |
| `sdk/bdo/fields/BaseField.ts` | Abstract base — `_meta` storage, convenience getters |
| `sdk/bdo/expressions/ExpressionEngine.ts` | Main validation orchestrator |
| `sdk/types/base-fields.ts` | Field value types, SystemFieldsType |
| `sdk/api/client.ts` | API client factory |
| `sdk/api/metadata.ts` | getBdoSchema(), listMetadata() |
| `sdk/components/hooks/useForm/useForm.ts` | Form hook with schema fetching |
| `sdk/components/hooks/useForm/createResolver.ts` | RHF resolver with 3-phase validation |
| `config/vite.config.js` | Build configuration with entry points |

---

## Compaction Instructions

When context is compressed, preserve these essentials:
1. **Always use `pnpm`** — never npm or yarn
2. **Path alias** — `@sdk/*` maps to `sdk/`
3. **Three generics** — `BaseBdo<TEntity, TEditable, TReadonly>`
4. **`create()` returns `ItemType`** — not `CreateUpdateResponseType`
5. **System fields** — never redeclare `_id`, `_created_at`, etc. in BDO subclasses
6. **Type suffix** — all type aliases and interfaces end with `Type`
7. **readOnly** (not isEditable) — boolean getter, `meta.ReadOnly`
8. **Entry points** — paired `module.ts` + `module.types.ts` in `sdk/` (except `utils`, `types`)
9. **Docs** — detailed module docs in `docs/` directory
