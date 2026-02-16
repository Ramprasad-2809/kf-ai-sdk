# API Conventions

## Endpoint Structure

Base path: `/api/app/{bo_id}` with operation suffixes.

| Operation | Method | Path |
|-----------|--------|------|
| Get | GET | `/{bo_id}/{id}/read` |
| Create | POST | `/{bo_id}/create` |
| Update | POST | `/{bo_id}/{id}/update` |
| Delete | DELETE | `/{bo_id}/{id}/delete` |
| List | POST | `/{bo_id}/list` |
| Count | POST | `/{bo_id}/metric` (uses Metric with Count aggregation) |
| Draft | POST | `/{bo_id}/draft` |
| Draft Update | POST | `/{bo_id}/{id}/draft` |
| Draft Patch | PATCH | `/{bo_id}/{id}/draft` |
| Draft Interaction | PATCH | `/{bo_id}/draft` |
| Metric | POST | `/{bo_id}/metric` |
| Pivot | POST | `/{bo_id}/pivot` |
| Fields | GET | `/{bo_id}/fields` |
| Fetch Field | GET | `/{bo_id}/{id}/field/{field_id}/fetch` |

## Resource Client Pattern

```typescript
// Basic CRUD
api("bo_id").get(id)
api("bo_id").create(data)
api("bo_id").update(id, data)
api("bo_id").delete(id)
api("bo_id").list({ Filter, Sort, Page, PageSize })
api("bo_id").count({ Filter })

// Draft/Interactive
api("bo_id").draft(data)
api("bo_id").draftUpdate(id, data)
api("bo_id").draftPatch(id, data)
api("bo_id").draftInteraction(data)

// Query
api("bo_id").metric({ GroupBy, Metric, Filter })
api("bo_id").pivot({ Row, Column, Metric, Filter })

// Metadata
api("bo_id").fields()
api("bo_id").fetchField(instanceId, fieldId)
```

## Response Types

- `get()`: Returns entity `T` (unwrapped from `ReadResponseType<T>.Data`)
- `list()`: Returns `ListResponseType<T>` (with `Data: T[]`)
- `create()` / `update()`: Returns `CreateUpdateResponseType` (but `BaseBdo.create()` wraps into `ItemType`)
- `delete()`: Returns `DeleteResponseType`
- `count()`: Returns `CountResponseType` (with `Count: number`)
- `draft()`: Returns `DraftResponseType`
- `draftUpdate()`: Returns `CreateUpdateResponseType`
- `draftPatch()`: Returns `DraftResponseType`
- `draftInteraction()`: Returns `DraftResponseType & { _id: string }`
- `metric()`: Returns `MetricResponseType`
- `pivot()`: Returns `PivotResponseType`
- `fields()`: Returns `FieldsResponseType`
- `fetchField<TResult>()`: Returns `TResult[]`

## Error Handling

- Every method throws a plain `Error` on non-ok responses
- Error message format: `"Failed to {operation} {path}: {statusText}"`
- Use `try/catch` around API calls

## Query Parameters

- `Filter`: `ConditionGroupType` with `Operator` ("And" / "Or" / "Not") and `Condition` array
- `Sort`: `Record<string, "ASC" | "DESC">[]` — format: `[{ "fieldName": "ASC" }]`
- `Page` / `PageSize`: Pagination (1-indexed)
