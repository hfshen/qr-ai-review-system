# Vercel 환경 변수 설정 가이드

## 도메인 설정 후 필요한 환경 변수 업데이트

### 1. Vercel Dashboard에서 환경 변수 설정
1. Vercel Dashboard → 프로젝트 선택 → Settings → Environment Variables
2. 다음 환경 변수를 추가/수정:

```
NEXT_PUBLIC_SITE_URL=https://qr-review.lolovely.com
```

### 2. Supabase 설정 업데이트
Supabase Dashboard에서 다음 설정을 업데이트:

**Authentication → URL Configuration:**
- Site URL: `https://qr-review.lolovely.com`
- Redirect URLs에 추가:
  ```
  https://qr-review.lolovely.com/auth/callback
  https://qr-review.lolovely.com/auth/google/callback
  https://qr-review.lolovely.com/auth/naver/callback
  https://qr-review.lolovely.com/auth/instagram/callback
  https://qr-review.lolovely.com/auth/tiktok/callback
  https://qr-review.lolovely.com/auth/xiaohongshu/callback
  ```

### 3. Google OAuth 설정 업데이트
Google Cloud Console에서:

**Authorized JavaScript origins:**
```
https://qr-review.lolovely.com
```

**Authorized redirect URIs:**
```
https://qr-review.lolovely.com/auth/callback
https://qr-review.lolovely.com/auth/google/callback
```

### 4. 도메인 상태 확인 방법

**DNS 전파 확인:**
```bash
# 터미널에서 실행
nslookup qr-review.lolovely.com
dig qr-review.lolovely.com
```

**SSL 인증서 확인:**
- Vercel에서 자동으로 SSL 인증서를 발급받습니다
- 도메인이 활성화되면 자동으로 HTTPS가 적용됩니다

### 5. 문제 해결 단계

1. **DNS 전파 대기**: 최대 24시간까지 소요될 수 있음
2. **Vercel에서 Refresh**: Domains 페이지에서 "Refresh" 버튼 클릭
3. **브라우저 캐시 삭제**: Ctrl+F5 또는 시크릿 모드에서 테스트
4. **다른 네트워크에서 테스트**: 모바일 데이터나 다른 WiFi에서 접속 시도

### 6. 확인 사항

- [ ] DNS CNAME 레코드가 올바르게 설정됨
- [ ] Vercel 환경 변수 `NEXT_PUBLIC_SITE_URL` 업데이트
- [ ] Supabase Site URL 및 Redirect URLs 업데이트
- [ ] Google OAuth 설정 업데이트
- [ ] DNS 전파 완료 대기 (5-30분)
- [ ] Vercel에서 도메인 상태 "Valid Configuration" 확인
