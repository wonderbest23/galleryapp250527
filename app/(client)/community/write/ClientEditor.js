"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import dynamicImport from "next/dynamic";

const FroalaEditorComponent = dynamicImport(() => import("@/app/(admin)/admin/components/Froala"), { ssr: false });

export default function CommunityWriteClient() {
  const categories = [
    { value: "자유", label: "자유" },
    { value: "전시", label: "전시" },
    { value: "질문", label: "질문" },
  ];
  const [category, setCategory] = useState(categories[0].value);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요");
      return;
    }
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 필요합니다");
      router.push("/mypage?redirect_to=/community/write");
      return;
    }
    const { error, data } = await supabase.from("community_post").insert({
      category,
      title,
      content,
      user_id: session.user.id,
    }).select().single();
    setIsSaving(false);
    if (error) {
      console.log("insert error", error);
      alert("저장 실패: " + error.message);
    }
    else {
      // 작성 성공 후 AI 댓글 생성 트리거 (비동기)
      fetch('/api/ai-generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: data.id })
      }).catch(()=>{});
      router.replace(`/community/${data.id}`);
    }
  };

  return (
    <>
      {/* Guidelines Modal */}
      <Modal isOpen={showGuide} onOpenChange={setShowGuide} size="sm" placement="center" className="z-[9999]">
        <ModalContent className="max-w-sm z-[9999]">
          <ModalHeader className="flex flex-col gap-1 text-sm">✅ 미술예술랭 커뮤니티 글 작성 시 유의사항</ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto text-xs whitespace-pre-wrap leading-relaxed">
{`
1. 작품·전시 관련 정보 공유 시
  • 출처 명확히 표기: 전시 포스터, 작가 인터뷰, 이미지 등을 공유할 때는 반드시 출처(예: ○○갤러리, ○○작가 인스타그램 등)를 표기해주세요.
  • 본인의 사진/영상은 자유롭게 공유 가능하지만, 타인의 저작물은 사전 허락 없이는 2차 가공 없이 올려주세요.
  • 비방이나 평점성 평가 지양: 작품/전시에 대한 감상은 환영하나, 작가에 대한 인신공격이나 단정적 표현은 자제해주세요.

2. 질문/토론 게시물 작성 시
  • 제목은 구체적으로 작성해주세요.
  • 명확한 질문/의견 제시: 맥락을 담아주세요.
  • 논쟁 유도 금지: 공격성 댓글은 삭제될 수 있습니다.

3. 커뮤니티 성격에 맞는 글쓰기
  • 미술과 무관한 주제는 자제: 광고, 정치·종교 글은 삭제될 수 있습니다.
  • 자신의 작업/전시 홍보는 '작가홍보' 탭 이용해주세요.

4. 사진/이미지 첨부 시
  • 작품 이미지 업로드는 출처와 작가명 함께 기재해주세요.
  • 고해상도보다는 웹용 최적화를 권장합니다.

5. 댓글 작성 시 예절
  • 비방·조롱·성적 표현 금지, 성실한 답변 장려.

❌ 금지 행위(운영자 제재)
  • 비방 및 인신공격, 무단 홍보·광고, 도배·스팸, 허위정보 유포, 저작권 침해, 정치·종교 논쟁 유도 등

🧩 운영자 권장 콘텐츠
  • 전시 후기, 작가 감상, 작업실 공유, 아트페어 방문기, 작품 해석 토론, 미술계 이슈 정리 등
`}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" className="w-full" onPress={()=>setShowGuide(false)}>확인</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Render editor only when guide closed */}
      {!showGuide && (
        <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6 gap-4">
          <h1 className="text-2xl font-bold">게시글 작성</h1>
          <Select
            label="카테고리"
            selectedKeys={new Set([category])}
            onSelectionChange={(keys)=>{
              const first = Array.from(keys)[0];
              if (first) setCategory(first);
            }}
          >
            {categories.map(c=>(<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </Select>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목" />
          <div className="w-full">
            <FroalaEditorComponent
              value={content}
              onChange={setContent}
              height={400}
              bucketName="notification"
            />
          </div>
          <Button color="primary" isLoading={isSaving} onPress={handleSubmit} className="w-full">등록</Button>
        </div>
      )}
    </>
  );
} 