import { uploadImageToStorage, saveScrapedPost } from "./savePost";

export async function scrapeVisitSeoul(month:string|undefined=""){
  const m = month && /20\d{4}/.test(month) ? month : new Date().toISOString().slice(0,7).replace('-','');
  const LIST_URL = `https://korean.visitseoul.net/exhibition?selectedMonth=${m}`;
  let browser: any;
  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(LIST_URL, { waitUntil: "networkidle0" });

    // 전시/공연 탭 클릭 (hash 기반)
    try {
      await page.click('a[href*="#tabAll"]');
      await page.waitForTimeout(500);
    }catch{}

    // 스크롤하여 lazy load 카드 가져오기
    await page.evaluate(async ()=>{ window.scrollTo(0,document.body.scrollHeight); await new Promise(r=>setTimeout(r,800)); });

    const items = await page.$$eval("ul.content_list li a", (els:any) => els.map((el:any)=>({url:(el as HTMLAnchorElement).href, title:(el.querySelector('.tit')?.textContent||el.textContent||'').trim()})) as any);

    for(const itm of (items as any[]).slice(0,30)){
      if(!/(전시|미술|art|exhibition)/i.test(itm.title)) continue;
      try{
        await page.goto(itm.url,{waitUntil:"networkidle2"});
        const {imgSrc,desc} = await page.evaluate(()=>{
          const img = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || (document.querySelector('.visual img') as HTMLImageElement)?.src;
          const d = (document.querySelector('.desc')?.textContent||'').trim();
          return {imgSrc:imgSrc??img, desc:d.slice(0,140)};
        });
        const thumb = await uploadImageToStorage(imgSrc||'');
        await saveScrapedPost({source:"visitseoul",post_url:itm.url,title:itm.title,thumb_url:thumb||undefined,summary:desc,score:2});
      }catch(e){console.log('visitSeoul detail error',e);} 
    }
  } catch (e) {
    console.log("visitSeoul scrape error", e);
  } finally {
    try { await browser?.close(); } catch {}
  }
} 