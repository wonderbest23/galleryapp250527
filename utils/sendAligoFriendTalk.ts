/*
 * utils/sendAligoFriendTalk.ts
 * 알리고 친구톡(FriendTalk) 발송 유틸
 */
import fetch from "node-fetch";

/**
 * 알리고 토큰 발급 (30분 유효)
 */
async function fetchAligoToken() {
  const res: any = await fetch("https://kakaoapi.aligo.in/akv10/token/create/30/s/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      apikey: process.env.ALIGO_API_KEY || "",
      userid: process.env.ALIGO_USER_ID || "",
    }),
  }).then((r) => r.json());

  if (res.code !== 0) {
    console.log("[Aligo] token error", res);
    throw new Error("Aligo token error: " + res.message);
  }
  return (res.token || "") as string;
}

export interface AligoButton {
  name: string; // 버튼 표시 이름
  linkType: "WL" | "AL" | "BK" | "MD" | "DS";
  linkUrl: string; // 버튼 링크
}

/**
 * 친구톡 발송
 * @param to 수신자 번호 (하이픈 없이)
 * @param text 메시지 본문 (1,000자 이내)
 * @param buttons 버튼 배열 (선택)
 * @returns 성공 여부 boolean
 */
export async function sendAligoFriendTalk(to: string, text: string, buttons?: AligoButton[]) {
  if (!process.env.ALIGO_API_KEY || !process.env.ALIGO_USER_ID || !process.env.ALIGO_SENDER_KEY) {
    console.log("[Aligo] env vars missing");
    return false;
  }

  try {
    const token = await fetchAligoToken();

    const params = new URLSearchParams({
      apikey: process.env.ALIGO_API_KEY,
      userid: process.env.ALIGO_USER_ID,
      token,
      senderkey: process.env.ALIGO_SENDER_KEY,
      tpl_code: process.env.ALIGO_FT_TEMPLATE_ID || "",
      sender: process.env.ALIGO_SENDER_PHONE || "01000000000", // 사전 등록된 발신번호
      receiver_1: to,
      message_1: text,
      message_type: "FT", // Friend Talk
    });

    if (buttons?.length) {
      params.append("button_json_1", JSON.stringify(buttons));
    }

    const res: any = await fetch("https://kakaoapi.aligo.in/akv10/alimtalk/send/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    }).then((r) => r.json());

    if (res.code !== 0) {
      console.log("[Aligo] send error", res);
      return false;
    }
    return true;
  } catch (e) {
    console.log("[Aligo] unexpected error", e);
    return false;
  }
} 