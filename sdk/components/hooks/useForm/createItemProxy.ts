import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import type { BaseBdo, FieldMetaType } from "../../../bdo";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type {
  FormItemType,
  ExtractEditableType,
  ExtractReadonlyType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from "./types";

/**
 * Creates a Proxy-based Item that delegates to RHF for state management.
 *
 * Key principle: Item has NO state. It's a view over RHF's state.
 * Editable fields get set(), readonly fields do not.
 *
 * @param bdo - The BDO instance for field metadata
 * @param form - The RHF useForm return object
 * @returns SmartFormItem proxy
 */
export function createItemProxy<B extends BaseBdo<any, any, any>>(
  bdo: B,
  form: UseFormReturn<FieldValues>,
): FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>> {
  const fields = bdo.getFields();

  return new Proxy({} as FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>>, {
    get(_, prop: string | symbol) {
      // Handle symbol properties (e.g., Symbol.toStringTag)
      if (typeof prop === "symbol") {
        return undefined;
      }

      // Direct _id access (not an accessor, just the value)
      if (prop === "_id") {
        return form.getValues("_id" as Path<FieldValues>);
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
      const fieldMeta: FieldMetaType = bdoField?.meta ?? {
        id: prop,
        label: prop,
        isEditable: true,
      };
      const isEditable = fieldMeta.isEditable;

      // Base accessor parts (shared between editable and readonly)
      const validate = () => {
        if (bdoField) {
          return bdoField.validate(form.getValues(prop as Path<FieldValues>));
        }
        return { valid: true, errors: [] };
      };

      // Only add set() for editable fields
      if (isEditable) {
        const accessor: EditableFormFieldAccessorType<unknown> = {
          meta: fieldMeta,
          get: () => form.getValues(prop as Path<FieldValues>),
          set: (value: unknown) => {
            form.setValue(prop as Path<FieldValues>, value as any, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: false, // Let mode control validation timing
            });
          },
          validate,
        };
        return accessor;
      }

      const accessor: ReadonlyFormFieldAccessorType<unknown> = {
        meta: fieldMeta,
        get: () => form.getValues(prop as Path<FieldValues>),
        validate,
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
