# 환경 변수 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트를 생성합니다.
2. 프로젝트 이름과 데이터베이스 비밀번호를 설정합니다.
3. 프로젝트가 생성될 때까지 기다립니다 (약 2-3분 소요).

## 2. API 키 확인

1. Supabase Dashboard에서 프로젝트를 선택합니다.
2. 좌측 메뉴에서 **Settings** > **API**를 클릭합니다.
3. 다음 정보를 복사합니다:
   - **Project URL** (예: https://abcdefgh.supabase.co)
   - **anon public** 키 (eyJ...로 시작하는 긴 문자열)
   - **service_role** 키 (eyJ...로 시작하는 긴 문자열)

## 3. 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 4. 데이터베이스 스키마 설정

1. Supabase Dashboard에서 **SQL Editor**를 클릭합니다.
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행합니다.
3. `supabase-rls.sql` 파일의 내용을 복사하여 실행합니다.

## 5. 개발 서버 재시작

환경 변수를 설정한 후 개발 서버를 재시작합니다:

```bash
npm run dev
```

## 문제 해결

### 환경 변수가 인식되지 않는 경우
- `.env.local` 파일이 프로젝트 루트에 있는지 확인하세요
- 파일명이 정확한지 확인하세요 (`.env.local`)
- 개발 서버를 재시작하세요

### Supabase 연결 오류
- API 키가 올바른지 확인하세요
- 프로젝트 URL이 정확한지 확인하세요
- Supabase 프로젝트가 활성화되어 있는지 확인하세요

### OAuth 프로바이더 오류
- "Unsupported provider" 오류가 발생하면 Supabase Dashboard에서 해당 프로바이더를 활성화해야 합니다
- Google OAuth를 사용하려면 Google Cloud Console에서 OAuth 2.0 클라이언트를 생성하고 Supabase에 설정해야 합니다
- 임시로는 이메일/비밀번호 인증만 사용할 수 있습니다 (providers=[]로 설정)
