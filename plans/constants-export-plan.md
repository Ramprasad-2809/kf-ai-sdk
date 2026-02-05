# Constants Export Plan

## Overview

This plan identifies all hardcoded constants, string literals, and type unions across the SDK that should be exported as runtime constants for better developer experience and type safety.

---

## Current State

### Already Exported
- `DatetimeFormat` from `@ram_28/kf-ai-sdk/api` (DATE, TIME, DATE_TIME formats)

### Not Exported (Hardcoded as String Literals)
All type unions in `sdk/types/common.ts` and other files are only available as TypeScript types, not as runtime constants.

---

## Constants to Export

### Category 1: Filter & Query Operators

#### 1.1 Condition Operators (`ConditionOperator`)
**Location:** Used throughout `useFilter`, `useTable`, `api/client.ts`
**Type:** `ConditionOperatorType`

| Constant | Value | Description |
|----------|-------|-------------|
| `EQ` | `"EQ"` | Equal |
| `NE` | `"NE"` | Not Equal |
| `GT` | `"GT"` | Greater Than |
| `GTE` | `"GTE"` | Greater Than or Equal |
| `LT` | `"LT"` | Less Than |
| `LTE` | `"LTE"` | Less Than or Equal |
| `Between` | `"Between"` | Value within range |
| `NotBetween` | `"NotBetween"` | Value outside range |
| `IN` | `"IN"` | Value in list |
| `NIN` | `"NIN"` | Value not in list |
| `Empty` | `"Empty"` | Field is empty/null |
| `NotEmpty` | `"NotEmpty"` | Field is not empty |
| `Contains` | `"Contains"` | String contains substring |
| `NotContains` | `"NotContains"` | String does not contain |
| `MinLength` | `"MinLength"` | Minimum string length |
| `MaxLength` | `"MaxLength"` | Maximum string length |

#### 1.2 Group/Logical Operators (`GroupOperator`)
**Location:** `useFilter`, filter building
**Type:** `ConditionGroupOperatorType`

| Constant | Value | Description |
|----------|-------|-------------|
| `And` | `"And"` | All conditions must match |
| `Or` | `"Or"` | Any condition can match |
| `Not` | `"Not"` | Negate the condition |

#### 1.3 RHS Value Types (`RHSType`)
**Location:** Filter conditions
**Type:** `FilterRHSTypeType`

| Constant | Value | Description |
|----------|-------|-------------|
| `Constant` | `"Constant"` | Literal constant value |
| `BOField` | `"BOField"` | Reference another field |
| `AppVariable` | `"AppVariable"` | Reference app variable |

---

### Category 2: Sort Constants

#### 2.1 Sort Direction (`SortDirection`)
**Location:** `useTable`, API queries
**Type:** `SortDirectionType`

| Constant | Value | Description |
|----------|-------|-------------|
| `ASC` | `"ASC"` | Ascending order |
| `DESC` | `"DESC"` | Descending order |

---

### Category 3: Metric/Aggregation Constants

#### 3.1 Metric Types (`MetricType`)
**Location:** `api/client.ts` metric/pivot queries
**Type:** `MetricTypeType`

| Constant | Value | Description |
|----------|-------|-------------|
| `Sum` | `"Sum"` | Sum of values |
| `Avg` | `"Avg"` | Average of values |
| `Count` | `"Count"` | Count of records |
| `Max` | `"Max"` | Maximum value |
| `Min` | `"Min"` | Minimum value |
| `DistinctCount` | `"DistinctCount"` | Count of unique values |
| `BlankCount` | `"BlankCount"` | Count of blank/null values |
| `NotBlankCount` | `"NotBlankCount"` | Count of non-blank values |
| `Concat` | `"Concat"` | Concatenate values |
| `DistinctConcat` | `"DistinctConcat"` | Concatenate distinct values |

---

### Category 4: Query Types

#### 4.1 Query Type (`QueryType`)
**Location:** `api/client.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `List` | `"List"` | List query |
| `Metric` | `"Metric"` | Metric/aggregation query |
| `Pivot` | `"Pivot"` | Pivot table query |

---

### Category 5: Form Constants

#### 5.1 Form Operation (`FormOperation`)
**Location:** `useForm`
**Type:** `FormOperationType`

| Constant | Value | Description |
|----------|-------|-------------|
| `Create` | `"create"` | Create new record |
| `Update` | `"update"` | Update existing record |

#### 5.2 Interaction Mode (`InteractionMode`)
**Location:** `useForm` draft operations

| Constant | Value | Description |
|----------|-------|-------------|
| `Interactive` | `"interactive"` | Interactive draft mode |
| `NonInteractive` | `"non-interactive"` | Non-interactive mode |

#### 5.3 Validation Mode (`ValidationMode`)
**Location:** `useForm` (from react-hook-form)

| Constant | Value | Description |
|----------|-------|-------------|
| `OnBlur` | `"onBlur"` | Validate on blur (default) |
| `OnChange` | `"onChange"` | Validate on change |
| `OnSubmit` | `"onSubmit"` | Validate on submit only |
| `OnTouched` | `"onTouched"` | Validate on first blur, then on change |
| `All` | `"all"` | Validate on blur and change |

---

### Category 6: Field Type Constants

#### 6.1 BDO Field Type (`BdoFieldType`)
**Location:** Schema parsing, form field rendering

| Constant | Value | Description |
|----------|-------|-------------|
| `String` | `"String"` | Text field |
| `Number` | `"Number"` | Numeric field |
| `Boolean` | `"Boolean"` | Boolean field |
| `Date` | `"Date"` | Date only field |
| `DateTime` | `"DateTime"` | Date and time field |
| `Reference` | `"Reference"` | Reference to another BDO |
| `Array` | `"Array"` | Array field |
| `Object` | `"Object"` | Object field |
| `ActivityFlow` | `"ActivityFlow"` | Activity flow field |

#### 6.2 Form Input Type (`FormInputType`)
**Location:** Form field rendering

| Constant | Value | Description |
|----------|-------|-------------|
| `Text` | `"text"` | Text input |
| `Number` | `"number"` | Number input |
| `Email` | `"email"` | Email input |
| `Password` | `"password"` | Password input |
| `Date` | `"date"` | Date picker |
| `DateTimeLocal` | `"datetime-local"` | DateTime picker |
| `Checkbox` | `"checkbox"` | Checkbox |
| `Select` | `"select"` | Select dropdown |
| `Textarea` | `"textarea"` | Multi-line text |
| `Reference` | `"reference"` | Reference field |

#### 6.3 Options Mode (`OptionsMode`)
**Location:** Schema parsing for select/reference fields

| Constant | Value | Description |
|----------|-------|-------------|
| `Dynamic` | `"Dynamic"` | Options fetched dynamically |
| `Static` | `"Static"` | Options defined statically |

---

### Category 7: Auth Constants

#### 7.1 Auth Status (`AuthStatus`)
**Location:** `useAuth` hook

| Constant | Value | Description |
|----------|-------|-------------|
| `Loading` | `"loading"` | Auth state being determined |
| `Authenticated` | `"authenticated"` | User is logged in |
| `Unauthenticated` | `"unauthenticated"` | User is not logged in |

---

### Category 8: System Field Constants

#### 8.1 System Fields (`SystemField`)
**Location:** BDO core, validation

| Constant | Value | Description |
|----------|-------|-------------|
| `Id` | `"_id"` | Primary key |
| `CreatedAt` | `"_created_at"` | Creation timestamp |
| `ModifiedAt` | `"_modified_at"` | Last modified timestamp |
| `CreatedBy` | `"_created_by"` | Creator user |
| `ModifiedBy` | `"_modified_by"` | Last modifier user |
| `Version` | `"_version"` | Record version |
| `MergeVersion` | `"_m_version"` | Merge version |

---

### Category 9: HTTP Method Constants

#### 9.1 HTTP Methods (`HttpMethod`)
**Location:** `api/client.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `GET` | `"GET"` | GET request |
| `POST` | `"POST"` | POST request |
| `PATCH` | `"PATCH"` | PATCH request |
| `DELETE` | `"DELETE"` | DELETE request |

---

### Category 10: Default Values

#### 10.1 Defaults (`Defaults`)
**Location:** `useTable`, `useKanban`

| Constant | Value | Description |
|----------|-------|-------------|
| `SEARCH_DEBOUNCE_MS` | `300` | Debounce delay for search |
| `PAGE_SIZE` | `10` | Default items per page |
| `PAGE` | `1` | Default page number (1-indexed) |
| `SEARCH_MAX_LENGTH` | `255` | Maximum search query length |

---

### Category 11: Delete Response Status

#### 11.1 Delete Status (`DeleteStatus`)
**Location:** API delete response

| Constant | Value | Description |
|----------|-------|-------------|
| `Success` | `"success"` | Successful deletion |

---

### Category 12: Date Encoding Keys

#### 12.1 Date Encoding Keys (`DateEncodingKey`)
**Location:** `sdk/types/base-fields.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `Date` | `"$__d__"` | Date encoded field key |
| `DateTime` | `"$__dt__"` | DateTime encoded field key |

---

## Implementation Plan

### Step 1: Create Constants File

Create `sdk/types/constants.ts` with all constants organized by category:

```typescript
// ============================================================
// SDK CONSTANTS
// Runtime constant values for all SDK operations
// ============================================================

// ----- Filter/Query Operators -----
export const ConditionOperator = {
  EQ: "EQ",
  NE: "NE",
  GT: "GT",
  GTE: "GTE",
  LT: "LT",
  LTE: "LTE",
  Between: "Between",
  NotBetween: "NotBetween",
  IN: "IN",
  NIN: "NIN",
  Empty: "Empty",
  NotEmpty: "NotEmpty",
  Contains: "Contains",
  NotContains: "NotContains",
  MinLength: "MinLength",
  MaxLength: "MaxLength",
} as const;

export const GroupOperator = {
  And: "And",
  Or: "Or",
  Not: "Not",
} as const;

// ... etc
```

### Step 2: Update Type Definitions

Update `sdk/types/common.ts` to derive types from constants:

```typescript
import { ConditionOperator, GroupOperator, ... } from './constants';

export type ConditionOperatorType = typeof ConditionOperator[keyof typeof ConditionOperator];
export type ConditionGroupOperatorType = typeof GroupOperator[keyof typeof GroupOperator];
// ... etc
```

### Step 3: Update Module Entry Points

**sdk/types/index.ts:**
```typescript
export * from './base-fields';
export * from './common';
export * from './constants';  // Add this
```

### Step 4: Update Entry Points for Each Module

Each module should re-export relevant constants:

**sdk/filter.ts:**
```typescript
export { ConditionOperator, GroupOperator, RHSType } from './types/constants';
```

**sdk/table.ts:**
```typescript
export { SortDirection, ConditionOperator } from './types/constants';
```

**sdk/api.ts:**
```typescript
export { MetricType, QueryType, HttpMethod } from './types/constants';
```

**sdk/form.ts:**
```typescript
export { FormOperation, InteractionMode, ValidationMode, BdoFieldType, FormInputType } from './types/constants';
```

**sdk/auth.ts:**
```typescript
export { AuthStatus } from './types/constants';
```

**sdk/bdo.ts:**
```typescript
export { SystemField } from './types/constants';
```

### Step 5: Update Internal Usage

Replace hardcoded strings with constants in:
- `sdk/components/hooks/useTable/useTable.ts`
- `sdk/components/hooks/useFilter/useFilter.ts`
- `sdk/components/hooks/useForm/schemaParser.utils.ts`
- `sdk/api/client.ts`
- `sdk/bdo/core/BaseBdo.ts`
- `sdk/bdo/core/Item.ts`

### Step 6: Update Documentation

Update each doc file to reference the constants:

**docs/useFilter.md:**
```markdown
## Filter Operators

Import operators from the SDK:
\`\`\`typescript
import { ConditionOperator, GroupOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";

// Use constants instead of strings
const filter = {
  Operator: GroupOperator.And,
  Condition: [{
    LHSField: "price",
    Operator: ConditionOperator.GT,
    RHSValue: 100,
    RHSType: RHSType.Constant,
  }]
};
\`\`\`
```

**docs/useTable.md:**
```markdown
## Sorting

Import sort direction from the SDK:
\`\`\`typescript
import { SortDirection } from "@ram_28/kf-ai-sdk/table";

const sortConfig = [{ price: SortDirection.DESC }];
\`\`\`
```

**docs/api.md:**
```markdown
## Metric Queries

Import metric types from the SDK:
\`\`\`typescript
import { MetricType } from "@ram_28/kf-ai-sdk/api";

const metric = {
  Type: "Metric",
  Metric: [{ Field: "amount", Type: MetricType.Sum }]
};
\`\`\`
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `sdk/types/constants.ts` | All constants definitions |

### Modified Files
| File | Changes |
|------|---------|
| `sdk/types/common.ts` | Derive types from constants |
| `sdk/types/index.ts` | Export constants |
| `sdk/filter.ts` | Re-export filter constants |
| `sdk/table.ts` | Re-export table constants |
| `sdk/api.ts` | Re-export API constants |
| `sdk/form.ts` | Re-export form constants |
| `sdk/auth.ts` | Re-export auth constants |
| `sdk/bdo.ts` | Re-export BDO constants |
| `sdk/components/hooks/useTable/useTable.ts` | Use constants internally |
| `sdk/components/hooks/useFilter/useFilter.ts` | Use constants internally |
| `sdk/api/client.ts` | Use constants internally |
| `docs/useFilter.md` | Document constants usage |
| `docs/useTable.md` | Document constants usage |
| `docs/api.md` | Document constants usage |
| `docs/useForm.md` | Document constants usage |

---

## Export Summary by Module

| Module | Constants Exported |
|--------|-------------------|
| `@ram_28/kf-ai-sdk/types` | All constants (full access) |
| `@ram_28/kf-ai-sdk/filter` | `ConditionOperator`, `GroupOperator`, `RHSType` |
| `@ram_28/kf-ai-sdk/table` | `SortDirection`, `ConditionOperator`, `Defaults` |
| `@ram_28/kf-ai-sdk/api` | `MetricType`, `QueryType`, `HttpMethod`, `DatetimeFormat`, `DateEncodingKey` |
| `@ram_28/kf-ai-sdk/form` | `FormOperation`, `InteractionMode`, `ValidationMode`, `BdoFieldType`, `FormInputType`, `OptionsMode` |
| `@ram_28/kf-ai-sdk/auth` | `AuthStatus` |
| `@ram_28/kf-ai-sdk/bdo` | `SystemField` |

---

## Benefits

1. **Type Safety**: Constants ensure correct string values at compile time
2. **Autocomplete**: IDE autocomplete for all valid values
3. **Refactoring**: Single source of truth for value changes
4. **Documentation**: Self-documenting code with named constants
5. **Tree-shaking**: Only import what you use
6. **Consistency**: No more typos in hardcoded strings
