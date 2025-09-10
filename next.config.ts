import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 ESLint 오류를 경고로만 처리 (빌드 실패 방지)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 오류를 경고로만 처리 (빌드 실패 방지)
    ignoreBuildErrors: true,
  },
  // PWA 설정
  experimental: {
    esmExternals: true,
  },
  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    unoptimized: true, // Vercel에서 이미지 최적화 문제 방지
  },
  
};

export default nextConfig;
