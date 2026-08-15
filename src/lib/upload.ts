import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

export interface PresignResult {
  url: string;
  key: string;
  expiresIn: number;
}

const STORAGE_BASE_URL: string =
  (Constants.expoConfig?.extra?.storageBaseUrl as string | undefined) ??
  "http://localhost:9000/hasti-public";

// Presigned URLs are returned from the API as absolute, opaque URLs and must be
// used verbatim — the signature is bound to the URL's host, so rewriting would
// invalidate it. Pass them straight through.
function rewritePresignUrl(presignUrl: string): string {
  return presignUrl;
}

export function mediaUrl(key: string): string {
  return `${STORAGE_BASE_URL}/${key}`;
}

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

export async function putToStorage(
  presignUrl: string,
  fileUri: string,
  contentType: string
): Promise<void> {
  const url = rewritePresignUrl(presignUrl);

  // Android image-picker returns content:// URIs; FileSystem.uploadAsync requires
  // a file:// URI (its native layer calls toFile() which crashes on content:// URIs).
  // Copy to a temp file first, upload from there, then clean up.
  let uploadUri = fileUri;
  let tempFile: string | null = null;
  if (!fileUri.startsWith("file://")) {
    const ext = contentType.split("/")[1]?.split("+")[0] ?? "bin";
    const cache = FileSystem.cacheDirectory;
    if (!cache) throw new Error("No cache directory");
    tempFile = `${cache}hasti_upload_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: fileUri, to: tempFile });
    uploadUri = tempFile;
  }

  const fileInfo = await FileSystem.getInfoAsync(uploadUri);
  if (fileInfo.exists && fileInfo.size > MAX_UPLOAD_BYTES) {
    if (tempFile) FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {});
    throw new Error("File exceeds the 100 MB upload limit.");
  }

  try {
    const result = await FileSystem.uploadAsync(url, uploadUri, {
      httpMethod: "PUT",
      headers: { "Content-Type": contentType },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed: ${result.status} ${result.body}`);
    }
  } finally {
    if (tempFile) {
      FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {});
    }
  }
}

export function getContentType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "pdf":
      return "application/pdf";
    case "mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}
