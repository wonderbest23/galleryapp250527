"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Spinner,
  Input,
  addToast
} from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function EditProduct() {
  const params = useParams();
  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 폼 필드 상태
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [makeMaterial, setMakeMaterial] = useState("");
  const [makeDate, setMakeDate] = useState("");
  const [genre, setGenre] = useState("현대미술");
  const [price, setPrice] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const genres = [
    { id: 1, name: "현대미술" },
    { id: 2, name: "명화/동양화" },
    { id: 3, name: "추상화" },
    { id: 4, name: "사진/일러스트" },
    { id: 5, name: "기타" },
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.log('작품 불러오기 오류:', error);
          addToast({
            title: "데이터 로드 실패",
            description: "작품 정보를 불러오는데 실패했습니다.",
            color: "danger"
          });
          router.push('/mypage/success');
          return;
        }

        // 현재 로그인한 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== data.artist_id) {
          addToast({
            title: "접근 권한 없음",
            description: "이 작품을 수정할 권한이 없습니다.",
            color: "danger"
          });
          router.push('/mypage/success');
          return;
        }

        setArtwork(data);
        // 폼 필드 초기화
        setName(data.name || "");
        setSize(data.size || "");
        setMakeMaterial(data.make_material || "");
        setMakeDate(data.make_date || "");
        setGenre(data.genre || "현대미술");
        setPrice(data.price ? data.price.toString() : "");
        setProductImages(data.image || []);
      } catch (error) {
        console.log('오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      fetchProductData();
    }
  }, [params.id, router, supabase]);

  // 브라우저 WebP 변환 (addProduct와 동일)
  async function fileToWebP(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      img.onload = () => {
        const max = 1200;
        let w = img.width,
          h = img.height;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round(h * (max / w));
            w = max;
          } else {
            w = Math.round(w * (max / h));
            h = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/webp", 0.8);
      };
      reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setIsUploading(true);

      const uploadedImages = [];
      for (const file of files) {
        const webpBlob = await fileToWebP(file);
        const fileName = `${uuidv4()}.webp`;
        const filePath = `product/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product")
          .upload(filePath, webpBlob, { contentType: "image/webp" });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("product").getPublicUrl(filePath);
        uploadedImages.push(publicUrl);
      }

      setProductImages([...productImages, ...uploadedImages]);
    } catch (error) {
      console.log("Error uploading image:", error);
      addToast({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 입력 유효성 검증 함수
  const validateInputs = () => {
    // 작품 이미지 체크
    if (productImages.length === 0) {
      addToast({
        title: "필수 입력 누락",
        description: "작품 이미지를 1개 이상 등록해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 작품명 체크
    if (!name.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "작품명을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 사이즈 체크
    if (!size.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "사이즈를 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 소재 체크
    if (!makeMaterial.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "소재를 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 제작일 체크 (YYYYMMDD 형식)
    if (!makeDate.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "제작일을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    const datePattern = /^\d{8}$/;
    if (!datePattern.test(makeDate)) {
      addToast({
        title: "입력 형식 오류",
        description: "제작일은 YYYYMMDD 형식(예: 20250201)으로 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    // 작품금액 체크 (숫자만)
    if (!price.trim()) {
      addToast({
        title: "필수 입력 누락",
        description: "작품금액을 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    if (!/^\d+$/.test(price)) {
      addToast({
        title: "입력 형식 오류",
        description: "작품금액은 숫자만 입력해주세요.",
        color: "danger",
      });
      return false;
    }
    
    return true;
  };

  // 숫자만 입력 허용하는 함수
  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPrice(value);
    }
  };

  // 날짜 형식 검증 함수
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d{0,8}$/.test(value)) {
      setMakeDate(value);
    }
  };

  const handleUpdate = async () => {
    // 입력 유효성 검증
    if (!validateInputs()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 작품 정보 업데이트
      const { error } = await supabase
        .from('product')
        .update({
          name,
          size,
          make_material: makeMaterial,
          make_date: makeDate,
          genre,
          price: parseInt(price),
          image: productImages
        })
        .eq('id', params.id);

      if (error) {
        addToast({
          title: "작품 수정 실패",
          description: "작품 정보 저장 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "작품 수정 성공",
        description: "작품이 성공적으로 수정되었습니다.",
        color: "success",
      });
      
      router.push('/mypage/success');
    } catch (error) {
      console.log('Error updating product:', error);
      addToast({
        title: "작품 수정 실패",
        description: error.message || "작품 수정 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('product')
        .delete()
        .eq('id', params.id);

      if (error) {
        addToast({
          title: "작품 삭제 실패",
          description: "작품 삭제 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "작품 삭제 성공",
        description: "작품이 성공적으로 삭제되었습니다.",
        color: "success",
      });
      
      router.push('/mypage/success');
    } catch (error) {
      console.log('Error deleting product:', error);
      addToast({
        title: "작품 삭제 실패",
        description: error.message || "작품 삭제 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/mypage/success")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">작품 수정하기</h1>
              <p className="text-sm text-gray-500">작품 정보를 수정하고 관리하세요</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 작품 이미지 섹션 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CiImageOn className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">작품 이미지</h3>
            <span className="text-red-500 text-sm">*</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {productImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`작품 이미지 ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <button
                  onClick={() => {
                    const newImages = [...productImages];
                    newImages.splice(index, 1);
                    setProductImages(newImages);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <IoMdCloseCircleOutline className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="relative">
              <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
                <CiImageOn className="text-2xl text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 text-center">이미지<br/>추가</span>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            최대 10개까지 업로드 가능합니다. 첫 번째 이미지가 대표 이미지로 설정됩니다.
          </p>
        </div>

        {/* 작품 기본 정보 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">작품 기본 정보</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 작품명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작품명 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                variant="bordered"
                placeholder="작품명을 입력해주세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }}
              />
            </div>

            {/* 사이즈 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이즈 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                variant="bordered"
                placeholder="예시) 121.9x156.8cm"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }}
              />
            </div>

            {/* 소재 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소재 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                variant="bordered"
                placeholder="예시) 유화/캔버스"
                value={makeMaterial}
                onChange={(e) => setMakeMaterial(e.target.value)}
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }}
              />
            </div>

            {/* 제작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제작일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                variant="bordered"
                placeholder="20250201"
                value={makeDate}
                onChange={handleDateChange}
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }}
              />
              <p className="text-xs text-gray-500 mt-1">YYYYMMDD 형식으로 입력해주세요</p>
            </div>

            {/* 작품금액 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작품금액 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                variant="bordered"
                placeholder="콤마없이 숫자만 입력해주세요"
                value={price}
                onChange={handlePriceChange}
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }}
              />
              <p className="text-xs text-gray-500 mt-1">원 단위로 입력해주세요</p>
            </div>
          </div>
        </div>

        {/* 장르 선택 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">장르</h3>
            <span className="text-red-500 text-sm">*</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenre(g.name)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  genre === g.name
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              color="primary"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4"
              size="lg"
              onPress={handleUpdate}
              isLoading={isSubmitting}
              startContent={
                !isSubmitting && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )
              }
            >
              {isSubmitting ? "수정 중..." : "작품 수정"}
            </Button>
            
            <Button
              variant="bordered"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-4"
              size="lg"
              onPress={handleDelete}
              isLoading={isDeleting}
              startContent={
                !isDeleting && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )
              }
            >
              {isDeleting ? "삭제 중..." : "작품 삭제"}
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">주의사항</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  작품 삭제는 되돌릴 수 없습니다. 삭제하기 전에 신중히 고려해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 하단 여백 */}
        <div className="h-8"></div>
      </div>
    </div>
  );
} 