/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    scrollRestoration: false, // 스크롤 복원 비활성화
  },
  
  // SEO 최적화 설정
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // SVG 파일 처리를 위한 설정
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    if (isServer) {
      const empty = false;
      Object.assign(config.resolve.alias, {
        "react-froala-wysiwyg": empty,
        "froala-editor": empty,
        "froala-editor/js/froala_editor.pkgd.min.js": empty,
        "froala-editor/js/plugins.pkgd.min.js": empty,
        "froala-editor/css/froala_style.min.css": empty,
        "froala-editor/css/froala_editor.pkgd.min.css": empty,
      });
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 'k.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'img1.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 'img1.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 't1.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 't1.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'dn.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 'dn.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'teaelrzxuigiocnukwha.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'teaelrzxuigiocnukwha.supabase.in', pathname: '/**' },
      { protocol: 'https', hostname: 'search.pstatic.net', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
    // 이미지 최적화 설정 - 더 작은 크기로 제한
    deviceSizes: [360, 414, 640, 768],
    imageSizes: [16, 24, 32, 48, 64, 96, 128],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 