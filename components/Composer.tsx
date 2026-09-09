"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPost } from "@/app/actions";
import { CATEGORIES, DEFAULT_CATEGORY, type CategoryKey } from "@/lib/categories";
import { pickImageFile, processImage, type ProcessedImage } from "@/lib/process-image";

export function Composer() {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  function replaceImage(next: ProcessedImage | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next?.previewUrl ?? null;
    setImage(next);
  }

  async function acceptFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const processed = await processImage(file);
      replaceImage(processed);
      setOpen(true);
      requestAnimationFrame(() => titleRef.current?.focus());
    } catch {
      setError("이미지를 읽지 못했어요. 다른 파일로 시도해주세요.");
    }
  }

  // 캡쳐 후 어디서든 Cmd+V 하면 바로 작성창이 열리도록
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = pickImageFile(event.clipboardData?.items);
      if (!file) return;
      event.preventDefault();
      void acceptFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function reset() {
    replaceImage(null);
    setTitle("");
    setPlace("");
    setMemo("");
    setCategory(DEFAULT_CATEGORY);
    setError(null);
    setOpen(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) {
      setError("사진을 한 장 올려주세요.");
      return;
    }
    if (!title.trim()) {
      setError("제목을 적어주세요.");
      return;
    }

    const formData = new FormData();
    formData.set("image", image.blob, image.filename);
    formData.set("imageW", String(image.width));
    formData.set("imageH", String(image.height));
    formData.set("title", title);
    formData.set("place", place);
    formData.set("memo", memo);
    formData.set("category", category);

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
      void acceptFile(pickImageFile(e.dataTransfer?.files));
    },
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          fileInputRef.current?.click();
        }}
        {...dropHandlers}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface/60 hover:border-accent"
        }`}
      >
        <span className="text-lg">📸</span>
        <span className="font-medium">캡쳐 붙여넣기</span>
        <span className="text-muted">
          <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">⌘V</kbd> · 끌어다 놓기 ·
          클릭해서 고르기
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void acceptFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      {...dropHandlers}
      className={`rounded-2xl border bg-surface p-4 shadow-sm transition ${
        dragging ? "border-accent" : "border-line"
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div>
          {image ? (
            <div className="group relative overflow-hidden rounded-xl border border-line bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt="올릴 사진 미리보기"
                className="block max-h-64 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => replaceImage(null)}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white"
              >
                지우기
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-40 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-sm text-muted transition hover:border-accent"
            >
              <span className="text-2xl">🖼️</span>
              <span>사진 고르기 · ⌘V</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void acceptFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="뭐가 그렇게 좋았어요? (예: 말차 티라미수)"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm font-medium outline-none placeholder:text-muted focus:border-accent"
          />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={80}
            placeholder="가게 이름 / 위치 (선택)"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />

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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:text-ink"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "올리는 중…" : "보드에 올리기"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
