import fetch from "node-fetch";
import { saveScrapedPost } from "./savePost";

const ENDPOINT = process.env.BING_SEARCH_ENDPOINT ?? "";
const KEY = process.env.BING_SEARCH_KEY ?? "";

/**
 * Bing 검색 API 를 이용해 전시 관련 웹문서를 수집한다.
 * 환경변수
 *  - BING_SEARCH_ENDPOINT : ex) https://api.bing.microsoft.com/v7.0/search
 *  - BING_SEARCH_KEY      : Azure Portal 에서 발급받은 키
 */
export async function scrapeBing(keyword: string = "2025년 7월 전시", limit = 25) {
  if (!ENDPOINT || !KEY) {
    console.log("[scrapeBing] .env 에 BING_SEARCH_ENDPOINT / BING_SEARCH_KEY 가 필요합니다");
    return;
  }
  try {
    const url = `${ENDPOINT}?q=${encodeURIComponent(keyword)}&count=${limit}&mkt=ko-KR`;
    const res = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
      },
    });
    if (!res.ok) {
      console.log("[scrapeBing] bing api error", res.status, await res.text());
      return;
    }
    const data: any = await res.json();
    const results: any[] = data.webPages?.value ?? [];

    for (const r of results) {
      const postUrl: string = r.url;
      const title: string = r.name;
      const summary: string = (r.snippet as string | undefined)?.slice(0, 140) ?? "";
      if (!/전시|미술|아트|갤러리/i.test(title)) continue; // 전시 관련만 저장
      await saveScrapedPost({
        source: "bing",
        post_url: postUrl,
        title,
        summary,
        score: 0,
      });
    }
  } catch (e) {
    console.log("[scrapeBing] unexpected error", e);
  }
} 