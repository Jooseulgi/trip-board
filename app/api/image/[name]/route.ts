import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { BLOB_UPLOAD_PREFIX, isValidImageFilename } from "@/lib/storage";

// private Blob 저장소는 주소로 바로 읽을 수 없어서 서버가 대신 받아 흘려보낸다.
// 파일 이름이 UUID라 내용이 바뀌지 않으므로 오래 캐시해 둔다 —
// 그러면 CDN이 받아두고, 이 함수는 사진 한 장당 사실상 한 번만 돈다.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!isValidImageFilename(name)) {
    return NextResponse.json({ error: "잘못된 주소예요." }, { status: 400 });
  }

  try {
    const result = await get(`${BLOB_UPLOAD_PREFIX}/${name}`, { access: "private" });
    if (!result || !("stream" in result)) {
      return NextResponse.json({ error: "사진을 찾지 못했어요." }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "content-length": String(result.blob.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/image] 실패", error);
    return NextResponse.json({ error: "사진을 불러오지 못했어요." }, { status: 404 });
  }
}
