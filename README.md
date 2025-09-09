# 🤖 AI 리뷰 플랫폼

QR 코드를 활용한 AI 기반 자동 리뷰 생성 플랫폼입니다. 고객이 QR 코드를 스캔하면 AI가 자동으로 자연스러운 리뷰를 생성하고 여러 소셜 플랫폼에 동시 게시합니다.

## ✨ 주요 기능

- **🎯 QR 코드 통합**: 각 지점별 고유 QR 코드 생성
- **🤖 AI 리뷰 생성**: OpenAI GPT-4 Mini를 활용한 자연스러운 리뷰 자동 생성
- **📱 이미지 분석**: Vision API를 통한 이미지 기반 리뷰 생성
- **🌐 멀티 플랫폼 지원**: 네이버, 인스타그램, 틱톡, 구글 등 동시 게시
- **⭐ 포인트 시스템**: 리뷰 작성 시 포인트 적립 및 마켓플레이스 활용
- **📊 실시간 분석**: 리뷰 성과 및 고객 참여도 추적
- **🔐 완전한 보안**: Row Level Security (RLS) 구현
- **📧 이메일 알림**: 다양한 상황별 자동 알림 시스템
- **📱 PWA 지원**: 모바일 앱과 같은 사용자 경험

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4 Mini + Vision API
- **OAuth**: 네이버, 인스타그램, 틱톡, 구글
- **Email**: Resend API
- **Deployment**: Vercel
- **PWA**: Service Worker, Web App Manifest

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- Supabase 계정
- OpenAI API 키

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/qr-ai-review-system.git
cd qr-ai-review-system
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env.local
```

4. 환경 변수 구성:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# OAuth (선택사항)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Email (선택사항)
RESEND_API_KEY=your_resend_api_key
```

5. 데이터베이스 설정
```bash
# Supabase Dashboard에서 다음 SQL 스크립트 실행:
# 1. complete-rls-policies.sql
# 2. add-marketplace-products.sql
```

6. 개발 서버 시작
```bash
npm run dev
```

7. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── admin/             # 관리자 대시보드
│   ├── dashboard/         # 에이전시 대시보드
│   ├── marketplace/       # 포인트 마켓플레이스
│   ├── qr/               # QR 코드 리뷰 페이지
│   ├── auth/             # OAuth 콜백 페이지
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── AuthForm.tsx      # 인증 폼
│   ├── UserProfile.tsx   # 사용자 프로필 관리
│   ├── Marketplace.tsx   # 마켓플레이스 인터페이스
│   ├── QRCodeManager.tsx # QR 코드 생성
│   ├── StatisticsDashboard.tsx # 분석 대시보드
│   ├── PlatformOAuth.tsx # OAuth 연동
│   └── PWAProvider.tsx   # PWA 지원
├── lib/                   # 유틸리티 함수
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── points.ts         # 포인트 시스템 로직
│   ├── keywords.ts       # 리뷰 키워드
│   ├── statistics.ts     # 분석 함수
│   ├── ai-review.ts      # AI 리뷰 생성
│   └── email-notifications.ts # 이메일 알림
└── types/                 # TypeScript 타입 정의
    └── database.ts       # 데이터베이스 스키마 타입
```

## 🎯 핵심 기능

### 1. QR 코드 시스템
- 각 지점별 고유 QR 코드 생성
- QR 코드 스캔 및 리뷰 제출 추적
- 커스터마이징 가능한 QR 코드 디자인

### 2. AI 리뷰 생성
- OpenAI GPT-4 Mini를 활용한 자연스러운 리뷰 생성
- 비즈니스 유형 기반 컨텍스트 인식
- Vision API를 통한 이미지 분석
- 별점 기반 톤 조정

### 3. 멀티 플랫폼 게시
- 주요 플랫폼 OAuth 연동
- 여러 플랫폼 동시 게시
- 플랫폼별 콘텐츠 최적화

### 4. 포인트 시스템
- 리뷰 참여 고객 보상 시스템
- 포인트 사용 마켓플레이스
- 관리자 포인트 관리

### 5. 분석 대시보드
- 실시간 리뷰 통계
- 플랫폼 성과 지표
- 고객 참여도 추적

## 🔌 API 엔드포인트

- `POST /api/generate-review` - AI 리뷰 생성
- `POST /api/publish-review` - 플랫폼 게시
- `GET /api/statistics` - 분석 데이터 조회

## 🗄 데이터베이스 스키마

Supabase를 사용하며 다음 주요 테이블들이 있습니다:
- `users` - 사용자 계정 및 프로필
- `agencies` - 비즈니스 에이전시
- `branches` - 비즈니스 지점
- `platforms` - 소셜 미디어 플랫폼
- `reviews` - 고객 리뷰
- `point_transactions` - 포인트 시스템 거래
- `marketplace_products` - 상품 교환
- `user_platforms` - 사용자 플랫폼 연동
- `agency_platforms` - 에이전시 플랫폼 연동

## 🚀 배포

### Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. Vercel 대시보드에서 환경 변수 설정
3. main 브랜치 푸시 시 자동 배포

### 프로덕션 환경 변수

```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
OPENAI_API_KEY=your_openai_api_key

# 선택사항 (OAuth)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 선택사항 (이메일)
RESEND_API_KEY=your_resend_api_key
```

## 📱 PWA 기능

- **오프라인 지원**: 서비스 워커를 통한 캐싱
- **앱 설치**: 홈 화면에 앱 추가 가능
- **푸시 알림**: 백그라운드 알림 지원
- **모바일 최적화**: 반응형 디자인

## 🔒 보안

- **Row Level Security (RLS)**: 데이터베이스 레벨 보안
- **OAuth 2.0**: 안전한 소셜 로그인
- **API 키 보호**: 서버 사이드 환경 변수 사용
- **CORS 설정**: 적절한 도메인 제한

## 🤝 기여하기

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

지원이 필요하시면 이메일로 문의하거나 GitHub Issues를 이용해주세요.

## 🗺 로드맵

- [ ] 결제 시스템 통합 (Stripe)
- [ ] 고급 분석 기능
- [ ] 모바일 앱 개발
- [ ] 다국어 지원
- [ ] 고급 AI 기능
- [ ] 스팸 필터링 시스템
- [ ] 사용자 등급 시스템

## 🎉 완성된 기능들

✅ **AI 모델 연동** - OpenAI GPT-4 Mini + Vision API  
✅ **소셜 플랫폼 OAuth** - 네이버, 인스타그램, 틱톡, 구글  
✅ **실제 플랫폼 API 연동** - 리뷰 게시 기능  
✅ **보안 강화** - 완전한 RLS 정책 구현  
✅ **이메일 알림 시스템** - 다양한 알림 템플릿  
✅ **모바일 최적화 및 PWA** - Progressive Web App  

**상용화 준비 완료!** 🚀