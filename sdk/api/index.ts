// Main API client
export {
  api,
  setApiBaseUrl,
  setDefaultHeaders,
  getDefaultHeaders,
  getApiBaseUrl,
} from "./client";
export type { ResourceClient } from "./client";

// DateTime utilities
export {
  encodeDatetime,
  decodeDatetime,
  encodeDate,
  decodeDate,
} from "./datetime";

// Metadata API client
export { getBdoSchema, listMetadata, getBdoFields } from "./metadata";
export type { BackendSchema, MetadataItem, FieldMetadata } from "./metadata";

// Re-export common types for convenience
export type {
  // Sort types
  SortDirection,
  SortOption,
  Sort,
  // Filter types
  Filter,
  FilterCondition,
  FilterOperator,
  FilterRHSType,
  LogicalOperator,
  FilterLogical,
  FilterNode,
  // List types
  ListOptions,
  ListResponse,
  ReadResponse,
  CreateUpdateResponse,
  DeleteResponse,
  CountResponse,
  // DateTime types
  DateTimeEncoded,
  DateEncoded,
  // Metric types
  MetricType,
  MetricField,
  MetricOptions,
  MetricResponse,
  // Pivot types
  PivotHeaderItem,
  PivotResponseData,
  PivotOptions,
  PivotResponse,
  // Draft types
  DraftResponse,
  // Fields types
  FieldsResponse,
} from "../types/common";
