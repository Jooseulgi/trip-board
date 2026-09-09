"use client";

import { useOptimistic, useTransition } from "react";
import { toggleVisited } from "@/app/actions";

export function VisitedToggle({ postId, visited }: { postId: string; visited: boolean }) {
  const [state, setState] = useOptimistic(visited);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setState(!state);
          const formData = new FormData();
          formData.set("postId", postId);
          await toggleVisited(formData);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        state
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-muted hover:border-accent"
      }`}
    >
      <span aria-hidden>{state ? "✅" : "⬜️"}</span>
      다녀왔어요
    </button>
  );
}
