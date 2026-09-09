import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteComment, deletePost } from "@/app/actions";
import { CommentForm } from "@/components/CommentForm";
import { Header } from "@/components/Header";
import { NameGate } from "@/components/NameGate";
import { ReactionBar } from "@/components/ReactionBar";
import { VisitedToggle } from "@/components/VisitedToggle";
import { WishButton } from "@/components/WishButton";
import { categoryOf } from "@/lib/categories";
import { relativeTime } from "@/lib/format";
import { getPost } from "@/lib/posts";
import { getMyName } from "@/lib/session";

export default async function PostPage(props: PageProps<"/posts/[id]">) {
  const myName = await getMyName();
  if (!myName) return <NameGate />;

  const { id } = await props.params;
  const data = await getPost(id, myName);
  if (!data) notFound();

  const { view: post, comments } = data;
  const category = categoryOf(post.category);

  return (
    <>
      <Header name={myName} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Link href="/" className="text-sm text-muted transition hover:text-ink">
          ← 보드로 돌아가기
        </Link>

        <article className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex justify-center bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.title}
              width={post.imageW ?? undefined}
              height={post.imageH ?? undefined}
              className="block h-auto max-h-[70vh] w-auto max-w-full"
            />
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
                {category.emoji} {category.label}
              </span>
              <span className="text-muted">
                {post.authorName} · {relativeTime(post.createdAt)}
              </span>
            </div>

            <div>
              <h1 className="text-xl font-bold leading-snug">{post.title}</h1>
              {post.place && <p className="mt-1.5 text-sm text-muted">📍 {post.place}</p>}
            </div>

            {post.memo && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.memo}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <WishButton
                postId={post.id}
                count={post.wishCount}
                mine={post.iWish}
                names={post.wishNames}
              />
              <VisitedToggle postId={post.id} visited={Boolean(post.visitedAt)} />
              <ReactionBar postId={post.id} reactions={post.reactions} />
            </div>

            {post.wishNames.length > 0 && (
              <p className="text-xs text-wish">
                🔖 {post.wishNames.join(", ")} 가고 싶어함
              </p>
            )}

            {post.isMine && (
              <form action={deletePost} className="flex justify-end">
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="text-xs text-muted underline-offset-2 transition hover:text-accent hover:underline"
                >
                  이 글 삭제
                </button>
              </form>
            )}
          </div>
        </article>

        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            코멘트 <span className="text-muted tabular-nums">{comments.length}</span>
          </h2>

          {comments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
              아직 코멘트가 없어요. 첫 마디를 남겨보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-2xl border border-line bg-surface px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">{comment.authorName}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {relativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.body}
                  </p>
                  {comment.isMine && (
                    <form action={deleteComment} className="mt-2">
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted transition hover:text-accent"
                      >
                        삭제
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <CommentForm postId={post.id} />
        </section>
      </main>
    </>
  );
}
