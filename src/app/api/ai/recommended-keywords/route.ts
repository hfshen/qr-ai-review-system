import { NextRequest, NextResponse } from 'next/server'
import { generateRecommendedKeywords } from '@/lib/advanced-ai'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 추천 키워드 생성 API
export async function POST(request: NextRequest) {
  try {
    const { businessType, rating, userProfileId } = await request.json()

    if (!businessType || !rating) {
      return NextResponse.json({ error: '비즈니스 유형과 별점이 필요합니다.' }, { status: 400 })
    }

    // 사용자 프로필 조회
    let userProfile = null
    if (userProfileId) {
      const { data } = await supabase
        .from('user_ai_profiles')
        .select('*')
        .eq('id', userProfileId)
        .single()
      
      userProfile = data
    }

    const result = await generateRecommendedKeywords(businessType, rating, userProfile)
    
    if (result.success && result.keywords) {
      // 데이터베이스에 저장 또는 업데이트
      const { error } = await supabase
        .from('ai_recommended_keywords')
        .upsert({
          business_type: businessType,
          rating: rating,
          keywords: result.keywords,
          user_profile_id: userProfileId,
          usage_count: 1
        }, {
          onConflict: 'business_type,rating,user_profile_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error saving recommended keywords:', error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in recommended keywords API:', error)
    return NextResponse.json({ error: '추천 키워드 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
