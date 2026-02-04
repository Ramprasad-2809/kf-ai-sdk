// ============================================================
// Form Entry Point
// ============================================================
// Exports useForm hook for forms with automatic validation and API operations.

export { useForm, createResolver, createItemProxy } from "./components/hooks/useForm";
export type {
  UseFormOptions,
  UseFormReturn,
  FormItem,
  FormFieldAccessor,
  HandleSubmitType,
} from "./components/hooks/useForm";
