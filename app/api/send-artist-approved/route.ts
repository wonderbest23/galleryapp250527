export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sendAligoFriendTalk } from "@/utils/sendAligoFriendTalk";

// POST { phone: string, name?: string }
export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "missing-phone" }, { status: 400 });
    }

    const text = `${name ?? "작가"}님의 가입 승인이 완료되었습니다. 지금 바로 작품을 등록해보세요!`;
    const ok = await sendAligoFriendTalk(phone, text, undefined, process.env.ALIGO_TPL_ARTIST_APPROVED);
    return NextResponse.json({ ok });
  } catch (e) {
    console.log("[send-artist-approved] error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 