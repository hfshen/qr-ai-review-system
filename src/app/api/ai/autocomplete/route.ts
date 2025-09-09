import { NextRequest, NextResponse } from 'next/server'
import { autoCompleteReview } from '@/lib/advanced-ai'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 리뷰 자동 완성 API
export async function POST(request: NextRequest) {
  try {
    const { partialText, businessType, rating, userId } = await request.json()

    if (!partialText) {
      return NextResponse.json({ error: '부분 텍스트가 필요합니다.' }, { status: 400 })
    }

    // 사용자 프로필 조회
    let userProfile = null
    if (userId) {
      const { data } = await supabase
        .from('user_ai_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      userProfile = data
    }

    const result = await autoCompleteReview(partialText, businessType || 'general', rating || 3, userProfile)
    
    if (result.success && result.completion) {
      // 데이터베이스에 저장
      const { error } = await supabase
        .from('review_autocompletions')
        .insert({
          user_id: userId,
          partial_text: partialText,
          completed_text: result.completion,
          business_type: businessType,
          rating: rating,
          confidence_score: 0.8 // 임시값
        })

      if (error) {
        console.error('Error saving autocompletion:', error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in autocompletion API:', error)
    return NextResponse.json({ error: '자동 완성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
