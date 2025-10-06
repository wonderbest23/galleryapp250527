import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 최근 24시간 내 생성된 커뮤니티 게시글들
    const { data: recentPosts } = await supabase
      .from('community_post')
      .select('id, title, created_at, updated_at')
      .eq('is_published', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // 최근 24시간 내 생성된 전시회들
    const { data: recentExhibitions } = await supabase
      .from('exhibition')
      .select('id, name, created_at, updated_at')
      .eq('is_published', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    const baseUrl = 'https://www.artandbridge.com';
    const now = new Date().toISOString();

    const newsItems = [];

    // 커뮤니티 게시글 추가
    if (recentPosts) {
      recentPosts.forEach(post => {
        newsItems.push({
          url: `${baseUrl}/community/${post.id}`,
          lastModified: new Date(post.updated_at || post.created_at).toISOString(),
          changeFrequency: 'daily',
          priority: 0.8
        });
      });
    }

    // 전시회 추가
    if (recentExhibitions) {
      recentExhibitions.forEach(exhibition => {
        newsItems.push({
          url: `${baseUrl}/exhibitions/${exhibition.id}`,
          lastModified: new Date(exhibition.updated_at || exhibition.created_at).toISOString(),
          changeFrequency: 'weekly',
          priority: 0.9
        });
      });
    }

    // XML 생성
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsItems.map(item => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
    <news:news>
      <news:publication>
        <news:name>아트앤브릿지</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${item.lastModified}</news:publication_date>
      <news:title>최신 예술 소식</news:title>
    </news:news>
  </url>`).join('')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });

  } catch (error) {
    console.error('News sitemap generation error:', error);
    
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }
}
