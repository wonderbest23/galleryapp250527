import { NextRequest, NextResponse } from "next/server";
import { generateDailyNews } from "@/utils/generateDailyNews";

export const runtime = "nodejs";

export async function POST(req: NextRequest){
  try{
    const result = await generateDailyNews();
    return NextResponse.json({ok:true,result});
  }catch(e:any){
    console.log("generateDailyNews error",e);
    return NextResponse.json({error:e.message||"unexpected"},{status:500});
  }
} 