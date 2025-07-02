import { NextRequest, NextResponse } from "next/server";
import { simulateViews } from "@/utils/simulateViews";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = await simulateViews();
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.log("simulate-views error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 