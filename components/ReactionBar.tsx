"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "@/app/actions";
import type { ReactionTally } from "@/lib/posts";

export function ReactionBar({ postId, reactions }: { postId: string; reactions: ReactionTally[] }) {
  const [state, setState] = useOptimistic(reactions);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {state.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          aria-pressed={reaction.mine}
          aria-label={`${reaction.emoji} 반응 ${reaction.count}개`}
          onClick={() =>
            startTransition(async () => {
              setState(
                state.map((r) =>
                  r.emoji === reaction.emoji
                    ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) }
                    : r,
                ),
              );
              const formData = new FormData();
              formData.set("postId", postId);
              formData.set("emoji", reaction.emoji);
              await toggleReaction(formData);
            })
          }
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
            reaction.mine
              ? "border-accent bg-accent-soft"
              : "border-transparent hover:border-line hover:bg-surface-2"
          } ${reaction.count === 0 && !reaction.mine ? "opacity-45 hover:opacity-100" : ""}`}
        >
          <span aria-hidden>{reaction.emoji}</span>
          {reaction.count > 0 && <span className="tabular-nums text-muted">{reaction.count}</span>}
        </button>
      ))}
    </div>
  );
}
