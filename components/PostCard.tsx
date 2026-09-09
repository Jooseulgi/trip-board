import Link from "next/link";
import { categoryOf } from "@/lib/categories";
import { hostOf, relativeTime } from "@/lib/format";
import type { PostView } from "@/lib/posts";
import { ImageCollage } from "./ImageCollage";
import { ReactionBar } from "./ReactionBar";
import { WishButton } from "./WishButton";

export function PostCard({ post }: { post: PostView }) {
  const category = categoryOf(post.category);
  const hasImages = post.images.length > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
      {hasImages && (
        <Link href={`/posts/${post.id}`} className="relative block bg-surface-2">
          <ImageCollage images={post.images} alt={post.title} />
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {category.emoji} {category.label}
          </span>
          <div className="absolute right-3 top-3 flex gap-1.5">
            {post.images.length > 1 && (
              <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                🖼 {post.images.length}
              </span>
            )}
            {post.visitedAt && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#23201c]">
                ✅ 다녀옴
              </span>
            )}
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-3 p-4">
        {/* 사진이 없는 글은 이미지 위에 얹던 정보를 본문 위로 올린다 */}
        {!hasImages && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
              {category.emoji} {category.label}
            </span>
            {post.visitedAt && (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                ✅ 다녀옴
              </span>
            )}
          </div>
        )}

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

        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
          >
            <span aria-hidden>🔗</span>
            <span className="truncate">{hostOf(post.linkUrl)}</span>
          </a>
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
