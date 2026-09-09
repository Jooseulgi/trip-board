"use client";

export type ProcessedImage = {
  key: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  previewUrl: string;
};

const MAX_EDGE = 1600;

/**
 * 캡쳐 이미지는 대개 필요 이상으로 큽니다.
 * 브라우저에서 미리 줄여서 올리면 업로드도 빠르고 저장 용량도 아낍니다.
 * (GIF는 애니메이션이 깨지므로 원본 그대로 보냅니다.)
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (file.type === "image/gif") {
    const size = await readSize(file);
    return {
      key: crypto.randomUUID(),
      blob: file,
      filename: file.name || "image.gif",
      width: size.width,
      height: size.height,
      previewUrl: URL.createObjectURL(file),
    };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서는 이미지를 처리할 수 없어요.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const encoded =
    (await toBlob(canvas, "image/webp", 0.86)) ?? (await toBlob(canvas, "image/jpeg", 0.9));
  if (!encoded) throw new Error("이미지를 변환하지 못했어요.");

  const ext = encoded.type === "image/webp" ? "webp" : "jpg";
  return {
    key: crypto.randomUUID(),
    blob: encoded,
    filename: `capture.${ext}`,
    width,
    height,
    previewUrl: URL.createObjectURL(encoded),
  };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob && blob.type === type ? blob : null), type, quality);
  });
}

async function readSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close?.();
  return size;
}

/** 붙여넣기 / 드래그 이벤트에서 이미지 파일을 전부 꺼냅니다. */
export function pickImageFiles(list: FileList | DataTransferItemList | null | undefined) {
  if (!list) return [];
  const files: File[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const entry = list[i];
    const file = entry instanceof File ? entry : (entry as DataTransferItem).getAsFile?.();
    if (file && file.type.startsWith("image/")) files.push(file);
  }
  return files;
}
