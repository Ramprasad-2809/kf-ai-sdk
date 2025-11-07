// Main API client
export { api, setApiBaseUrl, setDefaultHeaders } from './client';
export type { ResourceClient } from './client';

// DateTime utilities
export { encodeDatetime, decodeDatetime, encodeDate, decodeDate } from './datetime';

// Re-export common types for convenience
export type {
  SortDirection,
  SortOption,
  Sort,
  Filter,
  FilterCondition,
  FilterOperator,
  FilterRHSType,
  ListOptions,
  ListResponse,
  ReadResponse,
  CreateUpdateResponse,
  DeleteResponse,
  DateTimeEncoded,
  DateEncoded,
} from '../types/common';