import { NextRequest, NextResponse } from 'next/server'
import { 
  analyzeSentiment, 
  evaluateReviewQuality, 
  generatePersonalizedReview,
  analyzeUserProfile,
  generateRecommendedKeywords,
  autoCompleteReview,
  translateReview,
  summarizeReview,
  generateEmotionBasedReview
} from '@/lib/advanced-ai'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 감정 분석 API
export async function POST(request: NextRequest) {
  try {
    const { text, reviewId, userId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: '텍스트가 필요합니다.' }, { status: 400 })
    }

    const result = await analyzeSentiment(text)
    
    if (result.success && result.analysis) {
      // 데이터베이스에 저장
      const { error } = await supabase
        .from('sentiment_analysis')
        .insert({
          review_id: reviewId,
          user_id: userId,
          sentiment: result.analysis.sentiment,
          confidence: result.analysis.confidence,
          emotions: result.analysis.emotions,
          keywords: result.analysis.keywords
        })

      if (error) {
        console.error('Error saving sentiment analysis:', error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in sentiment analysis API:', error)
    return NextResponse.json({ error: '감정 분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
