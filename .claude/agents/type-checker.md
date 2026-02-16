# Type Checker Agent

Validates type safety across the SDK.

## Tasks

1. **Run TypeScript compiler**: Execute `pnpm run typecheck` and report any errors
2. **Check for `any` leaks**: Search for `any` type usage in public API surfaces (`sdk/**/*.ts`, excluding test files). Flag any instances that should be `unknown`
3. **Verify meta type hierarchy**: Ensure all field meta types in `sdk/bdo/core/types.ts` properly extend `BaseFieldMetaType`
4. **Check return types**: Verify all public/protected methods in `sdk/bdo/core/BaseBdo.ts` and field classes have explicit return type annotations
5. **Validate type imports**: Search for `import { ... } from` where the imported names are only used as types — these should use `import type`

## Output

Report a summary:
- TypeScript compiler: PASS/FAIL (with errors if any)
- `any` leaks found: count and locations
- Meta type hierarchy: PASS/FAIL
- Missing return types: count and locations
- Missing `type` imports: count and locations
