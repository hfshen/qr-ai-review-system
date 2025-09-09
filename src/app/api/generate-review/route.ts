import { NextRequest, NextResponse } from 'next/server'
import { generateReview, convertImagesToBase64 } from '@/lib/ai-review'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rating, keywords, branchInfo, images } = body

    if (!rating || !keywords || !branchInfo) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 })
    }

    // 이미지가 있는 경우 Base64로 변환
    let base64Images: string[] = []
    if (images && images.length > 0) {
      // 이미지가 이미 Base64 형태인지 확인
      if (typeof images[0] === 'string' && images[0].startsWith('data:')) {
        // 이미 Base64 형태인 경우
        base64Images = images.map((img: string) => {
          // data:image/jpeg;base64, 부분을 제거
          return img.split(',')[1]
        })
      } else {
        // File 객체인 경우 (실제로는 브라우저에서만 가능)
        console.log('File objects detected, converting to base64...')
        // 실제 구현에서는 클라이언트에서 Base64로 변환해서 보내야 함
        base64Images = []
      }
    }

    // AI 리뷰 생성
    const result = await generateReview({
      images: base64Images,
      keywords,
      rating,
      branchInfo,
      userPreferences: {
        tone: 'friendly',
        language: 'ko'
      }
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        review: result.content,
        usage: result.usage
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '리뷰 생성에 실패했습니다.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}