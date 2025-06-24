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
      'search.pstatic.net'
    ],
    unoptimized: false,
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 