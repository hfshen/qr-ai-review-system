# Google OAuth redirect_uri_mismatch 오류 해결 가이드

## 🚨 현재 오류 상황
- **오류**: `400 Error: redirect_uri_mismatch`
- **원인**: Google Cloud Console에서 OAuth 설정이 올바르지 않음
- **현재 도메인**: `qr-review.lolovely.com`

## 🔧 해결 방법

### 1. Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 올바른 프로젝트 선택 (QR 리뷰 프로젝트)
3. **APIs & Services** → **Credentials** 이동

### 2. OAuth 2.0 클라이언트 ID 수정
1. OAuth 2.0 클라이언트 ID 클릭
2. **Authorized JavaScript origins** 섹션에서 다음 URL 추가:
   ```
   https://qr-review.lolovely.com
   ```

3. **Authorized redirect URIs** 섹션에서 다음 URL들 추가:
   ```
   https://qr-review.lolovely.com/auth/callback
   https://qr-review.lolovely.com/auth/google/callback
   ```

### 3. Supabase 설정 확인
Supabase Dashboard에서:
1. **Authentication** → **URL Configuration**
2. **Site URL**: `https://qr-review.lolovely.com`
3. **Redirect URLs**에 추가:
   ```
   https://qr-review.lolovely.com/auth/callback
   https://qr-review.lolovely.com/auth/google/callback
   ```

### 4. Vercel 환경 변수 확인
Vercel Dashboard에서:
1. **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_SITE_URL` = `https://qr-review.lolovely.com`

## ⚠️ 중요 사항

### 잘못된 설정 예시:
- `localhost:3000` (개발용)
- 다른 프로젝트의 도메인
- HTTP URL (HTTPS만 허용)

### 올바른 설정:
- `https://qr-review.lolovely.com` (프로덕션용)
- 정확한 콜백 경로 (`/auth/callback`)

## 🔍 문제 진단

### 현재 리다이렉트 URL 확인:
브라우저 개발자 도구에서 Network 탭을 확인하여 실제 요청되는 URL을 확인하세요.

### 일반적인 실수:
1. **프로젝트 혼동**: 다른 Google Cloud 프로젝트의 OAuth 설정 사용
2. **도메인 불일치**: `qr-review.lolovely.com` 대신 다른 도메인 설정
3. **프로토콜 불일치**: HTTP 대신 HTTPS 사용해야 함
4. **경로 오류**: `/auth/callback` 경로 누락

## 📋 체크리스트

- [ ] Google Cloud Console에서 올바른 프로젝트 선택
- [ ] Authorized JavaScript origins에 `https://qr-review.lolovely.com` 추가
- [ ] Authorized redirect URIs에 콜백 URL들 추가
- [ ] Supabase Site URL 업데이트
- [ ] Vercel 환경 변수 설정
- [ ] 브라우저 캐시 삭제 후 재시도

## 🚀 테스트 방법

1. 설정 변경 후 5-10분 대기
2. 브라우저 캐시 삭제 (Ctrl+F5)
3. 시크릿 모드에서 테스트
4. 구글 로그인 버튼 클릭
5. 정상적으로 리다이렉트되는지 확인
