// ============================================================
// BDO-SPECIFIC TYPES
// ============================================================

/**
 * BDO-level metadata — identifies the business object
 */
export interface BdoMetaType {
  readonly _id: string;
  readonly name: string;
}

/**
 * Result of field validation
 */
export interface ValidationResultType {
  valid: boolean;
  errors: string[];
}

// ============================================================
// RAW BACKEND META TYPES
// These represent the exact JSON shape from the backend,
// with _id injected by the generator.
// ============================================================

/** Base constraint shape shared by all field types */
export interface BaseConstraintType {
  Required?: boolean;
  PrimaryKey?: boolean;
  DefaultValue?: unknown;
}

/** Base field meta — raw backend shape + injected _id */
export interface BaseFieldMetaType {
  _id: string;
  Name: string;
  Type: string;
  ReadOnly?: boolean;
  Required?: boolean;
  Constraint?: BaseConstraintType;
  DefaultValue?: unknown;
}

export interface StringFieldMetaType extends BaseFieldMetaType {
  Type: "String";
  Constraint?: BaseConstraintType & {
    Length?: number;
    Enum?: string[];
  };
  DefaultValue?: string;
  View?: {
    DataObject?: { Type: string; Id: string };
    Fields?: string[];
    Search?: string[];
    Filter?: Record<string, unknown>;
    Sort?: unknown[];
  };
}

export interface TextFieldMetaType extends BaseFieldMetaType {
  Type: "Text";
  Constraint?: BaseConstraintType & {
    Format?: "Plain" | "Markdown";
  };
  DefaultValue?: string;
}

export interface NumberFieldMetaType extends BaseFieldMetaType {
  Type: "Number";
  Constraint?: BaseConstraintType & {
    IntegerPart?: number;
    FractionPart?: number;
  };
  DefaultValue?: number;
}

export interface BooleanFieldMetaType extends BaseFieldMetaType {
  Type: "Boolean";
  Constraint?: BaseConstraintType;
  DefaultValue?: boolean;
}

export interface DateFieldMetaType extends BaseFieldMetaType {
  Type: "Date";
  Constraint?: BaseConstraintType;
  DefaultValue?: string;
}

export interface DateTimeFieldMetaType extends BaseFieldMetaType {
  Type: "DateTime";
  Constraint?: BaseConstraintType & {
    Precision?: "Second" | "Millisecond";
  };
  DefaultValue?: string;
}

export interface SelectFieldMetaType extends BaseFieldMetaType {
  Type: "String";
  Constraint?: BaseConstraintType & {
    Enum: string[];
  };
  DefaultValue?: string;
}

export interface ReferenceFieldMetaType extends BaseFieldMetaType {
  Type: "Reference";
  Constraint?: BaseConstraintType;
  View?: {
    DataObject: { Type: string; Id: string };
    Fields?: string[];
    Search?: string[];
    Filter?: Record<string, unknown>;
    Sort?: unknown[];
  };
}

export interface UserFieldMetaType extends BaseFieldMetaType {
  Type: "User";
  Constraint?: BaseConstraintType;
  View?: {
    Filter?: Record<string, unknown>;
    Sort?: unknown[];
    BusinessEntity?: string;
  };
}

export interface ArrayFieldMetaType extends BaseFieldMetaType {
  Type: "Array";
  Constraint?: BaseConstraintType;
  Property?: BaseFieldMetaType;
}

export interface ObjectFieldMetaType extends BaseFieldMetaType {
  Type: "Object";
  Constraint?: BaseConstraintType;
  Property?: Record<string, BaseFieldMetaType>;
}

export interface FileFieldMetaType extends BaseFieldMetaType {
  Type: "File";
  Constraint?: BaseConstraintType;
}

// ============================================================
// RUNTIME ACCESSOR TYPES
// These represent what item.Title looks like at runtime
// ============================================================

/** Base runtime accessor — every field accessor has these */
export interface BaseFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  validate(): ValidationResultType;
}

/** Editable accessor adds set() */
export interface EditableFieldAccessorType<T> extends BaseFieldAccessorType<T> {
  set(value: T): void;
}

/** Readonly accessor has no set() */
export type ReadonlyFieldAccessorType<T> = BaseFieldAccessorType<T>;

/** Union of editable or readonly accessor */
export type FieldAccessorType<T> = EditableFieldAccessorType<T> | ReadonlyFieldAccessorType<T>;

// ============================================================
// SELECT FIELD OPTIONS
// ============================================================

/**
 * Option for select fields
 */
export interface SelectOptionType<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
