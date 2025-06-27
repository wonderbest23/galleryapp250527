import { NextResponse } from "next/server";
import { runAllScrapers } from "@/utils/scrapers";

export const runtime = "nodejs";

export async function POST() {
  try {
    await runAllScrapers();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("run-scrapers error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
} 