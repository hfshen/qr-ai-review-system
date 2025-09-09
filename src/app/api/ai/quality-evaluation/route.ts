import { NextRequest, NextResponse } from 'next/server'
import { evaluateReviewQuality } from '@/lib/advanced-ai'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 리뷰 품질 평가 API
export async function POST(request: NextRequest) {
  try {
    const { review, businessType, rating, reviewId, userId } = await request.json()

    if (!review) {
      return NextResponse.json({ error: '리뷰 텍스트가 필요합니다.' }, { status: 400 })
    }

    const result = await evaluateReviewQuality(review, businessType, rating)
    
    if (result.success && result.quality) {
      // 데이터베이스에 저장
      const { error } = await supabase
        .from('review_quality_scores')
        .insert({
          review_id: reviewId,
          user_id: userId,
          overall_score: result.quality.overall_score,
          grammar_score: result.quality.criteria.grammar,
          relevance_score: result.quality.criteria.relevance,
          helpfulness_score: result.quality.criteria.helpfulness,
          authenticity_score: result.quality.criteria.authenticity,
          completeness_score: result.quality.criteria.completeness,
          suggestions: result.quality.suggestions,
          is_spam: result.quality.is_spam,
          spam_probability: result.quality.spam_probability
        })

      if (error) {
        console.error('Error saving quality score:', error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in quality evaluation API:', error)
    return NextResponse.json({ error: '품질 평가 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
