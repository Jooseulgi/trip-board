import Link from "next/link";
import { categoryOf } from "@/lib/categories";
import { relativeTime } from "@/lib/format";
import type { PostView } from "@/lib/posts";
import { ReactionBar } from "./ReactionBar";
import { WishButton } from "./WishButton";

export function PostCard({ post }: { post: PostView }) {
  const category = categoryOf(post.category);
  const ratio = post.imageW && post.imageH ? `${post.imageW} / ${post.imageH}` : "4 / 3";

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
      <Link href={`/posts/${post.id}`} className="relative block bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
          style={{ aspectRatio: ratio }}
          className="block w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {category.emoji} {category.label}
        </span>
        {post.visitedAt && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#23201c]">
            ✅ 다녀옴
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <Link href={`/posts/${post.id}`} className="block">
            <h3 className="text-[15px] font-semibold leading-snug">{post.title}</h3>
          </Link>
          {post.place && <p className="mt-1 text-xs text-muted">📍 {post.place}</p>}
        </div>

        {post.memo && (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {post.memo}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <WishButton
            postId={post.id}
            count={post.wishCount}
            mine={post.iWish}
            names={post.wishNames}
          />
          <ReactionBar postId={post.id} reactions={post.reactions} />
        </div>

        {post.wishNames.length > 0 && (
          <p className="text-xs text-wish">
            {post.wishNames.slice(0, 3).join(", ")}
            {post.wishNames.length > 3 && ` 외 ${post.wishNames.length - 3}명`} 가고 싶어함
          </p>
        )}

        <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
          <span>
            {post.authorName} · {relativeTime(post.createdAt)}
          </span>
          <Link href={`/posts/${post.id}`} className="transition hover:text-ink">
            💬 코멘트 {post.commentCount}
          </Link>
        </div>
      </div>
    </article>
  );
}
