import React from "react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import compressToWebp from "@/utils/compressImage";

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
          alert("배너 데이터를 불러오는 중 오류가 발생했습니다.");
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

      // WebP 변환
      const webpFile = await compressToWebp(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
      });

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("exhibition")
        .upload(fileName, webpFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.log("배너 이미지 업로드 오류:", uploadError);
        alert("배너 이미지를 업로드하는 중 오류가 발생했습니다.");
        return;
      }

      // public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("exhibition").getPublicUrl(fileName);

      // 상태 업데이트
      setBanners(
        banners.map((banner) =>
          banner.id === id ? { ...banner, url: publicUrl } : banner
        )
      );

      alert("배너 이미지가 성공적으로 업로드되었습니다.");
    } catch (err) {
      console.log("배너 이미지 업로드 예외:", err);
      alert("배너 이미지를 업로드하는 중 오류가 발생했습니다.");
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
        alert("배너 저장 중 오류가 발생했습니다.");
      } else {
        console.log("배너 저장 성공:", data);
        alert("메인 배너가 성공적으로 저장되었습니다.");
        setBanners(data);
      }
    } catch (error) {
      console.error("배너 저장 중 예외 발생:", error);
      alert("배너 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-full col-span-2 md:col-span-1">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">메인 배너 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          메인 화면에 표시될 배너를 관리합니다
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.length > 0 ? (
              banners.map((banner, index) => (
                <div key={banner.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-gray-900">
                      메인 배너 {index + 1}
                    </label>
                  </div>
                  
                  {/* 파일 업로드 인풋 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 업로드
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBannerUpload(e, banner.id)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 업로드 중 표시 */}
                  {uploadingId === banner.id && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      이미지 업로드 중...
                    </div>
                  )}

                  {/* 미리보기 */}
                  {banner.url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <img
                          src={banner.url}
                          alt={`메인 배너 ${index + 1}`}
                          className="w-full h-auto object-contain max-h-64"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">등록된 배너가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <button 
          onClick={onSave} 
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? '저장 중...' : '메인 배너 저장하기'}
        </button>
      </div>
    </div>
  );
}
