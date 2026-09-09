import { prisma } from "./db";
import { REACTIONS, type ReactionEmoji } from "./categories";
import { toUserKey } from "./session";

export type ReactionTally = { emoji: ReactionEmoji; count: number; mine: boolean };

export type PostImageView = { id: string; url: string; width: number | null; height: number | null };

export type PostView = {
  id: string;
  title: string;
  place: string | null;
  memo: string | null;
  category: string;
  linkUrl: string | null;
  images: PostImageView[];
  authorName: string;
  createdAt: Date;
  visitedAt: Date | null;
  commentCount: number;
  wishCount: number;
  wishNames: string[];
  iWish: boolean;
  reactions: ReactionTally[];
  isMine: boolean;
};

const postInclude = {
  _count: { select: { comments: true } },
  images: { orderBy: { sort: "asc" }, select: { id: true, url: true, width: true, height: true } },
  wishes: { select: { userKey: true, userName: true } },
  reactions: { select: { userKey: true, emoji: true } },
} as const;

type RawPost = {
  id: string;
  title: string;
  place: string | null;
  memo: string | null;
  category: string;
  linkUrl: string | null;
  images: PostImageView[];
  authorName: string;
  createdAt: Date;
  visitedAt: Date | null;
  _count: { comments: number };
  wishes: { userKey: string; userName: string }[];
  reactions: { userKey: string; emoji: string }[];
};

function toView(post: RawPost, myKey: string): PostView {
  const reactions = REACTIONS.map((emoji) => {
    const matching = post.reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: matching.length,
      mine: matching.some((r) => r.userKey === myKey),
    };
  });

  return {
    id: post.id,
    title: post.title,
    place: post.place,
    memo: post.memo,
    category: post.category,
    linkUrl: post.linkUrl,
    images: post.images,
    authorName: post.authorName,
    createdAt: post.createdAt,
    visitedAt: post.visitedAt,
    commentCount: post._count.comments,
    wishCount: post.wishes.length,
    wishNames: post.wishes.map((w) => w.userName),
    iWish: post.wishes.some((w) => w.userKey === myKey),
    reactions,
    isMine: toUserKey(post.authorName) === myKey,
  };
}

export type FeedFilter = {
  category?: string;
  only?: "wish" | "todo";
};

export async function getFeed(myName: string, filter: FeedFilter): Promise<PostView[]> {
  const myKey = toUserKey(myName);

  const posts = await prisma.post.findMany({
    where: {
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.only === "wish" ? { wishes: { some: { userKey: myKey } } } : {}),
      ...(filter.only === "todo" ? { visitedAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  return posts.map((post) => toView(post, myKey));
}

export async function getPost(id: string, myName: string) {
  const myKey = toUserKey(myName);
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) return null;

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });

  return {
    view: toView(post, myKey),
    comments: comments.map((c) => ({ ...c, isMine: toUserKey(c.authorName) === myKey })),
  };
}

/** 카테고리 필터 칩에 붙일 개수 */
export async function getCategoryCounts() {
  const rows = await prisma.post.groupBy({ by: ["category"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all])) as Record<string, number>;
}
