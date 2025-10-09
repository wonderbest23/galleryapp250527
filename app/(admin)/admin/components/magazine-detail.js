"use client";

import React from "react";
import { Input, Button, Textarea, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import Froala from "./Froala";

export function MagazineDetail({
  magazine,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedMagazine,
  setSelectedMagazine,
  onDelete,
  
}) {
  // 매거진 ID가 없으면 신규 등록 모드로 간주
  const isNewMagazine = !magazine.id;
  const [isEditing, setIsEditing] = React.useState(isNewMagazine);
  const [editedMagazine, setEditedMagazine] = React.useState({
    ...magazine,
    subtitle: magazine.subtitle || "",
    photos: magazine.photos || magazine.photo || [{ url: "" }],
    contents: magazine.contents || "",
    created_at: magazine.created_at || "",
  });
  const [imageUploading, setImageUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [content, setContent] = useState(magazine.contents || '');
  const [froalaLoaded, setFroalaLoaded] = useState(false);

  console.log("Froala 에디터 로딩 상태:", froalaLoaded);

  const handleEditorChange = (model) => {
    setContent(model);
    // 편집된 내용을 매거진 데이터에도 반영
    setEditedMagazine({
      ...editedMagazine,
      contents: model
    });
  };
  // 이전 매거진 ID를 저장하는 ref
  const prevMagazineIdRef = React.useRef(null);
  const supabase = createClient();

  useEffect(() => {
    // magazine 객체가 변경되면 항상 데이터 업데이트
    setEditedMagazine({
      ...magazine,
      subtitle: magazine.subtitle || "",
      // photo와 photos 모두 확인하여 처리 (데이터베이스에는 photo로 저장되므로)
      photos: magazine.photos || magazine.photo || [{ url: "" }],
      contents: magazine.contents || "",
      created_at: magazine.created_at || "",
    });

    // Froala 에디터 내용도 함께 업데이트
    setContent(magazine.contents || "");
    
    // 매거진이 변경되면 Froala 로딩 상태 초기화
    setFroalaLoaded(false);
    
    console.log('매거진 변경: ', magazine.id, '내용 길이: ', (magazine.contents || "").length);

    // 새 매거진이거나 기존 매거진이든 항상 편집 모드로 설정
    setIsEditing(true);

    // 이전 매거진 ID 업데이트
    prevMagazineIdRef.current = magazine.id;
  }, [magazine]);

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

  const uploadImageToSupabase = async (file) => {
    try {
      setImageUploading(true);
      setUploadProgress(0);
      // WebP 변환
      const webpBlob = await fileToWebP(file);
      const fileName = `${uuidv4()}.webp`;
      const filePath = `magazine/${fileName}`;
      
      // 1. 메인 이미지 업로드
      const { data, error } = await supabase.storage
        .from('magazine')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });
      if (error) {
        throw error;
      }
      
      // 업로드된 이미지의 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('magazine')
        .getPublicUrl(filePath);
      
      // 2. 서버에서 썸네일 생성 (비동기 - 실패해도 메인 업로드는 성공)
      fetch('/api/upload-magazine-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: publicUrlData.publicUrl,
          fileName: filePath
        })
      }).then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log("✅ 매거진 썸네일 자동 생성 완료:", result.thumbnailUrl);
          } else {
            console.warn("썸네일 생성 실패 (메인 이미지는 정상):", result.error);
          }
        })
        .catch(err => {
          console.warn("썸네일 생성 요청 실패 (메인 이미지는 정상):", err);
        });
      
      setImageUploading(false);
      return publicUrlData.publicUrl;
    } catch (error) {
      setImageUploading(false);
      console.error('이미지 업로드 중 오류 발생:', error);
      addToast({
        title: '업로드 오류',
        description: '이미지 업로드 중 오류가 발생했습니다: ' + error.message,
        type: 'error',
      });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      // 필수 입력값 검증
      if (!editedMagazine.title.trim()) {
        addToast({
          title: "입력 오류",
          description: "제목은 필수 입력 항목입니다.",
          type: "error",
        });
        return;
      }

      // 빈 URL을 가진 이미지 항목 제거
      const filteredPhotos = editedMagazine.photos.filter(photo => photo.url.trim() !== "");
      
      // 새 매거진 등록
      if (isNewMagazine) {
        console.log("신규 등록하기");
        const { data, error } = await supabase.from("magazine").insert([
          {
            title: editedMagazine.title,
            subtitle: editedMagazine.subtitle || "",
            contents: editedMagazine.contents || "",
            photo: filteredPhotos.length > 0 ? filteredPhotos : null,
            created_at: editedMagazine.created_at || null,
          },
        ]).select();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // 성공적으로 등록된 데이터로 UI 업데이트
          onUpdate(data[0]);
          addToast({
            title: "등록 완료",
            description: "새 매거진이 등록되었습니다.",
            color: "success",
          });
          setSelectedMagazine(null);
          // Froala 에디터 내용 초기화
          setContent('');
        }
      } else {
        // 기존 매거진 데이터 업데이트
        console.log("업데이트하기");
        const { error } = await supabase
          .from("magazine")
          .update({
            title: editedMagazine.title,
            subtitle: editedMagazine.subtitle || "",
            contents: editedMagazine.contents,
            photo: filteredPhotos.length > 0 ? filteredPhotos : null,
            created_at: editedMagazine.created_at || null,
          })
          .eq("id", editedMagazine.id);

        if (error) {
          throw error;
        }

        onUpdate({
          ...editedMagazine,
          photos: filteredPhotos.length > 0 ? filteredPhotos : null,
          thumbnail: filteredPhotos.length > 0 ? filteredPhotos[0].url : "",
        });
        addToast({
          title: "업데이트 완료",
          description: "매거진 정보가 업데이트되었습니다.",
          color: "success",
        });
        setSelectedMagazine(null);
        // Froala 에디터 내용 초기화
        setContent('');
      }

      // 저장 후 편집 모드 종료
      setIsEditing(false);
      
      // 목록 새로고침 실행
      try {
        if (onRefresh) {
          console.log("매거진 목록 새로고침 함수 호출 시도");
          onRefresh();
          console.log("매거진 목록 새로고침 함수 호출 성공");
        } else {
          console.log("매거진 목록 새로고침 함수가 전달되지 않았습니다");
        }
      } catch (refreshError) {
        console.error("매거진 목록 새로고침 중 오류 발생:", refreshError);
      }
    } catch (error) {
      console.error("매거진 저장 중 오류 발생:", error);
      addToast({
        title: "저장 오류",
        description: "매거진 저장 중 오류가 발생했습니다: " + error.message,
        color: "danger",
      });
    }
  };

  const handleDelete = async () => {


    try {
      const { error } = await supabase
        .from("magazine")
        .delete()
        .eq("id", magazine.id);

      if (error) {
        throw error;
      }

      addToast({
        title: "삭제 완료",
        description: "매거진이 삭제되었습니다.",
        color: "success",
      });

      // 상태 초기화 및 목록 새로고침
      onDelete();
      
    } catch (error) {
      console.error("매거진 삭제 중 오류 발생:", error);
      addToast({
        title: "삭제 오류",
        description: "매거진 삭제 중 오류가 발생했습니다: " + error.message,
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    if (isNewMagazine) {
      // 신규 등록 취소 시 목록으로 돌아가기
      onDelete();
      // Froala 에디터 내용 초기화
      setContent('');
    } else {
      // 기존 매거진 수정 취소 시 선택 해제하고 목록으로 돌아가기
      setEditedMagazine({
        ...magazine,
        subtitle: magazine.subtitle || "",
        photos: magazine.photos || magazine.photo || [{ url: "" }],
        contents: magazine.contents || "",
      });
      
      // Froala 에디터 내용 원래 값으로 복원
      setContent(magazine.contents || "");
      
      // 선택된 매거진 초기화
      if (typeof setSelectedMagazine === 'function') {
        setSelectedMagazine(null);
      }
      
      // 선택된 키 초기화
      if (typeof setSelectedKeys === 'function') {
        setSelectedKeys(new Set([]));
      }
    }
  };

  const handleImageChange = async (e, index) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let updatedPhotos = [...editedMagazine.photos];
    let insertPos = index;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = await uploadImageToSupabase(file);
      if (imageUrl) {
        // 비어있는 칸 찾기
        while (insertPos < updatedPhotos.length && updatedPhotos[insertPos]?.url) {
          insertPos++;
        }
        if (insertPos < updatedPhotos.length) {
          updatedPhotos[insertPos] = { url: imageUrl };
        } else {
          updatedPhotos.push({ url: imageUrl });
        }
        insertPos++;
      }
    }

    setEditedMagazine({
      ...editedMagazine,
      photos: updatedPhotos,
    });
  };

  const addImageField = () => {
    setEditedMagazine({
      ...editedMagazine,
      photos: [...editedMagazine.photos, { url: "" }],
    });
  };

  const removeImageField = (index) => {
    if (editedMagazine.photos.length <= 1) {
      setEditedMagazine({
        ...editedMagazine,
        photos: [{ url: "" }],
      });
    } else {
      const updatedPhotos = editedMagazine.photos.filter((_, i) => i !== index);
      setEditedMagazine({
        ...editedMagazine,
        photos: updatedPhotos,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isNewMagazine ? "새 매거진 등록" : "매거진 상세 정보"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isNewMagazine ? "새로운 매거진을 등록하세요" : "매거진 정보를 확인하고 편집하세요"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            color="primary" 
            onPress={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
            {isNewMagazine ? "등록하기" : "저장하기"}
          </Button>
          {!isNewMagazine && (
            <Button 
              color="danger" 
              variant="solid" 
              onPress={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Icon icon="lucide:trash" className="w-4 h-4 mr-2" />
              삭제
            </Button>
          )}
          <Button 
            variant="bordered" 
            onPress={handleCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
            취소
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon icon="lucide:info" className="w-5 h-5 mr-2 text-blue-600" />
          기본 정보
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <Input
              value={editedMagazine.title || ''}
              onValueChange={(value) => setEditedMagazine({...editedMagazine, title: value})}
              placeholder="매거진 제목을 입력하세요"
              variant="bordered"
              size="lg"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부제목
            </label>
            <Input
              value={editedMagazine.subtitle || ''}
              onValueChange={(value) => setEditedMagazine({...editedMagazine, subtitle: value})}
              placeholder="매거진 부제목을 입력하세요"
              variant="bordered"
              size="lg"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              작성일
            </label>
            <Input
              type="datetime-local"
              value={editedMagazine.created_at ? editedMagazine.created_at.slice(0, 16) : ""}
              onValueChange={value => setEditedMagazine({ ...editedMagazine, created_at: value })}
              variant="bordered"
              size="lg"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon icon="lucide:image" className="w-5 h-5 mr-2 text-green-600" />
          이미지 관리
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 대표 이미지 */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <h4 className="text-center font-medium mb-3 text-gray-700">대표 이미지</h4>
              <div className="relative w-full">
                {editedMagazine.photos && editedMagazine.photos.length > 0 && editedMagazine.photos[0].url ? (
                  <div className="relative group">
                    <img 
                      src={editedMagazine.photos[0].url} 
                      alt="대표 이미지" 
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                      <Icon icon="lucide:eye" className="text-white text-xl opacity-0 group-hover:opacity-100" />
                    </div>
                    {isEditing && (
                      <Button
                        isIconOnly
                        color="danger"
                        variant="solid"
                        size="sm"
                        className="absolute top-2 right-2"
                        onPress={() => removeImageField(0)}
                      >
                        <Icon icon="lucide:x" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isEditing && (
                      <input
                        type="file"
                        id="thumbnail-upload"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 0)}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    )}
                    <label 
                      htmlFor={isEditing ? "thumbnail-upload" : ''}
                      className={`${isEditing ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                        <Icon icon="lucide:upload" className="text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center">대표 이미지 업로드</p>
                        {isEditing && imageUploading && (
                          <div className="mt-2 flex items-center text-xs text-blue-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
                            업로드 중...
                          </div>
                        )}
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* 추가 이미지 갤러리 */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <h4 className="text-center font-medium mb-3 text-gray-700">추가 이미지</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {editedMagazine.photos.slice(1).map((photo, index) => (
                  <div key={index + 1} className="relative">
                    {photo.url ? (
                      <div className="group relative">
                        <img 
                          src={photo.url} 
                          alt={`매거진 이미지 ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-md cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-md flex items-center justify-center">
                          <Icon icon="lucide:eye" className="text-white text-lg opacity-0 group-hover:opacity-100" />
                        </div>
                        {isEditing && (
                          <Button
                            isIconOnly
                            color="danger"
                            variant="solid"
                            size="sm"
                            className="absolute top-1 right-1"
                            onPress={() => removeImageField(index + 1)}
                          >
                            <Icon icon="lucide:x" className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {isEditing && (
                          <input
                            type="file"
                            id={`photo-upload-${index + 1}`}
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageChange(e, index + 1)}
                            className="hidden"
                            disabled={imageUploading}
                          />
                        )}
                        <label 
                          htmlFor={isEditing ? `photo-upload-${index + 1}` : ''}
                          className="cursor-pointer w-full h-full"
                        >
                          <div className="flex flex-col items-center justify-center h-24 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                            <Icon icon="lucide:upload" className="text-xl text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">업로드</span>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                ))}

                {/* 이미지 추가 버튼 */}
                {isEditing && (
                  <div 
                    className="flex items-center justify-center h-24 bg-gray-100 rounded-md cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors" 
                    onClick={addImageField}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Icon icon="lucide:plus" className="text-2xl text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">추가</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 업로드 진행 상태 */}
        {imageUploading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">이미지 업로드 중...</span>
              <span className="text-sm text-blue-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Content Editor Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon icon="lucide:edit" className="w-5 h-5 mr-2 text-purple-600" />
          콘텐츠 작성
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              매거진의 상세 내용을 작성하세요. 이미지, 링크, 서식 등을 포함할 수 있습니다.
            </p>
          </div>
          <div className="p-4">
            <Froala 
              value={content} 
              onChange={handleEditorChange}
              bucketName="magazine"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 