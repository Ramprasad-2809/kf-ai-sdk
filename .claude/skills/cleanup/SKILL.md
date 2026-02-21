---
name: cleanup
description: Scan the entire SDK codebase for unused and unnecessary code, then report findings
disable-model-invocation: true
context: fork
allowed-tools: Read, Grep, Glob, Bash
---

# SDK Codebase Cleanup Scanner

Perform a comprehensive read-only scan of the SDK codebase to identify unused and unnecessary code. **Do NOT make any edits** — only report findings to the user.

## Rules

- **Read-only**: Do not edit, write, or delete any files. Only read and search.
- **No false positives**: Only flag something if you are confident it is unused/unnecessary. If uncertain, list it under a separate "Needs Manual Review" section with your reasoning.
- **Scope**: Only scan source files under `sdk/`. Do not scan `node_modules/`, `dist/`, or config files for issues — but DO use test files, config files, and entry points as consumers when checking whether something is used.
- **Be thorough**: Read every source file. Do not skip files or make assumptions.

## Scan Categories

### 1. Unused Exports

For every `export` (named exports, default exports, re-exports) in every `sdk/**/*.ts` file, check whether it is imported/referenced by at least one other file in the project (including test files and config files).

Flag exports that are **not imported anywhere else** in the codebase.

Pay attention to:
- Types/interfaces exported but never imported
- Functions/classes exported but never used
- Re-exports in barrel `index.ts` files that point to things nobody imports

**Exception**: Top-level entry point files (`sdk/*.ts`, `sdk/*.types.ts`) are the public API. Their exports are intentional even if not consumed internally — only flag these if the thing they re-export does not exist or the source module is missing.

### 2. Unused Imports

For every `import` statement in every `sdk/**/*.ts` file, check whether each imported binding is actually referenced in that file's body (outside the import statement itself).

### 3. Unused Files

Identify `.ts` files under `sdk/` that are not imported by any other file and are not entry points.

Entry points to exclude from this check (these are expected roots):
- All `sdk/*.ts` and `sdk/*.types.ts` top-level entry points
- `sdk/index.ts`
- Files referenced in `config/vite.config.js` build entries
- Files referenced in `package.json` exports

A file is unused if no other `.ts` file imports from it (directly or via barrel re-export chain) and it is not a build entry point.

### 4. Unused Type Definitions

Scan all `types.ts` files, `sdk/types/`, and `sdk/bdo/core/types.ts` for type aliases and interfaces that are defined but never referenced in any other file. Include transitively unused types (only referenced by other unused types).

### 5. Deprecated Items Still Exported

Items known to be deprecated (from CLAUDE.md): `UserRefType`, `TextAreaFieldType`.

Check for any items marked with `@deprecated` JSDoc tags. Report:
- Whether deprecated items are still exported from public entry points
- Whether deprecated items are still imported/used within the SDK itself (beyond just being re-exported for backwards compatibility)

### 6. Dead Internal Code

Within each file, look for:
- Functions or methods defined but never called within their module
- Variables assigned but never read
- Unreachable code after `return` / `throw` statements
- Commented-out code blocks (substantial ones, not single-line comments)

### 7. Redundant Re-exports

Check barrel files (`index.ts`) and entry points for:
- The same symbol exported through multiple overlapping paths
- Wildcard re-exports (`export *`) that overlap with named re-exports in the same file

### 8. Unnecessary Dependencies

Check `package.json`:
- Are all `dependencies` and `peerDependencies` actually imported somewhere in `sdk/`?
- Are all `devDependencies` referenced in config files, test files, or scripts?

## How to Execute

1. **Read config files first**: `package.json`, `config/vite.config.js`, and `tsconfig.json` to understand entry points, dependencies, and path aliases.
2. **Discover all source files** using Glob on `sdk/**/*.ts`.
3. **Read every source file** systematically. Use parallel reads to be efficient.
4. **Build a map** of every export and every import as you go.
5. **Cross-reference** each export against all imports using Grep to verify usage.
6. **Compile findings** into the report format below.

Use parallel tool calls aggressively — read multiple files at once, run multiple Grep searches simultaneously.

## Output Format

Present findings as a structured report in this exact format:

```
# SDK Cleanup Report

## Summary
- Unused exports: N found
- Unused imports: N found
- Unused files: N found
- Unused types: N found
- Deprecated items still active: N found
- Dead internal code: N found
- Redundant re-exports: N found
- Unnecessary dependencies: N found

## Findings

### 1. Unused Exports
| File | Export Name | Kind | Notes |
|------|------------|------|-------|

### 2. Unused Imports
| File | Import | From |
|------|--------|------|

### 3. Unused Files
| File | Reason |
|------|--------|

### 4. Unused Types
| File | Type Name | Notes |
|------|-----------|-------|

### 5. Deprecated Items Still Active
| Item | Defined In | Exported From | Used In |
|------|-----------|---------------|---------|

### 6. Dead Internal Code
| File | Line(s) | Description |
|------|---------|-------------|

### 7. Redundant Re-exports
| Symbol | Exported From (multiple paths) |
|--------|-------------------------------|

### 8. Unnecessary Dependencies
| Package | Type | Notes |
|---------|------|-------|

### Needs Manual Review
| File | Item | Concern |
|------|------|---------|
```

If a category has zero findings, still include the section header with "None found."
