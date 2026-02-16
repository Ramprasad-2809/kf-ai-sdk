---
description: Run an SDK code review checklist
user_invocable: true
---

# /review — SDK Code Review

Run through this checklist against the current changes (staged + unstaged).

## 1. Type Safety

- [ ] No `any` types in public API surfaces (use `unknown` instead)
- [ ] All public/protected methods have explicit return types
- [ ] Type imports use `import type { ... }` syntax
- [ ] All type aliases end with `Type` suffix

## 2. Export Integrity

- [ ] New public types/classes are exported from barrel `index.ts` files
- [ ] Entry point files (`sdk/*.ts`) re-export correctly
- [ ] `package.json` exports map matches actual source files
- [ ] Vite config entry points match `package.json` exports

## 3. BDO-Specific Checks

- [ ] System fields are not redeclared in BDO subclasses
- [ ] Field `_id` values match BDO property names
- [ ] `meta._id` is the correct Business Object ID
- [ ] `meta` uses `as const` assertion
- [ ] Field instances use `readonly` modifier
- [ ] Only role-appropriate CRUD methods are exposed as `public`
- [ ] `create()` return type is `ItemType`, not `CreateUpdateResponseType`

## 4. Naming Conventions

- [ ] PascalCase for backend-facing properties (`Name`, `Type`, `Constraint`)
- [ ] camelCase for SDK-facing getters (`readOnly`, `defaultValue`)
- [ ] Field classes named `{Type}Field` (e.g., `StringField`)
- [ ] Meta types named `{Type}FieldMetaType`

## 5. Build Verification

Run and report results:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test
```

Report any failures with the relevant error output.
