export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'jpg' | 'png' | 'webp' | 'avif';
}

export function getSupabaseImageUrl(
  url?: string,
  { width, height, quality = 100, resize, format }: TransformOptions = {}
): string | undefined {
  if (!url) return url;

  // 이미 변환 CDN URL이면 그대로 반환
  if (url.includes('/render/image/')) {
    return url;
  }

  // object → render 로 변경 (public/private 구분 유지)
  const transformed = url.replace('/storage/v1/object/', '/storage/v1/render/image/');

  // 쿼리스트링 작성
  const params: string[] = [];
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality) params.push(`quality=${quality}`);
  if (resize) params.push(`resize=${resize}`);
  if (format) params.push(`format=${format}`);

  return `${transformed}${params.length ? '?' + params.join('&') : ''}`;
} 