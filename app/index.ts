// ============================================================
// KF AI SDK - App Layer Entry Point
// ============================================================
// This is the main entry point for the App layer of the KF AI SDK.
// It provides type-safe, role-based access to all business entities.
//
// Note: Base field types and API client are now in the SDK core.
// This app layer contains only user-configurable business logic.

// ============================================================
// APP-SPECIFIC TYPES
// ============================================================
export * from "./types/roles";

// ============================================================
// SOURCES (Business Entities)
// ============================================================
export * from "./sources/order";
export * from "./sources/leave-request";
export * from "./sources/leave-balance";

// ============================================================
// E-COMMERCE MODULE
// ============================================================
export * from "./sources/ecommerce";

// ============================================================
