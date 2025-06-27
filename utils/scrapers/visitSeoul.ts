// @ts-ignore - puppeteer 타입 선언
import puppeteer from "puppeteer";
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://korean.visitseoul.net/exhibition#tabAll";

export async function scrapeVisitSeoul(){
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(LIST_URL, { waitUntil: "domcontentloaded" });
  const links: string[] = await page.$$eval("ul.content_list li a", (as: Element[]) => (as.map((a: Element)=> (a as HTMLAnchorElement).getAttribute("href") || "").filter(Boolean)));
  for(const href of links.slice(0,20)){
    const url = href.startsWith("http")?href:`https://korean.visitseoul.net${href}`;
    try{
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const title = await page.$eval("h2.tit", (el: Element)=>el.textContent?.trim() || "");
      if(!/전시|미술|아트|갤러리/i.test(title)) continue;
      const imgSrc = await page.$eval(".visual img", (el: Element)=> (el as HTMLImageElement).getAttribute("src")||"").catch(()=>"");
      const desc = await page.$eval(".desc", (el: Element)=>el.textContent?.trim()||"").catch(()=>"").then((t:string)=>t.slice(0,140));
      const thumbUrl = await uploadImageToStorage(imgSrc);
      await saveScrapedPost({ source:"visitseoul", post_url:url, title, thumb_url: thumbUrl??undefined, summary:desc, score:1 });
    }catch(e){ console.log("visitSeoul item error", e); }
  }
  await browser.close();
} 