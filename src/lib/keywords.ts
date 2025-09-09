import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ReviewKeyword {
  id: number
  rating: number
  keyword: string
}

/**
 * 모든 리뷰 키워드 조회
 */
export async function getAllReviewKeywords(): Promise<{ success: boolean; keywords?: ReviewKeyword[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('review_keywords')
      .select('*')
      .order('rating', { ascending: true })

    if (error) {
      console.error('Error fetching review keywords:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keywords: data || [] }
  } catch (error) {
    console.error('Error fetching review keywords:', error)
    return { success: false, error: '키워드 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 특정 별점의 키워드 조회
 */
export async function getKeywordsByRating(rating: number): Promise<{ success: boolean; keywords?: ReviewKeyword[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('review_keywords')
      .select('*')
      .eq('rating', rating)
      .order('keyword', { ascending: true })

    if (error) {
      console.error('Error fetching keywords by rating:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keywords: data || [] }
  } catch (error) {
    console.error('Error fetching keywords by rating:', error)
    return { success: false, error: '키워드 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 새 키워드 추가
 */
export async function addReviewKeyword(rating: number, keyword: string): Promise<{ success: boolean; keyword?: ReviewKeyword; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('review_keywords')
      .insert({
        rating,
        keyword: keyword.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding review keyword:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keyword: data }
  } catch (error) {
    console.error('Error adding review keyword:', error)
    return { success: false, error: '키워드 추가 중 오류가 발생했습니다.' }
  }
}

/**
 * 키워드 수정
 */
export async function updateReviewKeyword(id: number, keyword: string): Promise<{ success: boolean; keyword?: ReviewKeyword; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('review_keywords')
      .update({
        keyword: keyword.trim()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating review keyword:', error)
      return { success: false, error: error.message }
    }

    return { success: true, keyword: data }
  } catch (error) {
    console.error('Error updating review keyword:', error)
    return { success: false, error: '키워드 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 키워드 삭제
 */
export async function deleteReviewKeyword(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('review_keywords')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting review keyword:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting review keyword:', error)
    return { success: false, error: '키워드 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 기본 키워드 초기화 (관리자용)
 */
export async function initializeDefaultKeywords(): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultKeywords = [
      // 1점 키워드
      { rating: 1, keyword: '매우 불만족' },
      { rating: 1, keyword: '서비스 불친절' },
      { rating: 1, keyword: '음식 맛없음' },
      { rating: 1, keyword: '위생 상태 불량' },
      { rating: 1, keyword: '가격 대비 부족' },
      
      // 2점 키워드
      { rating: 2, keyword: '아쉬운 점 많음' },
      { rating: 2, keyword: '개선 필요' },
      { rating: 2, keyword: '보통 이하' },
      { rating: 2, keyword: '기대 이하' },
      { rating: 2, keyword: '재방문 의사 없음' },
      
      // 3점 키워드
      { rating: 3, keyword: '보통 수준' },
      { rating: 3, keyword: '무난함' },
      { rating: 3, keyword: '괜찮음' },
      { rating: 3, keyword: '평범함' },
      { rating: 3, keyword: '그럭저럭' },
      
      // 4점 키워드
      { rating: 4, keyword: '맛있음' },
      { rating: 4, keyword: '친절한 서비스' },
      { rating: 4, keyword: '깨끗한 환경' },
      { rating: 4, keyword: '가성비 좋음' },
      { rating: 4, keyword: '재방문 의사 있음' },
      
      // 5점 키워드
      { rating: 5, keyword: '완벽함' },
      { rating: 5, keyword: '최고의 맛' },
      { rating: 5, keyword: '훌륭한 서비스' },
      { rating: 5, keyword: '강력 추천' },
      { rating: 5, keyword: '완벽한 경험' }
    ]

    const { error } = await supabase
      .from('review_keywords')
      .insert(defaultKeywords)

    if (error) {
      console.error('Error initializing default keywords:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error initializing default keywords:', error)
    return { success: false, error: '기본 키워드 초기화 중 오류가 발생했습니다.' }
  }
}

/**
 * 별점별 키워드 그룹화
 */
export function groupKeywordsByRating(keywords: ReviewKeyword[]): Record<number, ReviewKeyword[]> {
  return keywords.reduce((groups, keyword) => {
    if (!groups[keyword.rating]) {
      groups[keyword.rating] = []
    }
    groups[keyword.rating].push(keyword)
    return groups
  }, {} as Record<number, ReviewKeyword[]>)
}
