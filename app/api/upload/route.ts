import { NextResponse } from "next/server";
import { getMyName } from "@/lib/session";
import { saveImage } from "@/lib/storage";

// Vercel 서버리스 함수는 요청 본문이 4.5MB로 제한된다.
// 그래서 사진은 한 장씩 따로 올리고, 글 저장은 URL만 넘긴다.
export const maxDuration = 30;

export async function POST(request: Request) {
  const me = await getMyName();
  if (!me) {
    return NextResponse.json({ error: "닉네임을 먼저 정해주세요." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "이미지가 없어요." }, { status: 400 });
  }

  try {
    const result = await saveImage(file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    // 예상 못 한 예외가 그대로 500으로 나가면 화면에 이유가 안 보인다
    console.error("[api/upload] 실패", error);
    return NextResponse.json({ error: "사진을 저장하지 못했어요." }, { status: 500 });
  }
}
