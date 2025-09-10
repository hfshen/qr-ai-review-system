# Supabase 리다이렉트 URL 설정 가이드

## 문제 상황
배포된 앱에서 구글 로그인 시 여전히 `http://localhost:3000`으로 리다이렉트되는 문제

## 해결 방법

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택

### 2. Authentication 설정 수정
1. 좌측 메뉴에서 **Authentication** 클릭
2. **URL Configuration** 섹션으로 이동

### 3. Site URL 변경
**Site URL**을 다음으로 변경:
```
https://your-app-name.vercel.app
```
(실제 Vercel 배포 URL로 변경)

### 4. Redirect URLs 추가/수정
**Redirect URLs**에 다음 URL들을 추가:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/google/callback
https://your-app-name.vercel.app/auth/naver/callback
https://your-app-name.vercel.app/auth/instagram/callback
https://your-app-name.vercel.app/auth/tiktok/callback
https://your-app-name.vercel.app/auth/xiaohongshu/callback
```

### 5. Google OAuth 설정 확인
Google Cloud Console에서도 설정 확인:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **APIs & Services** > **Credentials** 이동
4. OAuth 2.0 클라이언트 ID 클릭

**Authorized JavaScript origins:**
```
https://your-app-name.vercel.app
```

**Authorized redirect URIs:**
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/google/callback
```

### 6. Vercel 환경 변수 확인
Vercel Dashboard에서 환경 변수 확인:
```
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
```

## 중요 사항
- `localhost:3000`은 개발 환경에서만 사용
- 프로덕션에서는 반드시 실제 도메인 사용
- Supabase와 Google OAuth 모두에서 도메인 설정 필요
- 변경 후 브라우저 캐시 삭제 권장

## 테스트 방법
1. 설정 변경 후 5-10분 대기
2. 브라우저 캐시 삭제
3. 시크릿 모드에서 테스트
4. 구글 로그인 시도
