import React from "react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import compressToWebp from "@/utils/compressImage";

export default function MainBannerManager() {
  const supabase = createClient();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // 업로드 진행 상태 관리
  const [uploadingId, setUploadingId] = useState(null);
  
  // 크롭 관련 상태
  // 실제 플랫폼 배너 사이즈: 358×192 (비율 1.86:1)
  const bannerAspectRatio = 358 / 192; // 약 1.86:1
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 53.6 }); // 100% × 53.6% = 1.86:1 비율
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [showCrop, setShowCrop] = useState(false);
  const [currentBannerId, setCurrentBannerId] = useState(null);
  const [cropPreview, setCropPreview] = useState(null);
  const imgRef = useRef(null);

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

  // 파일 선택 핸들러 (크롭 모드로 전환)
  const onSelectFile = (e, id) => {
    if (e.target.files && e.target.files.length > 0) {
      setCurrentBannerId(id);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setShowCrop(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 크롭된 이미지를 캔버스로 변환하는 함수
  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9,
      );
    });
  };

  // 실시간 미리보기 생성 함수
  const generatePreview = (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx || !crop.width || !crop.height) return null;

    // 실제 플랫폼 사이즈로 미리보기 생성 (358×192)
    const previewWidth = 358;
    const previewHeight = 192;
    
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      previewWidth,
      previewHeight,
    );

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // 크롭된 이미지 업로드
  const onImageLoad = useCallback(async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && currentBannerId) {
      try {
        setUploadingId(currentBannerId);
        
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop,
          `cropped_banner_${currentBannerId}.jpg`
        );

        // WebP 변환
        const webpFile = await compressToWebp(croppedImageBlob, {
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
            banner.id === currentBannerId ? { ...banner, url: publicUrl } : banner
          )
        );

        alert("배너 이미지가 성공적으로 업로드되었습니다.");
        
        // 크롭 모드 종료
        setShowCrop(false);
        setImgSrc('');
        setCurrentBannerId(null);
        
      } catch (err) {
        console.log("배너 이미지 업로드 예외:", err);
        alert("배너 이미지를 업로드하는 중 오류가 발생했습니다.");
      } finally {
        setUploadingId(null);
      }
    }
  }, [completedCrop, currentBannerId, banners, supabase.storage]);

  // 크롭 변경 핸들러
  const onCropChange = (newCrop) => {
    setCrop(newCrop);
    
    // 실시간 미리보기 생성
    if (imgRef.current && newCrop.width && newCrop.height) {
      const preview = generatePreview(imgRef.current, newCrop);
      setCropPreview(preview);
    }
  };

  // 크롭 완료 핸들러
  const onCropComplete = (newCrop) => {
    setCompletedCrop(newCrop);
    
    // 최종 미리보기 생성
    if (imgRef.current && newCrop.width && newCrop.height) {
      const preview = generatePreview(imgRef.current, newCrop);
      setCropPreview(preview);
    }
  };

  // 크롭 취소
  const cancelCrop = () => {
    setShowCrop(false);
    setImgSrc('');
    setCurrentBannerId(null);
    setCropPreview(null);
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
    <>
      {/* 크롭 모달 */}
      {showCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">배너 이미지 크롭</h3>
              <button
                onClick={cancelCrop}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 크롭 영역 */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>실제 플랫폼 사이즈:</strong> 358×192 픽셀 (비율 1.86:1)
                  </p>
                  <p className="text-xs text-gray-500">
                    원하는 영역을 드래그하여 선택하세요. 가로형 비율이 자동으로 고정됩니다.
                  </p>
                </div>
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={onCropComplete}
                  aspect={bannerAspectRatio}
                  minWidth={100}
                  minHeight={53.6}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                    onLoad={() => {
                      // 초기 크롭 영역 설정
                      if (imgRef.current) {
                        const preview = generatePreview(imgRef.current, crop);
                        setCropPreview(preview);
                      }
                    }}
                  />
                </ReactCrop>
              </div>
              
              {/* 실시간 미리보기 */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                    실시간 미리보기
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    실제 플랫폼에서 표시될 모습입니다.
                  </p>
                </div>
                
                {cropPreview ? (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-center">
                      <img
                        src={cropPreview}
                        alt="배너 미리보기"
                        className="mx-auto border border-gray-200 rounded shadow-sm"
                        style={{ width: '358px', height: '192px', objectFit: 'cover' }}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        크기: 358 × 192 픽셀
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-gray-500 text-sm">
                      크롭 영역을 선택하면 미리보기가 표시됩니다.
                    </p>
                  </div>
                )}
                
                {/* 크롭 가이드라인 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 크롭 가이드라인
                  </h5>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 가로형 이미지가 배너에 최적화됩니다</li>
                    <li>• 중요한 텍스트나 로고는 중앙에 배치하세요</li>
                    <li>• 상단과 하단에 여백을 두면 더 깔끔합니다</li>
                    <li>• 실시간 미리보기를 참고하여 조정하세요</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelCrop}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={onImageLoad}
                disabled={!completedCrop?.width || !completedCrop?.height}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                크롭하여 업로드
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-full col-span-2 md:col-span-1">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">메인 배너 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            메인 화면에 표시될 배너를 관리합니다 (크롭 기능 포함)
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
                      배너 이미지 업로드 (실제 사이즈 맞춤)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onSelectFile(e, banner.id)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>📱 실제 플랫폼 사이즈:</strong> 358×192 픽셀 (1.86:1 비율)
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        이미지 선택 시 크롭 모드로 전환되어 실제 노출 크기에 맞게 조정할 수 있습니다.
                      </p>
                    </div>
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
    </>
  );
}
