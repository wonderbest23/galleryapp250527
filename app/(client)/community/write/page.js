"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@heroui/react";
import dynamic from "next/dynamic";

// FroalaEditorComponent 동적 임포트 (관리자용 컴포넌트 재사용)
const FroalaEditorComponent = dynamic(() => import("@/app/(admin)/admin/components/Froala"), {
  ssr: false,
});

export default function CommunityWrite() {
  const categories = [
    { value: "free", label: "자유" },
    { value: "issue", label: "유머/움짤/이슈" },
    { value: "qa", label: "질문" },
  ];

  const [category, setCategory] = useState(categories[0].value);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요");
      return;
    }
    setIsSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 필요합니다");
      router.push("/login");
      return;
    }
    const { error, data } = await supabase.from("community_post").insert({
      category,
      title,
      content,
      user_id: session.user.id,
      likes: 0,
      created_at: new Date().toISOString(),
      views: 0,
    }).select().single();
    setIsSaving(false);
    if (error) {
      console.log("error", error);
      alert("저장 실패");
    } else {
      router.replace(`/community/${data.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6 gap-4">
      <h1 className="text-2xl font-bold">게시글 작성</h1>
      <Select
        label="카테고리"
        selectedKeys={[category]}
        onSelectionChange={(keys)=> setCategory(Array.from(keys)[0])}
      >
        {categories.map(c=> (<Select.Item key={c.value}>{c.label}</Select.Item>))}
      </Select>
      <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목" />
      <div className="w-full">
        <FroalaEditorComponent
          value={content}
          onChange={setContent}
          height={400}
          bucketName="community"
        />
      </div>
      <Button color="primary" isLoading={isSaving} onPress={handleSubmit} className="w-full">
        등록
      </Button>
    </div>
  );
} 