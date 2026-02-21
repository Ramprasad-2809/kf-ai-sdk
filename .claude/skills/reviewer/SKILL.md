---
description: Deep code review of staged changes by a senior engineer who knows the library inside and out
user_invocable: true
---

# /reviewer — Senior Engineer Code Review

Perform a thorough, line-by-line code review of **staged changes only** (`git diff --cached`). You are acting as a senior engineer who knows every line of this SDK. **Do NOT make any edits** — only report review comments.

## Rules

- **Read-only**: Do not edit, write, or delete any files. Only read, search, and analyze.
- **Staged changes only**: Review only what is in `git diff --cached`. Unstaged changes are out of scope.
- **No changes**: Your output is review comments. Do not modify any files.
- **Be specific**: Reference exact file paths and line numbers. Quote the problematic code.
- **Be fair**: If the code is good, say so. Don't manufacture issues that don't exist.

## Phase 1: Understand the Library

Before reviewing the diff, build deep context by reading the files that the staged changes touch and their surrounding module.

For each file in the staged diff:

1. **Read the full current file** (not just the diff) to understand the complete context.
2. **Read sibling files** in the same directory to understand local patterns — naming, structure, export style, error handling approach.
3. **Read the module's barrel/index files** to understand how things are exported and composed.
4. **Read any types files** that the changed file imports from, so you understand the type contracts.
5. **Read any files that import from the changed file**, to understand downstream consumers and whether the change could break them.
6. **Read relevant docs** from the `docs/` directory if the changed module has documentation there.

Use parallel reads aggressively. The goal is to have full context of the module's conventions before you look at a single line of the diff.

## Phase 2: Analyze the Staged Diff

Run `git diff --cached` to get the full staged diff. Then review every hunk, line by line.

For each changed file, evaluate against ALL of the following criteria:

### 2.1 Pattern Consistency

- Does the new code follow the **exact same patterns** as existing code in the same module?
- Are naming conventions consistent? (PascalCase for backend props, camelCase for SDK-facing, `Type` suffix on types/interfaces)
- Does the code structure match sibling files? (import order, class layout, method organization)
- Are new exports added to all required barrel files and entry points?
- If a new type/interface is added, does it follow the project's type definition patterns?

### 2.2 Interface & API Design

- Do public method signatures match the conventions of existing public methods in the module?
- Are return types explicit on public/protected methods?
- Is the API surface consistent with how similar things are done elsewhere in the SDK?
- Are generics used consistently with the existing patterns (e.g., the three-generics BDO pattern)?
- Do new types compose well with existing types? Any unnecessary duplication?

### 2.3 Type Safety

- No `any` in public API surfaces (should be `unknown`)
- Type imports use `import type { ... }` syntax
- Are types tight enough? Could they be more specific without over-engineering?
- Any implicit `any` from missing type annotations?
- Are type assertions (`as`) justified, or are they masking a design issue?

### 2.4 Code Quality

- Is the code readable and self-documenting?
- Any unnecessary complexity that could be simplified?
- Any dead code, unreachable branches, or redundant conditions?
- Are error cases handled appropriately?
- Any potential runtime errors (null/undefined access, missing checks)?
- Any off-by-one errors or edge cases not handled?

### 2.5 Architectural Fit

- Does the change fit the module's responsibility? Or does it belong elsewhere?
- Does it respect module boundaries (e.g., BDO module shouldn't directly depend on hook internals)?
- Are dependencies pointing in the right direction? (no circular deps, no reaching into private internals)
- Does it maintain the SDK's tree-shaking guarantees? (no side effects in module scope)

### 2.6 Backwards Compatibility

- Could this change break existing consumers of the SDK?
- Are any public types narrowed or changed in a breaking way?
- Are any method signatures changed in a non-additive way?
- If breaking, is it intentional and justified?

### 2.7 Completeness

- If a new feature is added, is the full chain complete? (types → implementation → exports → re-exports)
- Are there any TODOs or placeholders left in the code?
- If new fields/types are added, are they exported from all necessary entry points?

## Phase 3: Cross-Reference

After reviewing individual files, look at the diff as a whole:

- Do the changes across files tell a **coherent story**? Or are there inconsistencies between files?
- Are there files that **should have been changed** but weren't? (e.g., a new type was added but not exported from the entry point)
- Are there **related tests** that should exist or be updated?

## Output Format

Present your review in this format:

```
# Code Review — Staged Changes

## Overview
Brief summary of what the staged changes do (2-3 sentences max).

## Files Reviewed
- `path/to/file1.ts` — brief description of changes
- `path/to/file2.ts` — brief description of changes

## Review Comments

### Critical (Must Fix)
Issues that would cause bugs, break consumers, or violate core SDK contracts.

> **[C1]** `path/to/file.ts:42`
> ```typescript
> // the problematic code
> ```
> Explanation of the issue and what should be done instead.

### Suggestions (Should Fix)
Pattern violations, inconsistencies, or code quality concerns.

> **[S1]** `path/to/file.ts:15`
> ```typescript
> // the code in question
> ```
> Explanation and suggested approach.

### Nits (Consider)
Minor style, naming, or readability observations.

> **[N1]** `path/to/file.ts:8`
> Brief note.

### Missing Changes
Files or updates that appear to be missing from this changeset.

> **[M1]** Expected `path/to/barrel.ts` to re-export the new type `FooType`.

## Verdict

One of:
- **Approve** — No critical issues, ship it.
- **Approve with suggestions** — No blockers, but consider the suggestions.
- **Request changes** — Critical issues must be addressed before merging.
```

If there are zero items in a category, include the header with "None." underneath.

## Important Notes

- Do NOT suggest adding comments, JSDoc, or documentation unless something is genuinely confusing.
- Do NOT suggest refactoring code that isn't part of the staged changes.
- Do NOT flag style issues that Prettier/ESLint would catch — assume those tools run automatically.
- DO focus on logic, patterns, types, API design, and architectural fit — the things automated tools can't catch.
