"use client";

import React from "react";
import { User } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import Image from "next/image";
const Review = React.forwardRef(
  (
    { children, user, title, content, rating, createdAt, review, ...props },
    ref
  ) => (
    <div ref={ref} {...props} className="px-4 pt-4 pb-2">
      <div className="flex flex-col">
        {/* 제목 부분 */}
        {/* <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-default-900">{title}</h3>
          <span className="text-xs text-default-400">
            {new Intl.DateTimeFormat("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(createdAt))}
          </span>
        </div> */}

        <div className="flex flex-row items-center  gap-2 mb-2">
          <Image
            src={(() => {
              if (!review?.exhibition_id?.photo || review.exhibition_id.photo.startsWith('data:')) {
                return "/images/noimage.jpg";
              }
              
              // 전시회 이미지 URL에서 썸네일 경로로 변환
              return review.exhibition_id.photo.includes('/thumbnails/')
                ? review.exhibition_id.photo
                : review.exhibition_id.photo.replace('/exhibition/exhibition/', '/exhibition/thumbnails/');
            })()}
            alt={user.name}
            width={50}
            height={50}
          />
          <div className="flex flex-col w-full ml-4">
            <p className="text-[13px] font-bold">{review?.exhibition_id?.contents}</p>
            <p className="text-[12px] text-default-400">
              {review.name.replace(/(.+?)(.{2})(?=@)/, (_, p1, p2) => p1.slice(0, -2) + '**')}님의 실제 방문 리뷰
            </p>
            <p className="text-[12px] text-default-400 text-end">
              {new Date(createdAt).toLocaleDateString('ko-KR').replace(/\./g, '년').slice(0,-1) + '일'}
            </p>
          </div>
        </div>

        

        {/* 리뷰 내용 */}
        <div className="w-full">
          <p className="text-default-500">{content || children}</p>
        </div>
        {/* 별점 */}
        <div className="flex items-center gap-1 mb-3 justify-end">
          {Array.from({ length: 5 }, (_, i) => {
            const isSelected = i + 1 <= rating;

            return (
              <Icon
                key={i}
                className={cn(
                  "text-lg",
                  isSelected ? "text-blue-500" : "text-default-200"
                )}
                icon="solar:star-bold"
              />
            );
          })}
        </div>
      </div>
    </div>
  )
);

Review.displayName = "Review";

export default Review;
