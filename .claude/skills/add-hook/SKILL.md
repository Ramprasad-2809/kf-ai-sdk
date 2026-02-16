---
description: Add a new React hook to the SDK
user_invocable: true
---

# /add-hook — Add a New React Hook

Follow these steps to add a new hook to the SDK.

## Step 1: Create Hook Directory

```
sdk/components/hooks/use{Name}/
├── use{Name}.ts         # Hook implementation
├── types.ts             # Hook-specific types
└── index.ts             # Barrel export
```

## Step 2: Define Types

In `sdk/components/hooks/use{Name}/types.ts`:
- Define `Use{Name}OptionsType` for hook parameters
- Define `Use{Name}ReturnType` for the return value
- Suffix all types with `Type`

## Step 3: Implement Hook

In `sdk/components/hooks/use{Name}/use{Name}.ts`:
- Import from `@tanstack/react-query` if data fetching is involved
- Use relative imports for internal imports
- Return a well-typed object

## Step 4: Create Entry Points

Create `sdk/{name}.ts` (runtime):
```typescript
export { use{Name} } from "./components/hooks/use{Name}";
export { /* constants */ } from "./types/constants";
```

Create `sdk/{name}.types.ts` (type-only):
```typescript
export type { Use{Name}OptionsType, Use{Name}ReturnType } from "./components/hooks/use{Name}/types";
```

## Step 5: Update Hooks Barrel

Add re-export to `sdk/components/hooks/index.ts`:
```typescript
export { use{Name} } from "./use{Name}";
```

## Step 6: Update Build Config

1. Add entry to `config/vite.config.js` → `build.lib.entry`
2. Add export map to `package.json` → `exports` (both `./{name}` and `./{name}/types`)

## Step 7: Verify

```bash
pnpm run typecheck
pnpm run build
# Check that dist/{name}.mjs and dist/{name}.cjs exist
ls dist/{name}.*
```
