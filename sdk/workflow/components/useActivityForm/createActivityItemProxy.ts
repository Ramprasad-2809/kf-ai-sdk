// ============================================================
// ACTIVITY ITEM PROXY
// ============================================================
// Proxy-based item that delegates to RHF for state management.
// Follows the same pattern as createItemProxy for BaseBdo,
// adapted for Activity.

import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import type { BaseFieldMetaType } from "../../../bdo/core/types";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type {
  FormItemType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from "../../../components/hooks/useForm/types";
import type { Activity } from "../../Activity";
import type {
  ExtractActivityEditable,
  ExtractActivityReadonly,
} from "./types";

/**
 * Creates a Proxy-based Item that delegates to RHF for state management.
 *
 * Key principle: Item has NO state. It's a view over RHF's state.
 * Editable fields get set(), readonly fields do not.
 *
 * @param activity - The Activity instance for field metadata
 * @param form - The RHF useForm return object
 * @returns FormItemType proxy
 */
export function createActivityItemProxy<A extends Activity<any, any, any>>(
  activity: A,
  form: UseFormReturn<FieldValues>,
): FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>> {
  const fields = activity._getFields();

  return new Proxy(
    {} as FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>,
    {
      get(_, prop: string | symbol) {
        // Handle symbol properties (e.g., Symbol.toStringTag)
        if (typeof prop === "symbol") {
          return undefined;
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
        const fieldMeta: BaseFieldMetaType = bdoField?.meta ?? {
          _id: prop,
          Name: prop,
          Type: "String",
        };
        const isReadOnly = bdoField?.readOnly ?? false;

        // Base validate function
        const validate = () => {
          if (bdoField) {
            return bdoField.validate(form.getValues(prop as Path<FieldValues>));
          }
          return { valid: true, errors: [] };
        };

        // Only add set() for editable fields
        if (!isReadOnly) {
          const accessor: EditableFormFieldAccessorType<unknown> = {
            label: bdoField?.label ?? prop,
            required: bdoField?.required ?? false,
            readOnly: false,
            defaultValue: bdoField?.defaultValue,
            meta: fieldMeta,
            get: () => form.getValues(prop as Path<FieldValues>),
            getOrDefault: (fallback: unknown) =>
              form.getValues(prop as Path<FieldValues>) ?? fallback,
            set: (value: unknown) => {
              form.setValue(prop as Path<FieldValues>, value as any, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: false,
              });
            },
            validate,
          };
          return accessor;
        }

        const accessor: ReadonlyFormFieldAccessorType<unknown> = {
          label: bdoField?.label ?? prop,
          required: bdoField?.required ?? false,
          readOnly: true,
          defaultValue: bdoField?.defaultValue,
          meta: fieldMeta,
          get: () => form.getValues(prop as Path<FieldValues>),
          getOrDefault: (fallback: unknown) =>
            form.getValues(prop as Path<FieldValues>) ?? fallback,
          validate,
        };
        return accessor;
      },

      has(_, prop) {
        if (typeof prop === "symbol") return false;
        if (prop === "toJSON" || prop === "validate") return true;
        return prop in fields;
      },

      ownKeys(_) {
        return [...Object.keys(fields), "toJSON", "validate"];
      },

      getOwnPropertyDescriptor(_, prop) {
        if (typeof prop === "symbol") return undefined;
        return {
          configurable: true,
          enumerable: prop !== "toJSON" && prop !== "validate",
        };
      },
    },
  );
}
