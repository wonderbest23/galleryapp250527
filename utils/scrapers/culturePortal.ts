// 신규 스크래퍼: 문화포털 "한눈에 보는 문화정보" 전시 목록
// puppeteer 로 동적 렌더링 후 DOM 파싱
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://www.culture.go.kr/oneeye/oneEyeList.do";

export async function scrapeCulturePortal() {
  let browser: any;
  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(LIST_URL, { waitUntil: "networkidle0" });

    // 목록에서 최대 20개 전시 정보 추출
    const items: { url: string; title: string; region: string }[] = await page.evaluate(() => {
      const arr: any[] = [];
      document.querySelectorAll("#oneeye_list > li").forEach((li) => {
        const a = li.querySelector("a");
        if (!a) return;
        const href = (a as HTMLAnchorElement).href;
        const title = (li.querySelector(".tit")?.textContent || a.textContent || "").trim();
        const region = (li.querySelector(".area")?.textContent || "").trim();
        if (href && title) arr.push({ url: href, title, region });
      });
      return arr;
    });

    for (const itm of items.slice(0, 20)) {
      if (!/전시|미술|아트|갤러리/i.test(itm.title)) continue;
      try {
        await page.goto(itm.url, { waitUntil: "networkidle0" });
        const { imgSrc, desc } = await page.evaluate(() => {
          const img = document.querySelector(".thumb img") as HTMLImageElement | null;
          const summary = document.querySelector(".dsc") || document.querySelector(".txt");
          return {
            imgSrc: img?.src || "",
            desc: (summary?.textContent || "").trim().slice(0, 140),
          };
        });
        const thumb = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source: "culturePortal", post_url: itm.url, title: itm.title, thumb_url: thumb ?? undefined, summary: desc, score: 1 });
      } catch (e) {
        console.log("culturePortal detail error", e);
      }
    }
  } catch (e) {
    console.log("culturePortal scrape error", e);
  } finally {
    try {
      await browser?.close();
    } catch {}
  }
} 