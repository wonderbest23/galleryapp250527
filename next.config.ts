import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "img1.kakaocdn.net", 
      "t1.kakaocdn.net",
      "k.kakaocdn.net",
      "dn.kakaocdn.net",
      "teaelrzxuigiocnukwha.supabase.co"
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 'k.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'img1.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 't1.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'dn.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'teaelrzxuigiocnukwha.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'teaelrzxuigiocnukwha.supabase.in', pathname: '/**' },
      { protocol: 'https', hostname: 'search.pstatic.net', pathname: '/**' },
    ]
  },
  webpack(config) {
    // SVG 파일을 컴포넌트로 가져올 수 있도록 설정
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ 
        loader: '@svgr/webpack',
        options: { 
          svgoConfig: {
            plugins: [{
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false
                },
              },
            }],
          }
        }
      }],
    });

    return config;
  },
};

export default nextConfig;
