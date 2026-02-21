// ============================================================
// WORKFLOW MODULE - Main Entry Point
// @ram_28/kf-ai-sdk/workflow
// ============================================================

export { Workflow } from './workflow/client';
export { Activity } from './workflow/Activity';
export { ActivityInstance } from './workflow/ActivityInstance';
export type {
  ActivityInstanceType,
  EditableFieldAccessor,
  ReadonlyFieldAccessor,
} from './workflow/ActivityInstance';
export type {
  ActivityInstanceFieldsType,
  ActivityOperations,
  ActivityProgressType,
  WorkflowStartResponseType,
} from './workflow/types';
export { createFieldFromMeta, buildFieldsFromInput } from './workflow/createFieldFromMeta';

export { useActivityForm } from './components/hooks/useActivityForm';
export type {
  UseActivityFormOptions,
  UseActivityFormReturn,
} from './components/hooks/useActivityForm';

export { useActivityTable, ActivityTableStatus } from './components/hooks/useActivityTable';
export type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityTableStatusType,
  ActivityRowType,
} from './components/hooks/useActivityTable';
