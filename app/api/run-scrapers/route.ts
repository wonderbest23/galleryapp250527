import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "@/utils/scrapers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let keyword="한국 미술 전시";
    try{ const body=await req.json(); if(body.keyword) keyword=body.keyword; }catch{}
    await runAllScrapers(keyword);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("run-scrapers error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
} 