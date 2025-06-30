import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do?searchCate=EXHIBITION&menuNo=200009";

export async function scrapeCultureSeoul() {
  try {
    const listHtml = await fetch(LIST_URL, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
    const $ = cheerio.load(listHtml);
    const items: { url: string; title: string }[] = [];
    $(".list_type01 li a").each((_: any, el: any) => {
      const href = $(el).attr("href") || "";
      const title = $(el).find(".tit").text().trim() || $(el).text().trim();
      if (href && title) items.push({ url: href.startsWith("http") ? href : `https://culture.seoul.go.kr${href}`, title });
    });

    for (const itm of items.slice(0, 15)) {
      if (!/전시|미술|아트|갤러리/i.test(itm.title)) continue;
      try {
        const detailHtml = await fetch(itm.url, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
        const $$ = cheerio.load(detailHtml);
        const title = $$("h3.tit").text().trim() || itm.title;
        const imgSrc = $$(".view_img img").first().attr("src") || "";
        const desc = $$(".view_con").text().trim().slice(0, 140);
        const thumbUrl = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source: "cultureSeoul", post_url: itm.url, title, thumb_url: thumbUrl ?? undefined, summary: desc, score: 1 });
      } catch (e) {
        console.log("cultureSeoul detail error", e);
      }
    }
  } catch (e) {
    console.log("cultureSeoul list error", e);
  }
} 