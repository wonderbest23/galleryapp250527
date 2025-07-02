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
      const title:string = (r.title||'').trim();
      let desc:string = (r.description||'').trim();

      // 1) 제목/요약 길이 & 키워드 필터
      if(title.length<10) continue;
      if(!/(전시|exhibition|art|미술|아트|갤러리|뮤지엄)/i.test(title+desc)) continue;

      // 2) 연도 필터 – 키워드 또는 최근 3년(2023~2026)
      const recentYear = /202[4-6]/;
      if(yearMatch && !title.includes(yearMatch) && !desc.includes(yearMatch)) continue;
      if(!yearMatch && !recentYear.test(title+desc)) continue;

      // 3) ellipsis 제거 – '…' 로 끝나는 짧은 스니펫은 페이지에서 보강 시도
      if(/…$/.test(desc) || desc.length<60){
        try{
          const html = await fetch(r.url).then(res=>res.text());
          const $ = (await import('cheerio')).load(html);
          const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
          if(ogDesc) desc = ogDesc.trim();
        }catch{}
      }

      // 4) 도메인 화이트리스트 (미술관·언론 위주) – 필요시 주석 처리
      try{
        const host = new URL(r.url).hostname;
        if(!/(mmca|sema|artmap|korean\.visitseoul|leeum|museum|gallery)/i.test(host)) continue;
      }catch{}

      const postUrl: string = r.url;
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