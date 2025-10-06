"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Spinner } from "@heroui/react";
import { FaArrowLeft, FaCamera, FaUser, FaCheck } from "react-icons/fa";
import ArtistInfoPopup from "./components/ArtistInfoPopup";

export default function MySettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [file, setFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showArtistInfo, setShowArtistInfo] = useState(false);
  const [refreshProfile, setRefreshProfile] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/mypage");
          return;
        }
        setUserId(user.id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
        setFullName(profileData?.full_name || "");
        setAvatarUrl(profileData?.avatar_url || "");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshProfile]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setAvatarUrl(url);
    }
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      let uploadedUrl = avatarUrl;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `avatars/${userId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("public").upload(path, file, { upsert: true });
        if (upErr) {
          console.log("업로드 오류", upErr);
        } else {
          const { data: pub } = supabase.storage.from("public").getPublicUrl(path);
          uploadedUrl = pub.publicUrl;
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: uploadedUrl })
        .eq("id", userId);
      if (error) {
        console.log("프로필 저장 오류", error);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/mypage/success");
        }, 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleArtistInfoUpdate = () => {
    setRefreshProfile(prev => !prev);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600 mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">저장 완료!</h2>
          <p className="text-gray-600">프로필이 성공적으로 업데이트되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-lg font-bold text-black">프로필 수정</h1>
        <div className="w-9" />
      </div>

      <div className="p-6 space-y-8">
        {/* 프로필 이미지 섹션 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-green-100 border border-gray-200 flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-black text-3xl font-medium">아트</span>
              )}
            </div>
            <button
              onClick={() => document.getElementById('avatar-upload').click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
            >
              <FaCamera className="text-white text-sm" />
            </button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        </div>

        {/* 이름 설정 섹션 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">이름</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black placeholder-gray-400"
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="pt-4">
          <Button 
            className="w-full h-12 text-white bg-gray-800 hover:bg-gray-900 rounded-lg font-medium transition-colors" 
            isDisabled={saving || !fullName.trim()} 
            onPress={save}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                저장 중...
              </>
            ) : (
              "저장하기"
            )}
          </Button>
        </div>

        {/* 작가 정보 수정 섹션 */}
        {profile?.isArtist && profile?.isArtistApproval && (
          <div className="pt-8">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">작가 정보</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">작가명</span>
                  <span className="text-sm font-medium text-gray-900">{profile.artist_name || "미설정"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">장르</span>
                  <span className="text-sm font-medium text-gray-900">{profile.artist_genre || "미설정"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">연락처</span>
                  <span className="text-sm font-medium text-gray-900">{profile.artist_phone || "미설정"}</span>
                </div>
                <div className="pt-3">
                  <Button 
                    className="w-full h-10 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors" 
                    onPress={() => setShowArtistInfo(true)}
                  >
                    작가 정보 수정
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 */}
        <div className="pt-8 text-center">
          <button className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* 작가 정보 수정 팝업 */}
      <ArtistInfoPopup
        isOpen={showArtistInfo}
        onClose={() => setShowArtistInfo(false)}
        profile={profile}
        onUpdate={handleArtistInfoUpdate}
      />
    </div>
  );
}
