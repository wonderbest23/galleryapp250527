import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://www.mmca.go.kr/exhibitions/progressList.do";

export async function scrapeMMCA() {
  try {
    const html = await fetch(LIST_URL, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
    const $ = cheerio.load(html);
    $(".list_box ul li").each(async (_idx: any, el: any) => {
      const link = $(el).find("a").attr("href") || "";
      if (!link) return;
      const url = link.startsWith("http") ? link : `https://www.mmca.go.kr${link}`;
      const title = $(el).find(".tit").text().trim();
      if (!/전시|미술|아트|갤러리/i.test(title)) return;
      try {
        const detail = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
        const $$ = cheerio.load(detail);
        const imgSrc = $$(".exhibition_view .img img").first().attr("src") || "";
        const summary = $$(".exhibition_view .txt").text().trim().slice(0, 140);
        const thumb = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source: "mmca", post_url: url, title, thumb_url: thumb ?? undefined, summary, score: 1 });
      } catch (e) { console.log("mmca detail error", e); }
    });
  } catch (e) { console.log("mmca list error", e); }
} 