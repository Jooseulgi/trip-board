import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  category?: string;
  only?: "wish" | "todo";
  counts: Record<string, number>;
  total: number;
};

function href(next: { category?: string; only?: string }) {
  const params = new URLSearchParams();
  if (next.category) params.set("cat", next.category);
  if (next.only) params.set("only", next.only);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function chipClass(active: boolean) {
  return `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:border-accent"
  }`;
}

export function FilterBar({ category, only, counts, total }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Link href={href({ only })} className={chipClass(!category)}>
          전체 {total > 0 && <span className="tabular-nums">{total}</span>}
        </Link>
        {CATEGORIES.map((c) => {
          const count = counts[c.key] ?? 0;
          if (count === 0 && category !== c.key) return null;
          return (
            <Link key={c.key} href={href({ category: c.key, only })} className={chipClass(category === c.key)}>
              {c.emoji} {c.label} <span className="tabular-nums">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        <Link
          href={href({ category, only: only === "wish" ? undefined : "wish" })}
          className={chipClass(only === "wish")}
        >
          🔖 내가 찜한 곳
        </Link>
        <Link
          href={href({ category, only: only === "todo" ? undefined : "todo" })}
          className={chipClass(only === "todo")}
        >
          ⬜️ 아직 안 간 곳
        </Link>
      </div>
    </div>
  );
}
