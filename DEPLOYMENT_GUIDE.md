# Vercel 배포 후 구글 로그인 설정 가이드

## 문제 해결 방법

### 1. Vercel 환경 변수 설정

Vercel Dashboard에서 다음 환경 변수를 설정하세요:

```
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase 프로젝트 설정

Supabase Dashboard에서 다음 설정을 확인/수정하세요:

#### Authentication > URL Configuration

**Site URL:**
```
https://your-app-name.vercel.app
```

**Redirect URLs:**
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/google/callback
https://your-app-name.vercel.app/auth/naver/callback
https://your-app-name.vercel.app/auth/instagram/callback
https://your-app-name.vercel.app/auth/tiktok/callback
https://your-app-name.vercel.app/auth/xiaohongshu/callback
```

### 3. Google OAuth 설정

Google Cloud Console에서 다음 설정을 확인하세요:

#### Authorized JavaScript origins:
```
https://your-app-name.vercel.app
```

#### Authorized redirect URIs:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/google/callback
```

### 4. 코드 수정 완료

다음 파일들이 이미 수정되었습니다:

- `src/components/AuthForm.tsx`: `redirectTo` URL을 환경 변수 기반으로 변경
- `src/components/PlatformOAuth.tsx`: OAuth URL을 절대 경로로 변경

### 5. 배포 후 확인사항

1. Vercel에서 환경 변수가 올바르게 설정되었는지 확인
2. Supabase에서 리다이렉트 URL이 올바르게 설정되었는지 확인
3. Google OAuth에서 도메인이 올바르게 설정되었는지 확인
4. 브라우저 캐시를 지우고 다시 테스트

### 6. 문제가 지속될 경우

1. 브라우저 개발자 도구에서 네트워크 탭 확인
2. Supabase 로그에서 인증 오류 확인
3. Vercel 함수 로그에서 오류 확인

## 주의사항

- `localhost:3000`은 개발 환경에서만 사용
- 프로덕션에서는 반드시 실제 도메인 사용
- 환경 변수는 Vercel Dashboard에서 설정
- Supabase와 Google OAuth 설정도 프로덕션 도메인으로 업데이트 필요
