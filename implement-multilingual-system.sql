-- 다국어 지원 시스템 데이터베이스 스키마
-- 번역 관리 및 다국어 콘텐츠 지원

-- 1. 지원 언어 테이블
CREATE TABLE IF NOT EXISTS supported_languages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(5) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    flag VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 번역 키 테이블
CREATE TABLE IF NOT EXISTS translation_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'common',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 번역 값 테이블
CREATE TABLE IF NOT EXISTS translation_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL REFERENCES supported_languages(code) ON DELETE CASCADE,
    value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_id, language_code)
);

-- 4. 사용자 언어 설정 테이블
CREATE TABLE IF NOT EXISTS user_language_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL REFERENCES supported_languages(code) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language_code)
);

-- 5. 기본 지원 언어 데이터 삽입
INSERT INTO supported_languages (code, name, native_name, flag, is_default) VALUES
('ko', 'Korean', '한국어', '🇰🇷', true),
('en', 'English', 'English', '🇺🇸', false),
('ja', 'Japanese', '日本語', '🇯🇵', false),
('zh', 'Chinese', '中文', '🇨🇳', false),
('es', 'Spanish', 'Español', '🇪🇸', false),
('fr', 'French', 'Français', '🇫🇷', false),
('de', 'German', 'Deutsch', '🇩🇪', false),
('ru', 'Russian', 'Русский', '🇷🇺', false)
ON CONFLICT (code) DO NOTHING;

-- 6. 기본 번역 키 데이터 삽입
INSERT INTO translation_keys (key, category, description) VALUES
-- 공통
('common.loading', 'common', '로딩 중 메시지'),
('common.error', 'common', '일반 오류 메시지'),
('common.success', 'common', '성공 메시지'),
('common.cancel', 'common', '취소 버튼'),
('common.confirm', 'common', '확인 버튼'),
('common.save', 'common', '저장 버튼'),
('common.delete', 'common', '삭제 버튼'),
('common.edit', 'common', '편집 버튼'),
('common.add', 'common', '추가 버튼'),
('common.search', 'common', '검색 버튼'),
('common.filter', 'common', '필터 버튼'),
('common.sort', 'common', '정렬 버튼'),
('common.refresh', 'common', '새로고침 버튼'),
('common.back', 'common', '뒤로 버튼'),
('common.next', 'common', '다음 버튼'),
('common.previous', 'common', '이전 버튼'),
('common.close', 'common', '닫기 버튼'),
('common.open', 'common', '열기 버튼'),
('common.view', 'common', '보기 버튼'),
('common.details', 'common', '상세보기 버튼'),
('common.more', 'common', '더보기 버튼'),
('common.less', 'common', '접기 버튼'),

-- 인증
('auth.login', 'auth', '로그인'),
('auth.logout', 'auth', '로그아웃'),
('auth.register', 'auth', '회원가입'),
('auth.email', 'auth', '이메일'),
('auth.password', 'auth', '비밀번호'),
('auth.confirmPassword', 'auth', '비밀번호 확인'),
('auth.forgotPassword', 'auth', '비밀번호 찾기'),
('auth.resetPassword', 'auth', '비밀번호 재설정'),
('auth.loginRequired', 'auth', '로그인 필요 메시지'),
('auth.invalidCredentials', 'auth', '잘못된 인증 정보 메시지'),
('auth.accountCreated', 'auth', '계정 생성 완료 메시지'),
('auth.loginSuccess', 'auth', '로그인 성공 메시지'),
('auth.logoutSuccess', 'auth', '로그아웃 성공 메시지'),

-- 네비게이션
('nav.home', 'nav', '홈'),
('nav.dashboard', 'nav', '대시보드'),
('nav.admin', 'nav', '관리자'),
('nav.marketplace', 'nav', '마켓플레이스'),
('nav.profile', 'nav', '프로필'),
('nav.settings', 'nav', '설정'),
('nav.help', 'nav', '도움말'),
('nav.about', 'nav', '소개'),
('nav.contact', 'nav', '문의'),

-- 대시보드
('dashboard.title', 'dashboard', '대시보드 제목'),
('dashboard.welcome', 'dashboard', '환영 메시지'),
('dashboard.overview', 'dashboard', '개요'),
('dashboard.statistics', 'dashboard', '통계'),
('dashboard.recentActivity', 'dashboard', '최근 활동'),
('dashboard.quickActions', 'dashboard', '빠른 작업'),
('dashboard.notifications', 'dashboard', '알림'),
('dashboard.messages', 'dashboard', '메시지'),

-- 리뷰
('review.title', 'review', '리뷰'),
('review.create', 'review', '리뷰 작성'),
('review.edit', 'review', '리뷰 편집'),
('review.delete', 'review', '리뷰 삭제'),
('review.content', 'review', '리뷰 내용'),
('review.rating', 'review', '평점'),
('review.platform', 'review', '플랫폼'),
('review.status', 'review', '상태'),
('review.pending', 'review', '대기 중'),
('review.approved', 'review', '승인됨'),
('review.rejected', 'review', '거부됨'),
('review.published', 'review', '게시됨'),
('review.draft', 'review', '초안'),
('review.submit', 'review', '제출'),
('review.approve', 'review', '승인'),
('review.reject', 'review', '거부'),
('review.publish', 'review', '게시'),

-- 포인트
('points.balance', 'points', '포인트 잔액'),
('points.earn', 'points', '포인트 획득'),
('points.use', 'points', '포인트 사용'),
('points.history', 'points', '포인트 내역'),
('points.deposit', 'points', '포인트 충전'),
('points.withdraw', 'points', '포인트 출금'),
('points.transaction', 'points', '포인트 거래'),
('points.reward', 'points', '포인트 보상'),
('points.purchase', 'points', '포인트 구매'),
('points.insufficient', 'points', '포인트 부족 메시지'),
('points.success', 'points', '포인트 처리 성공 메시지'),

-- 마켓플레이스
('marketplace.title', 'marketplace', '마켓플레이스'),
('marketplace.products', 'marketplace', '상품'),
('marketplace.categories', 'marketplace', '카테고리'),
('marketplace.price', 'marketplace', '가격'),
('marketplace.buy', 'marketplace', '구매'),
('marketplace.sell', 'marketplace', '판매'),
('marketplace.cart', 'marketplace', '장바구니'),
('marketplace.checkout', 'marketplace', '결제'),
('marketplace.order', 'marketplace', '주문'),
('marketplace.delivery', 'marketplace', '배송'),
('marketplace.return', 'marketplace', '반품'),
('marketplace.refund', 'marketplace', '환불'),

-- 관리자
('admin.title', 'admin', '관리자'),
('admin.users', 'admin', '사용자'),
('admin.agencies', 'admin', '에이전시'),
('admin.branches', 'admin', '지점'),
('admin.reviews', 'admin', '리뷰'),
('admin.platforms', 'admin', '플랫폼'),
('admin.keywords', 'admin', '키워드'),
('admin.statistics', 'admin', '통계'),
('admin.settings', 'admin', '설정'),
('admin.permissions', 'admin', '권한'),
('admin.roles', 'admin', '역할'),
('admin.logs', 'admin', '로그'),
('admin.reports', 'admin', '보고서'),

-- 에러 메시지
('error.network', 'error', '네트워크 오류'),
('error.server', 'error', '서버 오류'),
('error.notFound', 'error', '리소스 없음'),
('error.unauthorized', 'error', '권한 없음'),
('error.forbidden', 'error', '접근 금지'),
('error.validation', 'error', '입력값 오류'),
('error.duplicate', 'error', '중복 데이터'),
('error.expired', 'error', '만료된 요청'),
('error.rateLimit', 'error', '요청 한도 초과'),

-- 성공 메시지
('success.created', 'success', '생성 성공'),
('success.updated', 'success', '업데이트 성공'),
('success.deleted', 'success', '삭제 성공'),
('success.saved', 'success', '저장 성공'),
('success.sent', 'success', '전송 성공'),
('success.uploaded', 'success', '업로드 성공'),
('success.downloaded', 'success', '다운로드 성공'),

-- AI 리뷰
('ai.title', 'ai', 'AI 리뷰 생성'),
('ai.generate', 'ai', '리뷰 생성'),
('ai.regenerate', 'ai', '다시 생성'),
('ai.customize', 'ai', '커스터마이즈'),
('ai.tone', 'ai', '톤'),
('ai.length', 'ai', '길이'),
('ai.keywords', 'ai', '키워드'),
('ai.style', 'ai', '스타일'),
('ai.formal', 'ai', '격식체'),
('ai.casual', 'ai', '비격식체'),
('ai.friendly', 'ai', '친근한'),
('ai.professional', 'ai', '전문적인'),
('ai.short', 'ai', '짧게'),
('ai.medium', 'ai', '보통'),
('ai.long', 'ai', '길게'),

-- QR 코드
('qr.title', 'qr', 'QR 코드'),
('qr.generate', 'qr', 'QR 코드 생성'),
('qr.scan', 'qr', 'QR 코드 스캔'),
('qr.download', 'qr', 'QR 코드 다운로드'),
('qr.print', 'qr', 'QR 코드 인쇄'),
('qr.share', 'qr', 'QR 코드 공유'),
('qr.branch', 'qr', '지점 QR 코드'),
('qr.review', 'qr', '리뷰 QR 코드'),
('qr.campaign', 'qr', '캠페인 QR 코드'),

-- 통계
('stats.title', 'stats', '통계'),
('stats.overview', 'stats', '개요'),
('stats.reviews', 'stats', '리뷰'),
('stats.users', 'stats', '사용자'),
('stats.platforms', 'stats', '플랫폼'),
('stats.revenue', 'stats', '수익'),
('stats.growth', 'stats', '성장률'),
('stats.trends', 'stats', '트렌드'),
('stats.analytics', 'stats', '분석'),
('stats.reports', 'stats', '보고서'),
('stats.export', 'stats', '내보내기'),
('stats.import', 'stats', '가져오기'),

-- 설정
('settings.title', 'settings', '설정'),
('settings.profile', 'settings', '프로필'),
('settings.account', 'settings', '계정'),
('settings.privacy', 'settings', '개인정보'),
('settings.security', 'settings', '보안'),
('settings.notifications', 'settings', '알림'),
('settings.language', 'settings', '언어'),
('settings.theme', 'settings', '테마'),
('settings.preferences', 'settings', '환경설정'),
('settings.advanced', 'settings', '고급'),
('settings.about', 'settings', '정보'),
('settings.help', 'settings', '도움말'),
('settings.support', 'settings', '지원'),
('settings.feedback', 'settings', '피드백'),
('settings.terms', 'settings', '이용약관'),
('settings.privacyPolicy', 'settings', '개인정보처리방침'),
('settings.cookies', 'settings', '쿠키 정책')
ON CONFLICT (key) DO NOTHING;

-- 7. 기본 한국어 번역 값 삽입
INSERT INTO translation_values (key_id, language_code, value)
SELECT 
    tk.id,
    'ko',
    CASE tk.key
        -- 공통
        WHEN 'common.loading' THEN '로딩 중...'
        WHEN 'common.error' THEN '오류가 발생했습니다'
        WHEN 'common.success' THEN '성공했습니다'
        WHEN 'common.cancel' THEN '취소'
        WHEN 'common.confirm' THEN '확인'
        WHEN 'common.save' THEN '저장'
        WHEN 'common.delete' THEN '삭제'
        WHEN 'common.edit' THEN '편집'
        WHEN 'common.add' THEN '추가'
        WHEN 'common.search' THEN '검색'
        WHEN 'common.filter' THEN '필터'
        WHEN 'common.sort' THEN '정렬'
        WHEN 'common.refresh' THEN '새로고침'
        WHEN 'common.back' THEN '뒤로'
        WHEN 'common.next' THEN '다음'
        WHEN 'common.previous' THEN '이전'
        WHEN 'common.close' THEN '닫기'
        WHEN 'common.open' THEN '열기'
        WHEN 'common.view' THEN '보기'
        WHEN 'common.details' THEN '상세보기'
        WHEN 'common.more' THEN '더보기'
        WHEN 'common.less' THEN '접기'
        
        -- 인증
        WHEN 'auth.login' THEN '로그인'
        WHEN 'auth.logout' THEN '로그아웃'
        WHEN 'auth.register' THEN '회원가입'
        WHEN 'auth.email' THEN '이메일'
        WHEN 'auth.password' THEN '비밀번호'
        WHEN 'auth.confirmPassword' THEN '비밀번호 확인'
        WHEN 'auth.forgotPassword' THEN '비밀번호 찾기'
        WHEN 'auth.resetPassword' THEN '비밀번호 재설정'
        WHEN 'auth.loginRequired' THEN '로그인이 필요합니다'
        WHEN 'auth.invalidCredentials' THEN '잘못된 인증 정보입니다'
        WHEN 'auth.accountCreated' THEN '계정이 생성되었습니다'
        WHEN 'auth.loginSuccess' THEN '로그인되었습니다'
        WHEN 'auth.logoutSuccess' THEN '로그아웃되었습니다'
        
        -- 네비게이션
        WHEN 'nav.home' THEN '홈'
        WHEN 'nav.dashboard' THEN '대시보드'
        WHEN 'nav.admin' THEN '관리자'
        WHEN 'nav.marketplace' THEN '마켓플레이스'
        WHEN 'nav.profile' THEN '프로필'
        WHEN 'nav.settings' THEN '설정'
        WHEN 'nav.help' THEN '도움말'
        WHEN 'nav.about' THEN '소개'
        WHEN 'nav.contact' THEN '문의'
        
        -- 대시보드
        WHEN 'dashboard.title' THEN '대시보드'
        WHEN 'dashboard.welcome' THEN '환영합니다'
        WHEN 'dashboard.overview' THEN '개요'
        WHEN 'dashboard.statistics' THEN '통계'
        WHEN 'dashboard.recentActivity' THEN '최근 활동'
        WHEN 'dashboard.quickActions' THEN '빠른 작업'
        WHEN 'dashboard.notifications' THEN '알림'
        WHEN 'dashboard.messages' THEN '메시지'
        
        -- 리뷰
        WHEN 'review.title' THEN '리뷰'
        WHEN 'review.create' THEN '리뷰 작성'
        WHEN 'review.edit' THEN '리뷰 편집'
        WHEN 'review.delete' THEN '리뷰 삭제'
        WHEN 'review.content' THEN '리뷰 내용'
        WHEN 'review.rating' THEN '평점'
        WHEN 'review.platform' THEN '플랫폼'
        WHEN 'review.status' THEN '상태'
        WHEN 'review.pending' THEN '대기 중'
        WHEN 'review.approved' THEN '승인됨'
        WHEN 'review.rejected' THEN '거부됨'
        WHEN 'review.published' THEN '게시됨'
        WHEN 'review.draft' THEN '초안'
        WHEN 'review.submit' THEN '제출'
        WHEN 'review.approve' THEN '승인'
        WHEN 'review.reject' THEN '거부'
        WHEN 'review.publish' THEN '게시'
        
        -- 포인트
        WHEN 'points.balance' THEN '포인트 잔액'
        WHEN 'points.earn' THEN '포인트 획득'
        WHEN 'points.use' THEN '포인트 사용'
        WHEN 'points.history' THEN '포인트 내역'
        WHEN 'points.deposit' THEN '포인트 충전'
        WHEN 'points.withdraw' THEN '포인트 출금'
        WHEN 'points.transaction' THEN '포인트 거래'
        WHEN 'points.reward' THEN '포인트 보상'
        WHEN 'points.purchase' THEN '포인트 구매'
        WHEN 'points.insufficient' THEN '포인트가 부족합니다'
        WHEN 'points.success' THEN '포인트가 성공적으로 처리되었습니다'
        
        -- 마켓플레이스
        WHEN 'marketplace.title' THEN '마켓플레이스'
        WHEN 'marketplace.products' THEN '상품'
        WHEN 'marketplace.categories' THEN '카테고리'
        WHEN 'marketplace.price' THEN '가격'
        WHEN 'marketplace.buy' THEN '구매'
        WHEN 'marketplace.sell' THEN '판매'
        WHEN 'marketplace.cart' THEN '장바구니'
        WHEN 'marketplace.checkout' THEN '결제'
        WHEN 'marketplace.order' THEN '주문'
        WHEN 'marketplace.delivery' THEN '배송'
        WHEN 'marketplace.return' THEN '반품'
        WHEN 'marketplace.refund' THEN '환불'
        
        -- 관리자
        WHEN 'admin.title' THEN '관리자'
        WHEN 'admin.users' THEN '사용자'
        WHEN 'admin.agencies' THEN '에이전시'
        WHEN 'admin.branches' THEN '지점'
        WHEN 'admin.reviews' THEN '리뷰'
        WHEN 'admin.platforms' THEN '플랫폼'
        WHEN 'admin.keywords' THEN '키워드'
        WHEN 'admin.statistics' THEN '통계'
        WHEN 'admin.settings' THEN '설정'
        WHEN 'admin.permissions' THEN '권한'
        WHEN 'admin.roles' THEN '역할'
        WHEN 'admin.logs' THEN '로그'
        WHEN 'admin.reports' THEN '보고서'
        
        -- 에러 메시지
        WHEN 'error.network' THEN '네트워크 오류가 발생했습니다'
        WHEN 'error.server' THEN '서버 오류가 발생했습니다'
        WHEN 'error.notFound' THEN '요청한 리소스를 찾을 수 없습니다'
        WHEN 'error.unauthorized' THEN '권한이 없습니다'
        WHEN 'error.forbidden' THEN '접근이 금지되었습니다'
        WHEN 'error.validation' THEN '입력값이 올바르지 않습니다'
        WHEN 'error.duplicate' THEN '중복된 데이터입니다'
        WHEN 'error.expired' THEN '만료된 요청입니다'
        WHEN 'error.rateLimit' THEN '요청 한도를 초과했습니다'
        
        -- 성공 메시지
        WHEN 'success.created' THEN '성공적으로 생성되었습니다'
        WHEN 'success.updated' THEN '성공적으로 업데이트되었습니다'
        WHEN 'success.deleted' THEN '성공적으로 삭제되었습니다'
        WHEN 'success.saved' THEN '성공적으로 저장되었습니다'
        WHEN 'success.sent' THEN '성공적으로 전송되었습니다'
        WHEN 'success.uploaded' THEN '성공적으로 업로드되었습니다'
        WHEN 'success.downloaded' THEN '성공적으로 다운로드되었습니다'
        
        -- AI 리뷰
        WHEN 'ai.title' THEN 'AI 리뷰 생성'
        WHEN 'ai.generate' THEN '리뷰 생성'
        WHEN 'ai.regenerate' THEN '다시 생성'
        WHEN 'ai.customize' THEN '커스터마이즈'
        WHEN 'ai.tone' THEN '톤'
        WHEN 'ai.length' THEN '길이'
        WHEN 'ai.keywords' THEN '키워드'
        WHEN 'ai.style' THEN '스타일'
        WHEN 'ai.formal' THEN '격식체'
        WHEN 'ai.casual' THEN '비격식체'
        WHEN 'ai.friendly' THEN '친근한'
        WHEN 'ai.professional' THEN '전문적인'
        WHEN 'ai.short' THEN '짧게'
        WHEN 'ai.medium' THEN '보통'
        WHEN 'ai.long' THEN '길게'
        
        -- QR 코드
        WHEN 'qr.title' THEN 'QR 코드'
        WHEN 'qr.generate' THEN 'QR 코드 생성'
        WHEN 'qr.scan' THEN 'QR 코드 스캔'
        WHEN 'qr.download' THEN 'QR 코드 다운로드'
        WHEN 'qr.print' THEN 'QR 코드 인쇄'
        WHEN 'qr.share' THEN 'QR 코드 공유'
        WHEN 'qr.branch' THEN '지점 QR 코드'
        WHEN 'qr.review' THEN '리뷰 QR 코드'
        WHEN 'qr.campaign' THEN '캠페인 QR 코드'
        
        -- 통계
        WHEN 'stats.title' THEN '통계'
        WHEN 'stats.overview' THEN '개요'
        WHEN 'stats.reviews' THEN '리뷰'
        WHEN 'stats.users' THEN '사용자'
        WHEN 'stats.platforms' THEN '플랫폼'
        WHEN 'stats.revenue' THEN '수익'
        WHEN 'stats.growth' THEN '성장률'
        WHEN 'stats.trends' THEN '트렌드'
        WHEN 'stats.analytics' THEN '분석'
        WHEN 'stats.reports' THEN '보고서'
        WHEN 'stats.export' THEN '내보내기'
        WHEN 'stats.import' THEN '가져오기'
        
        -- 설정
        WHEN 'settings.title' THEN '설정'
        WHEN 'settings.profile' THEN '프로필'
        WHEN 'settings.account' THEN '계정'
        WHEN 'settings.privacy' THEN '개인정보'
        WHEN 'settings.security' THEN '보안'
        WHEN 'settings.notifications' THEN '알림'
        WHEN 'settings.language' THEN '언어'
        WHEN 'settings.theme' THEN '테마'
        WHEN 'settings.preferences' THEN '환경설정'
        WHEN 'settings.advanced' THEN '고급'
        WHEN 'settings.about' THEN '정보'
        WHEN 'settings.help' THEN '도움말'
        WHEN 'settings.support' THEN '지원'
        WHEN 'settings.feedback' THEN '피드백'
        WHEN 'settings.terms' THEN '이용약관'
        WHEN 'settings.privacyPolicy' THEN '개인정보처리방침'
        WHEN 'settings.cookies' THEN '쿠키 정책'
        
        ELSE tk.key
    END
FROM translation_keys tk
WHERE NOT EXISTS (
    SELECT 1 FROM translation_values tv 
    WHERE tv.key_id = tk.id AND tv.language_code = 'ko'
);

-- 8. 기본 영어 번역 값 삽입
INSERT INTO translation_values (key_id, language_code, value)
SELECT 
    tk.id,
    'en',
    CASE tk.key
        -- Common
        WHEN 'common.loading' THEN 'Loading...'
        WHEN 'common.error' THEN 'An error occurred'
        WHEN 'common.success' THEN 'Success'
        WHEN 'common.cancel' THEN 'Cancel'
        WHEN 'common.confirm' THEN 'Confirm'
        WHEN 'common.save' THEN 'Save'
        WHEN 'common.delete' THEN 'Delete'
        WHEN 'common.edit' THEN 'Edit'
        WHEN 'common.add' THEN 'Add'
        WHEN 'common.search' THEN 'Search'
        WHEN 'common.filter' THEN 'Filter'
        WHEN 'common.sort' THEN 'Sort'
        WHEN 'common.refresh' THEN 'Refresh'
        WHEN 'common.back' THEN 'Back'
        WHEN 'common.next' THEN 'Next'
        WHEN 'common.previous' THEN 'Previous'
        WHEN 'common.close' THEN 'Close'
        WHEN 'common.open' THEN 'Open'
        WHEN 'common.view' THEN 'View'
        WHEN 'common.details' THEN 'Details'
        WHEN 'common.more' THEN 'More'
        WHEN 'common.less' THEN 'Less'
        
        -- Auth
        WHEN 'auth.login' THEN 'Login'
        WHEN 'auth.logout' THEN 'Logout'
        WHEN 'auth.register' THEN 'Register'
        WHEN 'auth.email' THEN 'Email'
        WHEN 'auth.password' THEN 'Password'
        WHEN 'auth.confirmPassword' THEN 'Confirm Password'
        WHEN 'auth.forgotPassword' THEN 'Forgot Password'
        WHEN 'auth.resetPassword' THEN 'Reset Password'
        WHEN 'auth.loginRequired' THEN 'Login required'
        WHEN 'auth.invalidCredentials' THEN 'Invalid credentials'
        WHEN 'auth.accountCreated' THEN 'Account created'
        WHEN 'auth.loginSuccess' THEN 'Login successful'
        WHEN 'auth.logoutSuccess' THEN 'Logout successful'
        
        -- Navigation
        WHEN 'nav.home' THEN 'Home'
        WHEN 'nav.dashboard' THEN 'Dashboard'
        WHEN 'nav.admin' THEN 'Admin'
        WHEN 'nav.marketplace' THEN 'Marketplace'
        WHEN 'nav.profile' THEN 'Profile'
        WHEN 'nav.settings' THEN 'Settings'
        WHEN 'nav.help' THEN 'Help'
        WHEN 'nav.about' THEN 'About'
        WHEN 'nav.contact' THEN 'Contact'
        
        -- Dashboard
        WHEN 'dashboard.title' THEN 'Dashboard'
        WHEN 'dashboard.welcome' THEN 'Welcome'
        WHEN 'dashboard.overview' THEN 'Overview'
        WHEN 'dashboard.statistics' THEN 'Statistics'
        WHEN 'dashboard.recentActivity' THEN 'Recent Activity'
        WHEN 'dashboard.quickActions' THEN 'Quick Actions'
        WHEN 'dashboard.notifications' THEN 'Notifications'
        WHEN 'dashboard.messages' THEN 'Messages'
        
        -- Review
        WHEN 'review.title' THEN 'Review'
        WHEN 'review.create' THEN 'Create Review'
        WHEN 'review.edit' THEN 'Edit Review'
        WHEN 'review.delete' THEN 'Delete Review'
        WHEN 'review.content' THEN 'Review Content'
        WHEN 'review.rating' THEN 'Rating'
        WHEN 'review.platform' THEN 'Platform'
        WHEN 'review.status' THEN 'Status'
        WHEN 'review.pending' THEN 'Pending'
        WHEN 'review.approved' THEN 'Approved'
        WHEN 'review.rejected' THEN 'Rejected'
        WHEN 'review.published' THEN 'Published'
        WHEN 'review.draft' THEN 'Draft'
        WHEN 'review.submit' THEN 'Submit'
        WHEN 'review.approve' THEN 'Approve'
        WHEN 'review.reject' THEN 'Reject'
        WHEN 'review.publish' THEN 'Publish'
        
        -- Points
        WHEN 'points.balance' THEN 'Point Balance'
        WHEN 'points.earn' THEN 'Earn Points'
        WHEN 'points.use' THEN 'Use Points'
        WHEN 'points.history' THEN 'Point History'
        WHEN 'points.deposit' THEN 'Deposit Points'
        WHEN 'points.withdraw' THEN 'Withdraw Points'
        WHEN 'points.transaction' THEN 'Point Transaction'
        WHEN 'points.reward' THEN 'Point Reward'
        WHEN 'points.purchase' THEN 'Point Purchase'
        WHEN 'points.insufficient' THEN 'Insufficient points'
        WHEN 'points.success' THEN 'Points processed successfully'
        
        -- Marketplace
        WHEN 'marketplace.title' THEN 'Marketplace'
        WHEN 'marketplace.products' THEN 'Products'
        WHEN 'marketplace.categories' THEN 'Categories'
        WHEN 'marketplace.price' THEN 'Price'
        WHEN 'marketplace.buy' THEN 'Buy'
        WHEN 'marketplace.sell' THEN 'Sell'
        WHEN 'marketplace.cart' THEN 'Cart'
        WHEN 'marketplace.checkout' THEN 'Checkout'
        WHEN 'marketplace.order' THEN 'Order'
        WHEN 'marketplace.delivery' THEN 'Delivery'
        WHEN 'marketplace.return' THEN 'Return'
        WHEN 'marketplace.refund' THEN 'Refund'
        
        -- Admin
        WHEN 'admin.title' THEN 'Admin'
        WHEN 'admin.users' THEN 'Users'
        WHEN 'admin.agencies' THEN 'Agencies'
        WHEN 'admin.branches' THEN 'Branches'
        WHEN 'admin.reviews' THEN 'Reviews'
        WHEN 'admin.platforms' THEN 'Platforms'
        WHEN 'admin.keywords' THEN 'Keywords'
        WHEN 'admin.statistics' THEN 'Statistics'
        WHEN 'admin.settings' THEN 'Settings'
        WHEN 'admin.permissions' THEN 'Permissions'
        WHEN 'admin.roles' THEN 'Roles'
        WHEN 'admin.logs' THEN 'Logs'
        WHEN 'admin.reports' THEN 'Reports'
        
        -- Error Messages
        WHEN 'error.network' THEN 'Network error occurred'
        WHEN 'error.server' THEN 'Server error occurred'
        WHEN 'error.notFound' THEN 'Requested resource not found'
        WHEN 'error.unauthorized' THEN 'Unauthorized'
        WHEN 'error.forbidden' THEN 'Access forbidden'
        WHEN 'error.validation' THEN 'Invalid input'
        WHEN 'error.duplicate' THEN 'Duplicate data'
        WHEN 'error.expired' THEN 'Request expired'
        WHEN 'error.rateLimit' THEN 'Rate limit exceeded'
        
        -- Success Messages
        WHEN 'success.created' THEN 'Successfully created'
        WHEN 'success.updated' THEN 'Successfully updated'
        WHEN 'success.deleted' THEN 'Successfully deleted'
        WHEN 'success.saved' THEN 'Successfully saved'
        WHEN 'success.sent' THEN 'Successfully sent'
        WHEN 'success.uploaded' THEN 'Successfully uploaded'
        WHEN 'success.downloaded' THEN 'Successfully downloaded'
        
        -- AI Review
        WHEN 'ai.title' THEN 'AI Review Generation'
        WHEN 'ai.generate' THEN 'Generate Review'
        WHEN 'ai.regenerate' THEN 'Regenerate'
        WHEN 'ai.customize' THEN 'Customize'
        WHEN 'ai.tone' THEN 'Tone'
        WHEN 'ai.length' THEN 'Length'
        WHEN 'ai.keywords' THEN 'Keywords'
        WHEN 'ai.style' THEN 'Style'
        WHEN 'ai.formal' THEN 'Formal'
        WHEN 'ai.casual' THEN 'Casual'
        WHEN 'ai.friendly' THEN 'Friendly'
        WHEN 'ai.professional' THEN 'Professional'
        WHEN 'ai.short' THEN 'Short'
        WHEN 'ai.medium' THEN 'Medium'
        WHEN 'ai.long' THEN 'Long'
        
        -- QR Code
        WHEN 'qr.title' THEN 'QR Code'
        WHEN 'qr.generate' THEN 'Generate QR Code'
        WHEN 'qr.scan' THEN 'Scan QR Code'
        WHEN 'qr.download' THEN 'Download QR Code'
        WHEN 'qr.print' THEN 'Print QR Code'
        WHEN 'qr.share' THEN 'Share QR Code'
        WHEN 'qr.branch' THEN 'Branch QR Code'
        WHEN 'qr.review' THEN 'Review QR Code'
        WHEN 'qr.campaign' THEN 'Campaign QR Code'
        
        -- Statistics
        WHEN 'stats.title' THEN 'Statistics'
        WHEN 'stats.overview' THEN 'Overview'
        WHEN 'stats.reviews' THEN 'Reviews'
        WHEN 'stats.users' THEN 'Users'
        WHEN 'stats.platforms' THEN 'Platforms'
        WHEN 'stats.revenue' THEN 'Revenue'
        WHEN 'stats.growth' THEN 'Growth Rate'
        WHEN 'stats.trends' THEN 'Trends'
        WHEN 'stats.analytics' THEN 'Analytics'
        WHEN 'stats.reports' THEN 'Reports'
        WHEN 'stats.export' THEN 'Export'
        WHEN 'stats.import' THEN 'Import'
        
        -- Settings
        WHEN 'settings.title' THEN 'Settings'
        WHEN 'settings.profile' THEN 'Profile'
        WHEN 'settings.account' THEN 'Account'
        WHEN 'settings.privacy' THEN 'Privacy'
        WHEN 'settings.security' THEN 'Security'
        WHEN 'settings.notifications' THEN 'Notifications'
        WHEN 'settings.language' THEN 'Language'
        WHEN 'settings.theme' THEN 'Theme'
        WHEN 'settings.preferences' THEN 'Preferences'
        WHEN 'settings.advanced' THEN 'Advanced'
        WHEN 'settings.about' THEN 'About'
        WHEN 'settings.help' THEN 'Help'
        WHEN 'settings.support' THEN 'Support'
        WHEN 'settings.feedback' THEN 'Feedback'
        WHEN 'settings.terms' THEN 'Terms of Service'
        WHEN 'settings.privacyPolicy' THEN 'Privacy Policy'
        WHEN 'settings.cookies' THEN 'Cookie Policy'
        
        ELSE tk.key
    END
FROM translation_keys tk
WHERE NOT EXISTS (
    SELECT 1 FROM translation_values tv 
    WHERE tv.key_id = tk.id AND tv.language_code = 'en'
);

-- 9. RLS 정책 설정

-- supported_languages 테이블 RLS
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active languages" ON supported_languages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage languages" ON supported_languages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- translation_keys 테이블 RLS
ALTER TABLE translation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active translation keys" ON translation_keys
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage translation keys" ON translation_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- translation_values 테이블 RLS
ALTER TABLE translation_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active translation values" ON translation_values
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage translation values" ON translation_values
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- user_language_settings 테이블 RLS
ALTER TABLE user_language_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own language settings" ON user_language_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all language settings" ON user_language_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_supported_languages_code ON supported_languages(code);
CREATE INDEX IF NOT EXISTS idx_supported_languages_active ON supported_languages(is_active);
CREATE INDEX IF NOT EXISTS idx_translation_keys_key ON translation_keys(key);
CREATE INDEX IF NOT EXISTS idx_translation_keys_category ON translation_keys(category);
CREATE INDEX IF NOT EXISTS idx_translation_keys_active ON translation_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_translation_values_key_id ON translation_values(key_id);
CREATE INDEX IF NOT EXISTS idx_translation_values_language ON translation_values(language_code);
CREATE INDEX IF NOT EXISTS idx_translation_values_active ON translation_values(is_active);
CREATE INDEX IF NOT EXISTS idx_user_language_settings_user_id ON user_language_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_language_settings_language ON user_language_settings(language_code);

-- 11. 함수 생성 - 번역 조회
CREATE OR REPLACE FUNCTION get_translation(
    translation_key VARCHAR(255),
    language_code VARCHAR(5) DEFAULT 'ko'
)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT tv.value INTO result
    FROM translation_values tv
    JOIN translation_keys tk ON tv.key_id = tk.id
    WHERE tk.key = translation_key 
    AND tv.language_code = language_code
    AND tk.is_active = true
    AND tv.is_active = true;
    
    -- 번역이 없으면 키 자체를 반환
    IF result IS NULL THEN
        result := translation_key;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. 함수 생성 - 사용자 언어 설정 조회
CREATE OR REPLACE FUNCTION get_user_language(user_uuid UUID)
RETURNS VARCHAR(5) AS $$
DECLARE
    result VARCHAR(5);
BEGIN
    SELECT uls.language_code INTO result
    FROM user_language_settings uls
    WHERE uls.user_id = user_uuid
    AND uls.is_primary = true
    ORDER BY uls.updated_at DESC
    LIMIT 1;
    
    -- 설정이 없으면 기본 언어 반환
    IF result IS NULL THEN
        SELECT code INTO result
        FROM supported_languages
        WHERE is_default = true
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(result, 'ko');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE supported_languages IS '지원 언어 목록';
COMMENT ON TABLE translation_keys IS '번역 키 목록';
COMMENT ON TABLE translation_values IS '번역 값 목록';
COMMENT ON TABLE user_language_settings IS '사용자 언어 설정';
COMMENT ON FUNCTION get_translation IS '번역 조회 함수';
COMMENT ON FUNCTION get_user_language IS '사용자 언어 설정 조회 함수';
