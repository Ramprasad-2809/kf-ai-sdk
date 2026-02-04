// ============================================================
// SELECT FIELD ACCESSOR
// Accessor for select fields with access to options
// ============================================================

import type { SelectOption, SelectFieldAccessorInterface, FieldMeta } from "../core/types";
import type { SelectField } from "../fields/SelectField";
import { FieldAccessor } from "./FieldAccessor";

/**
 * Accessor for select fields with access to available options
 *
 * Extends FieldAccessor with methods to retrieve options.
 *
 * @template T - The type of the field value (union of option values)
 *
 * @example
 * ```typescript
 * const accessor = item.field("Status") as SelectFieldAccessor<StatusType>;
 * const options = accessor.options();
 * const currentLabel = accessor.getLabel();
 * ```
 */
export class SelectFieldAccessor<T>
  extends FieldAccessor<T>
  implements SelectFieldAccessorInterface<T>
{
  protected readonly _selectField: SelectField<string>;

  constructor(
    field: SelectField<string>,
    getValue: () => T | undefined,
    setValue: (value: T) => void
  ) {
    super(field as unknown as import("../fields/BaseField").BaseField<T>, getValue, setValue);
    this._selectField = field;
  }

  /**
   * Get field metadata including options
   */
  override get meta(): FieldMeta {
    return {
      id: this._selectField.id,
      label: this._selectField.label,
      options: this._selectField.getOptions() as unknown as readonly { value: unknown; label: string; disabled?: boolean }[],
    };
  }

  /**
   * Get all available options
   */
  options(): readonly SelectOption<T>[] {
    return this._selectField.getOptions() as unknown as readonly SelectOption<T>[];
  }


  /**
   * Get the label for the current value
   */
  getLabel(): string | undefined {
    const value = this.get();
    if (value === undefined) return undefined;
    return this._selectField.getLabelForValue(value as unknown as string);
  }

  /**
   * Get the label for a specific value
   */
  getLabelForValue(value: T): string | undefined {
    return this._selectField.getLabelForValue(value as unknown as string);
  }
}
