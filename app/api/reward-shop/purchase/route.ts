import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { itemId, userId } = await request.json();

    if (!itemId || !userId) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 2. 상품 정보 조회
    const { data: item, error: itemError } = await supabase
      .from("reward_shop_items")
      .select("*")
      .eq("id", itemId)
      .eq("is_active", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 재고 확인
    if (item.stock <= 0) {
      return NextResponse.json(
        { success: false, message: "상품의 재고가 없습니다." },
        { status: 400 }
      );
    }

    // 4. 사용자 포인트 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 5. 포인트 부족 체크
    if ((profile.points || 0) < item.points_required) {
      return NextResponse.json(
        { success: false, message: "포인트가 부족합니다." },
        { status: 400 }
      );
    }

    // 6. 트랜잭션 시작 (포인트 차감, 재고 차감, 구매 내역 생성)
    
    // 6-1. 포인트 차감
    const newPoints = (profile.points || 0) - item.points_required;
    const { error: updatePointsError } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", userId);

    if (updatePointsError) {
      console.log("포인트 업데이트 오류:", updatePointsError);
      return NextResponse.json(
        { success: false, message: "포인트 차감 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 6-2. 재고 차감
    const { error: updateStockError } = await supabase
      .from("reward_shop_items")
      .update({ stock: item.stock - 1 })
      .eq("id", itemId);

    if (updateStockError) {
      console.log("재고 업데이트 오류:", updateStockError);
      // 포인트 롤백
      await supabase
        .from("profiles")
        .update({ points: profile.points })
        .eq("id", userId);
      
      return NextResponse.json(
        { success: false, message: "재고 업데이트 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 6-3. 구매 내역 생성
    const { error: purchaseError } = await supabase
      .from("reward_purchases")
      .insert({
        user_id: userId,
        item_id: itemId,
        points_spent: item.points_required,
        status: "completed"
      });

    if (purchaseError) {
      console.log("구매 내역 생성 오류:", purchaseError);
      // 포인트와 재고 롤백
      await supabase
        .from("profiles")
        .update({ points: profile.points })
        .eq("id", userId);
      await supabase
        .from("reward_shop_items")
        .update({ stock: item.stock })
        .eq("id", itemId);
      
      return NextResponse.json(
        { success: false, message: "구매 내역 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "구매가 완료되었습니다.",
      data: {
        remainingPoints: newPoints,
        purchasedItem: item.title
      }
    });

  } catch (error) {
    console.log("구매 처리 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "구매 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

