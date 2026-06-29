import Constants from "expo-constants";

export interface PresignResult {
  url: string;
  key: string;
  expiresIn: number;
}

const STORAGE_BASE_URL: string =
  (Constants.expoConfig?.extra?.storageBaseUrl as string | undefined) ??
  "http://localhost:9000/hasti-public";

export function mediaUrl(key: string): string {
  return `${STORAGE_BASE_URL}/${key}`;
}

export async function putToStorage(
  presignUrl: string,
  fileUri: string,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(blob);
  });
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
