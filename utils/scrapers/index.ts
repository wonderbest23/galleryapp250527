import { scrapeVisitSeoul } from "./visitSeoul";
import { scrapeCultureSeoul } from "./cultureSeoul";
import { scrapeMMCA } from "./mmca";
import { scrapeDCInside } from "./dcinside";

export async function runAllScrapers(){
  await scrapeVisitSeoul();
  await scrapeCultureSeoul();
  await scrapeMMCA();
  await scrapeDCInside();
} 