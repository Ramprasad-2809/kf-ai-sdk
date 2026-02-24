# Primitive Fields

> Complete form demonstrating all primitive field types with the correct form binding pattern for each: String, Number, Boolean, Date, DateTime, and Text.

```tsx
import { useMemo } from "react";
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import { AdminFieldTest } from "@/bdo/admin/FieldTest";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function PrimitiveFieldsForm({ recordId }: { recordId?: string }) {
  const fieldTest = useMemo(() => new AdminFieldTest(), []);

  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    isLoading,
    isSubmitting,
  }: UseBDOFormReturnType<AdminFieldTest> = useBDOForm({
    bdo: fieldTest,
    recordId,
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit((data) => console.log("Saved", data._id))}>
      {/* ───────────────────────────────────────────────── */}
      {/* StringField — register() for native text inputs  */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>
          {fieldTest.Name.label} {fieldTest.Name.required && <span>*</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            {...register(fieldTest.Name.id)}
            maxLength={fieldTest.Name.length}
            placeholder="Enter name"
          />
          {fieldTest.Name.length && (
            <span className="text-xs text-gray-500">
              Max {fieldTest.Name.length} characters
            </span>
          )}
        </FieldContent>
        {errors.Name && <FieldError>{errors.Name.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* NumberField — register() with type="number"      */}
      {/* Derive step from fractionPart                    */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>
          {fieldTest.Amount.label} {fieldTest.Amount.required && <span>*</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="number"
            step={
              fieldTest.Amount.fractionPart
                ? `0.${"0".repeat(fieldTest.Amount.fractionPart - 1)}1`
                : "1"
            }
            {...register(fieldTest.Amount.id)}
            placeholder="0.00"
          />
          <span className="text-xs text-gray-500">
            IntegerPart: {fieldTest.Amount.integerPart}, FractionPart: {fieldTest.Amount.fractionPart ?? "none"}
          </span>
        </FieldContent>
        {errors.Amount && <FieldError>{errors.Amount.message}</FieldError>}
      </Field>

      {/* Integer-only number (no fractionPart → step="1") */}
      <Field>
        <FieldLabel>{fieldTest.Quantity.label}</FieldLabel>
        <FieldContent>
          <Input
            type="number"
            step="1"
            {...register(fieldTest.Quantity.id)}
            placeholder="0"
          />
        </FieldContent>
        {errors.Quantity && <FieldError>{errors.Quantity.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* BooleanField — watch() + setValue(), NOT register */}
      {/* Checkbox doesn't fire native change events       */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <div className="flex items-center gap-3">
          <Checkbox
            id={fieldTest.IsEnabled.id}
            checked={watch(fieldTest.IsEnabled.id) ?? false}
            onCheckedChange={(checked) =>
              setValue(fieldTest.IsEnabled.id, checked === true)
            }
          />
          <FieldLabel htmlFor={fieldTest.IsEnabled.id}>
            {fieldTest.IsEnabled.label}
          </FieldLabel>
        </div>
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* DateField — register() with type="date"          */}
      {/* Strict YYYY-MM-DD — never default to ""          */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>
          {fieldTest.StartDate.label} {fieldTest.StartDate.required && <span>*</span>}
        </FieldLabel>
        <FieldContent>
          <Input type="date" {...register(fieldTest.StartDate.id)} />
        </FieldContent>
        {errors.StartDate && <FieldError>{errors.StartDate.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* DateTimeField — register() with datetime-local   */}
      {/* Add step for Millisecond precision               */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.CreatedOn.label}</FieldLabel>
        <FieldContent>
          <Input
            type="datetime-local"
            step={fieldTest.CreatedOn.precision === "Millisecond" ? "0.001" : undefined}
            {...register(fieldTest.CreatedOn.id)}
          />
          <span className="text-xs text-gray-500">
            Precision: {fieldTest.CreatedOn.precision}
          </span>
        </FieldContent>
        {errors.CreatedOn && <FieldError>{errors.CreatedOn.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* TextField — register() with <textarea>           */}
      {/* Conditional rendering based on format            */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.Description.label}</FieldLabel>
        <FieldContent>
          <textarea
            {...register(fieldTest.Description.id)}
            rows={4}
            placeholder="Enter plain text description"
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-500">
            Format: {fieldTest.Description.format}
          </span>
        </FieldContent>
        {errors.Description && <FieldError>{errors.Description.message}</FieldError>}
      </Field>

      {/* Markdown text field — use a markdown editor */}
      <Field>
        <FieldLabel>{fieldTest.RichContent.label}</FieldLabel>
        <FieldContent>
          {fieldTest.RichContent.format === "Markdown" ? (
            <textarea
              {...register(fieldTest.RichContent.id)}
              rows={6}
              placeholder="Enter markdown content..."
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono"
            />
          ) : (
            <textarea
              {...register(fieldTest.RichContent.id)}
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          )}
          <span className="text-xs text-gray-500">
            Format: {fieldTest.RichContent.format}
          </span>
        </FieldContent>
        {errors.RichContent && <FieldError>{errors.RichContent.message}</FieldError>}
      </Field>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Key Patterns

- **`register()` works for** String, Number, Date, DateTime, Text — native HTML inputs that fire change events
- **`watch()` + `setValue()` needed for** Boolean — Checkbox components don't fire native change events, so `register()` won't pick up value changes
- **Constraint-derived getters**:
  - `field.length` — max characters (StringField)
  - `field.integerPart` / `field.fractionPart` — numeric precision (NumberField)
  - `field.precision` — `"Second"` or `"Millisecond"` (DateTimeField)
  - `field.format` — `"Plain"` or `"Markdown"` (TextField)
- **Never default Date/DateTime to empty string** — Use `undefined` for unset dates. Empty strings (`""`) fail DateField validation (`YYYY-MM-DD` regex) and produce confusing errors
- **Derive `step` from `fractionPart`** — `fractionPart: 2` → `step="0.01"`, no `fractionPart` → `step="1"` (integer only)
- **Conditional rendering for TextField** — Check `field.format` to switch between `<textarea>` and a markdown editor
