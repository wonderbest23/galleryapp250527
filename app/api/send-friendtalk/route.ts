export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sendAligoFriendTalk } from "@/utils/sendAligoFriendTalk";

export async function POST(req: NextRequest) {
  try {
    const { phone, text, buttons } = await req.json();

    if (!phone || !text) {
      return NextResponse.json({ error: "missing-params" }, { status: 400 });
    }

    const ok = await sendAligoFriendTalk(phone, text, buttons);
    return NextResponse.json({ ok });
  } catch (e) {
    console.log("[send-friendtalk] unexpected error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 