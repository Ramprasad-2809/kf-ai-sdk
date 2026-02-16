---
description: Version bump, build, and publish the SDK
user_invocable: true
---

# /release — SDK Release Workflow

**IMPORTANT: Always confirm with the user before publishing.**

## Step 1: Pre-flight Checks

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

All must pass before proceeding. If any fail, stop and report.

## Step 2: Version Bump

Ask the user which version bump to apply:
- `patch` (bug fixes, e.g., 2.0.4 → 2.0.5)
- `minor` (new features, e.g., 2.0.4 → 2.1.0)
- `major` (breaking changes, e.g., 2.0.4 → 3.0.0)

Read the current version from `package.json` and confirm the new version with the user.

## Step 3: Update Version

Update the `version` field in `package.json`.

## Step 4: Build

```bash
pnpm run build
```

## Step 5: Commit and Tag

```bash
git add package.json
git commit -m "{new_version}"
git tag v{new_version}
```

## Step 6: Publish

**Ask the user for confirmation before this step.**

```bash
pnpm publish
git push && git push --tags
```

## Notes

- Never use `--no-verify` on commits
- Never force-push tags
- Check that `dist/` output looks correct before publishing
