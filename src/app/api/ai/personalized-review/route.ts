import { NextRequest, NextResponse } from 'next/server'
import { generatePersonalizedReview } from '@/lib/advanced-ai'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 개인화된 리뷰 생성 API
export async function POST(request: NextRequest) {
  try {
    const { originalReview, userProfile, targetPlatform, originalReviewId, userId, platformId } = await request.json()

    if (!originalReview || !userProfile) {
      return NextResponse.json({ error: '원본 리뷰와 사용자 프로필이 필요합니다.' }, { status: 400 })
    }

    const result = await generatePersonalizedReview(originalReview, userProfile, targetPlatform)
    
    if (result.success && result.personalized) {
      // 데이터베이스에 저장
      const { error } = await supabase
        .from('personalized_reviews')
        .insert({
          original_review_id: originalReviewId,
          user_id: userId,
          platform_id: platformId,
          original_review: originalReview,
          personalized_review: result.personalized.personalized_review,
          tone_adjustment: result.personalized.tone_adjustment,
          length_adjustment: result.personalized.length_adjustment,
          style_preferences: result.personalized.style_preferences
        })

      if (error) {
        console.error('Error saving personalized review:', error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in personalized review API:', error)
    return NextResponse.json({ error: '개인화된 리뷰 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
