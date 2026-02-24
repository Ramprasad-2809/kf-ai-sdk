# @ram_28/kf-ai-sdk Documentation

React SDK for building web applications with type-safe hooks for forms, tables, workflow, and authentication.

## Authentication

**[`useAuth`](./useAuth/README.md)** — Cookie-based authentication with `AuthProvider`, login/logout, session management, and role checks. Wrap your app in `<AuthProvider>` and use `useAuth()` to access `user`, `isAuthenticated`, `login()`, `logout()`.

## BDO (Business Data Objects)

BDO is the data access layer. See the [BDO module docs](./bdo/README.md) for field classes, Item proxy, and the three-generics pattern.

### When working with field types and metadata

**See [Fields](./fields/README.md)** · [API Reference](./fields/api_reference.md)

All 13 field classes (`StringField`, `NumberField`, `SelectField`, `ReferenceField`, `FileField`, etc.), the `BaseField<T>` contract, field-specific getters (`length`, `options`, `precision`, `format`), and pre-built UI components for attachments.

### When building a form for a BDO record

**Use [`useBDOForm`](./useBDOForm/README.md)** · [API Reference](./useBDOForm/api_reference.md)

Create, edit, or view a single BDO record. Automatic validation, per-field server sync, and `handleSubmit` to persist.

### When building a table of BDO records

**Use [`useBDOTable`](./useBDOTable/README.md)** · [API Reference](./useBDOTable/api_reference.md)

List BDO records with sorting, search, filtering, and pagination. Rows are proxies with `.get()` accessors.

### When building a CRUD page (table + form dialog)

**Use `useBDOTable` + `useBDOForm` together.**

The table lists records; clicking a row opens a form dialog to create or edit.

## Workflow

Workflow orchestrates multi-step business processes (e.g., employee submits leave → manager approves). See the [Workflow module docs](./workflow/README.md) for `Workflow`, `Activity`, and instance management.

### When building a form for a workflow activity

**Use [`useActivityForm`](./useActivityForm/README.md)** · [API Reference](./useActivityForm/api_reference.md)

Fill in an activity's input fields. Same API shape as `useBDOForm` but operates on activity instances. Context-derived readonly fields from prior activities are discovered automatically from BP metadata.

### When building a table of workflow activities

**Use [`useActivityTable`](./useActivityTable/README.md)** · [API Reference](./useActivityTable/api_reference.md)

List in-progress or completed activity instances. Same API shape as `useBDOTable` with activity system fields (`Status`, `AssignedTo`, `CompletedAt`, `BPInstanceId`).

### When building a workflow page (table + form dialog)

**Use `useActivityTable` + `useActivityForm` together.**

The table lists activity instances; clicking a row opens a form dialog.
