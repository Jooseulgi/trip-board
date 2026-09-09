"use client";

import { useRef, useState, useTransition } from "react";
import { addComment } from "@/app/actions";

export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!body.trim() || pending) return;
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("body", body);

    startTransition(async () => {
      const result = await addComment(formData);
      if (result.ok) {
        setBody("");
        setError(null);
      } else {
        setError(result.error ?? "저장에 실패했어요.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="rounded-2xl border border-line bg-surface p-3"
    >
      <textarea
        ref={areaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        maxLength={500}
        placeholder="여기 진짜 맛있겠다… 같이 가자!"
        className="w-full resize-y bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted"
      />
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted">⌘ + Enter로 등록</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-accent">{error}</span>}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "등록 중…" : "코멘트 남기기"}
          </button>
        </div>
      </div>
    </form>
  );
}
