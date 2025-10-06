import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 리워드샵 상품 조회
    const { data: items, error } = await supabase
      .from("reward_shop_items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("리워드샵 상품 조회 오류:", error);
      return NextResponse.json(
        { success: false, error: "상품 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (error) {
    console.error("리워드샵 상품 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    );
  }
}

