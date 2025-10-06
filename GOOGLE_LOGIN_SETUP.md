# 구글 로그인 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 Google Cloud Console 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 OAuth 2.0 클라이언트 ID 생성
1. Google Cloud Console에서 "API 및 서비스" > "사용자 인증 정보" 이동
2. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 승인된 자바스크립트 원본:
   - `http://localhost:3000` (개발용)
   - `https://your-domain.com` (프로덕션용)
5. 승인된 리디렉션 URI:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (개발용)

### 1.3 클라이언트 ID와 클라이언트 시크릿 복사
- 생성된 OAuth 2.0 클라이언트 ID와 클라이언트 시크릿을 복사해두세요.

## 2. Supabase 설정

### 2.1 Supabase Dashboard에서 OAuth 설정
1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 선택
3. "Authentication" > "Providers" 이동
4. "Google" 프로바이더 활성화
5. Google OAuth 설정:
   - **Client ID**: Google Cloud Console에서 복사한 클라이언트 ID
   - **Client Secret**: Google Cloud Console에서 복사한 클라이언트 시크릿
   - **Redirect URL**: `https://your-supabase-project.supabase.co/auth/v1/callback`

### 2.2 Site URL 설정
1. "Authentication" > "URL Configuration" 이동
2. Site URL 설정:
   - 개발용: `http://localhost:3000`
   - 프로덕션용: `https://your-domain.com`

## 3. 환경변수 설정

### 3.1 .env.local 파일 생성 (아직 없다면)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth (선택사항 - Supabase에서 관리)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. 코드 구현 완료

구글 로그인 기능이 이미 구현되어 있습니다:

### 4.1 로그인 함수
```javascript
const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    const supabase = createClient();
    
    const redirectUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(returnUrl)}`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("구글 로그인 오류:", error);
      throw error;
    }
  } catch (error) {
    console.error("로그인 처리 중 오류가 발생했습니다:", error);
    alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
  } finally {
    setLoading(false);
  }
};
```

### 4.2 UI 버튼
- 구글 로그인 버튼이 카카오 로그인 버튼 위에 추가됨
- 구글 브랜드 컬러와 아이콘 사용
- 반응형 디자인 적용

## 5. 테스트

### 5.1 개발 환경 테스트
1. `npm run dev`로 개발 서버 실행
2. `http://localhost:3000/mypage` 접속
3. "Google로 로그인" 버튼 클릭
4. 구글 로그인 팝업에서 계정 선택
5. 로그인 성공 후 리디렉션 확인

### 5.2 프로덕션 배포 시 주의사항
1. Google Cloud Console에서 프로덕션 도메인 추가
2. Supabase에서 프로덕션 Site URL 설정
3. 환경변수 업데이트

## 6. 문제 해결

### 6.1 일반적인 오류
- **"redirect_uri_mismatch"**: Google Cloud Console의 리디렉션 URI 확인
- **"invalid_client"**: 클라이언트 ID/시크릿 확인
- **"access_denied"**: 사용자가 로그인을 거부한 경우

### 6.2 디버깅
- 브라우저 개발자 도구의 Network 탭에서 OAuth 플로우 확인
- Supabase Dashboard의 Authentication 로그 확인
- Google Cloud Console의 OAuth 동의 화면 설정 확인

## 7. 추가 설정 (선택사항)

### 7.1 OAuth 동의 화면 설정
1. Google Cloud Console에서 "OAuth 동의 화면" 설정
2. 앱 이름, 로고, 지원 이메일 등 입력
3. 스코프 설정 (기본: profile, email)

### 7.2 도메인 검증
- 프로덕션 도메인을 Google Search Console에서 검증
- 보안을 위해 HTTPS 사용 권장

이제 구글 로그인이 완전히 구현되었습니다! 🎉
