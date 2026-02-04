import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import type { BaseBdo, FieldMeta, BaseField } from "../../../bdo";
import type { FormItem, FormFieldAccessor } from "./types";

/**
 * Creates a Proxy-based Item that delegates to RHF for state management.
 *
 * Key principle: Item has NO state. It's a view over RHF's state.
 *
 * @param bdo - The BDO instance for field metadata
 * @param form - The RHF useForm return object
 * @param instanceId - Optional instance ID for fetchOptions (recordId for edit, draftId or "new" for create)
 * @returns FormItem proxy
 */
export function createItemProxy<TEntity extends FieldValues>(
  bdo: BaseBdo<TEntity, any, any, any>,
  form: UseFormReturn<TEntity>,
  instanceId?: string,
): FormItem<TEntity> {
  const fields = bdo.getFields();

  return new Proxy({} as FormItem<TEntity>, {
    get(_, prop: string | symbol) {
      // Handle symbol properties (e.g., Symbol.toStringTag)
      if (typeof prop === "symbol") {
        return undefined;
      }

      // Direct _id access (not an accessor, just the value)
      if (prop === "_id") {
        return form.getValues("_id" as Path<TEntity>);
      }

      // toJSON returns all form values as plain object
      if (prop === "toJSON") {
        return () => form.getValues();
      }

      // validate triggers RHF validation for all fields
      if (prop === "validate") {
        return () => form.trigger();
      }

      // Field accessor
      const bdoField = fields[prop] as BaseField<unknown> | undefined;
      const fieldMeta: FieldMeta = bdoField?.meta ?? {
        id: prop,
        label: prop,
      };

      // Enhance meta with context-aware fetchOptions
      // If the field has fetchOptions, wrap it to provide default instanceId from form context
      const enhancedMeta: FieldMeta = fieldMeta.fetchOptions
        ? {
            ...fieldMeta,
            fetchOptions: (providedId?: string) => {
              const effectiveId = providedId ?? instanceId ?? "new";
              return fieldMeta.fetchOptions!(effectiveId);
            },
          }
        : fieldMeta;

      const accessor: FormFieldAccessor<unknown> = {
        meta: enhancedMeta,

        get: () => form.getValues(prop as Path<TEntity>),

        set: (value: unknown) => {
          form.setValue(prop as Path<TEntity>, value as any, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: false, // Let mode control validation timing
          });
        },

        validate: () => {
          if (bdoField) {
            return bdoField.validate(form.getValues(prop as Path<TEntity>));
          }
          return { valid: true, errors: [] };
        },
      };

      return accessor;
    },

    has(_, prop) {
      if (typeof prop === "symbol") return false;
      if (prop === "_id" || prop === "toJSON" || prop === "validate")
        return true;
      return prop in fields;
    },

    ownKeys(_) {
      return [...Object.keys(fields), "_id", "toJSON", "validate"];
    },

    getOwnPropertyDescriptor(_, prop) {
      if (typeof prop === "symbol") return undefined;
      return {
        configurable: true,
        enumerable: prop !== "toJSON" && prop !== "validate",
      };
    },
  });
}
