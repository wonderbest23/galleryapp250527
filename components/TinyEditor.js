'use client';

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";

// TinyMCE Editor is dynamically imported to avoid SSR issues
const Editor = dynamic(() => import("@tinymce/tinymce-react").then((m) => m.Editor), { ssr: false });

// 브라우저에서 WebP 변환 함수 (최대 1200px 리사이즈 적용)
async function fileToWebP(file) {
  return new Promise((resolve) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const maxSize = 1200;
      let targetW = img.width;
      let targetH = img.height;
      if (img.width > maxSize || img.height > maxSize) {
        if (img.width > img.height) {
          targetW = maxSize;
          targetH = Math.round(img.height * (maxSize / img.width));
        } else {
          targetH = maxSize;
          targetW = Math.round(img.width * (maxSize / img.height));
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/webp",
        0.8
      );
    };
    reader.readAsDataURL(file);
  });
}

export default function TinyEditor({ value, onChange, height = 400, bucketName = "notification" }) {
  const supabase = createClient();

  const init = useMemo(
    () => ({
      height,
      menubar: false,
      plugins: "image link lists code table",
      toolbar:
        "undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | image link | code",
      // 한글 UI (불필요하면 삭제)
      language: "ko_KR",
      // 이미지 업로드 커스텀 핸들러
      images_upload_handler: async (blobInfo, success, failure) => {
        try {
          const originalFile = blobInfo.blob();
          const webpBlob = await fileToWebP(originalFile);
          const fileName = `${uuidv4()}.webp`;
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, webpBlob, { contentType: "image/webp" });
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          success(publicUrl);
        } catch (err) {
          console.error("TinyMCE 이미지 업로드 실패", err);
          failure("Upload failed");
        }
      },
    }), [height, bucketName, supabase]
  );

  return (
    <Editor
      value={value}
      onEditorChange={onChange}
      init={init}
      tinymceScriptSrc={"/tinymce/tinymce.min.js" /* 로컬 빌드용, CDN 사용 시 삭제 */}
    />
  );
} 