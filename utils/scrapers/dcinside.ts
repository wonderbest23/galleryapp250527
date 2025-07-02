import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const GALLERIES = [
  { id: "finearts", base: "https://gall.dcinside.com/board/lists/?id=finearts" },
  { id: "spark", base: "https://gall.dcinside.com/mgallery/board/lists/?id=spark" },
];

export async function scrapeDCInside(){
  for (const gall of GALLERIES) {
    try {
      const html = await fetch(gall.base, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
      const $ = cheerio.load(html);
      const rows = $("tr.ub-content").toArray();
      for (const el of rows) {
        const titleEl = $(el).find("td.gall_tit a");
        const href = titleEl.attr("href") || "";
        let title = titleEl.text().trim();
        // [3] 과 같은 댓글 수 표기를 제거
        title = title.replace(/\[\d+\]/g, "").trim();
        if (!title || href.startsWith("javascript")) continue;
        if (!/전시|미술|아트|갤러리/i.test(title)) continue;
        const url = href.startsWith("http") ? href : `https://gall.dcinside.com${href}`;
        try {
          const detail = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } }).then(r => r.text());
          const $$ = cheerio.load(detail);
          const imgSrc = $$("div.write_div img").first().attr("src") || '';
          const summary = $$("div.write_div").text().trim().slice(0, 140);
          const thumb = await uploadImageToStorage(imgSrc);
          await saveScrapedPost({ source: `dc-${gall.id}`, post_url: url, title, thumb_url: thumb ?? undefined, summary, score: 2 });
        } catch (e) {
          console.log("dc detail err", e);
        }
      }
    } catch (e) {
      console.log("dc list err", e);
    }
  }
} 