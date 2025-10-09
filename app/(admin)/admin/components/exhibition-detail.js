"use client";
import React from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import Froala from "./Froala";
import RichTextEditor from "./RichTextEditor/RichTextEditor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { GallerySearchModal } from "./GallerySearchModal";

export function ExhibitionDetail({
  exhibition,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedExhibition,
  setSelectedExhibition,
}) {
  // 전시회 ID가 없으면 신규 등록 모드로 간주
  const isNewExhibition = !exhibition.id;
  const [isEditing, setIsEditing] = React.useState(isNewExhibition);
  const [editedExhibition, setEditedExhibition] = React.useState({
    ...exhibition,
    free_ticket_limit: exhibition.free_ticket_limit !== undefined && exhibition.free_ticket_limit !== null ? exhibition.free_ticket_limit : 0,
  });
  // 이전 전시회 ID를 저장하는 ref
  const prevExhibitionIdRef = React.useRef(exhibition.id);
  const supabase = createClient();
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  
  // QR 코드 관련 상태
  const [qrValue, setQrValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const qrRef = useRef(null);

  // DatePicker 관련 상태
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 갤러리 검색 모달 관련 상태
  const [isGallerySearchOpen, setIsGallerySearchOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);

  useEffect(() => {
    console.log('ExhibitionDetail: exhibition prop 변경됨:', exhibition);
    
    // exhibition이 변경될 때마다 editedExhibition 업데이트
    setEditedExhibition({...exhibition}); // 새로운 객체로 복사
    setPreviewUrl(exhibition.photo || '');

    // 새 전시회이거나 다른 전시회로 전환된 경우에만 편집 모드 설정
    if (!exhibition.id) {
      console.log('신규 전시회 모드로 설정');
      setIsEditing(true); // 신규 등록 모드
    } else if (prevExhibitionIdRef.current !== exhibition.id) {
      console.log('다른 전시회로 전환됨, 조회 모드로 설정');
      setIsEditing(false); // 기존 전시회 조회 모드
    }

    // 이전 전시회 ID 업데이트
    prevExhibitionIdRef.current = exhibition.id;
    
    // QR 코드 URL 설정
    if (exhibition.id) {
      // 현재 window.location.origin 가져오기
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setBaseUrl(origin);
      setQrValue(`${origin}/review/exhibition/${exhibition.id}`);
    } else {
      setQrValue("");
    }
  }, [exhibition, exhibition.id]); // exhibition.id도 의존성에 추가

  // add_info 값 변경 감지
  useEffect(() => {
  }, [editedExhibition.add_info]);

  // 갤러리 선택 처리 함수
  const handleGallerySelect = (gallery) => {
    setSelectedGallery(gallery);
    // 네이버 갤러리 URL을 갤러리의 URL로 설정
    setEditedExhibition({
      ...editedExhibition,
      naver_gallery_url: gallery.url
    });
    addToast({
      title: "갤러리 선택 완료",
      description: `${gallery.name} 갤러리가 선택되었습니다.`,
      color: "success",
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 유형 체크
    if (!file.type.includes("image")) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        color: "danger",
      });
      return;
    }
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 크기는 5MB 이하여야 합니다.",
        color: "danger",
      });
      return;
    }
    
    setImageFile(file);
    
    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 브라우저에서 WebP 변환 함수
  async function fileToWebP(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => { resolve(blob); },
          'image/webp',
          0.8 // 압축률(0~1)
        );
      };
      reader.readAsDataURL(file);
    });
  }

  const uploadImage = async () => {
    if (!imageFile) return null;
    try {
      setIsUploading(true);
      const fileName = `${uuidv4()}.webp`;
      const filePath = `exhibition/${fileName}`;
      
      // WebP 변환
      const webpBlob = await fileToWebP(imageFile);
      
      // 1. 메인 이미지 업로드
      const { data, error } = await supabase.storage
        .from("exhibition")
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });
      if (error) throw error;
      
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("exhibition")
        .getPublicUrl(filePath);
      
      // 2. 서버에서 썸네일 생성 (비동기 - 실패해도 메인 업로드는 성공)
      fetch('/api/upload-exhibition-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: publicUrl,
          fileName: filePath
        })
      }).then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log("✅ 전시회 썸네일 자동 생성 완료:", result.thumbnailUrl);
          } else {
            console.warn("썸네일 생성 실패 (메인 이미지는 정상):", result.error);
          }
        })
        .catch(err => {
          console.warn("썸네일 생성 요청 실패 (메인 이미지는 정상):", err);
        });
      
      return publicUrl;
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      addToast({
        title: "이미지 업로드 오류",
        description: error.message,
        color: "danger",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  console.log("exhibition:", exhibition)
  const handleSave = async () => {
    // 편집 모드가 아닌 경우에는 바로 저장 진행
    if (!isEditing && !isNewExhibition) {
      console.log("전시회 저장 시작 - 추가 정보:", editedExhibition.add_info);
      // 이미지가 선택되었다면 업로드부터 진행
      let photoUrl = editedExhibition.photo;
      if (imageFile) {
        setIsUploading(true);
        photoUrl = await uploadImage();
        if (!photoUrl) {
          addToast({
            title: "이미지 업로드 실패",
            description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
            color: "danger",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      
      // 이제 이미지 URL을 포함한 데이터로 업데이트
      try {
        // 기존 전시회 데이터 업데이트
        console.log("업데이트하기");
        
        // naver_gallery_url 처리
        const naver_gallery_url = editedExhibition.naver_gallery_url && typeof editedExhibition.naver_gallery_url === 'object' 
          ? editedExhibition.naver_gallery_url.url || "" 
          : editedExhibition.naver_gallery_url || "";
        
        let payload = {
          name: editedExhibition.name,
          contents: editedExhibition.contents,
          photo: photoUrl, // 새 이미지 URL 사용
          start_date: editedExhibition.start_date,
          end_date: editedExhibition.end_date,
          working_hour: editedExhibition.working_hour,
          off_date: editedExhibition.off_date,
          add_info: editedExhibition.add_info,
          homepage_url: editedExhibition.homepage_url,
          isFree: editedExhibition.isFree,
          isRecommended: editedExhibition.isRecommended,
          review_count: editedExhibition.review_count,
          review_average: editedExhibition.review_average,
          naver_gallery_url: naver_gallery_url,
          price: editedExhibition.price,
          isSale: editedExhibition.isSale,
          pick: editedExhibition.pick,
          // isTestSale: editedExhibition.isTestSale || false,
          // isPreSale: editedExhibition.isPreSale || false,
        };
        if (editedExhibition.isSale) {
          payload.free_ticket_limit = editedExhibition.free_ticket_limit;
        }
        
        const { error } = await supabase
          .from("exhibition")
          .update(payload)
          .eq("id", editedExhibition.id);

        if (error) {
          throw error;
        }

        // 업데이트된 photo URL을 포함하여 전달
        onUpdate({...editedExhibition, photo: photoUrl});

        addToast({
          title: "전시회 저장 완료",
          description: "전시회 정보가 성공적으로 저장되었습니다.",
          color: "success",
        });
        
        // 목록 새로고침 실행
        try {
          if (onRefresh) {
            onRefresh();
          }
        } catch (refreshError) {
          console.error("전시회 목록 새로고침 중 오류 발생:", refreshError);
        }
        
        setRefreshToggle((refreshToggle) => refreshToggle + 1);
        setImageFile(null); // 이미지 파일 초기화
        return;
      } catch (error) {
        console.log("전시회 저장 중 오류 발생:", error);
        addToast({
          title: "전시회 저장 중 오류 발생",
          description: error.message,
          color: "danger",
        });
        setRefreshToggle((refreshToggle) => refreshToggle + 1);
        return;
      }
    }
    
    console.log('editedExhibition', editedExhibition)
    if (!editedExhibition.contents) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시회 제목을 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedExhibition.review_average))) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "평점을 숫자로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    if (isNaN(Number(editedExhibition.review_count))) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "리뷰 수를 숫자로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // naver_gallery_url 유효성 검사 - 객체 또는 문자열 모두 처리
    const naver_gallery_url_value = typeof editedExhibition.naver_gallery_url === 'object' 
      ? (editedExhibition.naver_gallery_url?.url || "") 
      : (editedExhibition.naver_gallery_url || "");
      
    if (naver_gallery_url_value === "") {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "네이버 갤러리 URL을 입력해주세요.",
        color: "danger",
      });
      return;
    }

    // end_date 검증 강화
    if (!editedExhibition.end_date || editedExhibition.end_date==="" || editedExhibition.end_date.trim() === "") {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시종료일을 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // YYYYmmdd 형식 검증
    const dateFormatRegex = /^\d{8}$/;
    if (!dateFormatRegex.test(editedExhibition.end_date)) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시종료일은 YYYYMMDD 형식(예: 20241231)으로 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // 유효한 날짜인지 추가 검증
    const year = parseInt(editedExhibition.end_date.substring(0, 4));
    const month = parseInt(editedExhibition.end_date.substring(4, 6)) - 1; // 0-11
    const day = parseInt(editedExhibition.end_date.substring(6, 8));
    
    const date = new Date(year, month, day);
    if (
      date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day
    ) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "유효하지 않은 날짜입니다. 올바른 날짜를 입력해주세요.",
        color: "danger",
      });
      return;
    }
    
    // start_date도 동일한 형식인지 확인
    if (editedExhibition.start_date && !dateFormatRegex.test(editedExhibition.start_date)) {
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시시작일은 YYYYMMDD 형식(예: 20241231)으로 입력해주세요.",
        color: "danger",
      });
      return;
    }

    try {
      // 이미지가 선택되었다면 업로드
      let photoUrl = editedExhibition.photo;
      if (imageFile) {
        setIsUploading(true);
        photoUrl = await uploadImage();
        if (!photoUrl) {
          addToast({
            title: "이미지 업로드 실패",
            description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
            color: "danger",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      if (isNewExhibition) {
        // Supabase에 새 전시회 데이터 삽입
        console.log("삽입하기");
        
        // naver_gallery_url 처리
        const naver_gallery_url_value = typeof editedExhibition.naver_gallery_url === 'object' 
          ? (editedExhibition.naver_gallery_url?.url || "") 
          : (editedExhibition.naver_gallery_url || "");
        
        let payload = {
          name: editedExhibition.name,
          contents: editedExhibition.contents,
          photo: photoUrl,
          start_date: editedExhibition.start_date,
          end_date: editedExhibition.end_date,
          working_hour: editedExhibition.working_hour,
          off_date: editedExhibition.off_date,
          add_info: editedExhibition.add_info,
          homepage_url: editedExhibition.homepage_url,
          isFree: editedExhibition.isFree || false,
          isRecommended: editedExhibition.isRecommended || false,
          review_count: editedExhibition.review_count,
          review_average: editedExhibition.review_average,
          naver_gallery_url: naver_gallery_url_value,
          price: editedExhibition.price,
          isSale: editedExhibition.isSale || false,
          pick: editedExhibition.pick || false,
          // isTestSale: editedExhibition.isTestSale || false,
          // isPreSale: editedExhibition.isPreSale || false,
        };
        if (editedExhibition.isSale) {
          payload.free_ticket_limit = editedExhibition.free_ticket_limit;
        }
        
        const { data, error } = await supabase
          .from("exhibition")
          .insert([payload])
          .select();

        if (error) {
          throw error;
        }

        // 저장된 데이터 (ID 포함)로 전시회 정보 업데이트
        const newExhibitionWithId = data[0];
        onUpdate(newExhibitionWithId);

      } else {
        // 기존 전시회 데이터 업데이트
        console.log("업데이트하기");
        const { error } = await supabase
          .from("exhibition")
          .update({
            name: editedExhibition.name,
            contents: editedExhibition.contents,
            photo: photoUrl,
            start_date: editedExhibition.start_date,
            end_date: editedExhibition.end_date,
            working_hour: editedExhibition.working_hour,
            off_date: editedExhibition.off_date,
            add_info: editedExhibition.add_info,
            homepage_url: editedExhibition.homepage_url,
            isFree: editedExhibition.isFree || false,
            isRecommended: editedExhibition.isRecommended || false,
            review_count: editedExhibition.review_count,
            review_average: editedExhibition.review_average,
            naver_gallery_url: editedExhibition.naver_gallery_url,
            price: editedExhibition.price,
            isSale: editedExhibition.isSale || false,
            pick: editedExhibition.pick || false,
            // isTestSale: editedExhibition.isTestSale || false,
            // isPreSale: editedExhibition.isPreSale || false,
          })
          .eq("id", editedExhibition.id);

        if (error) {
          throw error;
        }

        onUpdate({...editedExhibition, photo: photoUrl});
      }

      // 저장 후 편집 모드 종료
      setIsEditing(false);
      setImageFile(null);
      setPreviewUrl('');
      setEditedExhibition({
        name: "",
        contents: "",
        photo: "",
        start_date: "",
        end_date: "",
        working_hour: "",
        off_date: "",
        add_info: "",
        homepage_url: "",
        isFree: false,
        isRecommended: false,
        review_count: 0,
        review_average: 0,
        naver_gallery_url:"",
        price:0,
        isSale: false,
        pick: false,
        isTestSale: false,
        isPreSale: false,
        free_ticket_limit: 0,
      });
      // 목록 새로고침 실행
      try {
        if (onRefresh) {
          console.log("전시회 목록 새로고침 함수 호출 시도");
          onRefresh();
          console.log("전시회 목록 새로고침 함수 호출 성공");
        } else {
          console.log("전시회 목록 새로고침 함수가 전달되지 않았습니다");
        }
      } catch (refreshError) {
        console.error("전시회 목록 새로고침 중 오류 발생:", refreshError);
      }

      addToast({
        title: "전시회 저장 완료",
        description: "전시회 정보가 성공적으로 저장되었습니다.",
        color: "success",
      });
      setSelectedKeys(new Set([]));
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
      setSelectedExhibition(null);
    } catch (error) {
      console.log("전시회 저장 중 오류 발생:", error);
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: error.message,
        color: "danger",
      });
      setRefreshToggle((refreshToggle) => refreshToggle + 1);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("exhibition")
      .delete()
      .eq("id", editedExhibition.id);
    if (error) {
      throw error;
    }
    addToast({
      title: "전시회 삭제 완료",
      description: "전시회 정보가 성공적으로 삭제되었습니다.",
      color: "success",
    });
    setSelectedKeys(new Set([]));
    setRefreshToggle((refreshToggle) => refreshToggle + 1);
    setIsEditing(false);
    setImageFile(null);
    setPreviewUrl('');
    setEditedExhibition({
      name: "",
      contents: "",
      photo: "",
      start_date: "",
      end_date: "",
      working_hour: "",
      off_date: "",
      add_info: "",
      homepage_url: "",
      isFree: false,
      isRecommended: false,
      review_count: 0,
      review_average: 0,
      naver_gallery_url:"",
      price:0,
      isSale: false,
      pick: false,
      free_ticket_limit: 0,
    });
    setSelectedExhibition(null);
  };

  const handleCancel = () => {
    if (isNewExhibition) {
      // 신규 등록 취소 시 해당 데이터를 삭제하고 목록으로 돌아감
      setSelectedExhibition(null);
      setSelectedKeys(new Set([]));
    } else {
      // 기존 데이터 편집 취소 시 원래 데이터로 복원
      setEditedExhibition(exhibition);
      setPreviewUrl(exhibition.photo || '');
      setImageFile(null);
      setIsEditing(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async () => {
    if (!editedExhibition.photo) return;
    
    try {
      // URL에서 경로 추출
      const urlParts = editedExhibition.photo.split("/");
      const filePath = urlParts[urlParts.length - 2] + "/" + urlParts[urlParts.length - 1];
      
      // Supabase Storage에서 이미지 삭제
      const { error } = await supabase.storage
        .from("exhibition")
        .remove([filePath]);
        
      if (error) throw error;
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
    }
  };
  
  // 이미지 삭제 버튼 핸들러
  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    setEditedExhibition({ ...editedExhibition, photo: "" });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // QR 코드 다운로드 함수
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = document.createElement("canvas");
    const svgElement = qrRef.current.querySelector("svg");
    const { width, height } = svgElement.getBoundingClientRect();
    
    // 고해상도 캔버스 설정
    const scale = 2; // 2배 크기로 렌더링
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgURL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, width, height);
      
      try {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `exhibition-review-qr-${editedExhibition.id || 'new'}.png`;
        link.href = dataURL;
        link.click();
      } catch (err) {
        console.error("QR 코드 다운로드 중 오류 발생:", err);
        addToast({
          title: "QR 코드 다운로드 오류",
          description: "QR 코드 이미지를 생성하는 중 오류가 발생했습니다.",
          color: "danger",
        });
      }
    };
    
    image.onerror = () => {
      addToast({
        title: "QR 코드 다운로드 오류",
        description: "QR 코드 이미지 변환 중 오류가 발생했습니다.",
        color: "danger",
      });
    };
    
    image.src = svgURL;
  };

  console.log("editedExhibition", editedExhibition);
  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNewExhibition ? "전시회 신규 등록" : "전시회 상세 정보"}
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button color="primary" onPress={handleSave} isDisabled={isUploading}>
                <Icon icon="lucide:save" className="text-lg mr-1" />
                {isNewExhibition ? "등록" : "저장"}
                {isUploading && " (업로드 중...)"}
              </Button>
              <Button variant="flat" onPress={handleCancel} isDisabled={isUploading}>
                <Icon icon="lucide:x" className="text-lg mr-1" />
                취소
              </Button>
            </>
          ) : (
            <>
              <Button
                color="primary"
                variant="flat"
                onPress={handleSave}
              >
                <Icon icon="lucide:save" className="text-lg mr-1" />
                저장
              </Button>
              <Button color="danger" variant="flat" onPress={handleDelete}>
                <Icon icon="lucide:trash" className="text-lg mr-1" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* 필수 필드 - 전시회 제목 */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
            전시회 제목
          </label>
          <Input
            value={editedExhibition.contents||""}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, contents: value })
            }
            placeholder="전시회 제목을 입력하세요"
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-red-300 hover:border-red-400 focus-within:border-red-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        {/* 전시회 아이디 - 숨김 처리 */}
        <div className="col-span-2 md:col-span-1 hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전시회 아이디
          </label>
          <Input
            value={editedExhibition.id||""}
            isDisabled={true}
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-gray-100 text-base",
              inputWrapper: "border-2 border-gray-300 bg-gray-100"
            }}
          />
        </div>
        
        {/* 썸네일 이미지 업로드 컴포넌트 */}
        <div className="space-y-2 col-span-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">전시회 이미지</label>
            {previewUrl && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={handleRemoveImage}
                isDisabled={isUploading}
                className="col-span-2 md:col-span-1"
              >
                <Icon icon="lucide:trash-2" className="text-sm mr-1" />
                이미지 삭제
              </Button>
            )}
          </div>
          
          <div className="flex items-start space-x-4">
            {/* 이미지 미리보기 영역 */}
            <div className="w-36 h-36 border border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover col-span-2 md:col-span-1"
                />
              ) : (
                <div className="text-gray-400 text-center p-2">
                  <Icon icon="lucide:image" className="text-3xl mx-auto mb-1" />
                  <p className="text-xs">이미지 없음</p>
                </div>
              )}
            </div>
            
            {/* 업로드 영역 */}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden col-span-2 md:col-span-1"
                id="thumbnail-upload"
                disabled={isUploading}
              />
              
              <Button
                className="w-full col-span-2 md:col-span-1"
                color="primary"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
                isDisabled={isUploading}
              >
                <Icon icon="lucide:upload" className="text-lg mr-1" />
                {isUploading ? "업로드 중..." : "이미지 선택"}
              </Button>
              
              <p className="text-xs text-gray-500">
                5MB 이하의 이미지 파일을 선택해주세요. (JPG, PNG, GIF)
              </p>
              
              {/* 외부 URL 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  또는 이미지 URL 직접 입력
                </label>
                <Input
                  value={!imageFile ? editedExhibition.photo || "" : ""}
                  onValueChange={(value) => {
                    if (!imageFile) {
                      setEditedExhibition({ ...editedExhibition, photo: value });
                      setPreviewUrl(value);
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  isDisabled={!!imageFile || isUploading}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "bg-white text-base",
                    inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 전시시작/종료 달력 UI - 신규 등록 모드일 때 갤러리와 동일하게 */}
        {isNewExhibition ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
                  전시 시작일
                </label>
                <DatePicker
                  locale={ko}
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      setEditedExhibition({ ...editedExhibition, start_date: `${year}${month}${day}` });
                    }
                  }}
                  dateFormat="yyyy.MM.dd"
                  customInput={
                    <div className="relative">
                      <input
                        className="w-full pl-3 pr-10 py-3 rounded-lg border-2 border-red-300 hover:border-red-400 focus:border-red-500 focus:outline-none cursor-pointer text-base bg-white shadow-sm"
                        value={
                          editedExhibition.start_date
                            ? `${editedExhibition.start_date.slice(0,4)}.${editedExhibition.start_date.slice(4,6)}.${editedExhibition.start_date.slice(6,8)}`
                            : ""
                        }
                        readOnly
                        placeholder="YYYY.MM.DD"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                      </div>
                    </div>
                  }
                  popperClassName="react-datepicker-popper z-50"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
                  전시 종료일
                </label>
                <DatePicker
                  locale={ko}
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      setEditedExhibition({ ...editedExhibition, end_date: `${year}${month}${day}` });
                    }
                  }}
                  dateFormat="yyyy.MM.dd"
                  customInput={
                    <div className="relative">
                      <input
                        className="w-full pl-3 pr-10 py-3 rounded-lg border-2 border-red-300 hover:border-red-400 focus:border-red-500 focus:outline-none cursor-pointer text-base bg-white shadow-sm"
                        value={
                          editedExhibition.end_date
                            ? `${editedExhibition.end_date.slice(0,4)}.${editedExhibition.end_date.slice(4,6)}.${editedExhibition.end_date.slice(6,8)}`
                            : ""
                        }
                        readOnly
                        placeholder="YYYY.MM.DD"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                      </div>
                    </div>
                  }
                  popperClassName="react-datepicker-popper z-50"
                />
              </div>
            </div>
          </>
        ) : (
          // 기존 전시회 수정 모드
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
                전시 시작일
              </label>
              <DatePicker
                locale={ko}
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setEditedExhibition({ ...editedExhibition, start_date: `${year}${month}${day}` });
                  }
                }}
                dateFormat="yyyy.MM.dd"
                customInput={
                  <div className="relative">
                    <input
                      className="w-full pl-3 pr-10 py-3 rounded-lg border-2 border-red-300 hover:border-red-400 focus:border-red-500 focus:outline-none cursor-pointer text-base bg-white shadow-sm"
                      value={
                        editedExhibition.start_date
                          ? `${editedExhibition.start_date.slice(0,4)}.${editedExhibition.start_date.slice(4,6)}.${editedExhibition.start_date.slice(6,8)}`
                          : ""
                      }
                      readOnly
                      placeholder="YYYY.MM.DD"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper z-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
                전시 종료일
              </label>
              <DatePicker
                locale={ko}
                selected={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setEditedExhibition({ ...editedExhibition, end_date: `${year}${month}${day}` });
                  }
                }}
                dateFormat="yyyy.MM.dd"
                customInput={
                  <div className="relative">
                    <input
                      className="w-full pl-3 pr-10 py-3 rounded-lg border-2 border-red-300 hover:border-red-400 focus:border-red-500 focus:outline-none cursor-pointer text-base bg-white shadow-sm"
                      value={
                        editedExhibition.end_date
                          ? `${editedExhibition.end_date.slice(0,4)}.${editedExhibition.end_date.slice(4,6)}.${editedExhibition.end_date.slice(6,8)}`
                          : ""
                      }
                      readOnly
                      placeholder="YYYY.MM.DD"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Icon icon="lucide:calendar" className="text-gray-500 text-xl" />
                    </div>
                  </div>
                }
                popperClassName="react-datepicker-popper z-50"
              />
            </div>
          </div>
        )}

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">운영 시간</label>
          <Input
            value={editedExhibition.working_hour || ""}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, working_hour: value })
            }
            placeholder="예: 10:00 - 18:00"
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">휴무일</label>
          <Input
            value={editedExhibition.off_date || ""}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, off_date: value })
            }
            placeholder="예: 매주 월요일"
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">홈페이지 URL</label>
          <Input
            value={editedExhibition.homepage_url || ""}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, homepage_url: value })
            }
            placeholder="https://example.com"
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 수</label>
          <Input
            value={editedExhibition.review_count||0}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, review_count: value })
            }
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">평균 평점</label>
          <Input
            value={editedExhibition.review_average||0}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, review_average: value })
            }
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>
        
        <div className="col-span-2 md:col-span-1 space-y-2">
          <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">필수</span>
            네이버 갤러리 URL
          </label>
          <div className="flex items-end gap-2">
            <Input
              value={editedExhibition.naver_gallery_url && typeof editedExhibition.naver_gallery_url === 'object' ? editedExhibition.naver_gallery_url.url || "" : editedExhibition.naver_gallery_url || ""}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, naver_gallery_url: value })
              }
              className="flex-1"
              isDisabled={!isEditing}
              placeholder="갤러리를 검색하거나 URL을 직접 입력하세요"
              variant="bordered"
              size="lg"
              classNames={{
                input: "bg-white text-base",
                inputWrapper: "border-2 border-red-300 hover:border-red-400 focus-within:border-red-500 bg-white shadow-sm"
              }}
            />
            {isEditing && (
              <Button
                color="primary"
                variant="flat"
                onPress={() => setIsGallerySearchOpen(true)}
                startContent={<Icon icon="mdi:magnify" />}
                className="h-12"
              >
                갤러리 검색
              </Button>
            )}
          </div>
          {selectedGallery && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              선택된 갤러리: <strong>{selectedGallery.name}</strong> ({selectedGallery.address})
            </div>
          )}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">가격</label>
          <Input
            value={editedExhibition.price || ""}
            onValueChange={(value) =>
              setEditedExhibition({ ...editedExhibition, price: value })
            }
            placeholder="예: 15,000원"
            variant="bordered"
            size="lg"
            classNames={{
              input: "bg-white text-base",
              inputWrapper: "border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white shadow-sm"
            }}
          />
        </div>

        {/* 추가 정보 섹션 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">추가 정보</label>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <RichTextEditor
              contents={editedExhibition.add_info}
              setContents={(value) => {
                setEditedExhibition({ ...editedExhibition, add_info: value });
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* 전시회 옵션 섹션 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-4">전시회 옵션</label>
          <div className="space-y-4 bg-white p-4 rounded-lg border-2 border-gray-200">
            {/* 무료 전시회 */}
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={editedExhibition.isFree || false}
                onChange={(e) =>
                  setEditedExhibition({ ...editedExhibition, isFree: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900 font-medium">무료 전시회</span>
            </label>
            
            {/* 추천 전시회 */}
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={editedExhibition.isRecommended || false}
                onChange={(e) =>
                  setEditedExhibition({ ...editedExhibition, isRecommended: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900 font-medium">추천 전시회로 표시</span>
            </label>
            
            {/* 아트앤브릿지 */}
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={editedExhibition.pick || false}
                onChange={(e) =>
                  setEditedExhibition({ ...editedExhibition, pick: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900 font-medium">아트앤브릿지</span>
            </label>
            
            {/* 티켓 판매 */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={editedExhibition.isSale || false}
                  onChange={(e) =>
                    setEditedExhibition({
                      ...editedExhibition,
                      isSale: e.target.checked,
                      free_ticket_limit:
                        e.target.checked && (editedExhibition.free_ticket_limit === undefined || editedExhibition.free_ticket_limit === '' || isNaN(Number(editedExhibition.free_ticket_limit)))
                          ? 0
                          : editedExhibition.free_ticket_limit,
                    })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-900 font-medium">티켓판매로 표시</span>
              </label>
              
              {/* 티켓 수량 입력 */}
              {editedExhibition.isSale && (
                <div className="ml-7 mt-2">
                  <label className="block text-sm text-gray-600 mb-1">무료 티켓 수량</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editedExhibition.free_ticket_limit ?? 0}
                    onChange={(e) => setEditedExhibition({ ...editedExhibition, free_ticket_limit: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="티켓수량 (예: 100)"
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
            {/* <Checkbox
              id="isTestSale"
              isSelected={editedExhibition.isTestSale || false}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, isTestSale: value })
              }
            >
              테스트 티켓판매
            </Checkbox>
            <Checkbox
              id="isPreSale"
              isSelected={editedExhibition.isPreSale || false}
              onValueChange={(value) =>
                setEditedExhibition({ ...editedExhibition, isPreSale: value })
              }
            >
              사전티켓예매
            </Checkbox> */}
        </div>

        {/* QR 코드 섹션 - 편집 모드가 아닌 경우에만 표시 */}
        {!isNewExhibition && !isEditing && (
          <div className="flex flex-col items-center gap-5 col-span-2 border border-gray-200 p-6 rounded-lg mt-6 bg-gradient-to-b from-gray-50 to-white shadow-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">리뷰 페이지 QR 코드</h3>
              <p className="text-sm text-gray-600">
                아래 QR 코드를 스캔하면 전시회 리뷰 페이지로 이동합니다
              </p>
            </div>
            
            <div ref={qrRef} className="bg-white p-5 rounded-lg shadow border border-gray-100">
              {qrValue && (
                <QRCodeSVG 
                  value={qrValue} 
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            
            <div className="text-center space-y-3 w-full max-w-md">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="font-medium text-gray-700 mb-1">리뷰 페이지 URL:</p>
                <p className="text-sm text-gray-600 break-all font-mono">
                  {qrValue || "QR 코드 URL을 확인할 수 없습니다."}
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  color="primary" 
                  onPress={downloadQRCode}
                  isDisabled={!qrValue}
                  className="px-6"
                >
                  <Icon icon="lucide:download" className="text-lg mr-2" />
                  QR 코드 다운로드
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                전시회 안내판이나 홍보 자료에 이 QR 코드를 사용하여 방문객들이 쉽게 리뷰를 작성할 수 있도록 하세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 갤러리 검색 모달 */}
      <GallerySearchModal
        isOpen={isGallerySearchOpen}
        onClose={() => setIsGallerySearchOpen(false)}
        onSelectGallery={handleGallerySelect}
      />
    </div>
  );
}
