# Date & DateTime Handling

Working with Date and DateTime fields in the SDK.

## API Response Format

The backend returns dates in encoded format:
- **Date**: `{ "$__d__": "YYYY-MM-DD" }`
- **DateTime**: `{ "$__dt__": unix_timestamp_seconds }`

## Imports

```typescript
// Decoding & formatting for API
import {
  decodeDate,
  decodeDateTime,
  formatDate,
  formatDateTime,
  parseDate,
  parseDateTime,
} from "@ram_28/kf-ai-sdk/api";

// UI display formatting
import {
  formatDate,
  formatDateTime
} from "@ram_28/kf-ai-sdk/utils";
```

## Decoding API Responses

Convert encoded dates to JavaScript Date objects.

### decodeDate
```typescript
const apiResponse = { "$__d__": "2025-03-15" };
const date = decodeDate(apiResponse);
// => Date object for March 15, 2025
```

### decodeDateTime
```typescript
const apiResponse = { "$__dt__": 1769110463 };
const date = decodeDateTime(apiResponse);
// => Date object with full timestamp
```

## Formatting for API Requests

Convert Date objects to strings the API expects.

### formatDate (API)
```typescript
import { formatDate } from "@ram_28/kf-ai-sdk/api";

const date = new Date(2025, 2, 15);
formatDate(date); // => "2025-03-15"
```

### formatDateTime (API)
```typescript
import { formatDateTime } from "@ram_28/kf-ai-sdk/api";

const date = new Date(2025, 2, 15, 10, 30, 45);
formatDateTime(date); // => "2025-03-15 10:30:45"
```

## Formatting for UI Display

Convert Date objects to human-readable strings.

### formatDate (UI)
```typescript
import { formatDate } from "@ram_28/kf-ai-sdk/utils";

const date = new Date(2025, 2, 15);
formatDate(date, 'short');  // => "3/15/25"
formatDate(date, 'medium'); // => "Mar 15, 2025"
formatDate(date, 'long');   // => "March 15, 2025"
```

### formatDateTime (UI)
```typescript
import { formatDateTime } from "@ram_28/kf-ai-sdk/utils";

const date = new Date(2025, 2, 15, 10, 30, 45);
formatDateTime(date, 'short');  // => "3/15/25, 10:30 AM"
formatDateTime(date, 'medium'); // => "Mar 15, 2025, 10:30:45 AM"
formatDateTime(date, 'long');   // => "March 15, 2025 at 10:30:45 AM"
```

## Common Patterns

### Display a date from API response
```typescript
import { decodeDate } from "@ram_28/kf-ai-sdk/api";
import { formatDate } from "@ram_28/kf-ai-sdk/utils";

function displayDate(encodedDate: { $__d__: string }) {
  const date = decodeDate(encodedDate);
  return formatDate(date, 'medium');
}

// Usage in component
<span>{displayDate(record.OrderDate)}</span>
```

### Display created/modified timestamps
```typescript
import { decodeDateTime } from "@ram_28/kf-ai-sdk/api";
import { formatDateTime } from "@ram_28/kf-ai-sdk/utils";

function displayTimestamp(encodedDateTime: { $__dt__: number }) {
  const date = decodeDateTime(encodedDateTime);
  return formatDateTime(date, 'medium');
}

// Usage
<span>Created: {displayTimestamp(record._created_at)}</span>
<span>Modified: {displayTimestamp(record._modified_at)}</span>
```

### Submit a date to the API
```typescript
import { formatDate } from "@ram_28/kf-ai-sdk/api";

// From a date picker value
const datePickerValue = "2025-03-15"; // HTML date input value
// Already in correct format, use directly

// From a Date object
const dateObj = new Date();
const apiValue = formatDate(dateObj); // => "2025-03-15"
```

## Type Definitions

```typescript
import type {
  DateEncodedType,      // { $__d__: string }
  DateTimeEncodedType,  // { $__dt__: number }
} from "@ram_28/kf-ai-sdk/api";
```
