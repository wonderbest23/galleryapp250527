"use client";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiImage, FiVideo } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import JournalistEditor from "./components/JournalistEditor";
import VideoUploader from "./components/VideoUploader";

export default function WritePostPage() {
  const router = useRouter();
  const supabase = createClient();
  const [category, setCategory] = useState("자유");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // 투표 관련 상태
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // 기자단 관련 상태
  const [isJournalist, setIsJournalist] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const categories = ["자유", "토론", "전시회", "작품", "기자단"];
  const currentPoints = 20;

  // 기자단 승인 상태 확인
  useEffect(() => {
    const checkJournalistStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_journalist_approved")
            .eq("id", user.id)
            .single();
          
          if (profile) {
            setIsJournalist(profile.is_journalist_approved);
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error("기자단 상태 확인 오류:", error);
      }
    };

    checkJournalistStatus();
  }, [supabase]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const handleVideoSelect = (file) => {
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    // 숏폼은 이미지와 함께 올릴 수 없음
    setSelectedImages([]);
  };

  const handleVideoRemove = () => {
    setSelectedVideo(null);
    setVideoPreview("");
  };


  // 투표 선택지 추가
  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  // 투표 선택지 제거
  const removePollOption = (index) => {
    if (pollOptions.length <= 2) {
      alert("최소 2개의 선택지가 필요합니다.");
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // 투표 선택지 업데이트
  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // 토론 카테고리일 때 투표 유효성 검사
    if (category === "토론") {
      if (!pollQuestion.trim()) {
        alert("투표 질문을 입력해주세요.");
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert("최소 2개의 선택지를 입력해주세요.");
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      let videoUrl = null;

      // 비디오 업로드 (숏폼인 경우)
      if (selectedVideo) {
        const fileExt = selectedVideo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `community-videos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("community-videos")
          .upload(filePath, selectedVideo);

        if (uploadError) {
          console.log("비디오 업로드 오류:", uploadError);
          alert("비디오 업로드에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("community-videos")
          .getPublicUrl(filePath);

        videoUrl = publicUrl;
      }

      // 이미지 업로드
      let imageUrl = null;
      if (selectedImages.length > 0 && !selectedVideo) {
        const file = selectedImages[0]; // 첫 번째 이미지만 업로드
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `community-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("community-images")
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("community-images")
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        } else {
          console.log("이미지 업로드 오류:", uploadError);
          alert("이미지 업로드에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }
      }

      // 게시글 데이터베이스에 저장
      const categoryMap = {
        "자유": "free",
        "토론": "토론",
        "전시회": "exhibition",
        "작품": "artwork",
        "숏폼": "short_video"
      };

      const { data, error } = await supabase
        .from('community_post')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            category: categoryMap[category] || "free",
            user_id: user.id,
            image_url: imageUrl,
            video_url: videoUrl
          }
        ])
        .select()
        .single();

      if (error) {
        console.log("Error creating post:", error);
        alert("게시글 등록에 실패했습니다. 권한 또는 네트워크 문제일 수 있습니다.");
        setIsSubmitting(false);
        return;
      }

      // 토론 카테고리일 때 투표 생성
      if (category === "토론" && data) {
        const validOptions = pollOptions.filter(opt => opt.trim());
        const { error: pollError } = await supabase
          .from("community_polls")
          .insert({
            post_id: data.id,
            question: pollQuestion.trim(),
            options: validOptions
          });

        if (pollError) {
          console.log("Error creating poll:", pollError);
          // 투표 생성 실패해도 게시글은 유지
        }
      }

      // 포인트 지급 (10P)
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ points: (profile.points || 0) + 10 })
          .eq("id", user.id);
      }

      console.log("Post created successfully:", data);
      alert("게시글이 등록되었습니다! 10P가 지급되었습니다.");
      router.push("/community");
      
    } catch (error) {
      console.log("Error:", error);
      alert("게시글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/community" className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">게시글 작성</h1>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSubmitting 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-3">카테고리</label>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors"
          >
            <span className="text-gray-900">{category}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {/* 드롭다운 메뉴 */}
          {showCategoryDropdown && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-gray-900">{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 기자단 에디터 또는 일반 에디터 */}
      {category === "기자단" && isJournalist ? (
        <div className="bg-white">
          <div className="px-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">✍️</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">기자단 전용 에디터</h3>
                  <p className="text-xs text-blue-600">전문적인 기사 작성 도구를 사용하세요</p>
                </div>
              </div>
            </div>
            <JournalistEditor
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              category={category}
            />
          </div>
        </div>
      ) : category === "기자단" && !isJournalist ? (
        <div className="bg-white">
          <div className="px-4 py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">기자단 전용 카테고리</h3>
              <p className="text-gray-600 mb-4">기자단으로 승인된 사용자만 작성할 수 있습니다.</p>
              <Link 
                href="/journalist-application"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                기자단 신청하기
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 제목 입력 */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">제목</label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* 내용 입력 */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">내용</label>
              <textarea
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
              />
            </div>
          </div>
        </>
      )}

      {/* 투표 만들기 (토론 카테고리일 때만) */}
      {category === "토론" && (
        <div className="bg-blue-50 border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
              <h3 className="font-bold text-blue-800">투표 만들기 (선택사항)</h3>
            </div>

            {/* 투표 질문 */}
            <input
              type="text"
              placeholder="투표 질문을 입력하세요 (예: 어떤 장르를 더 좋아하시나요?)"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
            />

            {/* 선택지 */}
            <div className="space-y-2 mb-3">
              <label className="text-sm font-medium text-blue-800">선택지</label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`선택지 ${index + 1}`}
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 선택지 추가 버튼 */}
            <button
              type="button"
              onClick={addPollOption}
              className="w-full py-2 border border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span className="text-sm font-medium">선택지 추가</span>
            </button>
          </div>
        </div>
      )}

      {/* 사진/동영상 업로드 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">미디어 첨부</label>
          
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
              selectedVideo !== null 
                ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-blue-300 bg-blue-50 text-blue-600 hover:border-blue-400 hover:bg-blue-100'
            }`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={selectedVideo !== null}
              />
              <FiImage className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">사진 업로드</span>
              <span className="text-xs text-gray-500 mt-1">여러 장 선택 가능</span>
            </label>
            
            {category === "숏폼" ? (
              <VideoUploader
                onVideoSelect={handleVideoSelect}
                onVideoRemove={handleVideoRemove}
                selectedVideo={selectedVideo}
                videoPreview={videoPreview}
              />
            ) : (
              <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                selectedImages.length > 0 
                  ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-purple-300 bg-purple-50 text-purple-600 hover:border-purple-400 hover:bg-purple-100'
              }`}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleVideoSelect(file);
                  }}
                  className="hidden"
                  disabled={selectedImages.length > 0}
                />
                <FiVideo className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">동영상 업로드</span>
                <span className="text-xs text-gray-500 mt-1">최대 100MB</span>
              </label>
            )}
          </div>
          
          {/* 안내 메시지 */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>안내:</strong> 사진과 동영상은 함께 업로드할 수 없습니다. 
              {selectedVideo !== null ? ' 동영상이 선택되어 사진 업로드가 비활성화되었습니다.' : ''}
              {selectedImages.length > 0 ? ' 사진이 선택되어 동영상 업로드가 비활성화되었습니다.' : ''}
            </p>
          </div>
          
          {/* 선택된 이미지 미리보기 */}
          {selectedImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">선택된 사진 ({selectedImages.length}장)</h4>
                <button
                  onClick={() => setSelectedImages([])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  전체 삭제
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 선택된 비디오 미리보기 (숏폼이 아닌 경우) */}
          {selectedVideo && category !== "숏폼" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">선택된 동영상</h4>
                <button
                  onClick={handleVideoRemove}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  삭제
                </button>
              </div>
              <div className="relative">
                <video
                  src={videoPreview}
                  className="w-full max-h-64 rounded-lg bg-black border border-gray-200"
                  controls
                />
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>파일명: {selectedVideo.name}</span>
                  <span>크기: {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 포인트 획득 안내 */}
      <div className="bg-white">
        <div className="px-4 py-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🎉</span>
              <h3 className="text-lg font-bold text-green-800">포인트 획득 안내</h3>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• 게시글 작성: 10P</li>
              <li>• 등급별 추가 포인트</li>
              <li className="ml-4 text-xs">- 브론즈: +0P (기본)</li>
              <li className="ml-4 text-xs">- 실버: +5P (리뷰 4개 + 게시글 4개)</li>
              <li className="ml-4 text-xs">- 골드: +10P (리뷰 50개 + 게시글 50개)</li>
              <li className="ml-4 text-xs">- 플래티넘: +15P (리뷰 100개 + 게시글 100개)</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm font-medium text-green-800">
                현재 포인트: {currentPoints}P
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}