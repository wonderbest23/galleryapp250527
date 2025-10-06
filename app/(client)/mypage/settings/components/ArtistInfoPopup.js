"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Textarea, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { FaTimes, FaCheck } from "react-icons/fa";

export default function ArtistInfoPopup({ isOpen, onClose, profile, onUpdate }) {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 작가 정보 상태
  const [artistName, setArtistName] = useState("");
  const [artistPhone, setArtistPhone] = useState("");
  const [artistIntro, setArtistIntro] = useState("");
  const [artistBirth, setArtistBirth] = useState("");
  const [artistGenre, setArtistGenre] = useState("");
  const [artistProof, setArtistProof] = useState("");

  const genres = [
    { id: 1, name: "현대미술" },
    { id: 2, name: "명화/동양화" },
    { id: 3, name: "추상화" },
    { id: 4, name: "사진/일러스트" },
    { id: 5, name: "기타" }
  ];

  // 팝업이 열릴 때 기존 작가 정보 로드
  useEffect(() => {
    if (isOpen && profile) {
      setArtistName(profile.artist_name || "");
      setArtistPhone(profile.artist_phone || "");
      setArtistIntro(profile.artist_intro || "");
      setArtistBirth(profile.artist_birth || "1990-01-01");
      setArtistGenre(profile.artist_genre || "");
      setArtistProof(profile.artist_proof || "");
    }
  }, [isOpen, profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      // 필수 필드 검증
      if (!artistName || !artistPhone || !artistIntro || !artistBirth || !artistGenre || !artistProof) {
        alert("모든 필드를 입력해주세요.");
        return;
      }

      // 날짜 유효성 검사
      if (!/^\d{4}-\d{2}-\d{2}$/.test(artistBirth)) {
        alert("날짜 형식이 유효하지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          artist_name: artistName,
          artist_phone: artistPhone,
          artist_intro: artistIntro,
          artist_birth: artistBirth,
          artist_genre: artistGenre,
          artist_proof: artistProof
        })
        .eq("id", profile.id);

      if (error) {
        console.error("작가 정보 저장 오류:", error);
        alert("작가 정보 저장에 실패했습니다.");
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onUpdate(); // 부모 컴포넌트에 업데이트 알림
        onClose();
      }, 1500);

    } catch (error) {
      console.error("작가 정보 저장 오류:", error);
      alert("작가 정보 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (showSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <ModalContent>
          <ModalBody className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">수정 완료!</h3>
              <p className="text-gray-600">작가 정보가 성공적으로 업데이트되었습니다.</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">작가 정보 수정</h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            <FaTimes className="w-4 h-4 text-gray-500" />
          </button>
        </ModalHeader>
        
        <ModalBody className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">작가명</label>
            <Input
              type="text"
              variant="bordered"
              placeholder="작가명을 입력해주세요"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              isDisabled={saving}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">연락처</label>
            <Input
              type="tel"
              variant="bordered"
              placeholder="연락처를 입력해주세요"
              value={artistPhone}
              onChange={(e) => setArtistPhone(e.target.value)}
              isDisabled={saving}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">작가 소개</label>
            <Textarea
              variant="bordered"
              placeholder="작가 소개를 입력해주세요"
              minRows={4}
              value={artistIntro}
              onChange={(e) => setArtistIntro(e.target.value)}
              isDisabled={saving}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">출생연도</label>
            <Input
              type="date"
              variant="bordered"
              value={artistBirth}
              onChange={(e) => setArtistBirth(e.target.value)}
              isDisabled={saving}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">장르</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setArtistGenre(genre.name)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                    ${artistGenre === genre.name 
                      ? 'bg-black text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">활동 검증 자료</label>
            <Textarea
              variant="bordered"
              placeholder="전시 이력, 수상 경력 등 작가 활동을 증명할 수 있는 자료를 입력해주세요"
              minRows={4}
              value={artistProof}
              onChange={(e) => setArtistProof(e.target.value)}
              isDisabled={saving}
            />
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            isDisabled={saving}
          >
            취소
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={saving}
            isDisabled={!artistName || !artistPhone || !artistIntro || !artistBirth || !artistGenre || !artistProof}
          >
            {saving ? "저장 중..." : "저장하기"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

