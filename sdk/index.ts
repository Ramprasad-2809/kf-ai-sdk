// ============================================================
// @ram_28/kf-ai-sdk - Main Entry Point
// ============================================================
// This is the primary export file for the SDK, providing a unified
// interface to all hooks, types, utilities, and API functions.

// ============================================================
// HOOKS - Core functionality for building applications
// ============================================================

// Table hook - Data tables with sorting, pagination, and filtering
export { useTable } from './components/hooks/useTable';
export type {
  UseTableOptionsType,
  UseTableReturnType,
} from './components/hooks/useTable';

// Form hook - Schema-driven forms with validation
export { useForm } from './components/hooks/useForm';
export type {
  UseFormOptionsType,
  UseFormReturnType,
  FormFieldConfigType,
  FormSchemaConfigType,
} from './components/hooks/useForm';

// Kanban hook - Kanban board state management
export { useKanban } from './components/hooks/useKanban';
export type {
  UseKanbanOptionsType,
  UseKanbanReturnType,
  KanbanCardType,
  KanbanColumnType,
  ColumnConfigType,
} from './components/hooks/useKanban';

// Filter hook - Advanced filtering with logical operators
export { useFilter, isCondition, isConditionGroup } from './components/hooks/useFilter';
export type {
  UseFilterOptionsType,
  UseFilterReturnType,
} from './components/hooks/useFilter';

// ============================================================
// AUTHENTICATION - User authentication and authorization
// ============================================================

export { AuthProvider, useAuth } from './auth';
export type {
  UseAuthReturnType,
  UserDetailsType,
  AuthStatusType,
  AuthProviderPropsType,
} from './auth/types';

// ============================================================
// API CLIENT - Type-safe CRUD operations
// ============================================================

export { api, setApiBaseUrl, getApiBaseUrl, getBdoSchema } from './api';

// ============================================================
// TYPES - Core type definitions
// ============================================================

// Common types
export type {
  SortType,
  SortDirectionType,
  FilterType,
  ConditionType,
  ConditionGroupType,
  ConditionOperatorType,
  ConditionGroupOperatorType,
  ListResponseType,
  ListOptionsType,
  ColumnDefinitionType,
} from './types/common';

// Base field types
export type {
  IdFieldType,
  StringFieldType,
  TextAreaFieldType,
  NumberFieldType,
  LongFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  CurrencyFieldType,
  SelectFieldType,
  LookupFieldType,
  ArrayFieldType,
  JSONFieldType,
  ReferenceFieldType,
  ExtractReferenceType,
  ExtractFetchFieldType,
} from './types/base-fields';

// ============================================================
// UTILITIES - Helper functions
// ============================================================

// Formatting utilities
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatBoolean,
  formatArray,
  formatJSON,
  formatFieldValue,
} from './utils/formatting';

// Class name utility
export { cn } from './utils/cn';

// Error handling utilities
export {
  toError,
  isError,
  getErrorMessage,
  isNetworkError,
  isTimeoutError,
  isAbortError,
  tryCatch,
  wrapError,
} from './utils/error-handling';

// API utilities
export {
  buildListOptions,
  buildCountOptions,
  combineFilters,
} from './utils/api';

// ============================================================
// UI COMPONENTS - Pre-built React components
// ============================================================

export {
  Kanban,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanCardTitle,
  KanbanCardDescription,
  KanbanColumnFooter,
} from './components/ui';

// ============================================================
// LEGACY EXPORTS - For backwards compatibility
// ============================================================

// Re-export everything from submodules for backwards compatibility
export * from './types';
export * from './api';
export * from './utils';
export * from './components';
export * from './auth';