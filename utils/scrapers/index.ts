import { scrapeBrave } from "./braveSearch";
import { scrapeVisitSeoul } from "./visitSeoul";

export async function runAllScrapers(keyword: string = "한국 미술 전시"){
  await scrapeBrave(keyword);

  // YYYYMM 형태가 포함돼 있으면 그 달 전시 페이지 스크랩
  const monthMatch = keyword.match(/20\d{4}/)?.[0];
  await scrapeVisitSeoul(monthMatch);
}

export default { runAllScrapers }; 