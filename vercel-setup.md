# Vercel CLI로 새 프로젝트 연결하기

## 1단계: Vercel CLI 실행
npx vercel login

## 2단계: 프로젝트 초기화
npx vercel

## 3단계: 질문에 답변
- Set up and deploy? [Y/n] → Y
- Which scope? → 본인의 Vercel 계정 선택
- Link to existing project? [y/N] → N (새 프로젝트이므로)
- What's your project's name? → galleryapp250527-new (원하는 이름)
- In which directory is your code located? → ./
- Want to modify these settings? [y/N] → N

## 4단계: 환경 변수 추가
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY

## 5단계: 배포
npx vercel --prod
