import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import type { BaseBdo } from "../../../bdo";
import type { BaseFieldMetaType } from "../../../bdo/core/types";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type { FileType } from "../../../types/base-fields";
import type { FileDownloadResponseType, AttachmentViewType } from "../../../types/common";
import { api } from "../../../api/client";
import { validateFileExtension, extractFileExtension } from "../../../bdo/fields/attachment-constants";
import { validateConstraints } from "./createResolver";
import type {
  FormItemType,
  ExtractEditableType,
  ExtractReadonlyType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from "./types";

/**
 * Creates a Proxy-based Item that delegates to RHF for state management.
 *
 * Key principle: Item has NO state. It's a view over RHF's state.
 * Editable fields get set(), readonly fields do not.
 *
 * In create mode (no _id), attachment and fetch operations use 'draft' as the
 * instanceId, which the backend accepts as a placeholder.
 *
 * @param bdo - The BDO instance for field metadata
 * @param form - The RHF useForm return object
 * @returns SmartFormItem proxy
 */
export function createItemProxy<B extends BaseBdo<any, any, any>>(
  bdo: B,
  form: UseFormReturn<FieldValues>,
): FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>> {
  const fields = bdo.getFields();
  const accessorCache = new Map<string, EditableFormFieldAccessorType<unknown> | ReadonlyFormFieldAccessorType<unknown>>();

  const boIdShared = bdo.getBoId();

  /** Returns the real _id in edit mode, or 'draft' in create mode */
  const getInstanceId = (): string =>
    (form.getValues("_id" as Path<FieldValues>) as string) || "draft";

  return new Proxy({} as FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>>, {
    get(_, prop: string | symbol) {
      // Handle symbol properties (e.g., Symbol.toStringTag)
      if (typeof prop === "symbol") {
        return undefined;
      }

      // Direct _id access (not an accessor, just the value)
      if (prop === "_id") {
        return form.getValues("_id" as Path<FieldValues>);
      }

      // toJSON returns all form values as plain object
      if (prop === "toJSON") {
        return () => form.getValues();
      }

      // validate triggers RHF validation for all fields
      if (prop === "validate") {
        return () => form.trigger();
      }

      // Return cached accessor if available
      if (accessorCache.has(prop)) {
        return accessorCache.get(prop);
      }

      // Field accessor
      const bdoField = fields[prop] as BaseField<unknown> | undefined;
      const fieldMeta: BaseFieldMetaType = bdoField?.meta ?? {
        _id: prop,
        Name: prop,
        Type: "String",
      };
      const isReadOnly = bdoField?.readOnly ?? false;

      // Full validation: type + constraint + expression (matches createResolver pipeline)
      const validate = () => {
        if (!bdoField) return { valid: true, errors: [] };
        let value = form.getValues(prop as Path<FieldValues>);

        // Coerce string → number for NumberField (HTML inputs always send strings)
        if ("integerPart" in bdoField && typeof value === "string" && value !== "") {
          const num = Number(value);
          if (!isNaN(num)) {
            value = num;
            form.setValue(prop as Path<FieldValues>, num as any, { shouldDirty: false });
          }
        }

        // Match backend BDO core: skip ALL validation for non-required empty fields
        if (!bdoField.required && (value == null || value === "" || (Array.isArray(value) && value.length === 0))) {
          return { valid: true, errors: [] };
        }

        // 1. Type validation
        const typeResult = bdoField.validate(value);
        if (!typeResult.valid) return typeResult;

        // 2. Constraint validation
        const constraintResult = validateConstraints(bdoField as BaseField<unknown>, value);
        if (!constraintResult.valid) return constraintResult;

        // 3. Expression validation
        if (bdo.hasMetadata()) {
          const exprResult = bdo.validateFieldExpression(
            prop,
            value,
            form.getValues() as Record<string, unknown>,
          );
          if (!exprResult.valid) return exprResult;
        }

        return { valid: true, errors: [] };
      };

      // Only add set() for non-readOnly fields
      // Shared getOrDefault helper
      const getOrDefault = (fallback: unknown) => {
        const value = form.getValues(prop as Path<FieldValues>);
        return value !== undefined && value !== null ? value : fallback;
      };

      if (!isReadOnly) {
        // Defensive get(): File fields return [] instead of null/undefined, Image returns null
        const fieldGet = () => {
          const val = form.getValues(prop as Path<FieldValues>);
          if (fieldMeta.Type === "File") return val ?? [];
          return val;
        };

        const accessor: EditableFormFieldAccessorType<unknown> = {
          label: bdoField?.label ?? prop,
          required: bdoField?.required ?? false,
          readOnly: false,
          defaultValue: bdoField?.defaultValue,
          meta: fieldMeta,
          get: fieldGet,
          getOrDefault,
          set: (value: unknown) => {
            form.setValue(prop as Path<FieldValues>, value as any, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: false, // Let mode control validation timing
            });
          },
          validate,
        };

        // Enrich Image/File field accessors with attachment methods (draft-based upload)
        if (fieldMeta.Type === "Image" || fieldMeta.Type === "File") {
          const boId = boIdShared;

          if (fieldMeta.Type === "Image") {
            // Image: single file upload — always uploads immediately (draft in create mode)
            (accessor as any).upload = async (file: File): Promise<FileType> => {
              validateFileExtension(file.name, "Image");
              const id = getInstanceId();

              const [uploadInfo] = await api(boId).getUploadUrl(id, prop, [
                { FileName: file.name, Size: file.size, FileExtension: extractFileExtension(file.name) },
              ]);
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
              form.setValue(prop as Path<FieldValues>, metadata as any, { shouldDirty: true });
              return metadata;
            };

            (accessor as any).deleteAttachment = async (): Promise<void> => {
              const val = form.getValues(prop as Path<FieldValues>) as any;
              const instanceId = getInstanceId();
              if (!(val?._id)) throw new Error(`${prop} has no image to delete`);
              await api(boId).deleteAttachment(instanceId, prop, val._id);
              form.setValue(prop as Path<FieldValues>, null as any, { shouldDirty: true });
            };

            (accessor as any).getDownloadUrl = async (viewType?: AttachmentViewType): Promise<FileDownloadResponseType> => {
              const val = form.getValues(prop as Path<FieldValues>) as any;
              const instanceId = getInstanceId();
              if (!(val?._id)) throw new Error(`${prop} has no image`);
              return api(boId).getDownloadUrl(instanceId, prop, val._id, viewType);
            };
          } else {
            // File field — multi-file, always uploads immediately (draft in create mode)
            (accessor as any).upload = async (files: File[]): Promise<FileType[]> => {
              for (const file of files) validateFileExtension(file.name, "File");
              const id = getInstanceId();

              const requests = files.map((file) => ({
                FileName: file.name,
                Size: file.size,
                FileExtension: extractFileExtension(file.name),
              }));
              const uploadInfos = await api(boId).getUploadUrl(id, prop, requests);
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
              const current = (form.getValues(prop as Path<FieldValues>) as FileType[] | undefined) ?? [];
              form.setValue(prop as Path<FieldValues>, [...current, ...uploaded] as any, { shouldDirty: true });
              return uploaded;
            };

            (accessor as any).deleteAttachment = async (attachmentId: string): Promise<void> => {
              const current = (form.getValues(prop as Path<FieldValues>) as any[]) ?? [];
              const instanceId = getInstanceId();
              await api(boId).deleteAttachment(instanceId, prop, attachmentId);
              form.setValue(
                prop as Path<FieldValues>,
                current.filter((f) => f._id !== attachmentId) as any,
                { shouldDirty: true },
              );
            };

            (accessor as any).getDownloadUrl = async (
              attachmentId: string,
              viewType?: AttachmentViewType,
            ): Promise<FileDownloadResponseType> => {
              const instanceId = getInstanceId();
              return api(boId).getDownloadUrl(instanceId, prop, attachmentId, viewType);
            };
            (accessor as any).getDownloadUrls = async (
              viewType?: AttachmentViewType,
            ): Promise<FileDownloadResponseType[]> => {
              const instanceId = getInstanceId();
              return api(boId).getDownloadUrls(instanceId, prop, viewType);
            };
          }
        }

        accessorCache.set(prop, accessor);
        return accessor;
      }

      // Defensive get() for readonly accessor too
      const readonlyGet = () => {
        const val = form.getValues(prop as Path<FieldValues>);
        if (fieldMeta.Type === "File") return val ?? [];
        return val;
      };

      const accessor: ReadonlyFormFieldAccessorType<unknown> = {
        label: bdoField?.label ?? prop,
        required: bdoField?.required ?? false,
        readOnly: true,
        defaultValue: bdoField?.defaultValue,
        meta: fieldMeta,
        get: readonlyGet,
        getOrDefault,
        validate,
      };

      // Enrich readonly Image/File field accessors with download methods
      if (fieldMeta.Type === "Image" || fieldMeta.Type === "File") {
        const boId = boIdShared;

        if (fieldMeta.Type === "Image") {
          (accessor as any).getDownloadUrl = async (viewType?: AttachmentViewType): Promise<FileDownloadResponseType> => {
            const val = form.getValues(prop as Path<FieldValues>) as any;
            const instanceId = getInstanceId();
            if (!(val?._id)) throw new Error(`${prop} has no image to download`);
            return api(boId).getDownloadUrl(instanceId, prop, val._id, viewType);
          };
        } else {
          (accessor as any).getDownloadUrl = async (
            attachmentId: string,
            viewType?: AttachmentViewType,
          ): Promise<FileDownloadResponseType> => {
            const instanceId = getInstanceId();
            return api(boId).getDownloadUrl(instanceId, prop, attachmentId, viewType);
          };
          (accessor as any).getDownloadUrls = async (
            viewType?: AttachmentViewType,
          ): Promise<FileDownloadResponseType[]> => {
            const instanceId = getInstanceId();
            return api(boId).getDownloadUrls(instanceId, prop, viewType);
          };
        }
      }

      accessorCache.set(prop, accessor);
      return accessor;
    },

    has(_, prop) {
      if (typeof prop === "symbol") return false;
      if (prop === "_id" || prop === "toJSON" || prop === "validate")
        return true;
      return prop in fields;
    },

    ownKeys(_) {
      return [...Object.keys(fields), "_id", "toJSON", "validate"];
    },

    getOwnPropertyDescriptor(_, prop) {
      if (typeof prop === "symbol") return undefined;
      return {
        configurable: true,
        enumerable: prop !== "toJSON" && prop !== "validate",
      };
    },
  });
}
