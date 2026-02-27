# Complex Fields

> Complete form demonstrating selection, reference, and attachment fields with async options loading and pre-built UI components: Select, Reference, User, File, and Image.

```tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import type { UserFieldType } from "@ram_28/kf-ai-sdk/types";
import { AdminFieldTest } from "@/bdo/admin/FieldTest";
import type { FieldTestSupplierRefType } from "@/bdo/entities/field-test";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReferenceSelect } from "@/components/system/reference-select";
import { FileUpload } from "@/components/system/file-upload";
import { ImageUpload } from "@/components/system/image-upload";
import { FilePreview } from "@/components/system/file-preview";
import { ImageThumbnail } from "@/components/system/image-thumbnail";

export default function ComplexFieldsForm({ recordId }: { recordId?: string }) {
  const fieldTest = useMemo(() => new AdminFieldTest(), []);

  const {
    watch,
    setValue,
    handleSubmit,
    errors,
    item,
    isLoading,
    isSubmitting,
  }: UseBDOFormReturnType<AdminFieldTest> = useBDOForm({
    bdo: fieldTest,
    recordId,
  });

  // Dropdown open state for lazy-loading
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // ─── Async Options ─────────────────────────────────────────

  // User field options — lazy-load when dropdown opens
  const { data: users = [], isFetching: isUsersLoading } = useQuery<
    UserFieldType[]
  >({
    queryKey: ["fieldtest-user-options", item._id],
    queryFn: () => fieldTest.AssignedUser.fetchOptions(item._id!),
    enabled: userDropdownOpen && !!item._id,
    staleTime: Infinity,
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit((data) => console.log("Saved", data._id))}>
      {/* ───────────────────────────────────────────────── */}
      {/* SelectField — static options from Constraint.Enum */}
      {/* watch() + setValue(), NOT register()              */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>
          {fieldTest.Status.label} {fieldTest.Status.required && <span>*</span>}
        </FieldLabel>
        <FieldContent>
          <Select
            value={watch(fieldTest.Status.id) ?? ""}
            onValueChange={(value) => setValue(fieldTest.Status.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {fieldTest.Status.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
        {errors.Status && <FieldError>{errors.Status.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* ReferenceField — pre-built <ReferenceSelect>     */}
      {/* Abstracts fetchOptions + dropdown UI              */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.SupplierRef.label}</FieldLabel>
        <FieldContent>
          <ReferenceSelect
            bdoField={fieldTest.SupplierRef}
            instanceId={item._id}
            value={watch(fieldTest.SupplierRef.id)}
            onChange={(supplier) =>
              setValue(
                fieldTest.SupplierRef.id,
                supplier as FieldTestSupplierRefType,
              )
            }
          />
        </FieldContent>
        {errors.SupplierRef && <FieldError>{errors.SupplierRef.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* UserField — fetchOptions() + manual dropdown     */}
      {/* Value shape: { _id: string; _name: string }      */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.AssignedUser.label}</FieldLabel>
        <FieldContent>
          <Select
            value={watch(fieldTest.AssignedUser.id)?._id ?? ""}
            onValueChange={(value) => {
              const user = users.find((u) => u._id === value);
              if (user) setValue(fieldTest.AssignedUser.id, user);
            }}
            open={userDropdownOpen}
            onOpenChange={setUserDropdownOpen}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user">
                {watch(fieldTest.AssignedUser.id)?._name ?? "Select user"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {isUsersLoading ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user._name}
                  </SelectItem>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-gray-500">
                  No users available
                </div>
              )}
            </SelectContent>
          </Select>
        </FieldContent>
        {errors.AssignedUser && <FieldError>{errors.AssignedUser.message}</FieldError>}
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* FileField — <FileUpload> for edit mode           */}
      {/* Runtime methods (upload, delete) on item accessor */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.Documents.label}</FieldLabel>
        <FieldContent>
          <FileUpload
            field={fieldTest.Documents}
            value={watch(fieldTest.Documents.id)}
            boId={fieldTest.meta._id}
            instanceId={item._id}
            fieldId={fieldTest.Documents.id}
          />
        </FieldContent>
      </Field>

      {/* ───────────────────────────────────────────────── */}
      {/* ImageField — <ImageUpload> for edit mode         */}
      {/* Single image, nullable                           */}
      {/* ───────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>{fieldTest.Thumbnail.label}</FieldLabel>
        <FieldContent>
          <ImageUpload
            field={fieldTest.Thumbnail}
            value={watch(fieldTest.Thumbnail.id)}
            boId={fieldTest.meta._id}
            instanceId={item._id}
            fieldId={fieldTest.Thumbnail.id}
          />
        </FieldContent>
      </Field>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Read-Only Display

For tables and detail pages, use `<FilePreview>` and `<ImageThumbnail>`:

```tsx
import { FilePreview } from "@/components/system/file-preview";
import { ImageThumbnail } from "@/components/system/image-thumbnail";

// In a table row or detail page
function RecordRow({ record }: { record: ItemType<...> }) {
  return (
    <div>
      {/* File preview — clickable thumbnails for images, file icons for others */}
      <FilePreview
        boId={fieldTest.meta._id}
        instanceId={record._id}
        fieldId="Documents"
        value={record.Documents.get()}
      />

      {/* Image thumbnail — proxy URL with view_type=thumbnail */}
      <ImageThumbnail
        boId={fieldTest.meta._id}
        instanceId={record._id}
        fieldId="Thumbnail"
        value={record.Thumbnail.get()}
      />
    </div>
  );
}
```

## Key Patterns

- **All complex fields use `watch()` + `setValue()`** — never `register()`. Select, Reference, User, File, and Image fields use custom components that don't fire native change events.

- **`fetchOptions()` lazy-loaded with `useQuery`** — Gate with `enabled: dropdownOpen && !!item._id` to avoid fetching until the dropdown opens. Use `staleTime: Infinity` to cache options.

- **ReferenceField stores the full object** — Not just an ID. The value is `{ _id, SupplierName, Email, ... }`. The `setValue()` call must pass the complete object.

- **File/Image runtime methods are on `item.Field`** — The `upload()`, `getDownloadUrl()`, `deleteAttachment()` methods live on the `item` accessor (created by the `Item` proxy), not on the BDO field class. The `<FileUpload>` and `<ImageUpload>` components handle this internally.

- **`<ReferenceSelect>` abstracts the full pattern** — Handles `fetchOptions()`, dropdown UI, search, and option display. Pass `bdoField`, `instanceId`, `value`, and `onChange`.

- **`<FileUpload>` / `<ImageUpload>` handle the upload lifecycle** — File selection, upload to storage, progress indication, preview, and delete. They need `boId`, `instanceId`, and `fieldId` for API calls.

- **`<FilePreview>` / `<ImageThumbnail>` for read-only display** — Use in tables, detail pages, or any context where files should be viewable but not editable. They construct proxy URLs for same-origin access.
