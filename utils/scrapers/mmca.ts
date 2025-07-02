import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://www.mmca.go.kr/exhibitions/progressList.do";

export async function scrapeMMCA() {
  let browser: any;
  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(LIST_URL, { waitUntil: "networkidle0" });

    const items: { url: string; title: string }[] = await page.evaluate(() => {
      const arr: any[] = [];
      document.querySelectorAll(".list_box ul li a").forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        const title = (a.querySelector(".tit")?.textContent || a.textContent || "").trim();
        if (href && title) arr.push({ url: href, title });
      });
      return arr;
    });

    for (const itm of items.slice(0, 20)) {
      if (!/전시|미술|아트|갤러리/i.test(itm.title)) continue;
      try {
        await page.goto(itm.url, { waitUntil: "networkidle0" });
        const { imgSrc, desc } = await page.evaluate(() => {
          const img = document.querySelector(".exhibition_view .img img") as HTMLImageElement | null;
          const summary = document.querySelector(".exhibition_view .txt");
          return {
            imgSrc: img?.src || "",
            desc: (summary?.textContent || "").trim().slice(0, 140),
          };
        });
        const thumb = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source: "mmca", post_url: itm.url, title: itm.title, thumb_url: thumb ?? undefined, summary: desc, score: 1 });
      } catch (e) {
        console.log("mmca detail error", e);
      }
    }
  } catch (e) {
    console.log("mmca scrape error", e);
  } finally {
    try { await browser?.close(); } catch {}
  }
} 