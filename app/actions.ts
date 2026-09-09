"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORY, isCategoryKey, isReaction } from "@/lib/categories";
import { getMyName, toUserKey, writeMyName } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return { error: "이미지 파일만 올릴 수 있어요 (png, jpg, webp, gif)." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "이미지가 너무 커요. 10MB 이하로 올려주세요." };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return { url: `/uploads/${filename}` };
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

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "사진을 한 장 올려주세요." };
  }

  const saved = await saveImage(image);
  if ("error" in saved) return { ok: false, error: saved.error };

  const rawCategory = str(formData, "category");
  const width = Number(str(formData, "imageW"));
  const height = Number(str(formData, "imageH"));

  await prisma.post.create({
    data: {
      title,
      place: str(formData, "place") || null,
      memo: str(formData, "memo") || null,
      category: isCategoryKey(rawCategory) ? rawCategory : DEFAULT_CATEGORY,
      imageUrl: saved.url,
      imageW: Number.isFinite(width) && width > 0 ? Math.round(width) : null,
      imageH: Number.isFinite(height) && height > 0 ? Math.round(height) : null,
      authorName: author,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  const me = await getMyName();
  const id = str(formData, "postId");
  if (!me || !id) return;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || toUserKey(post.authorName) !== toUserKey(me)) return;

  await prisma.post.delete({ where: { id } });

  if (post.imageUrl.startsWith("/uploads/")) {
    const filename = path.basename(post.imageUrl);
    await unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});
  }

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
