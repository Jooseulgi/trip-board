"use client";

import { useOptimistic, useTransition } from "react";
import { toggleWish } from "@/app/actions";

export function WishButton({
  postId,
  count,
  mine,
  names,
}: {
  postId: string;
  count: number;
  mine: boolean;
  names?: string[];
}) {
  const [state, setState] = useOptimistic({ count, mine });
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={names?.length ? `${names.join(", ")} 가고 싶어함` : "가고 싶어요"}
      onClick={() =>
        startTransition(async () => {
          setState({ mine: !state.mine, count: state.count + (state.mine ? -1 : 1) });
          const formData = new FormData();
          formData.set("postId", postId);
          await toggleWish(formData);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        state.mine
          ? "border-wish bg-wish-soft text-wish"
          : "border-line text-muted hover:border-wish hover:text-wish"
      }`}
    >
      <span aria-hidden>{state.mine ? "🔖" : "🏳️"}</span>
      가고 싶어요
      {state.count > 0 && <span className="tabular-nums">{state.count}</span>}
    </button>
  );
}
