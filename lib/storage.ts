import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * 이미지 저장은 두 갈래.
 * - 배포(Vercel): 파일 시스템이 읽기 전용이라 Vercel Blob에만 쓸 수 있다.
 * - 로컬 개발: Blob 토큰 없이도 굴러가도록 public/uploads에 그냥 파일로 떨군다.
 * 다른 저장소로 옮기고 싶다면 이 파일만 고치면 된다.
 */
function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return { error: "이미지 파일만 올릴 수 있어요 (png, jpg, webp, gif)." };
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "이미지가 너무 커요. 10MB 이하로 올려주세요." };
  }

  const filename = `${randomUUID()}.${ext}`;

  if (usingBlob()) {
    try {
      const blob = await put(`uploads/${filename}`, file, {
        access: "public",
        contentType: file.type,
      });
      return { url: blob.url };
    } catch {
      return { error: "이미지를 저장하지 못했어요. 잠시 후 다시 시도해주세요." };
    }
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${filename}` };
}

export async function removeImage(url: string) {
  if (url.startsWith("http")) {
    await del(url).catch(() => {});
    return;
  }
  if (!url.startsWith("/uploads/")) return;
  await unlink(path.join(LOCAL_DIR, path.basename(url))).catch(() => {});
}

const LOCAL_URL = /^\/uploads\/[0-9a-f-]{36}\.(webp|jpg|png|gif)$/;
const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[0-9a-f-]{36}\.(webp|jpg|png|gif)$/;

/**
 * 글을 저장할 때 넘어오는 이미지 URL이 우리가 방금 올린 것인지 확인한다.
 * 클라이언트가 보내는 값이라 아무 주소나 들어올 수 있어서 형태를 검사한다.
 */
export function isManagedImageUrl(url: string) {
  return LOCAL_URL.test(url) || BLOB_URL.test(url);
}
