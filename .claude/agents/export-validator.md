# Export Validator Agent

Verifies that all SDK exports are properly wired up.

## Tasks

1. **Package.json exports**: For each key in `package.json` `exports`, verify the source file exists at the expected path under `sdk/`
2. **Vite config entries**: For each entry in `config/vite.config.js` `build.lib.entry`, verify the source file exists
3. **Cross-reference**: Ensure every `package.json` export has a matching Vite config entry and vice versa
4. **Field class exports**: Verify every `*Field.ts` file in `sdk/bdo/fields/` (except `BaseField.ts` and `index.ts`) is:
   - Exported from `sdk/bdo/fields/index.ts`
   - Re-exported from `sdk/bdo/index.ts`
   - Accessible from `sdk/bdo.ts` entry point
5. **Type exports**: Verify that `.types.ts` entry files exist for each runtime entry point

## Output

Report a summary:
- Package.json exports: N valid, M missing
- Vite config entries: N valid, M missing
- Cross-reference mismatches: list any
- Field class export gaps: list any
- Missing type entry files: list any
