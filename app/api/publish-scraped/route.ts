import { NextResponse } from "next/server";
import { publishScraped } from "@/utils/publishScraped";

export const runtime="nodejs";

export async function POST(){
  try{
    const res=await publishScraped();
    return NextResponse.json(res);
  }catch(e:any){
    console.log("publish-scraped error",e);
    return NextResponse.json({error:"failed"},{status:500});
  }
} 