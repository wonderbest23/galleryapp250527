import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const baseUrl = 'https://www.artandbridge.com';
    
    // 이미지가 있는 커뮤니티 게시글들
    const { data: postsWithImages } = await supabase
      .from('community_post')
      .select('id, title, image_url, created_at, updated_at')
      .eq('is_published', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // 이미지가 있는 전시회들
    const { data: exhibitionsWithImages } = await supabase
      .from('exhibition')
      .select('id, name, image_url, created_at, updated_at')
      .eq('is_published', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // 이미지가 있는 작가들
    const { data: artistsWithImages } = await supabase
      .from('artist')
      .select('id, name, avatar_url, created_at, updated_at')
      .eq('is_published', true)
      .not('avatar_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    const imageItems = [];

    // 커뮤니티 게시글 이미지 추가
    if (postsWithImages) {
      postsWithImages.forEach(post => {
        if (post.image_url) {
          imageItems.push({
            url: `${baseUrl}/community/${post.id}`,
            image: {
              loc: post.image_url.startsWith('http') ? post.image_url : `${baseUrl}${post.image_url}`,
              caption: post.title,
              title: post.title,
              license: `${baseUrl}/terms`
            },
            lastModified: new Date(post.updated_at || post.created_at).toISOString(),
            changeFrequency: 'weekly',
            priority: 0.6
          });
        }
      });
    }

    // 전시회 이미지 추가
    if (exhibitionsWithImages) {
      exhibitionsWithImages.forEach(exhibition => {
        if (exhibition.image_url) {
          imageItems.push({
            url: `${baseUrl}/exhibitions/${exhibition.id}`,
            image: {
              loc: exhibition.image_url.startsWith('http') ? exhibition.image_url : `${baseUrl}${exhibition.image_url}`,
              caption: exhibition.name,
              title: exhibition.name,
              license: `${baseUrl}/terms`
            },
            lastModified: new Date(exhibition.updated_at || exhibition.created_at).toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8
          });
        }
      });
    }

    // 작가 이미지 추가
    if (artistsWithImages) {
      artistsWithImages.forEach(artist => {
        if (artist.avatar_url) {
          imageItems.push({
            url: `${baseUrl}/artist/${artist.id}`,
            image: {
              loc: artist.avatar_url.startsWith('http') ? artist.avatar_url : `${baseUrl}${artist.avatar_url}`,
              caption: artist.name,
              title: artist.name,
              license: `${baseUrl}/terms`
            },
            lastModified: new Date(artist.updated_at || artist.created_at).toISOString(),
            changeFrequency: 'monthly',
            priority: 0.5
          });
        }
      });
    }

    // XML 생성
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageItems.map(item => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
    <image:image>
      <image:loc>${item.image.loc}</image:loc>
      <image:caption>${item.image.caption}</image:caption>
      <image:title>${item.image.title}</image:title>
      <image:license>${item.image.license}</image:license>
    </image:image>
  </url>`).join('')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });

  } catch (error) {
    console.error('Image sitemap generation error:', error);
    
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }
}
