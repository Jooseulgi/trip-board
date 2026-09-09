"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPost } from "@/app/actions";
import { CATEGORIES, DEFAULT_CATEGORY, type CategoryKey } from "@/lib/categories";
import { pickImageFiles, processImage, type ProcessedImage } from "@/lib/process-image";

const MAX_IMAGES = 10;

export function Composer() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  // 미리보기 URL은 컴포넌트가 사라질 때 한 번에 정리한다
  const previewUrls = useRef(new Set<string>());

  async function acceptFiles(files: File[]) {
    if (files.length === 0) return;
    setOpen(true);
    setError(null);

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`사진은 ${MAX_IMAGES}장까지만 올릴 수 있어요.`);
      return;
    }
    if (files.length > room) {
      setError(`${MAX_IMAGES}장까지만 올릴 수 있어서 앞의 ${room}장만 담았어요.`);
    }

    setProcessing(true);
    try {
      const processed = await Promise.all(files.slice(0, room).map(processImage));
      processed.forEach((image) => previewUrls.current.add(image.previewUrl));
      setImages((current) => [...current, ...processed]);
      requestAnimationFrame(() => titleRef.current?.focus());
    } catch {
      setError("이미지를 읽지 못했어요. 다른 파일로 시도해주세요.");
    } finally {
      setProcessing(false);
    }
  }

  function removeImage(key: string) {
    setImages((current) => {
      const target = current.find((image) => image.key === key);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrls.current.delete(target.previewUrl);
      }
      return current.filter((image) => image.key !== key);
    });
  }

  // 캡쳐 후 어디서든 ⌘V 하면 바로 작성창이 열리고, 여러 장이면 전부 담긴다
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = pickImageFiles(event.clipboardData?.items);
      if (files.length === 0) return;
      event.preventDefault();
      void acceptFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function reset() {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    previewUrls.current.clear();
    setImages([]);
    setTitle("");
    setPlace("");
    setLink("");
    setMemo("");
    setCategory(DEFAULT_CATEGORY);
    setError(null);
    setOpen(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("제목을 적어주세요.");
      titleRef.current?.focus();
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("place", place);
    formData.set("linkUrl", link);
    formData.set("memo", memo);
    formData.set("category", category);
    for (const image of images) {
      formData.append("images", image.blob, image.filename);
      formData.append("imageSizes", `${image.width}x${image.height}`);
    }

    startTransition(async () => {
      const result = await createPost(formData);
      if (result.ok) reset();
      else setError(result.error ?? "저장에 실패했어요.");
    });
  }

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void acceptFiles(pickImageFiles(e.dataTransfer?.files));
    },
  };

  const filePicker = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => {
        void acceptFiles(Array.from(e.target.files ?? []));
        e.target.value = "";
      }}
    />
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => titleRef.current?.focus());
        }}
        {...dropHandlers}
        className={`flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface/60 hover:border-accent"
        }`}
      >
        <span className="text-lg">📸</span>
        <span className="font-medium">새로 올리기</span>
        <span className="text-muted">
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">⌘V</kbd>로 캡쳐 붙여넣기
          · 끌어다 놓기 · 사진 없이 링크만 남겨도 돼요
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      {...dropHandlers}
      className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm transition ${
        dragging ? "border-accent" : "border-line"
      }`}
    >
      {/* 사진 트레이 — 없으면 넓은 안내, 있으면 썸네일 줄 */}
      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border-2 border-dashed border-line px-4 py-5 text-sm text-muted transition hover:border-accent"
        >
          <span className="text-lg">🖼️</span>
          <span>{processing ? "사진 준비 중…" : "사진 추가 (선택)"}</span>
          <span className="text-xs">⌘V · 끌어다 놓기 · 여러 장 한꺼번에</span>
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <div
              key={image.key}
              className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 text-[10px] font-medium text-white">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeImage(image.key)}
                aria-label={`${index + 1}번째 사진 빼기`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-line text-xs text-muted transition hover:border-accent"
            >
              <span className="text-lg">＋</span>
              {processing ? "준비 중…" : "추가"}
            </button>
          )}
        </div>
      )}
      {filePicker}

      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        placeholder="제목"
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm font-medium outline-none placeholder:text-muted focus:border-accent"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          maxLength={80}
          placeholder="가게 이름 / 위치 (선택)"
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          inputMode="url"
          maxLength={2000}
          placeholder="🔗 링크 (인스타·블로그·지도, 선택)"
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:border-accent"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="코멘트 — 왜 가고 싶은지, 언제 열려 있는지, 얼마인지…"
        className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />

      {error && <p className="text-xs text-accent">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {images.length > 0 ? `사진 ${images.length}장` : "사진 없이 올려도 괜찮아요"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending || processing}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "올리는 중…" : "보드에 올리기"}
          </button>
        </div>
      </div>
    </form>
  );
}
