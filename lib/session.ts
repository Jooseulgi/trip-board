import { cookies } from "next/headers";

const COOKIE_NAME = "tb_name";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** 닉네임을 사용자 식별자로 정규화 (대소문자/공백 무시) */
export function toUserKey(name: string) {
  return name.trim().toLowerCase();
}

export async function getMyName(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value?.trim();
  return value ? value : null;
}

/** 로그인이 필요한 서버 액션에서 사용 */
export async function requireMyName(): Promise<string> {
  const name = await getMyName();
  if (!name) throw new Error("닉네임을 먼저 정해주세요.");
  return name;
}

export async function writeMyName(name: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, name, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false,
  });
}

export async function clearMyName() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
