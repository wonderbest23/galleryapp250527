/** @type {import('next').NextConfig} */
const nextConfig = {
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
    domains: [
      'picsum.photos', 
      'teaelrzxuigiocnukwha.supabase.co',
      'teaelrzxuigiocnukwha.supabase.in',
      'search.pstatic.net',
      'k.kakaocdn.net'
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
    ],
    unoptimized: false,
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 