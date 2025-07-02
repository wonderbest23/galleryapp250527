import { NextRequest, NextResponse } from "next/server";
import { scheduleDailyNews } from "@/utils/dailyNewsScheduler";

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try{
    const { prompt } = await req.json();
    if(!prompt) return NextResponse.json({error:"missing-prompt"},{status:400});
    await scheduleDailyNews(prompt);
    return NextResponse.json({ok:true});
  }catch(e){
    console.log("scheduleDailyNews api error",e);
    return NextResponse.json({error:"unexpected"},{status:500});
  }
} 