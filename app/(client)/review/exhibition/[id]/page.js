"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Image,
  Textarea,
  Skeleton,
} from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import Star from "./components/Star";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import { addToast, ToastProvider } from "@heroui/react";

export default function page() {
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const { id } = useParams();
  const [exhibition, setExhibition] = useState(null);
  const [description, setDescription] = useState("");
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [user, setUser] = useState(null);
  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log("data:", data);
    if (!data.user) {
      router.push("/mypage?redirect_to=/review/exhibition/" + id);
    }
    if (error) {
      console.error("Error fetching user:", error);
    } else {
      setUser(data.user);
    }
  };
  useEffect(() => {
    getUser();
  }, []);
  const fetchExhibition = async () => {
    const { data, error } = await supabase
      .from("exhibition")
      .select("*, gallery(*)")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching gallery:", error);
    } else {
      setExhibition(data);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchExhibition();
  }, [id]);
  console.log("exhibition:", exhibition);

  const handleFeelingClick = (feeling) => {
    if (selectedFeelings.includes(feeling)) {
      setSelectedFeelings(selectedFeelings.filter((item) => item !== feeling));
    } else {
      setSelectedFeelings([...selectedFeelings, feeling]);
    }
  };

  const router = useRouter();
  console.log("feeling:", selectedFeelings);

  const handleReviewSubmit = async () => {
    // 먼저 이 사용자가 이 전시회에 대한 리뷰를 이미 작성했는지 확인
    const { data: existingReviews, error: checkError } = await supabase
      .from("exhibition_review")
      .select("*")
      .eq("exhibition_id", id)
      .eq("user_id", user.id);

    if (checkError) {
      console.log("기존 리뷰 확인 중 오류 발생:", checkError);
      return;
    }

    // 이미 리뷰가 존재하는 경우
    if (existingReviews && existingReviews.length > 0) {
      addToast({
        title: "리뷰 작성 불가",
        description: "이미 작성한 리뷰가 있어서 추가 작성은 불가합니다.",
        color: "danger",
      });
      router.push("/");
      return;
    }

    const maskedName = user.user_metadata?.name
      ? user.user_metadata.name.length > 1
        ? user.user_metadata.name[0] + '**'
        : user.user_metadata.name
      : user.email;
    const { data, error } = await supabase.from("exhibition_review").insert({
      exhibition_id: id,
      category: selectedFeelings,
      rating: rating,
      description: description,
      name: maskedName,
      user_id: user.id,
    });
    if (error) {
      console.error("Error submitting review:", error);
    } else {
      console.log("Review submitted successfully");

      /* 동일 내용으로 갤러리 리뷰도 생성 (없을 때만) */
      try {
        const { data: exInfo } = await supabase.from('exhibition').select('naver_gallery_url').eq('id', id).single();
        if(exInfo?.naver_gallery_url){
          const { data: galInfo } = await supabase.from('gallery').select('id').eq('url', exInfo.naver_gallery_url).single();
          const gId = galInfo?.id;
          if(gId){
            // 중복 확인
            const { data: existG } = await supabase.from('gallery_review').select('id').eq('gallery_id', gId).eq('user_id', user.id).maybeSingle();
            if(!existG){
              await supabase.from('gallery_review').insert({
                gallery_id: gId,
                rating,
                description,
                category: selectedFeelings,
                name: maskedName,
                user_id: user.id,
              });
            }
          }
        }
      } catch(e){console.log('gallery review sync error',e)}

      addToast({
        title: "리뷰 작성 완료",
        description: "리뷰가 성공적으로 작성되었습니다.",
        color: "success",
      });
    }
    router.push("/");
  };
  // if (!user) {
  //   router.push("/login");
  // }

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 w-full px-4 ">
      {user && (
        <>
          <div className="bg-white flex items-center w-full justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <IoClose className="text-xl" />
            </Button>
            <h2 className="text-lg font-bold text-center flex-grow">리뷰</h2>
            <div className="w-10"></div>
          </div>
          <div className="w-full flex flex-col gap-4 font-bold text-[20px] text-start">
            여기는 어떠셨나요?
          </div>
          {isLoading ? (
            <div className="max-w-[300px] w-full flex items-center gap-3 justify-center">
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <Card className="w-full m-0">
              <CardBody className="flex gap-4 flex-row justify-center items-center">
                <img
                  src={exhibition?.photo}
                  alt={exhibition?.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex flex-col w-full">
                  <div className="flex flex-col justify-between items-start">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-gray-500">
                        {exhibition?.name}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-lg font-bold">
                        {exhibition?.contents}
                      </div>
                    </div>
                  </div>

                  <Divider orientation="horizontal" className=" bg-gray-300" />
                  <div className="text-xs flex flex-col my-2">
                    {exhibition?.start_date ? (
                      <>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니달력.svg"
                            alt=""
                          />
                          {exhibition?.start_date?.slice(0, 10)} ~{" "}
                          {exhibition?.end_date?.slice(0, 10)}
                        </div>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니지도.svg"
                            alt=""
                          />
                          {exhibition?.gallery?.address}
                        </div>
                        <div className="flex flex-row gap-1">
                          <img
                            className="w-4 h-4"
                            src="/exhibition/미니가격.png"
                            alt=""
                          />
                          {exhibition?.price}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-row gap-1">
                        <img
                          className="w-4 h-4"
                          src="/exhibition/미니지도.svg"
                          alt=""
                        />
                        {gallery?.address}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          <div className="w-full flex flex-col gap-4">
            <Star
              rating={rating}
              hoverRating={hoverRating}
              setRating={setRating}
              setHoverRating={setHoverRating}
            />
          </div>
          {/* <div className="w-full flex flex-col gap-4 font-bold text-xl text-center">
        어떤 부분이 느껴졌나요?
      </div> */}
          {/* <div className="w-full flex flex-wrap gap-2 justify-center mb-6">
        {[
          "쾌적함",
          "프라이빗",
          "다양한경험",
          "친절",
          "애견동반",
          "주차편리",
          "높은수준",
          "시끌벅적",
          "별로",
        ].map((feeling) => (
          <Button
            key={feeling}
            variant="bordered"
            className={`${selectedFeelings.includes(feeling) ? "font-bold border-2 border-primary text-primary" : "border border-gray-300"}`}
            onPress={() => handleFeelingClick(feeling)}
          >
            {feeling}
          </Button>
        ))}
      </div> */}
          <div className="w-full flex flex-col gap-4 font-bold text-[15px] text-start">
            의견을 남겨주세요(선택)
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="내용을 작성해주세요"
            variant="bordered"
          />
          <div className="w-full flex flex-col gap-4 font-bold text-xl text-center mb-24">
            <Button
              className="w-full font-bold bg-black text-white"
              onPress={handleReviewSubmit}
            >
              리뷰 작성완료
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
