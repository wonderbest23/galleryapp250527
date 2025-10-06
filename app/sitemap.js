import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function sitemap() {
  const baseUrl = 'https://www.artandbridge.com';
  
  // 정적 페이지들
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exhibitions`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artstore`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/magazineList`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/galleries`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    }
  ];

  try {
    // 커뮤니티 게시글들
    const { data: communityPosts } = await supabase
      .from('community_post')
      .select('id, title, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    const communityPages = (communityPosts || []).map(post => ({
      url: `${baseUrl}/community/${post.id}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 전시회 정보들
    const { data: exhibitions } = await supabase
      .from('exhibition')
      .select('id, name, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(500);

    const exhibitionPages = (exhibitions || []).map(exhibition => ({
      url: `${baseUrl}/exhibition/${exhibition.id}`,
      lastModified: new Date(exhibition.updated_at || exhibition.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 갤러리 정보들
    const { data: galleries } = await supabase
      .from('gallery')
      .select('id, name, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(200);

    const galleryPages = (galleries || []).map(gallery => ({
      url: `${baseUrl}/gallery/${gallery.id}`,
      lastModified: new Date(gallery.updated_at || gallery.created_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // 작가 정보들
    const { data: artists } = await supabase
      .from('artist')
      .select('id, name, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(200);

    const artistPages = (artists || []).map(artist => ({
      url: `${baseUrl}/artist/${artist.id}`,
      lastModified: new Date(artist.updated_at || artist.created_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // 상품 정보들
    const { data: products } = await supabase
      .from('product')
      .select('id, title, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(500);

    const productPages = (products || []).map(product => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updated_at || product.created_at),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    // 매거진 기사들
    const { data: magazines } = await supabase
      .from('magazine')
      .select('id, title, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    const magazinePages = (magazines || []).map(magazine => ({
      url: `${baseUrl}/magazine/${magazine.id}`,
      lastModified: new Date(magazine.updated_at || magazine.created_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...communityPages,
      ...exhibitionPages,
      ...galleryPages,
      ...artistPages,
      ...productPages,
      ...magazinePages,
    ];

  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // 에러 발생 시 정적 페이지만 반환
    return staticPages;
  }
}
