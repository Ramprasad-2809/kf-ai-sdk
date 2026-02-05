// ============================================================
// Form Entry Point
// ============================================================
// Exports useForm hook for forms with automatic validation and API operations.

export { useForm, createResolver, createItemProxy } from "./components/hooks/useForm";
export type {
  UseFormOptions,
  UseFormReturn,
  SmartFormItem,
  EditableFormFieldAccessor,
  ReadonlyFormFieldAccessor,
  SmartRegister,
  HandleSubmitType,
  ExtractEditable,
  ExtractReadonly,
  AllFields,
} from "./components/hooks/useForm";
