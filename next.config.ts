import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 캡쳐 이미지는 브라우저에서 1600px로 줄여 보내지만,
    // GIF처럼 원본 그대로 올라가는 경우를 위해 여유를 둔다.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
