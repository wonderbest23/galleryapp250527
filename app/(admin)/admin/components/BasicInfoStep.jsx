import React from "react";
import { Input, Button, Textarea, Checkbox } from "@heroui/react";

export function BasicInfoStep({ form, onChange, onNext, onCancel }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="전시회명" 
          value={form.contents} 
          onValueChange={v => onChange('contents', v)} 
          className="md:col-span-2" 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="썸네일 URL" 
          value={form.photo} 
          onValueChange={v => onChange('photo', v)} 
          className="md:col-span-2" 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="전시시작일" 
          value={form.start_date} 
          onValueChange={v => onChange('start_date', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="전시종료일" 
          value={form.end_date} 
          onValueChange={v => onChange('end_date', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="운영 시간" 
          value={form.working_hour} 
          onValueChange={v => onChange('working_hour', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="휴무일" 
          value={form.off_date} 
          onValueChange={v => onChange('off_date', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="홈페이지 URL" 
          value={form.homepage_url} 
          onValueChange={v => onChange('homepage_url', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="리뷰 수" 
          value={form.review_count} 
          onValueChange={v => onChange('review_count', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="평균 평점" 
          value={form.review_average} 
          onValueChange={v => onChange('review_average', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="네이버 갤러리 URL" 
          value={form.naver_gallery_url} 
          onValueChange={v => onChange('naver_gallery_url', v)} 
          variant="bordered"
          size="lg"
        />
        <Input 
          label="가격" 
          value={form.price} 
          onValueChange={v => onChange('price', v)} 
          variant="bordered"
          size="lg"
        />
        <Textarea 
          label="전시회 내용" 
          value={form.contents} 
          onValueChange={v => onChange('contents', v)} 
          className="md:col-span-2" 
          variant="bordered"
          size="lg"
          minRows={4}
        />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="light" onPress={onCancel} size="lg">취소</Button>
        <Button color="primary" onPress={onNext} size="lg">다음</Button>
      </div>
    </div>
  );
} 