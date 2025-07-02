import fetch from "node-fetch";
import { saveScrapedPost } from "./savePost";
import * as cheerio from "cheerio";

const KEY = process.env.BRAVE_SEARCH_KEY || "";
const ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

export async function scrapeBrave(keyword: string = "한국 미술 전시", limit: number = 30) {
  if (!KEY) {
    console.log("[scrapeBrave] BRAVE_SEARCH_KEY env 필요");
    return;
  }
  try {
    const url = `${ENDPOINT}?q=${encodeURIComponent(keyword)}&freshness=month&spellcheck=on`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": KEY,
      },
    });
    if (!res.ok) {
      console.log("[scrapeBrave] API error", res.status, await res.text());
      return;
    }
    const data: any = await res.json();
    const results: any[] = data.web?.results ?? [];

    const yearMatch = keyword.match(/20\d{2}/)?.[0];

    for (const r of results) {
      const postUrl: string = r.url;
      const title: string = r.title || '';
      const desc: string = r.description || '';

      // 전시/예술 관련 키워드 포함 필터
      if(!/(전시|exhibition|art|미술)/i.test(title+desc)) continue;

      // 검색 키워드에 연도가 포함돼 있으면 결과에도 포함되는지 체크
      if(yearMatch && !title.includes(yearMatch) && !desc.includes(yearMatch)) continue;

      const summary: string = desc.slice(0,140);

      // OpenGraph 이미지 추출 시도 (5초 타임아웃)
      let ogImage: string | undefined;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(()=>ctrl.abort(),5000);
        const htmlRes = await fetch(postUrl,{signal:ctrl.signal,headers:{"User-Agent":"Mozilla/5.0"}});
        clearTimeout(t);
        if(htmlRes.ok){
          const html = await htmlRes.text();
          const $ = cheerio.load(html);
          ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        }
      }catch(e){/* ignore */}

      await saveScrapedPost({ source: "brave", post_url: postUrl, title, summary, thumb_url: ogImage, score: 0 });
    }
  } catch (e) {
    console.log("[scrapeBrave] unexpected error", e);
  }
} 