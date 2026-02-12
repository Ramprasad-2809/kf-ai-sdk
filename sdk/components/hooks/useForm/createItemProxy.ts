import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import type { BaseBdo } from "../../../bdo";
import type { BaseFieldMetaType } from "../../../bdo/core/types";
import type { BaseField } from "../../../bdo/fields/BaseField";
import { validateConstraints } from "./createResolver";
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
  const accessorCache = new Map<string, EditableFormFieldAccessorType<unknown> | ReadonlyFormFieldAccessorType<unknown>>();

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

      // Return cached accessor if available
      if (accessorCache.has(prop)) {
        return accessorCache.get(prop);
      }

      // Field accessor
      const bdoField = fields[prop] as BaseField<unknown> | undefined;
      const fieldMeta: BaseFieldMetaType = bdoField?.meta ?? {
        _id: prop,
        Name: prop,
        Type: "String",
      };
      const isReadOnly = bdoField?.readOnly ?? false;

      // Full validation: type + constraint + expression (matches createResolver pipeline)
      const validate = () => {
        if (!bdoField) return { valid: true, errors: [] };
        const value = form.getValues(prop as Path<FieldValues>);

        // 1. Type validation
        const typeResult = bdoField.validate(value);
        if (!typeResult.valid) return typeResult;

        // 2. Constraint validation
        const constraintResult = validateConstraints(bdoField as BaseField<unknown>, value);
        if (!constraintResult.valid) return constraintResult;

        // 3. Expression validation
        if (bdo.hasMetadata()) {
          const exprResult = bdo.validateFieldExpression(
            prop,
            value,
            form.getValues() as Record<string, unknown>,
          );
          if (!exprResult.valid) return exprResult;
        }

        return { valid: true, errors: [] };
      };

      // Only add set() for non-readOnly fields
      if (!isReadOnly) {
        const accessor: EditableFormFieldAccessorType<unknown> = {
          label: bdoField?.label ?? prop,
          required: bdoField?.required ?? false,
          readOnly: false,
          defaultValue: bdoField?.defaultValue,
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
        accessorCache.set(prop, accessor);
        return accessor;
      }

      const accessor: ReadonlyFormFieldAccessorType<unknown> = {
        label: bdoField?.label ?? prop,
        required: bdoField?.required ?? false,
        readOnly: true,
        defaultValue: bdoField?.defaultValue,
        meta: fieldMeta,
        get: () => form.getValues(prop as Path<FieldValues>),
        validate,
      };
      accessorCache.set(prop, accessor);
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
