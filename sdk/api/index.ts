// Main API client
export {
  api,
  createResourceClient,
  setApiBaseUrl,
  setDefaultHeaders,
  getDefaultHeaders,
  getApiBaseUrl,
} from "./client";
export type { ResourceClient } from "./client";

// DateTime utilities
export {
  DatetimeFormat,
  decodeDate,
  decodeDateTime,
  formatDate,
  formatDateTime,
  parseDate,
  parseDateTime,
} from "./datetime";

// Metadata API client
export { getBdoSchema, listMetadata } from "./metadata";
export type { BackendSchema, MetadataItem, FieldMetadata } from "./metadata";

// Re-export common types for convenience
export type {
  // Sort types
  SortDirectionType,
  SortOptionType,
  SortType,
  // Filter types
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  FilterRHSTypeType,
  ConditionOperatorType,
  // List types
  ListOptionsType,
  ListResponseType,
  ReadResponseType,
  CreateUpdateResponseType,
  DeleteResponseType,
  CountResponseType,
  // Metric types
  MetricTypeType,
  MetricFieldType,
  MetricOptionsType,
  MetricResponseType,
  // Pivot types
  PivotHeaderItemType,
  PivotResponseDataType,
  PivotOptionsType,
  PivotResponseType,
  // Draft types
  DraftResponseType,
  // Fields types
  FieldsResponseType,
} from "../types/common";

// Re-export date types from base-fields
export type {
  DateEncodedType,
  DateTimeEncodedType,
} from "../types/base-fields";
