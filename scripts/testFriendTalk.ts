import { sendAligoFriendTalk } from "../utils/sendAligoFriendTalk";
 
(async () => {
  const ok = await sendAligoFriendTalk("01086859866", "[테스트] 친구톡 발송 테스트입니다.");
  console.log("send result", ok);
  process.exit(0);
})(); 