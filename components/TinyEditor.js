'use client';

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";

// TinyMCE 로컬 번들 로드 (CDN/API Key 불필요)
import "tinymce/tinymce"; // core
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
// 플러그인 (필요한 것만)
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/advlist";
// 언어 파일 (ko_KR) 직접 로드
// import "tinymce/langs/ko_KR.js";
// 기본 스킨 CSS
import "tinymce/skins/ui/oxide/skin.min.css";

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
      plugins: "lists advlist link table code",
      toolbar: [
        "fontSizeSel | bold italic underline | alignleft aligncenter alignright | bullist numlist | undo redo | link code",
        "uploadImage"
      ],
      toolbar_mode: "wrap",
      fontsize_formats: "16px 18px",
      font_formats: "Pretendard=pretendard, sans-serif;",
      skin: false,
      content_css: false,
      content_style: "body { font-size: 16px; } img { max-width: 100%; height: auto; }",
      license_key: "gpl",
      automatic_uploads: true,
      file_picker_types: "image",
      file_picker_callback: (cb) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const webpBlob = await fileToWebP(file);
            const path = `${uuidv4()}.webp`;
            const { error } = await supabase.storage.from(bucketName).upload(path, webpBlob, { upsert: false, contentType: "image/webp" });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
            cb(publicUrl, { title: file.name });
          } catch (err) {
            console.log("image upload error", err);
          }
        };
        input.click();
      },
      images_upload_handler: async (blobInfo) => {
        const file = blobInfo.blob();
        const webpBlob = await fileToWebP(file);
        const path = `${uuidv4()}.webp`;
        const { error } = await supabase.storage.from(bucketName).upload(path, webpBlob, { upsert: false, contentType: "image/webp" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
        return publicUrl;
      },
      setup: (editor) => {
        // custom format definitions
        editor.on('PreInit', () => {
          editor.formatter.register({
            sz16: { inline: 'span', styles: { fontSize: '16px' } },
            sz18: { inline: 'span', styles: { fontSize: '18px' } },
          });
        });

        // font size dropdown using menu button (TinyMCE 7)
        editor.ui.registry.addMenuButton('fontSizeSel', {
          text: 'Size',
          tooltip: 'Font size',
          fetch: (callback) => {
            callback([
              {
                type: 'menuitem',
                text: '16px',
                onAction: () => editor.formatter.apply('sz16')
              },
              {
                type: 'menuitem',
                text: '18px',
                onAction: () => editor.formatter.apply('sz18')
              }
            ]);
          }
        });

        editor.ui.registry.addButton("uploadImage", {
          icon: "image",
          tooltip: "이미지 업로드",
          onAction: () => {
            const containerId = "upload-pane";
            let pane = document.getElementById(containerId);
            if (!pane) {
              pane = document.createElement("div");
              pane.id = containerId;
              pane.style.border = "1px solid #ddd";
              pane.style.padding = "8px";
              pane.style.marginTop = "8px";
              pane.innerHTML = `
                <style>#upload-pane .upl-btn{padding:4px 8px;border:1px solid #bbb;border-radius:4px;background:#f0f0f0;font-size:13px;cursor:pointer;} #upload-pane .upl-btn:hover{background:#e2e2e2;}</style>
                <div style="font-size:13px;margin-bottom:4px;"><span id="cnt">0</span>개 첨부 됨 (<span id="size">0KB</span> / 50.00MB)</div>
                <div style="margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" id="selAll" class="upl-btn">전체 선택</button>
                  <button type="button" id="selNone" class="upl-btn">전체 해제</button>
                  <button type="button" id="delSel" class="upl-btn">선택 삭제</button>
                  <button type="button" id="insertSel" class="upl-btn">본문 삽입</button>
                </div>
                <input type="file" id="uploader" accept="image/*" multiple style="margin-bottom:8px" />
                <div id="gallery" style="display:flex;flex-wrap:wrap;gap:8px;"></div>`;
              editor.getContainer().parentNode.insertBefore(pane, editor.getContainer().nextSibling);
            }

            const gallery = pane.querySelector('#gallery');
            const cntSpan = pane.querySelector('#cnt');
            const sizeSpan = pane.querySelector('#size');
            const uploader = pane.querySelector('#uploader');
            const selAllBtn = pane.querySelector('#selAll');
            const selNoneBtn = pane.querySelector('#selNone');
            const delSelBtn = pane.querySelector('#delSel');
            const insertBtn = pane.querySelector('#insertSel');

            const updateInfo = () => {
              const thumbs = gallery.querySelectorAll('.thumb');
              cntSpan.textContent = thumbs.length;
              let total = 0;
              thumbs.forEach(t=>{ total += parseInt(t.dataset.size || '0'); });
              sizeSpan.textContent = (total/1024).toFixed(1)+ 'KB';
            };

            const addThumb = (url, fileSize) => {
              const div = document.createElement('div');
              div.className = 'thumb selected';
              div.dataset.url = url;
              div.dataset.size = fileSize;
              div.style.position = 'relative';
              div.style.border = '1px solid #ddd';
              div.style.width = '80px';
              div.style.height = '80px';
              div.style.cursor = 'pointer';
              div.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" />`;
              const check = document.createElement('span');
              check.textContent = '✔';
              check.style.position = 'absolute';
              check.style.top = '2px';
              check.style.left = '2px';
              check.style.background = '#0066ff';
              check.style.color = '#fff';
              check.style.fontSize = '12px';
              check.style.width = '16px';
              check.style.height = '16px';
              check.style.display = 'flex';
              check.style.alignItems = 'center';
              check.style.justifyContent = 'center';
              check.style.borderRadius = '2px';
              div.appendChild(check);
              div.onclick = () => {
                div.classList.toggle('selected');
                check.style.display = div.classList.contains('selected') ? 'flex' : 'none';
              };
              gallery.appendChild(div);
              updateInfo();
            };

            uploader.onchange = async (e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) {
                try {
                  const webpBlob = await fileToWebP(file);
                  const path = `${uuidv4()}.webp`;
                  const { error } = await supabase.storage.from(bucketName).upload(path, webpBlob, { upsert: false, contentType: "image/webp" });
                  if (error) throw error;
                  const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
                  addThumb(publicUrl, webpBlob.size);
                } catch (err) {
                  console.log('image upload error', err);
                }
              }
              uploader.value = '';
            };

            selAllBtn.onclick = () => gallery.querySelectorAll('.thumb').forEach(el=>{ el.classList.add('selected'); el.querySelector('span').style.display='flex'; });
            selNoneBtn.onclick = () => gallery.querySelectorAll('.thumb').forEach(el=>{ el.classList.remove('selected'); el.querySelector('span').style.display='none'; });
            delSelBtn.onclick = () => { gallery.querySelectorAll('.thumb.selected').forEach(el=>el.remove()); updateInfo(); };

            insertBtn.onclick = () => {
              const selected = gallery.querySelectorAll('.thumb.selected');
              if (selected.length) {
                let html = '';
                selected.forEach(el => { html += `<p><img src="${el.dataset.url}" /></p>`; });
                html += '<p><br></p>';
                editor.insertContent(html);
                editor.focus();
              }
            };
          }
        });

        // drag & drop 처리
        editor.on('drop', async (e) => {
          const dt = e.dataTransfer;
          if (!dt?.files?.length) return;
          e.preventDefault();
          for (const file of dt.files) {
            if (!file.type.startsWith('image/')) continue;
            try {
              const webpBlob = await fileToWebP(file);
              const path = `${uuidv4()}.webp`;
              const { error } = await supabase.storage.from(bucketName).upload(path, webpBlob, { upsert: false, contentType: "image/webp" });
              if (error) throw error;
              const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
              editor.insertContent(`<img src="${publicUrl}" />`);
            } catch (err) {
              console.log("image upload error", err);
            }
          }
        });
      },
      mobile: {
        theme: "silver",
        toolbar: "uploadImage | fontSizeSel | bold italic | bullist numlist | link"
      },
      // 언어 옵션 제거로 기본 영어 UI 사용
    }), [height, bucketName, supabase]
  );

  return (
    <Editor
      value={value}
      onEditorChange={onChange}
      init={init}
    />
  );
} 