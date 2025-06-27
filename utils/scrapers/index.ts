import { scrapeVisitSeoul } from "./visitSeoul";
import { scrapeCultureSeoul } from "./cultureSeoul";

export async function runAllScrapers(){
  await scrapeVisitSeoul();
  await scrapeCultureSeoul();
} 