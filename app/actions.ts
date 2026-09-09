"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORY, isCategoryKey, isReaction } from "@/lib/categories";
import { getMyName, toUserKey, writeMyName } from "@/lib/session";
import { removeImage, saveImage } from "@/lib/storage";

export type ActionResult = { ok: boolean; error?: string };

const MAX_IMAGES = 10;

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** "instagram.com/p/x" 처럼 스킴 없이 붙여넣는 경우가 많아 https를 붙여준다. */
function normalizeLink(raw: string): string | null | { error: string } {
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: "링크 주소를 다시 확인해주세요." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "http 또는 https 링크만 넣을 수 있어요." };
  }
  if (candidate.length > 2000) return { error: "링크가 너무 길어요." };
  return parsed.toString();
}

/* ---------------------------------- 닉네임 --------------------------------- */

export async function saveName(formData: FormData): Promise<ActionResult> {
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "이름을 입력해주세요." };
  if (name.length > 20) return { ok: false, error: "이름은 20자까지만 가능해요." };

  await writeMyName(name);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ----------------------------------- 글 ----------------------------------- */

export async function createPost(formData: FormData): Promise<ActionResult> {
  const author = await getMyName();
  if (!author) return { ok: false, error: "닉네임을 먼저 정해주세요." };

  const title = str(formData, "title");
  if (!title) return { ok: false, error: "제목을 적어주세요." };
  if (title.length > 80) return { ok: false, error: "제목은 80자까지만 가능해요." };

  const link = normalizeLink(str(formData, "linkUrl"));
  if (link && typeof link !== "string") return { ok: false, error: link.error };

  // 사진은 선택. 링크만 있는 글, 메모만 있는 글도 올릴 수 있다.
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) {
    return { ok: false, error: `사진은 한 번에 ${MAX_IMAGES}장까지 올릴 수 있어요.` };
  }

  const sizes = formData.getAll("imageSizes").map(String);
  const saved: { url: string; width: number | null; height: number | null; sort: number }[] = [];

  for (const [index, file] of files.entries()) {
    const result = await saveImage(file);
    if ("error" in result) {
      // 이미 저장한 파일은 지우고 통째로 실패시킨다 (반쯤 올라간 글이 남지 않도록)
      await Promise.all(saved.map((s) => removeImage(s.url)));
      return { ok: false, error: result.error };
    }
    const [w, h] = (sizes[index] ?? "").split("x").map(Number);
    saved.push({
      url: result.url,
      width: Number.isFinite(w) && w > 0 ? Math.round(w) : null,
      height: Number.isFinite(h) && h > 0 ? Math.round(h) : null,
      sort: index,
    });
  }

  const rawCategory = str(formData, "category");

  await prisma.post.create({
    data: {
      title,
      place: str(formData, "place") || null,
      memo: str(formData, "memo") || null,
      linkUrl: link,
      category: isCategoryKey(rawCategory) ? rawCategory : DEFAULT_CATEGORY,
      authorName: author,
      images: { create: saved },
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  const me = await getMyName();
  const id = str(formData, "postId");
  if (!me || !id) return;

  const post = await prisma.post.findUnique({ where: { id }, include: { images: true } });
  if (!post || toUserKey(post.authorName) !== toUserKey(me)) return;

  await prisma.post.delete({ where: { id } });
  await Promise.all(post.images.map((image) => removeImage(image.url)));

  revalidatePath("/");
  redirect("/");
}

export async function toggleVisited(formData: FormData) {
  const me = await getMyName();
  const id = str(formData, "postId");
  if (!me || !id) return;

  const post = await prisma.post.findUnique({ where: { id }, select: { visitedAt: true } });
  if (!post) return;

  await prisma.post.update({
    where: { id },
    data: { visitedAt: post.visitedAt ? null : new Date() },
  });

  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
}

/* --------------------------------- 가고싶어요 -------------------------------- */

export async function toggleWish(formData: FormData) {
  const me = await getMyName();
  const postId = str(formData, "postId");
  if (!me || !postId) return;

  const userKey = toUserKey(me);
  const existing = await prisma.wish.findUnique({
    where: { postId_userKey: { postId, userKey } },
  });

  if (existing) {
    await prisma.wish.delete({ where: { id: existing.id } });
  } else {
    await prisma.wish.create({ data: { postId, userKey, userName: me } });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

/* ---------------------------------- 반응 ---------------------------------- */

export async function toggleReaction(formData: FormData) {
  const me = await getMyName();
  const postId = str(formData, "postId");
  const emoji = str(formData, "emoji");
  if (!me || !postId || !isReaction(emoji)) return;

  const userKey = toUserKey(me);
  const existing = await prisma.reaction.findUnique({
    where: { postId_userKey_emoji: { postId, userKey, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userKey, emoji } });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

/* ---------------------------------- 코멘트 --------------------------------- */

export async function addComment(formData: FormData): Promise<ActionResult> {
  const me = await getMyName();
  if (!me) return { ok: false, error: "닉네임을 먼저 정해주세요." };

  const postId = str(formData, "postId");
  const body = str(formData, "body");
  if (!postId) return { ok: false, error: "잘못된 요청이에요." };
  if (!body) return { ok: false, error: "코멘트를 입력해주세요." };
  if (body.length > 500) return { ok: false, error: "코멘트는 500자까지만 가능해요." };

  await prisma.comment.create({ data: { postId, body, authorName: me } });

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData) {
  const me = await getMyName();
  const id = str(formData, "commentId");
  if (!me || !id) return;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || toUserKey(comment.authorName) !== toUserKey(me)) return;

  await prisma.comment.delete({ where: { id } });
  revalidatePath(`/posts/${comment.postId}`);
}
