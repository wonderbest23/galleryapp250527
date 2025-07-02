import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/utils/simulateActivity";

export const runtime = "nodejs";

// POST /api/simulate-activity
// body: { boardId?: number, posts?: number, commentsMin?: number, commentsMax?: number }
export async function POST(req: NextRequest) {
  try {
    const { boardId = 1, posts = 1, commentsMin = 1, commentsMax = 3 } = await req.json();
    await runSimulation({ boardId, postCount: posts, commentsPerPost: [commentsMin, commentsMax] });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("simulate-activity api error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 