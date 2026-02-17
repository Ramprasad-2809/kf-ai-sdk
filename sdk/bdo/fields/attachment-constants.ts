/** Supported image extensions — matches backend SupportFileExtensions.IMAGE_EXTENSIONS */
export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "tif",
  "heic",
  "heif",
]);

/** Supported file extensions — matches backend SupportFileExtensions.FILE_EXTENSIONS */
export const FILE_EXTENSIONS = new Set([
  // Images
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "tif",
  "heic",
  "heif",
  // Videos
  "mp4",
  "mov",
  "avi",
  "webm",
  "mkv",
  "m4v",
  "wmv",
  "flv",
  // Documents
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  // Other
  "txt",
  "csv",
  "zip",
]);

/** Extract and normalize file extension from a filename. Returns lowercase without dot. */
export function extractFileExtension(fileName: string): string {
  if (!fileName.includes(".")) return "";
  const parts = fileName.split(".");
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

/** Validate file extension against backend whitelist. Throws on invalid. */
export function validateFileExtension(
  fileName: string,
  fieldType: "File" | "Image",
): void {
  const ext = extractFileExtension(fileName);
  const allowed = fieldType === "Image" ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
  if (!ext || !allowed.has(ext)) {
    const types = [...allowed].sort().join(", ");
    throw new Error(
      `File "${fileName}" has unsupported extension "${ext || "(none)"}". ` +
        `Supported for ${fieldType} fields: ${types}`,
    );
  }
}
