import fetch from 'node-fetch';

/**
 * Fetch latest art-related headlines.
 * Uses NewsAPI (https://newsapi.org). Provide NEWS_API_KEY env var.
 * Returns up to 5 headlines array of strings.
 */
export async function fetchArtHeadlines(): Promise<string[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url = `https://newsapi.org/v2/everything?q=%EC%95%84%ED%8A%B8%20OR%20art%20OR%20%EB%AF%B8%EC%88%A0&language=ko&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json: any = await res.json();
    const titles = (json.articles || []).map((a: any) => `${a.title}`);
    return titles.slice(0, 5);
  } catch {
    return [];
  }
} 