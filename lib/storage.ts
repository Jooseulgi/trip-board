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
const BLOB_PREFIX = "uploads";

/**
 * 이미지 저장은 세 갈래.
 * - Vercel Blob (public 저장소): CDN 주소를 그대로 <img>에 쓴다.
 * - Vercel Blob (private 저장소): 주소로 바로 못 읽어서 /api/image 로 흘려보낸다.
 * - 로컬 개발: Blob이 없으면 public/uploads에 파일로 떨군다.
 *
 * 저장소가 public인지 private인지는 Vercel에서 만들 때 정해지고 바꾸기 번거로워서,
 * 처음 한 번 실제로 써보고 알아낸 뒤 기억해둔다.
 */
let blobAccess: "public" | "private" | null = null;

function usingBlob() {
  // 예전 방식은 BLOB_READ_WRITE_TOKEN, 요즘은 OIDC + BLOB_STORE_ID를 쓴다.
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function isAccessMismatch(error: unknown) {
  return /private store|public store|access on a/i.test(
    error instanceof Error ? error.message : String(error),
  );
}

async function putToBlob(filename: string, file: File) {
  const candidates: ("public" | "private")[] = blobAccess ? [blobAccess] : ["public", "private"];
  let lastError: unknown;

  for (const access of candidates) {
    try {
      const blob = await put(`${BLOB_PREFIX}/${filename}`, file, {
        access,
        contentType: file.type,
      });
      blobAccess = access;
      // private 저장소는 주소로 바로 못 읽으니 우리 라우트를 거치게 한다
      return access === "public" ? blob.url : `/api/image/${filename}`;
    } catch (error) {
      lastError = error;
      if (!isAccessMismatch(error)) throw error;
    }
  }
  throw lastError;
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
      return { url: await putToBlob(filename, file) };
    } catch (error) {
      console.error("[storage] Blob 업로드 실패", error);
      return { error: "이미지를 저장하지 못했어요. 잠시 후 다시 시도해주세요." };
    }
  }

  // 배포 환경은 파일 시스템이 읽기 전용이라 여기까지 오면 안 된다.
  if (process.env.VERCEL) {
    console.error("[storage] Blob 저장소가 프로젝트에 연결되지 않았습니다");
    return { error: "이미지 저장소가 아직 연결되지 않았어요." };
  }

  try {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, filename), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/${filename}` };
  } catch (error) {
    console.error("[storage] 로컬 저장 실패", error);
    return { error: "이미지를 저장하지 못했어요." };
  }
}

export async function removeImage(url: string) {
  if (url.startsWith("http")) {
    await del(url).catch(() => {});
    return;
  }
  if (url.startsWith("/api/image/")) {
    await del(`${BLOB_PREFIX}/${path.basename(url)}`).catch(() => {});
    return;
  }
  if (!url.startsWith("/uploads/")) return;
  await unlink(path.join(LOCAL_DIR, path.basename(url))).catch(() => {});
}

const FILENAME = String.raw`[0-9a-f-]{36}\.(webp|jpg|png|gif)`;
const LOCAL_URL = new RegExp(`^/uploads/${FILENAME}$`);
const PROXY_URL = new RegExp(`^/api/image/${FILENAME}$`);
const BLOB_URL = new RegExp(
  String.raw`^https://[a-z0-9-]+\.public\.blob\.vercel-storage\.com/${BLOB_PREFIX}/${FILENAME}$`,
);

/** 글을 저장할 때 넘어오는 이미지 주소가 우리가 방금 올린 것인지 확인한다. */
export function isManagedImageUrl(url: string) {
  return LOCAL_URL.test(url) || PROXY_URL.test(url) || BLOB_URL.test(url);
}

export function isValidImageFilename(name: string) {
  return new RegExp(`^${FILENAME}$`).test(name);
}

export const BLOB_UPLOAD_PREFIX = BLOB_PREFIX;
