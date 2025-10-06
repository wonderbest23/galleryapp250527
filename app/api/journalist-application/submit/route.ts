import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { 
      userId,
      phone,
      introduction,
      experience,
      portfolio_links,
      interests,
      available_time,
      visit_frequency
    } = await request.json();

    // 필수 필드 검증
    if (!userId || !phone || !introduction || !experience || !interests || !available_time || !visit_frequency) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 기존 신청 내역 확인
    const { data: existingApp, error: checkError } = await supabase
      .from("journalist_applications")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (checkError) {
      console.log("신청 내역 확인 오류:", checkError);
    }

    const applicationData = {
      user_id: userId,
      phone,
      introduction,
      experience,
      portfolio_links: portfolio_links || [],
      interests,
      available_time,
      visit_frequency,
      status: "pending",
      updated_at: new Date().toISOString()
    };

    let result;

    if (existingApp && existingApp.length > 0) {
      // 기존 신청이 있으면 업데이트
      const { data, error } = await supabase
        .from("journalist_applications")
        .update(applicationData)
        .eq("id", existingApp[0].id)
        .select()
        .single();

      if (error) {
        console.log("신청 업데이트 오류:", error);
        throw error;
      }
      result = data;
    } else {
      // 새 신청 생성
      const { data, error } = await supabase
        .from("journalist_applications")
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.log("신청 생성 오류:", error);
        throw error;
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: "신청이 완료되었습니다.",
      data: result
    });

  } catch (error) {
    console.log("신청 처리 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

