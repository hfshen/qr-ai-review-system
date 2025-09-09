import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ContentFilter {
  id: string
  keyword: string
  filter_type: 'spam' | 'inappropriate' | 'profanity' | 'advertisement'
  severity: 'low' | 'medium' | 'high'
  action: 'block' | 'flag' | 'review'
  created_at: string
}

export interface FilteredContent {
  id: string
  content: string
  filter_reason: string
  severity: 'low' | 'medium' | 'high'
  action_taken: 'blocked' | 'flagged' | 'reviewed'
  user_id?: string
  review_id?: string
  created_at: string
}

/**
 * 콘텐츠 필터링 결과
 */
export interface FilterResult {
  isBlocked: boolean
  isFlagged: boolean
  severity: 'low' | 'medium' | 'high'
  reasons: string[]
  suggestedAction: 'block' | 'flag' | 'review' | 'allow'
}

/**
 * 텍스트 콘텐츠 필터링
 */
export async function filterContent(content: string): Promise<FilterResult> {
  try {
    // 1. 스팸 키워드 검사
    const spamResult = await checkSpamKeywords(content)
    
    // 2. 부적절한 콘텐츠 검사
    const inappropriateResult = await checkInappropriateContent(content)
    
    // 3. 욕설 검사
    const profanityResult = await checkProfanity(content)
    
    // 4. 광고성 콘텐츠 검사
    const advertisementResult = await checkAdvertisement(content)
    
    // 5. 결과 종합
    const allReasons = [
      ...spamResult.reasons,
      ...inappropriateResult.reasons,
      ...profanityResult.reasons,
      ...advertisementResult.reasons
    ]
    
    const maxSeverity = Math.max(
      getSeverityLevel(spamResult.severity),
      getSeverityLevel(inappropriateResult.severity),
      getSeverityLevel(profanityResult.severity),
      getSeverityLevel(advertisementResult.severity)
    )
    
    const severity = getSeverityFromLevel(maxSeverity)
    
    // 6. 액션 결정
    let suggestedAction: 'block' | 'flag' | 'review' | 'allow' = 'allow'
    let isBlocked = false
    let isFlagged = false
    
    if (severity === 'high') {
      suggestedAction = 'block'
      isBlocked = true
    } else if (severity === 'medium') {
      suggestedAction = 'flag'
      isFlagged = true
    } else if (severity === 'low') {
      suggestedAction = 'review'
      isFlagged = true
    }
    
    return {
      isBlocked,
      isFlagged,
      severity,
      reasons: allReasons,
      suggestedAction
    }
  } catch (error) {
    console.error('Error filtering content:', error)
    return {
      isBlocked: false,
      isFlagged: false,
      severity: 'low',
      reasons: ['필터링 중 오류가 발생했습니다.'],
      suggestedAction: 'review'
    }
  }
}

/**
 * 스팸 키워드 검사
 */
async function checkSpamKeywords(content: string): Promise<{ severity: 'low' | 'medium' | 'high', reasons: string[] }> {
  const spamKeywords = [
    '무료', '공짜', '이벤트', '할인', '쿠폰', '적립', '포인트', '캐시백',
    '지금', '바로', '즉시', '당장', '지금만', '한정', '특가', '세일',
    '광고', '홍보', '마케팅', '판매', '구매', '주문', '결제', '카드',
    '대출', '보험', '투자', '수익', '부업', '알바', '재택', '부업'
  ]
  
  const foundKeywords = spamKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (foundKeywords.length >= 3) {
    return {
      severity: 'high',
      reasons: [`스팸 키워드 다수 발견: ${foundKeywords.join(', ')}`]
    }
  } else if (foundKeywords.length >= 2) {
    return {
      severity: 'medium',
      reasons: [`스팸 키워드 발견: ${foundKeywords.join(', ')}`]
    }
  } else if (foundKeywords.length >= 1) {
    return {
      severity: 'low',
      reasons: [`스팸 키워드 의심: ${foundKeywords.join(', ')}`]
    }
  }
  
  return { severity: 'low', reasons: [] }
}

/**
 * 부적절한 콘텐츠 검사
 */
async function checkInappropriateContent(content: string): Promise<{ severity: 'low' | 'medium' | 'high', reasons: string[] }> {
  const inappropriateKeywords = [
    '폭력', '살인', '자살', '자해', '약물', '마약', '알코올', '음주',
    '도박', '사기', '절도', '강도', '성폭력', '성추행', '성희롱',
    '혐오', '차별', '인종차별', '성차별', '장애인차별', '연령차별'
  ]
  
  const foundKeywords = inappropriateKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (foundKeywords.length >= 2) {
    return {
      severity: 'high',
      reasons: [`부적절한 콘텐츠 다수 발견: ${foundKeywords.join(', ')}`]
    }
  } else if (foundKeywords.length >= 1) {
    return {
      severity: 'medium',
      reasons: [`부적절한 콘텐츠 발견: ${foundKeywords.join(', ')}`]
    }
  }
  
  return { severity: 'low', reasons: [] }
}

/**
 * 욕설 검사
 */
async function checkProfanity(content: string): Promise<{ severity: 'low' | 'medium' | 'high', reasons: string[] }> {
  const profanityKeywords = [
    '씨발', '개새끼', '병신', '지랄', '좆', '꺼져', '닥쳐', '죽어',
    '바보', '멍청이', '똥', '오줌', '씨', '개', '놈', '년', '새끼'
  ]
  
  const foundKeywords = profanityKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (foundKeywords.length >= 3) {
    return {
      severity: 'high',
      reasons: [`욕설 다수 발견: ${foundKeywords.join(', ')}`]
    }
  } else if (foundKeywords.length >= 2) {
    return {
      severity: 'medium',
      reasons: [`욕설 발견: ${foundKeywords.join(', ')}`]
    }
  } else if (foundKeywords.length >= 1) {
    return {
      severity: 'low',
      reasons: [`욕설 의심: ${foundKeywords.join(', ')}`]
    }
  }
  
  return { severity: 'low', reasons: [] }
}

/**
 * 광고성 콘텐츠 검사
 */
async function checkAdvertisement(content: string): Promise<{ severity: 'low' | 'medium' | 'high', reasons: string[] }> {
  const advertisementPatterns = [
    /https?:\/\/[^\s]+/g, // URL 패턴
    /[0-9]{3}-[0-9]{4}-[0-9]{4}/g, // 전화번호 패턴
    /[가-힣]{2,4}원/g, // 가격 패턴
    /[가-힣]{2,4}할인/g, // 할인 패턴
    /[가-힣]{2,4}쿠폰/g, // 쿠폰 패턴
  ]
  
  const foundPatterns = advertisementPatterns.filter(pattern => 
    pattern.test(content)
  )
  
  if (foundPatterns.length >= 3) {
    return {
      severity: 'high',
      reasons: ['광고성 콘텐츠로 판단됨 (URL, 전화번호, 가격 정보 다수 포함)']
    }
  } else if (foundPatterns.length >= 2) {
    return {
      severity: 'medium',
      reasons: ['광고성 콘텐츠 의심 (URL, 전화번호, 가격 정보 포함)']
    }
  } else if (foundPatterns.length >= 1) {
    return {
      severity: 'low',
      reasons: ['광고성 콘텐츠 가능성 (URL, 전화번호, 가격 정보 일부 포함)']
    }
  }
  
  return { severity: 'low', reasons: [] }
}

/**
 * 심각도 레벨을 숫자로 변환
 */
function getSeverityLevel(severity: 'low' | 'medium' | 'high'): number {
  switch (severity) {
    case 'low': return 1
    case 'medium': return 2
    case 'high': return 3
    default: return 0
  }
}

/**
 * 숫자를 심각도로 변환
 */
function getSeverityFromLevel(level: number): 'low' | 'medium' | 'high' {
  if (level >= 3) return 'high'
  if (level >= 2) return 'medium'
  return 'low'
}

/**
 * 필터링된 콘텐츠 기록 저장
 */
export async function saveFilteredContent(
  content: string,
  filterReason: string,
  severity: 'low' | 'medium' | 'high',
  actionTaken: 'blocked' | 'flagged' | 'reviewed',
  userId?: string,
  reviewId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('filtered_content')
      .insert({
        content,
        filter_reason: filterReason,
        severity,
        action_taken: actionTaken,
        user_id: userId,
        review_id: reviewId
      })

    if (error) {
      console.error('Error saving filtered content:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving filtered content:', error)
    return { success: false, error: '필터링 기록 저장 중 오류가 발생했습니다.' }
  }
}

/**
 * 콘텐츠 필터 규칙 조회
 */
export async function getContentFilters(): Promise<{ success: boolean; filters?: ContentFilter[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('content_filters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching content filters:', error)
      return { success: false, error: error.message }
    }

    return { success: true, filters: data || [] }
  } catch (error) {
    console.error('Error fetching content filters:', error)
    return { success: false, error: '필터 규칙 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 콘텐츠 필터 규칙 추가
 */
export async function addContentFilter(
  keyword: string,
  filterType: 'spam' | 'inappropriate' | 'profanity' | 'advertisement',
  severity: 'low' | 'medium' | 'high',
  action: 'block' | 'flag' | 'review'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_filters')
      .insert({
        keyword,
        filter_type: filterType,
        severity,
        action
      })

    if (error) {
      console.error('Error adding content filter:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding content filter:', error)
    return { success: false, error: '필터 규칙 추가 중 오류가 발생했습니다.' }
  }
}
