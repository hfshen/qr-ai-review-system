// 다국어 지원 시스템
export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export interface Translation {
  key: string
  value: string
  language: string
}

export const supportedLanguages: Language[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
]

// 기본 번역 데이터
export const defaultTranslations: Record<string, Record<string, string>> = {
  ko: {
    // 공통
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다',
    'common.success': '성공했습니다',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.save': '저장',
    'common.delete': '삭제',
    'common.edit': '편집',
    'common.add': '추가',
    'common.search': '검색',
    'common.filter': '필터',
    'common.sort': '정렬',
    'common.refresh': '새로고침',
    'common.back': '뒤로',
    'common.next': '다음',
    'common.previous': '이전',
    'common.close': '닫기',
    'common.open': '열기',
    'common.view': '보기',
    'common.details': '상세보기',
    'common.more': '더보기',
    'common.less': '접기',
    
    // 인증
    'auth.login': '로그인',
    'auth.logout': '로그아웃',
    'auth.register': '회원가입',
    'auth.email': '이메일',
    'auth.password': '비밀번호',
    'auth.confirmPassword': '비밀번호 확인',
    'auth.forgotPassword': '비밀번호 찾기',
    'auth.resetPassword': '비밀번호 재설정',
    'auth.loginRequired': '로그인이 필요합니다',
    'auth.invalidCredentials': '잘못된 인증 정보입니다',
    'auth.accountCreated': '계정이 생성되었습니다',
    'auth.loginSuccess': '로그인되었습니다',
    'auth.logoutSuccess': '로그아웃되었습니다',
    
    // 네비게이션
    'nav.home': '홈',
    'nav.dashboard': '대시보드',
    'nav.admin': '관리자',
    'nav.marketplace': '마켓플레이스',
    'nav.profile': '프로필',
    'nav.settings': '설정',
    'nav.help': '도움말',
    'nav.about': '소개',
    'nav.contact': '문의',
    
    // 대시보드
    'dashboard.title': '대시보드',
    'dashboard.welcome': '환영합니다',
    'dashboard.overview': '개요',
    'dashboard.statistics': '통계',
    'dashboard.recentActivity': '최근 활동',
    'dashboard.quickActions': '빠른 작업',
    'dashboard.notifications': '알림',
    'dashboard.messages': '메시지',
    
    // 리뷰
    'review.title': '리뷰',
    'review.create': '리뷰 작성',
    'review.edit': '리뷰 편집',
    'review.delete': '리뷰 삭제',
    'review.content': '리뷰 내용',
    'review.rating': '평점',
    'review.platform': '플랫폼',
    'review.status': '상태',
    'review.pending': '대기 중',
    'review.approved': '승인됨',
    'review.rejected': '거부됨',
    'review.published': '게시됨',
    'review.draft': '초안',
    'review.submit': '제출',
    'review.approve': '승인',
    'review.reject': '거부',
    'review.publish': '게시',
    
    // 포인트
    'points.balance': '포인트 잔액',
    'points.earn': '포인트 획득',
    'points.use': '포인트 사용',
    'points.history': '포인트 내역',
    'points.deposit': '포인트 충전',
    'points.withdraw': '포인트 출금',
    'points.transaction': '포인트 거래',
    'points.reward': '포인트 보상',
    'points.purchase': '포인트 구매',
    'points.insufficient': '포인트가 부족합니다',
    'points.success': '포인트가 성공적으로 처리되었습니다',
    
    // 마켓플레이스
    'marketplace.title': '마켓플레이스',
    'marketplace.products': '상품',
    'marketplace.categories': '카테고리',
    'marketplace.price': '가격',
    'marketplace.buy': '구매',
    'marketplace.sell': '판매',
    'marketplace.cart': '장바구니',
    'marketplace.checkout': '결제',
    'marketplace.order': '주문',
    'marketplace.delivery': '배송',
    'marketplace.return': '반품',
    'marketplace.refund': '환불',
    
    // 관리자
    'admin.title': '관리자',
    'admin.users': '사용자',
    'admin.agencies': '에이전시',
    'admin.branches': '지점',
    'admin.reviews': '리뷰',
    'admin.platforms': '플랫폼',
    'admin.keywords': '키워드',
    'admin.statistics': '통계',
    'admin.settings': '설정',
    'admin.permissions': '권한',
    'admin.roles': '역할',
    'admin.logs': '로그',
    'admin.reports': '보고서',
    
    // 에러 메시지
    'error.network': '네트워크 오류가 발생했습니다',
    'error.server': '서버 오류가 발생했습니다',
    'error.notFound': '요청한 리소스를 찾을 수 없습니다',
    'error.unauthorized': '권한이 없습니다',
    'error.forbidden': '접근이 금지되었습니다',
    'error.validation': '입력값이 올바르지 않습니다',
    'error.duplicate': '중복된 데이터입니다',
    'error.expired': '만료된 요청입니다',
    'error.rateLimit': '요청 한도를 초과했습니다',
    
    // 성공 메시지
    'success.created': '성공적으로 생성되었습니다',
    'success.updated': '성공적으로 업데이트되었습니다',
    'success.deleted': '성공적으로 삭제되었습니다',
    'success.saved': '성공적으로 저장되었습니다',
    'success.sent': '성공적으로 전송되었습니다',
    'success.uploaded': '성공적으로 업로드되었습니다',
    'success.downloaded': '성공적으로 다운로드되었습니다',
    
    // AI 리뷰
    'ai.title': 'AI 리뷰 생성',
    'ai.generate': '리뷰 생성',
    'ai.regenerate': '다시 생성',
    'ai.customize': '커스터마이즈',
    'ai.tone': '톤',
    'ai.length': '길이',
    'ai.keywords': '키워드',
    'ai.style': '스타일',
    'ai.formal': '격식체',
    'ai.casual': '비격식체',
    'ai.friendly': '친근한',
    'ai.professional': '전문적인',
    'ai.short': '짧게',
    'ai.medium': '보통',
    'ai.long': '길게',
    
    // QR 코드
    'qr.title': 'QR 코드',
    'qr.generate': 'QR 코드 생성',
    'qr.scan': 'QR 코드 스캔',
    'qr.download': 'QR 코드 다운로드',
    'qr.print': 'QR 코드 인쇄',
    'qr.share': 'QR 코드 공유',
    'qr.branch': '지점 QR 코드',
    'qr.review': '리뷰 QR 코드',
    'qr.campaign': '캠페인 QR 코드',
    
    // 통계
    'stats.title': '통계',
    'stats.overview': '개요',
    'stats.reviews': '리뷰',
    'stats.users': '사용자',
    'stats.platforms': '플랫폼',
    'stats.revenue': '수익',
    'stats.growth': '성장률',
    'stats.trends': '트렌드',
    'stats.analytics': '분석',
    'stats.reports': '보고서',
    'stats.export': '내보내기',
    'stats.import': '가져오기',
    
    // 설정
    'settings.title': '설정',
    'settings.profile': '프로필',
    'settings.account': '계정',
    'settings.privacy': '개인정보',
    'settings.security': '보안',
    'settings.notifications': '알림',
    'settings.language': '언어',
    'settings.theme': '테마',
    'settings.preferences': '환경설정',
    'settings.advanced': '고급',
    'settings.about': '정보',
    'settings.help': '도움말',
    'settings.support': '지원',
    'settings.feedback': '피드백',
    'settings.terms': '이용약관',
    'settings.privacyPolicy': '개인정보처리방침',
    'settings.cookies': '쿠키 정책'
  },
  
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.view': 'View',
    'common.details': 'Details',
    'common.more': 'More',
    'common.less': 'Less',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password',
    'auth.resetPassword': 'Reset Password',
    'auth.loginRequired': 'Login required',
    'auth.invalidCredentials': 'Invalid credentials',
    'auth.accountCreated': 'Account created',
    'auth.loginSuccess': 'Login successful',
    'auth.logoutSuccess': 'Logout successful',
    
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.marketplace': 'Marketplace',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.statistics': 'Statistics',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.notifications': 'Notifications',
    'dashboard.messages': 'Messages',
    
    // Review
    'review.title': 'Review',
    'review.create': 'Create Review',
    'review.edit': 'Edit Review',
    'review.delete': 'Delete Review',
    'review.content': 'Review Content',
    'review.rating': 'Rating',
    'review.platform': 'Platform',
    'review.status': 'Status',
    'review.pending': 'Pending',
    'review.approved': 'Approved',
    'review.rejected': 'Rejected',
    'review.published': 'Published',
    'review.draft': 'Draft',
    'review.submit': 'Submit',
    'review.approve': 'Approve',
    'review.reject': 'Reject',
    'review.publish': 'Publish',
    
    // Points
    'points.balance': 'Point Balance',
    'points.earn': 'Earn Points',
    'points.use': 'Use Points',
    'points.history': 'Point History',
    'points.deposit': 'Deposit Points',
    'points.withdraw': 'Withdraw Points',
    'points.transaction': 'Point Transaction',
    'points.reward': 'Point Reward',
    'points.purchase': 'Point Purchase',
    'points.insufficient': 'Insufficient points',
    'points.success': 'Points processed successfully',
    
    // Marketplace
    'marketplace.title': 'Marketplace',
    'marketplace.products': 'Products',
    'marketplace.categories': 'Categories',
    'marketplace.price': 'Price',
    'marketplace.buy': 'Buy',
    'marketplace.sell': 'Sell',
    'marketplace.cart': 'Cart',
    'marketplace.checkout': 'Checkout',
    'marketplace.order': 'Order',
    'marketplace.delivery': 'Delivery',
    'marketplace.return': 'Return',
    'marketplace.refund': 'Refund',
    
    // Admin
    'admin.title': 'Admin',
    'admin.users': 'Users',
    'admin.agencies': 'Agencies',
    'admin.branches': 'Branches',
    'admin.reviews': 'Reviews',
    'admin.platforms': 'Platforms',
    'admin.keywords': 'Keywords',
    'admin.statistics': 'Statistics',
    'admin.settings': 'Settings',
    'admin.permissions': 'Permissions',
    'admin.roles': 'Roles',
    'admin.logs': 'Logs',
    'admin.reports': 'Reports',
    
    // Error Messages
    'error.network': 'Network error occurred',
    'error.server': 'Server error occurred',
    'error.notFound': 'Requested resource not found',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Access forbidden',
    'error.validation': 'Invalid input',
    'error.duplicate': 'Duplicate data',
    'error.expired': 'Request expired',
    'error.rateLimit': 'Rate limit exceeded',
    
    // Success Messages
    'success.created': 'Successfully created',
    'success.updated': 'Successfully updated',
    'success.deleted': 'Successfully deleted',
    'success.saved': 'Successfully saved',
    'success.sent': 'Successfully sent',
    'success.uploaded': 'Successfully uploaded',
    'success.downloaded': 'Successfully downloaded',
    
    // AI Review
    'ai.title': 'AI Review Generation',
    'ai.generate': 'Generate Review',
    'ai.regenerate': 'Regenerate',
    'ai.customize': 'Customize',
    'ai.tone': 'Tone',
    'ai.length': 'Length',
    'ai.keywords': 'Keywords',
    'ai.style': 'Style',
    'ai.formal': 'Formal',
    'ai.casual': 'Casual',
    'ai.friendly': 'Friendly',
    'ai.professional': 'Professional',
    'ai.short': 'Short',
    'ai.medium': 'Medium',
    'ai.long': 'Long',
    
    // QR Code
    'qr.title': 'QR Code',
    'qr.generate': 'Generate QR Code',
    'qr.scan': 'Scan QR Code',
    'qr.download': 'Download QR Code',
    'qr.print': 'Print QR Code',
    'qr.share': 'Share QR Code',
    'qr.branch': 'Branch QR Code',
    'qr.review': 'Review QR Code',
    'qr.campaign': 'Campaign QR Code',
    
    // Statistics
    'stats.title': 'Statistics',
    'stats.overview': 'Overview',
    'stats.reviews': 'Reviews',
    'stats.users': 'Users',
    'stats.platforms': 'Platforms',
    'stats.revenue': 'Revenue',
    'stats.growth': 'Growth Rate',
    'stats.trends': 'Trends',
    'stats.analytics': 'Analytics',
    'stats.reports': 'Reports',
    'stats.export': 'Export',
    'stats.import': 'Import',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.preferences': 'Preferences',
    'settings.advanced': 'Advanced',
    'settings.about': 'About',
    'settings.help': 'Help',
    'settings.support': 'Support',
    'settings.feedback': 'Feedback',
    'settings.terms': 'Terms of Service',
    'settings.privacyPolicy': 'Privacy Policy',
    'settings.cookies': 'Cookie Policy'
  }
}

// 언어 감지 및 설정
export function detectLanguage(): string {
  if (typeof window === 'undefined') return 'ko'
  
  // 1. 로컬 스토리지에서 언어 설정 확인
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage && supportedLanguages.find(lang => lang.code === savedLanguage)) {
    return savedLanguage
  }
  
  // 2. 브라우저 언어 설정 확인
  const browserLanguage = navigator.language.split('-')[0]
  if (supportedLanguages.find(lang => lang.code === browserLanguage)) {
    return browserLanguage
  }
  
  // 3. 기본값 반환
  return 'ko'
}

export function setLanguage(languageCode: string): void {
  if (typeof window === 'undefined') return
  
  if (supportedLanguages.find(lang => lang.code === languageCode)) {
    localStorage.setItem('language', languageCode)
    // 언어 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: languageCode }))
  }
}

export function getLanguage(): string {
  return detectLanguage()
}

export function getLanguageName(languageCode: string): string {
  const language = supportedLanguages.find(lang => lang.code === languageCode)
  return language ? language.nativeName : '한국어'
}

export function getLanguageFlag(languageCode: string): string {
  const language = supportedLanguages.find(lang => lang.code === languageCode)
  return language ? language.flag : '🇰🇷'
}

// 번역 함수
export function t(key: string, language?: string): string {
  const currentLanguage = language || getLanguage()
  const translations = defaultTranslations[currentLanguage] || defaultTranslations['ko']
  return translations[key] || key
}

// 다국어 지원 React Hook
export function useTranslation(language?: string) {
  const currentLanguage = language || getLanguage()
  
  return {
    t: (key: string) => t(key, currentLanguage),
    language: currentLanguage,
    setLanguage: (lang: string) => setLanguage(lang),
    supportedLanguages,
    getLanguageName: (code: string) => getLanguageName(code),
    getLanguageFlag: (code: string) => getLanguageFlag(code)
  }
}
