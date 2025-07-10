import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Spinner,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

export default function MainBannerManager() {
  const supabase = createClient();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // 업로드 진행 상태 관리
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from("banner").select("*");
        if (error) {
          console.error("배너 데이터 가져오기 오류:", error);
          addToast({
            title: "로드 실패",
            description: "배너 데이터를 불러오는 중 오류가 발생했습니다.",
            variant: "error",
          });
        } else {
          // 데이터가 없으면 기본 배너 객체 생성
          if (data.length === 0) {
            setBanners([{ id: 1, url: "" }]);
          } else {
            setBanners(data);
          }
        }
      } catch (error) {
        console.error("배너 데이터 가져오기 중 예외 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // 파일 업로드 핸들러
  const handleBannerUpload = async (e, id) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(id);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.log("배너 이미지 업로드 오류:", uploadError);
        addToast({
          title: "업로드 실패",
          description: "배너 이미지를 업로드하는 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      // public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("banners").getPublicUrl(fileName);

      // 상태 업데이트
      setBanners(
        banners.map((banner) =>
          banner.id === id ? { ...banner, url: publicUrl } : banner
        )
      );

      addToast({
        title: "업로드 완료",
        description: "배너 이미지가 성공적으로 업로드되었습니다.",
        color: "success",
      });
    } catch (err) {
      console.log("배너 이미지 업로드 예외:", err);
      addToast({
        title: "업로드 실패",
        description: "배너 이미지를 업로드하는 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setUploadingId(null);
    }
  };
  
  const addBanner = () => {
    // 새 배너 ID는 현재 배너 중 가장 큰 ID + 1로 설정
    const newId = banners.length > 0 
      ? Math.max(...banners.map(banner => banner.id)) + 1 
      : 1;
    
    setBanners([...banners, { id: newId, url: "" }]);
  };
  
  const removeBanner = (id) => {
    if (banners.length > 1) {
      setBanners(banners.filter(banner => banner.id !== id));
    } else {
      // 마지막 배너는 삭제하지 않고 내용만 비움
      setBanners([{ id: banners[0].id, url: "" }]);
    }
  };

  const onSave = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("banner")
        .upsert(banners)
        .select();

      if (error) {
        console.error("배너 저장 오류:", error);
        addToast({
          title: "저장 실패",
          description: "배너 저장 중 오류가 발생했습니다.",
          color: "danger",
        });
      } else {
        console.log("배너 저장 성공:", data);
        addToast({
          title: "저장 완료",
          description: "메인 배너가 성공적으로 저장되었습니다.",
          color: "success",
        });
        setBanners(data);
      }
    } catch (error) {
      console.error("배너 저장 중 예외 발생:", error);
      addToast({
        title: "저장 실패",
        description: "배너 저장 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      shadow="sm"
      radius="lg"
      className="max-w-full col-span-2 md:col-span-1"
    >
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-xl font-semibold">메인 배너 관리</p>
          <p className="text-small text-default-500">
            메인 화면에 표시될 배너를 관리합니다
          </p>
        </div>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {banners.length > 0 ? (
              banners.map((banner, index) => (
                <div key={banner.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">
                      메인 배너 {index + 1}
                    </label>

                  </div>
                  
                  {/* 파일 업로드 인풋 */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(e, banner.id)}
                    className="file-input file-input-bordered w-full"
                  />

                  {/* 업로드 중 스피너 */}
                  {uploadingId === banner.id && (
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      <Spinner size="sm" /> 이미지 업로드 중...
                    </div>
                  )}

                  {/* 미리보기 */}
                  {banner.url && (
                    <Image
                      src={banner.url}
                      alt={`메인 배너 ${index + 1}`}
                      width={300}
                      height={150}
                      className="object-contain rounded border"
                    />
                  )}


                </div>
              ))
            ) : (
              <p>등록된 배너가 없습니다.</p>
            )}
            

          </div>
        )}
      </CardBody>
      <CardFooter>
        <Button 
          onPress={onSave} 
          color="primary" 
          radius="sm" 
          className="w-full"
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          메인 배너 저장하기
        </Button>
      </CardFooter>
    </Card>
  );
}
