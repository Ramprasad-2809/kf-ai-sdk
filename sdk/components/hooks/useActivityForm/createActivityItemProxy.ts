// ============================================================
// ACTIVITY ITEM PROXY
// ============================================================
// Proxy-based item that delegates to RHF for state management.
// Follows the same pattern as createItemProxy for BaseBdo,
// adapted for Activity. Attachment methods call
// createResourceClient() directly (matching BDO's api() pattern).

import type { UseFormReturn, Path, FieldValues } from 'react-hook-form';
import type { BaseFieldMetaType } from '../../../bdo/core/types';
import type { BaseField } from '../../../bdo/fields/BaseField';
import type { FileType } from '../../../types/base-fields';
import type {
  FileDownloadResponseType,
  AttachmentViewType,
} from '../../../types/common';
import type {
  FormItemType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from '../useForm/types';
import type { Activity } from '../../../workflow/Activity';
import type {
  ExtractActivityEditable,
  ExtractActivityReadonly,
} from './types';
import { createResourceClient } from '../../../api/client';
import {
  validateFileExtension,
  extractFileExtension,
} from '../../../bdo/fields/attachment-constants';

/**
 * Creates a Proxy-based Item that delegates to RHF for state management.
 *
 * Key principle: Item has NO state. It's a view over RHF's state.
 * Editable fields get set(), readonly fields do not.
 *
 * Activity forms always have an instance ID (no draft creation needed),
 * so attachment operations use the provided instanceId directly.
 *
 * @param activity - The Activity instance for field metadata
 * @param form - The RHF useForm return object
 * @param instanceId - The activity instance ID
 * @returns FormItemType proxy
 */
export function createActivityItemProxy<A extends Activity<any, any, any>>(
  activity: A,
  form: UseFormReturn<FieldValues>,
  instanceId: string,
): FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>> {
  const fields = activity._getFields();
  const accessorCache = new Map<
    string,
    | EditableFormFieldAccessorType<unknown>
    | ReadonlyFormFieldAccessorType<unknown>
  >();

  // Resource client for attachment operations — same pattern as BDO's api(boId)
  const activityBasePath = `/api/app/process/${activity.meta.businessProcessId}/${activity.meta.activityId}`;
  const activityApi = createResourceClient(activityBasePath);

  /**
   * Defensive helper — throws if no instance ID is available.
   * Activity forms always have an instance, so this is a safety net.
   */
  function requireInstanceId(): string {
    if (!instanceId) {
      throw new Error(
        'Cannot perform attachment operation: no activity instance ID',
      );
    }
    return instanceId;
  }

  return new Proxy(
    {} as FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>,
    {
      get(_, prop: string | symbol) {
        // Handle symbol properties (e.g., Symbol.toStringTag)
        if (typeof prop === 'symbol') {
          return undefined;
        }

        // Direct _id access (not an accessor, just the value)
        if (prop === '_id') {
          return instanceId;
        }

        // toJSON returns all form values as plain object
        if (prop === 'toJSON') {
          return () => form.getValues();
        }

        // validate triggers RHF validation for all fields
        if (prop === 'validate') {
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
          Type: 'String',
        };
        const isReadOnly = bdoField?.readOnly ?? false;

        // Base validate function
        const validate = () => {
          if (bdoField) {
            return bdoField.validate(
              form.getValues(prop as Path<FieldValues>),
            );
          }
          return { valid: true, errors: [] };
        };

        // Shared getOrDefault helper
        const getOrDefault = (fallback: unknown) => {
          const value = form.getValues(prop as Path<FieldValues>);
          return value !== undefined && value !== null ? value : fallback;
        };

        // Only add set() for editable fields
        if (!isReadOnly) {
          // Defensive get(): File fields return [] instead of null/undefined
          const fieldGet = () => {
            const val = form.getValues(prop as Path<FieldValues>);
            if (fieldMeta.Type === 'File') return val ?? [];
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
                shouldValidate: false,
              });
            },
            validate,
          };

          // Enrich Image/File field accessors with attachment methods
          if (fieldMeta.Type === 'Image' || fieldMeta.Type === 'File') {
            if (fieldMeta.Type === 'Image') {
              // Image: single file upload
              (accessor as any).upload = async (
                file: File,
              ): Promise<FileType> => {
                validateFileExtension(file.name, 'Image');
                const id = requireInstanceId();

                const [uploadInfo] = await activityApi.getUploadUrl(
                  id,
                  prop,
                  [
                    {
                      FileName: file.name,
                      Size: file.size,
                      FileExtension: extractFileExtension(file.name),
                    },
                  ],
                );
                await fetch(uploadInfo.UploadUrl.URL, {
                  method: 'PUT',
                  headers: { 'Content-Type': uploadInfo.ContentType },
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
                form.setValue(prop as Path<FieldValues>, metadata as any, {
                  shouldDirty: true,
                });
                return metadata;
              };

              (accessor as any).deleteAttachment =
                async (): Promise<void> => {
                  const val = form.getValues(
                    prop as Path<FieldValues>,
                  ) as any;
                  const id = requireInstanceId();
                  if (!val?._id)
                    throw new Error(`${prop} has no image to delete`);
                  await activityApi.deleteAttachment(id, prop, val._id);
                  form.setValue(prop as Path<FieldValues>, null as any, {
                    shouldDirty: true,
                  });
                };

              (accessor as any).getDownloadUrl = async (
                viewType?: AttachmentViewType,
              ): Promise<FileDownloadResponseType> => {
                const val = form.getValues(
                  prop as Path<FieldValues>,
                ) as any;
                const id = requireInstanceId();
                if (!val?._id)
                  throw new Error(`${prop} has no image`);
                return activityApi.getDownloadUrl(
                  id,
                  prop,
                  val._id,
                  viewType,
                );
              };
            } else {
              // File field — multi-file
              (accessor as any).upload = async (
                files: File[],
              ): Promise<FileType[]> => {
                for (const file of files)
                  validateFileExtension(file.name, 'File');
                const id = requireInstanceId();

                const requests = files.map((file) => ({
                  FileName: file.name,
                  Size: file.size,
                  FileExtension: extractFileExtension(file.name),
                }));
                const uploadInfos = await activityApi.getUploadUrl(
                  id,
                  prop,
                  requests,
                );
                const uploaded: FileType[] = await Promise.all(
                  files.map(async (file, i) => {
                    await fetch(uploadInfos[i].UploadUrl.URL, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': uploadInfos[i].ContentType,
                      },
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
                  (form.getValues(prop as Path<FieldValues>) as
                    | FileType[]
                    | undefined) ?? [];
                form.setValue(
                  prop as Path<FieldValues>,
                  [...current, ...uploaded] as any,
                  { shouldDirty: true },
                );
                return uploaded;
              };

              (accessor as any).deleteAttachment = async (
                attachmentId: string,
              ): Promise<void> => {
                const current =
                  (form.getValues(prop as Path<FieldValues>) as any[]) ?? [];
                const id = requireInstanceId();
                await activityApi.deleteAttachment(id, prop, attachmentId);
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
                const id = requireInstanceId();
                return activityApi.getDownloadUrl(
                  id,
                  prop,
                  attachmentId,
                  viewType,
                );
              };

              (accessor as any).getDownloadUrls = async (
                viewType?: AttachmentViewType,
              ): Promise<FileDownloadResponseType[]> => {
                const id = requireInstanceId();
                return activityApi.getDownloadUrls(id, prop, viewType);
              };
            }
          }

          accessorCache.set(prop, accessor);
          return accessor;
        }

        // Defensive get() for readonly accessor too
        const readonlyGet = () => {
          const val = form.getValues(prop as Path<FieldValues>);
          if (fieldMeta.Type === 'File') return val ?? [];
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
        if (fieldMeta.Type === 'Image' || fieldMeta.Type === 'File') {
          if (fieldMeta.Type === 'Image') {
            (accessor as any).getDownloadUrl = async (
              viewType?: AttachmentViewType,
            ): Promise<FileDownloadResponseType> => {
              const val = form.getValues(
                prop as Path<FieldValues>,
              ) as any;
              const id = requireInstanceId();
              if (!val?._id)
                throw new Error(`${prop} has no image to download`);
              return activityApi.getDownloadUrl(
                id,
                prop,
                val._id,
                viewType,
              );
            };
          } else {
            (accessor as any).getDownloadUrl = async (
              attachmentId: string,
              viewType?: AttachmentViewType,
            ): Promise<FileDownloadResponseType> => {
              const id = requireInstanceId();
              return activityApi.getDownloadUrl(
                id,
                prop,
                attachmentId,
                viewType,
              );
            };
            (accessor as any).getDownloadUrls = async (
              viewType?: AttachmentViewType,
            ): Promise<FileDownloadResponseType[]> => {
              const id = requireInstanceId();
              return activityApi.getDownloadUrls(id, prop, viewType);
            };
          }
        }

        accessorCache.set(prop, accessor);
        return accessor;
      },

      has(_, prop) {
        if (typeof prop === 'symbol') return false;
        if (prop === '_id' || prop === 'toJSON' || prop === 'validate')
          return true;
        return prop in fields;
      },

      ownKeys(_) {
        return [...Object.keys(fields), '_id', 'toJSON', 'validate'];
      },

      getOwnPropertyDescriptor(_, prop) {
        if (typeof prop === 'symbol') return undefined;
        return {
          configurable: true,
          enumerable: prop !== 'toJSON' && prop !== 'validate',
        };
      },
    },
  );
}
