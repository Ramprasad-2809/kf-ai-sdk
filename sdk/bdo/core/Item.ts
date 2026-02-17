// ============================================================
// ITEM CLASS
// Wraps a record with field accessors for type-safe manipulation
// ============================================================

import type {
  ValidationResultType,
  BaseFieldMetaType,
  EditableFieldAccessorType,
  ReadonlyFieldAccessorType,
  FieldAccessorType,
  EditableImageFieldAccessorType,
  ReadonlyImageFieldAccessorType,
  EditableFileFieldAccessorType,
  ReadonlyFileFieldAccessorType,
} from "./types";
import type { BaseField } from "../fields/BaseField";
import type {
  FileType,
  ImageFieldType,
  FileFieldType,
} from "../../types/base-fields";
import type {
  FileUploadRequestType,
  FileDownloadResponseType,
  AttachmentViewType,
} from "../../types/common";
import {
  validateFileExtension,
  extractFileExtension,
} from "../fields/attachment-constants";
import { api } from "../../api/client";

/**
 * Interface for BDO that Item needs
 */
interface BdoLike {
  getFields(): Record<string, BaseField<unknown>>;
  hasMetadata(): boolean;
  validateFieldExpression(
    fieldId: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): ValidationResultType;
  getBoId(): string;
}

// Re-export accessor types for convenience
export type { EditableFieldAccessorType, ReadonlyFieldAccessorType, FieldAccessorType, BaseFieldMetaType };

/**
 * Resolve editable accessor type — specialized for File/Image fields
 */
type ResolveEditableAccessor<T> =
  [T] extends [ImageFieldType]
    ? EditableImageFieldAccessorType
    : [T] extends [FileFieldType]
      ? EditableFileFieldAccessorType
      : EditableFieldAccessorType<T>;

/**
 * Resolve readonly accessor type — specialized for File/Image fields
 */
type ResolveReadonlyAccessor<T> =
  [T] extends [ImageFieldType]
    ? ReadonlyImageFieldAccessorType
    : [T] extends [FileFieldType]
      ? ReadonlyFileFieldAccessorType
      : ReadonlyFieldAccessorType<T>;

/**
 * Create editable accessor type for each field in TEditable
 */
type EditableAccessors<T> = {
  [K in keyof T as K extends "_id" ? never : K]: ResolveEditableAccessor<T[K]>;
};

/**
 * Create readonly accessor type for each field in TReadonly
 */
type ReadonlyAccessors<T> = {
  [K in keyof T as K extends "_id" ? never : K]: ResolveReadonlyAccessor<T[K]>;
};

/**
 * Item type with typed field accessors and direct _id access
 *
 * @template TEditable - Fields that have set() available
 * @template TReadonly - Fields that only have get() and validate()
 */
export type ItemType<
  TEditable extends Record<string, unknown>,
  TReadonly extends Record<string, unknown> = {},
> = Item<TEditable & TReadonly> &
  EditableAccessors<TEditable> &
  ReadonlyAccessors<TReadonly> &
  { readonly _id: string };

/**
 * Item class that wraps a record with field accessors
 *
 * Each field is accessible as a property returning an accessor with:
 * - label: display name
 * - required: whether field is required
 * - readOnly: whether field is read-only
 * - defaultValue: default value
 * - meta: full raw backend meta
 * - get(): get current value
 * - set(value): set value (editable fields only)
 * - validate(): validate current value
 *
 * @template T - The type of the underlying data
 */
export class Item<T extends Record<string, unknown>> {
  private _data: Partial<T>;
  private readonly _bdo: BdoLike;
  private readonly _accessorCache: Map<string, FieldAccessorType<unknown>> = new Map();

  constructor(bdo: BdoLike, data: Partial<T>) {
    this._bdo = bdo;
    this._data = { ...data };

    // Return a Proxy for field accessor access
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Handle Item's own methods and properties first
        if (
          prop === "validate" ||
          prop === "toJSON" ||
          prop === "_bdo" ||
          prop === "_data" ||
          prop === "_accessorCache" ||
          prop === "_getAccessor" ||
          prop === "_requireInstanceId"
        ) {
          return Reflect.get(target, prop, receiver);
        }
        // Handle symbol properties (needed for internal JS operations)
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }
        // _id is always returned directly (not as accessor)
        if (prop === "_id") {
          return target._data._id;
        }
        // Return field accessor for other properties
        return target._getAccessor(prop as string);
      },
      set(target, prop, value) {
        // Prevent setting Item's own properties
        if (
          prop === "_bdo" ||
          prop === "_data" ||
          prop === "_accessorCache" ||
          prop === "validate" ||
          prop === "toJSON"
        ) {
          return false;
        }
        // Handle symbol properties
        if (typeof prop === "symbol") {
          return Reflect.set(target, prop, value);
        }
        // Set value directly on data (shorthand for item.Field.set(value))
        target._data[prop as keyof T] = value;
        return true;
      },
      has(target, prop) {
        if (prop === "validate" || prop === "toJSON") {
          return true;
        }
        return prop in target._data || prop in target._bdo.getFields();
      },
      ownKeys(target) {
        const fields = Object.keys(target._bdo.getFields());
        return [...fields, "validate", "toJSON"];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop === "validate" || prop === "toJSON") {
          return {
            configurable: true,
            enumerable: false,
            value: target[prop as keyof Item<T>],
          };
        }
        const fields = target._bdo.getFields();
        if (prop in fields || prop in target._data) {
          return {
            configurable: true,
            enumerable: true,
            get: () => target._getAccessor(prop as string),
          };
        }
        return undefined;
      },
    }) as Item<T>;
  }

  /**
   * Require instanceId or throw.
   * TODO: Support create flow via draftInteraction to get temp _id
   */
  private _requireInstanceId(): string {
    const id = this._data._id as string | undefined;
    if (!id) {
      throw new Error(
        "Cannot perform attachment operation: item has no _id. Save the item first.",
      );
    }
    return id;
  }

  /**
   * Get or create a field accessor for the given field.
   * Editable fields get set(), readonly fields do not.
   */
  private _getAccessor(fieldId: string): FieldAccessorType<unknown> {
    // Check cache first
    if (this._accessorCache.has(fieldId)) {
      return this._accessorCache.get(fieldId)!;
    }

    const fields = this._bdo.getFields();
    const fieldDef = fields[fieldId];

    // Get raw meta from field definition
    const meta: BaseFieldMetaType = fieldDef?.meta ?? {
      _id: fieldId,
      Name: fieldId,
      Type: "String",
    };
    const isReadOnly = fieldDef?.readOnly ?? false;

    // Shared validate function
    const validate = (): ValidationResultType => {
      // 1. Type validation (existing)
      if (fieldDef) {
        const typeResult = fieldDef.validate(this._data[fieldId as keyof T]);
        if (!typeResult.valid) {
          return typeResult;
        }
      }

      // 2. Expression validation (if metadata loaded)
      if (this._bdo.hasMetadata()) {
        return this._bdo.validateFieldExpression(
          fieldId,
          this._data[fieldId as keyof T],
          this.toJSON() as Record<string, unknown>
        );
      }

      return { valid: true, errors: [] };
    };

    // Shared getOrDefault helper
    const getOrDefault = (fallback: unknown) => {
      const value = this._data[fieldId as keyof T];
      return value !== undefined && value !== null ? value : fallback;
    };

    // Create accessor — only add set() for non-readOnly fields
    let accessor: FieldAccessorType<unknown>;

    if (!isReadOnly) {
      accessor = {
        label: fieldDef?.label ?? fieldId,
        required: fieldDef?.required ?? false,
        readOnly: false,
        defaultValue: fieldDef?.defaultValue,
        meta,
        get: () => this._data[fieldId as keyof T],
        getOrDefault,
        set: (value: unknown) => {
          this._data[fieldId as keyof T] = value as T[keyof T];
        },
        validate,
      };
    } else {
      accessor = {
        label: fieldDef?.label ?? fieldId,
        required: fieldDef?.required ?? false,
        readOnly: true,
        defaultValue: fieldDef?.defaultValue,
        meta,
        get: () => this._data[fieldId as keyof T],
        getOrDefault,
        validate,
      };
    }

    // Enrich File/Image field accessors with attachment methods
    if (meta.Type === "Image" || meta.Type === "File") {
      const boId = this._bdo.getBoId();
      const acc = accessor as unknown as Record<string, unknown>;

      if (meta.Type === "Image") {
        // Image field — single file

        // getDownloadUrl — always available (editable + readonly)
        acc.getDownloadUrl = async (
          viewType?: AttachmentViewType,
        ): Promise<FileDownloadResponseType> => {
          const instanceId = this._requireInstanceId();
          const value = this._data[fieldId as keyof T] as
            | FileType
            | null
            | undefined;
          if (!value?._id) {
            throw new Error(`${fieldId} has no image to download`);
          }
          return api(boId).getDownloadUrl(
            instanceId,
            fieldId,
            value._id,
            viewType,
          );
        };

        // upload + deleteAttachment — editable only
        if (!isReadOnly) {
          /**
           * Upload to storage and update local field value.
           * Does NOT persist to backend — call save()/update() after uploading.
           */
          acc.upload = async (file: File): Promise<FileType> => {
            validateFileExtension(file.name, "Image");
            const instanceId = this._requireInstanceId();
            const request: FileUploadRequestType = {
              FileName: file.name,
              Size: file.size,
              FileExtension: extractFileExtension(file.name),
            };
            const [uploadInfo] = await api(boId).getUploadUrl(
              instanceId,
              fieldId,
              [request],
            );

            await fetch(uploadInfo.UploadUrl.URL, {
              method: "PUT",
              headers: { "Content-Type": uploadInfo.ContentType },
              body: file,
            });

            const metadata: FileType = {
              _id: uploadInfo._id,
              _name: uploadInfo._name,
              FileName: uploadInfo.FileName,
              FileExtension: uploadInfo.FileExtension,
              Size: uploadInfo.Size,
              ContentType: uploadInfo.ContentType,
            };

            this._data[fieldId as keyof T] = metadata as T[keyof T];
            return metadata;
          };

          acc.deleteAttachment = async (): Promise<void> => {
            const instanceId = this._requireInstanceId();
            const value = this._data[fieldId as keyof T] as
              | FileType
              | null
              | undefined;
            if (!value?._id) {
              throw new Error(`${fieldId} has no image to delete`);
            }
            await api(boId).deleteAttachment(instanceId, fieldId, value._id);
            this._data[fieldId as keyof T] = null as T[keyof T];
          };
        }
      } else {
        // File field — multi-file

        // getDownloadUrl + getDownloadUrls — always available (editable + readonly)
        acc.getDownloadUrl = async (
          attachmentId: string,
          viewType?: AttachmentViewType,
        ): Promise<FileDownloadResponseType> => {
          const instanceId = this._requireInstanceId();
          return api(boId).getDownloadUrl(
            instanceId,
            fieldId,
            attachmentId,
            viewType,
          );
        };

        acc.getDownloadUrls = async (
          viewType?: AttachmentViewType,
        ): Promise<FileDownloadResponseType[]> => {
          const instanceId = this._requireInstanceId();
          return api(boId).getDownloadUrls(instanceId, fieldId, viewType);
        };

        // upload + deleteAttachment — editable only
        if (!isReadOnly) {
          /**
           * Upload to storage and update local field value.
           * Does NOT persist to backend — call save()/update() after uploading.
           * (deleteAttachment is atomic — backend handles storage + DB in one call)
           */
          acc.upload = async (files: File[]): Promise<FileType[]> => {
            for (const file of files) {
              validateFileExtension(file.name, "File");
            }
            const instanceId = this._requireInstanceId();
            const requests: FileUploadRequestType[] = files.map((file) => ({
              FileName: file.name,
              Size: file.size,
              FileExtension: extractFileExtension(file.name),
            }));
            const uploadInfos = await api(boId).getUploadUrl(
              instanceId,
              fieldId,
              requests,
            );

            const uploaded: FileType[] = await Promise.all(
              files.map(async (file, i) => {
                await fetch(uploadInfos[i].UploadUrl.URL, {
                  method: "PUT",
                  headers: { "Content-Type": uploadInfos[i].ContentType },
                  body: file,
                });
                return {
                  _id: uploadInfos[i]._id,
                  _name: uploadInfos[i]._name,
                  FileName: uploadInfos[i].FileName,
                  FileExtension: uploadInfos[i].FileExtension,
                  Size: uploadInfos[i].Size,
                  ContentType: uploadInfos[i].ContentType,
                };
              }),
            );

            const current =
              (this._data[fieldId as keyof T] as FileType[] | undefined) ?? [];
            this._data[fieldId as keyof T] = [
              ...current,
              ...uploaded,
            ] as T[keyof T];
            return uploaded;
          };

          acc.deleteAttachment = async (
            attachmentId: string,
          ): Promise<void> => {
            const instanceId = this._requireInstanceId();
            await api(boId).deleteAttachment(
              instanceId,
              fieldId,
              attachmentId,
            );
            const current =
              (this._data[fieldId as keyof T] as FileType[] | undefined) ?? [];
            this._data[fieldId as keyof T] = current.filter(
              (f) => f._id !== attachmentId,
            ) as T[keyof T];
          };
        }
      }
    }

    // Cache and return
    this._accessorCache.set(fieldId, accessor);
    return accessor;
  }

  /**
   * Validate all fields and return combined results
   */
  validate(): ValidationResultType {
    const fields = this._bdo.getFields();
    const allErrors: string[] = [];
    const allValues = this.toJSON() as Record<string, unknown>;

    for (const [fieldId, fieldDef] of Object.entries(fields)) {
      // Skip readonly fields — users can't edit them, so validation errors are confusing
      if (fieldDef.readOnly) continue;

      const value = this._data[fieldId as keyof T];

      // 1. Type validation
      const typeResult = fieldDef.validate(value);
      if (!typeResult.valid) {
        allErrors.push(...typeResult.errors);
        continue; // Skip expression validation if type validation fails
      }

      // 2. Expression validation (if metadata loaded)
      if (this._bdo.hasMetadata()) {
        const exprResult = this._bdo.validateFieldExpression(
          fieldId,
          value,
          allValues
        );
        if (!exprResult.valid) {
          allErrors.push(...exprResult.errors);
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Convert the item to a plain object
   */
  toJSON(): Partial<T> {
    return { ...this._data };
  }
}
