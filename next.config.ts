import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 사진은 /api/upload로 한 장씩 올라가고 서버 액션에는 URL만 실려서
  // 본문이 작다. 기본값(1MB)으로 충분하다.
};

export default nextConfig;
