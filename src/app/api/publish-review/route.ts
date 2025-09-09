import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PublishReviewRequest {
  reviewId: string
  platformIds: number[]
  content: string
  images?: string[]
  userId: string
}

export interface PublishReviewResponse {
  success: boolean
  results?: {
    platformId: number
    platformName: string
    success: boolean
    error?: string
    postId?: string
  }[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishReviewRequest = await request.json()
    const { reviewId, platformIds, content, images, userId } = body

    if (!reviewId || !platformIds || !content || !userId) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 })
    }

    // 사용자의 연동된 플랫폼 확인
    const { data: userPlatforms, error: userPlatformsError } = await supabase
      .from('user_platforms')
      .select(`
        platform_id,
        connected,
        account_identifier,
        platforms (
          id,
          code,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('connected', true)
      .in('platform_id', platformIds)

    if (userPlatformsError) {
      throw userPlatformsError
    }

    if (!userPlatforms || userPlatforms.length === 0) {
      return NextResponse.json({
        success: false,
        error: '연동된 플랫폼이 없습니다.'
      }, { status: 400 })
    }

    // 각 플랫폼에 리뷰 게시
    const results = await Promise.all(
      userPlatforms.map(async (userPlatform) => {
        try {
          const platform = userPlatform.platforms as any
          let result

          switch (platform.code) {
            case 'naver':
              result = await publishToNaver(content, images, userPlatform.account_identifier)
              break
            case 'instagram':
              result = await publishToInstagram(content, images, userPlatform.account_identifier)
              break
            case 'tiktok':
              result = await publishToTikTok(content, images, userPlatform.account_identifier)
              break
            case 'google':
              result = await publishToGoogle(content, images, userPlatform.account_identifier)
              break
            default:
              throw new Error(`지원하지 않는 플랫폼: ${platform.code}`)
          }

          return {
            platformId: platform.id,
            platformName: platform.name,
            success: true,
            postId: result.postId
          }
        } catch (error) {
          return {
            platformId: userPlatform.platform_id,
            platformName: (userPlatform.platforms as any).name,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          }
        }
      })
    )

    // 리뷰 상태 업데이트
    const successCount = results.filter(r => r.success).length
    const status = successCount > 0 ? 'published' : 'failed'

    await supabase
      .from('reviews')
      .update({ 
        status,
        published_at: successCount > 0 ? new Date().toISOString() : null
      })
      .eq('id', reviewId)

    return NextResponse.json({
      success: successCount > 0,
      results
    })

  } catch (error) {
    console.error('리뷰 게시 오류:', error)
    return NextResponse.json({
      success: false,
      error: '리뷰 게시 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 네이버 블로그 게시
async function publishToNaver(content: string, images?: string[], accountIdentifier?: string) {
  // 실제 네이버 블로그 API 연동
  // 현재는 Mock 구현
  console.log('네이버 블로그 게시:', { content, images, accountIdentifier })
  
  return {
    postId: `naver_${Date.now()}`,
    url: `https://blog.naver.com/${accountIdentifier}/${Date.now()}`
  }
}

// 인스타그램 게시
async function publishToInstagram(content: string, images?: string[], accountIdentifier?: string) {
  // 실제 인스타그램 Graph API 연동
  // 현재는 Mock 구현
  console.log('인스타그램 게시:', { content, images, accountIdentifier })
  
  return {
    postId: `instagram_${Date.now()}`,
    url: `https://instagram.com/p/${Date.now()}`
  }
}

// 틱톡 게시
async function publishToTikTok(content: string, images?: string[], accountIdentifier?: string) {
  // 실제 틱톡 API 연동
  // 현재는 Mock 구현
  console.log('틱톡 게시:', { content, images, accountIdentifier })
  
  return {
    postId: `tiktok_${Date.now()}`,
    url: `https://tiktok.com/@${accountIdentifier}/video/${Date.now()}`
  }
}

// 구글 리뷰 게시
async function publishToGoogle(content: string, images?: string[], accountIdentifier?: string) {
  // 실제 구글 My Business API 연동
  // 현재는 Mock 구현
  console.log('구글 리뷰 게시:', { content, images, accountIdentifier })
  
  return {
    postId: `google_${Date.now()}`,
    url: `https://google.com/maps/reviews/${Date.now()}`
  }
}
