import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { uploadImageToStorage, saveScrapedPost } from "./savePost";

const LIST_URL = "https://korean.visitseoul.net/exhibition";

export async function scrapeVisitSeoul(){
  try{
    const html = await fetch(LIST_URL, { headers:{"user-agent":"Mozilla/5.0"}}).then(r=>r.text());
    const $ = cheerio.load(html);
    const items: {url:string,title:string}[] = [];
    $("ul.content_list li a").each((_:any,el:any)=>{
      const href = $(el).attr("href")||"";
      const title = $(el).find(".tit").text().trim() || $(el).text().trim();
      if(href && title) items.push({url: href.startsWith("http")?href:`https://korean.visitseoul.net${href}`, title});
    });

    for(const itm of items.slice(0,20)){
      if(!/전시|미술|아트|갤러리/i.test(itm.title)) continue;
      try{
        const detail = await fetch(itm.url,{headers:{"user-agent":"Mozilla/5.0"}}).then(r=>r.text());
        const $$ = cheerio.load(detail);
        const imgSrc = $$(".visual img").first().attr("src")||"";
        const desc = $$(".desc").text().trim().slice(0,140);
        const thumb = await uploadImageToStorage(imgSrc);
        await saveScrapedPost({ source:"visitseoul", post_url: itm.url, title: itm.title, thumb_url: thumb??undefined, summary: desc, score: 1 });
      }catch(e){console.log("visitSeoul detail error",e);}  
    }
  }catch(e){console.log("visitSeoul list error",e);} 
} 