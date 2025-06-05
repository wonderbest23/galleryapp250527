import React from "react";
import {
  Button,
  Skeleton,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';

async function processPayment(orderId, amount, paymentKey, userId, quantity) {
  console.log("quantity:", quantity)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amount,
        paymentKey,
      }),
      cache: 'no-store'
    });

    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '결제 처리 중 오류가 발생했습니다.');
    }

    // API 응답 데이터 가져오기
    const responseData = await response.json();
    console.log('responseData:',responseData);
    // Supabase 클라이언트 생성 (비동기)
    const supabase = await createClient();

    // payment_credit 테이블에 데이터 저장
    const { error: insertError } = await supabase
      .from('payment_credit')
      .upsert([
        {
          artist_id: userId,
          amount: amount,
          payment_key: paymentKey,
          order_id: orderId,
          status: 'success',
          quantity: parseInt(quantity),
        }
      ], { 
        onConflict: 'order_id',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting payment data:', insertError);
      throw new Error('결제 정보 저장 중 오류가 발생했습니다.');
    }

    // API 호출이 성공했을 때만 크레딧 추가 (status_code가 0인 경우 성공)
    if (!responseData.message) {
      // profiles 테이블에서 artist_credit 업데이트
      // amount를 10000으로 나눈 값만큼 artist_credit 증가
      const creditToAdd = Number(amount) / 10000;
      
      // 현재 artist_credit 값 조회
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('artist_credit')
        .eq('id', userId)
        .single();
      
      if (profileFetchError) {
        console.error('Error fetching profile data:', profileFetchError);
        throw new Error('사용자 정보 조회 중 오류가 발생했습니다.');
      }
      
      // 현재 credit 값에 새로운 credit 추가
      const updatedCredit = (profileData.artist_credit || 0) + creditToAdd;
      
      // profiles 테이블 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ artist_credit: updatedCredit })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating artist credit:', updateError);
        throw new Error('크레딧 업데이트 중 오류가 발생했습니다.');
      }
    }

    return responseData;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

export default async function PaymentSuccess({ searchParams }) {
  const params = await searchParams;
  const { user_id, orderId, amount, paymentKey, quantity } = params;

  try {
    await processPayment(orderId, amount, paymentKey, user_id, quantity);
  } catch (error) {
    console.error('Payment processing error:', error);
    const errorMessage = encodeURIComponent(error.message || '결제 처리 중 오류가 발생했습니다.');
    redirect(`/payment/fail?message=${errorMessage}`);
  }

  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <div className="w-[90%] flex flex-col gap-y-4 mt-6 h-[calc(100vh-150px)] justify-center ">
        <div className="flex flex-col gap-y-2 items-center justify-center">
          <img src="/payment/present.png" alt="결제 완료" className="w-[160px] h-[91px]" />
        </div>
        <div className="flex flex-col gap-y-2 items-center justify-center"> 
          <div className="text-[24px] text-black font-bold">
            결제 완료!
          </div>
          <div className="text-[16px] text-[#A6A6A6] font-medium">
            결제 반영까지 최대 10분이 소요될 수 있습니다!
          </div>
        </div>

        <form action="/addProduct" method="GET">
          <Button
            type="submit"
            className="w-full text-white font-bold bg-black"
            size="lg"
          >
            신규작품 등록하기
          </Button>
        </form>
        
        <form action="/" method="GET">
          <Button
            type="submit"
            className="w-full font-bold bg-white border-2 border-black text-black"
            size="lg"
          >
            홈으로 돌아가기
          </Button>
        </form>
      </div>
    </div>
  );
}