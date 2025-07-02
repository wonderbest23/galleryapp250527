import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://culture.seoul.go.kr/culture/culture/cultureEvent/list.do?searchCate=EXHIBITION&menuNo=200009";

export async function scrapeCultureSeoul() {
  let browser: any;
  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(LIST_URL, { waitUntil: "networkidle0" });

    const items: { url: string; title: string }[] = await page.evaluate(() => {
      const arr: any[] = [];
      document.querySelectorAll(".list_type01 li a").forEach((el) => {
        const href = (el as HTMLAnchorElement).href;
        const title = (el.querySelector(".tit")?.textContent || el.textContent || "").trim();
        if (href && title) arr.push({ url: href, title });
      });
      return arr;
    });

    for (const itm of items.slice(0, 15)) {
      if (!/전시|미술|아트|갤러리/i.test(itm.title)) continue;
      try {
        await page.goto(itm.url, { waitUntil: "networkidle0" });
        const { imgSrc, desc, title } = await page.evaluate(() => {
          const img = document.querySelector(".view_img img") as HTMLImageElement | null;
          const descEl = document.querySelector(".view_con");
          const t = (document.querySelector("h3.tit")?.textContent || "").trim();
          return { imgSrc: img?.src || "", desc: (descEl?.textContent || "").trim().slice(0, 140), title: t };
        });
        const thumbUrl = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source: "cultureSeoul", post_url: itm.url, title: title || itm.title, thumb_url: thumbUrl ?? undefined, summary: desc, score: 1 });
      } catch (e) {
        console.log("cultureSeoul detail error", e);
      }
    }
  } catch (e) {
    console.log("cultureSeoul scrape error", e);
  } finally {
    try { await browser?.close(); } catch {}
  }
} 