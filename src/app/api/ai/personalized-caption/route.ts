import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createBrowserClient } from '@supabase/ssr'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { 
      review, 
      branch, 
      platformId, 
      userId, 
      userPreferences = {},
      previousCaptions = []
    } = await request.json()

    if (!review || !branch || !platformId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 행동 패턴 분석
    const userPatterns = await analyzeUserPatterns(userId, platformId)
    
    // 플랫폼별 최적화된 프롬프트 생성
    const prompt = generatePersonalizedPrompt(
      review, 
      branch, 
      platformId, 
      userPatterns, 
      userPreferences,
      previousCaptions
    )

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 소셜 미디어 전문가이자 개인화된 콘텐츠 생성자입니다. 사용자의 과거 행동 패턴과 선호도를 분석하여 최적화된 캡션을 생성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const personalizedCaption = completion.choices[0]?.message?.content || ''
    
    // 생성된 캡션을 데이터베이스에 저장 (학습용)
    await saveCaptionForLearning(userId, platformId, personalizedCaption, review)

    return NextResponse.json({ 
      caption: personalizedCaption,
      patterns: userPatterns,
      optimization: {
        engagement: calculateEngagementScore(personalizedCaption, platformId),
        readability: calculateReadabilityScore(personalizedCaption),
        platformOptimization: getPlatformOptimization(personalizedCaption, platformId)
      }
    })
  } catch (error) {
    console.error('개인화된 캡션 생성 오류:', error)
    return NextResponse.json(
      { error: '개인화된 캡션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 행동 패턴 분석
async function analyzeUserPatterns(userId: string, platformId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // 사용자의 과거 캡션 분석
    const { data: pastCaptions } = await supabase
      .from('user_caption_history')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', platformId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 사용자의 포인트 획득 패턴 분석
    const { data: pointHistory } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .like('source', `${platformId}_%`)
      .order('created_at', { ascending: false })
      .limit(20)

    // 사용자의 리뷰 작성 패턴 분석
    const { data: reviewHistory } = await supabase
      .from('reviews')
      .select('rating, keywords, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      captionStyle: analyzeCaptionStyle(pastCaptions || []),
      engagementLevel: analyzeEngagementLevel(pointHistory || []),
      reviewPatterns: analyzeReviewPatterns(reviewHistory || []),
      platformPreference: analyzePlatformPreference(pointHistory || []),
      optimalPostingTime: analyzePostingTime(pointHistory || [])
    }
  } catch (error) {
    console.error('사용자 패턴 분석 오류:', error)
    return {
      captionStyle: 'balanced',
      engagementLevel: 'medium',
      reviewPatterns: { averageRating: 4, commonKeywords: [] },
      platformPreference: 'neutral',
      optimalPostingTime: 'anytime'
    }
  }
}

// 개인화된 프롬프트 생성
function generatePersonalizedPrompt(
  review: { rating: number; keywords: string[]; content: string }, 
  branch: { name: string; address: string; category: string }, 
  platformId: string, 
  userPatterns: { captionStyle: string; engagementLevel: string; reviewPatterns: { averageRating: number; commonKeywords: string[] }; platformPreference: string; optimalPostingTime: string }, 
  userPreferences: { tone: string; length: string; emoji: boolean },
  previousCaptions: string[]
) {
  const platformTemplates = {
    naver: {
      base: `네이버 플레이스 방문자리뷰용 캡션을 생성해주세요.`,
      requirements: [
        '200-400자 내외',
        '방문 인증을 암시하는 표현 포함',
        '메뉴명, 시간대, 동행자 정보 포함',
        '과장하지 않고 솔직한 톤',
        '영수증 첨부를 암시하는 문구 포함'
      ]
    },
    instagram: {
      base: `인스타그램용 캡션을 생성해주세요.`,
      requirements: [
        '80-140자 + 해시태그 6-15개',
        '트렌디하고 감성적인 톤',
        '지역, 메뉴, 분위기 해시태그 조합',
        '스토리텔링 요소 포함',
        '인터랙션을 유도하는 질문 포함'
      ]
    },
    xiaohongshu: {
      base: `샤오홍슈용 중국어 캡션을 생성해주세요.`,
      requirements: [
        '400-800자 스토리형',
        '도입-경험-한줄평 구조',
        '작은 아쉬움 1개 포함 (신뢰도 향상)',
        '현지 어투와 유행어 사용',
        '장소 태그 암시'
      ]
    }
  }

  const template = platformTemplates[platformId as keyof typeof platformTemplates]
  const ratingStars = '⭐'.repeat(review.rating)
  
  return `${template.base}

리뷰 정보:
- 가게명: ${branch.name}
- 평점: ${ratingStars} (${review.rating}/5점)
- 리뷰 내용: ${review.content}
- 키워드: ${review.keywords?.join(', ') || '없음'}

사용자 패턴 분석:
- 캡션 스타일: ${userPatterns.captionStyle}
- 참여도 수준: ${userPatterns.engagementLevel}
- 평균 평점: ${userPatterns.reviewPatterns.averageRating}
- 선호도: ${userPatterns.platformPreference}

요구사항:
${template.requirements.map(req => `- ${req}`).join('\n')}

사용자 선호사항:
- 톤: ${userPreferences.tone || '자연스러운'}
- 길이: ${userPreferences.length || '적당한'}
- 스타일: ${userPreferences.style || '균형잡힌'}

이전 캡션 참고 (피해야 할 반복):
${previousCaptions.slice(0, 3).map(caption => `- ${caption.substring(0, 50)}...`).join('\n')}

위 정보를 바탕으로 개인화되고 최적화된 캡션을 생성해주세요.`
}

// 캡션 스타일 분석
function analyzeCaptionStyle(captions: { content: string }[]) {
  if (captions.length === 0) return 'balanced'
  
  const avgLength = captions.reduce((sum, c) => sum + c.content.length, 0) / captions.length
  
  if (avgLength < 100) return 'concise'
  if (avgLength > 300) return 'detailed'
  return 'balanced'
}

// 참여도 수준 분석
function analyzeEngagementLevel(pointHistory: { points: number; source: string }[]) {
  if (pointHistory.length === 0) return 'medium'
  
  const avgPoints = pointHistory.reduce((sum, p) => sum + p.points, 0) / pointHistory.length
  
  if (avgPoints > 25) return 'high'
  if (avgPoints < 15) return 'low'
  return 'medium'
}

// 리뷰 패턴 분석
function analyzeReviewPatterns(reviewHistory: { rating: number; keywords: string[] }[]) {
  if (reviewHistory.length === 0) return { averageRating: 4, commonKeywords: [] }
  
  const avgRating = reviewHistory.reduce((sum, r) => sum + r.rating, 0) / reviewHistory.length
  const allKeywords = reviewHistory.flatMap(r => r.keywords || [])
  const keywordCounts = allKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const commonKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([keyword]) => keyword)
  
  return { averageRating: avgRating, commonKeywords }
}

// 플랫폼 선호도 분석
function analyzePlatformPreference(pointHistory: { source: string }[]) {
  if (pointHistory.length === 0) return 'neutral'
  
  const platformCounts = pointHistory.reduce((acc, p) => {
    const platform = p.source.split('_')[0]
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const maxPlatform = Object.entries(platformCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  return maxPlatform || 'neutral'
}

// 포스팅 시간 분석
function analyzePostingTime(pointHistory: { created_at: string }[]) {
  if (pointHistory.length === 0) return 'anytime'
  
  const hours = pointHistory.map(p => new Date(p.created_at).getHours())
  const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length
  
  if (avgHour >= 6 && avgHour < 12) return 'morning'
  if (avgHour >= 12 && avgHour < 18) return 'afternoon'
  if (avgHour >= 18 && avgHour < 22) return 'evening'
  return 'anytime'
}

// 캡션을 학습용으로 저장
async function saveCaptionForLearning(
  userId: string, 
  platformId: string, 
  caption: string, 
  review: { id: string; rating: number; keywords: string[] }
) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    await supabase
      .from('user_caption_history')
      .insert({
        user_id: userId,
        platform_id: platformId,
        content: caption,
        review_id: review.id,
        rating: review.rating,
        keywords: review.keywords
      })
  } catch (error) {
    console.error('캡션 저장 오류:', error)
  }
}

// 참여도 점수 계산
function calculateEngagementScore(caption: string, platformId: string) {
  let score = 0
  
  // 길이 최적화
  const length = caption.length
  if (platformId === 'instagram' && length >= 80 && length <= 140) score += 20
  if (platformId === 'naver' && length >= 200 && length <= 400) score += 20
  if (platformId === 'xiaohongshu' && length >= 400 && length <= 800) score += 20
  
  // 해시태그 개수
  const hashtagCount = (caption.match(/#/g) || []).length
  if (platformId === 'instagram' && hashtagCount >= 6 && hashtagCount <= 15) score += 15
  
  // 감정 표현
  const emotionWords = ['좋아요', '맛있어요', '추천', '최고', '완벽', '대박']
  const emotionCount = emotionWords.filter(word => caption.includes(word)).length
  score += emotionCount * 5
  
  // 질문 포함
  if (caption.includes('?')) score += 10
  
  return Math.min(score, 100)
}

// 가독성 점수 계산
function calculateReadabilityScore(caption: string) {
  const sentences = caption.split(/[.!?]/).filter(s => s.trim().length > 0)
  const avgSentenceLength = caption.length / sentences.length
  
  let score = 100
  
  // 문장 길이 최적화 (10-20자)
  if (avgSentenceLength < 10) score -= 20
  if (avgSentenceLength > 30) score -= 30
  
  // 줄바꿈 활용
  if (caption.includes('\n')) score += 10
  
  return Math.max(score, 0)
}

// 플랫폼 최적화 점수
function getPlatformOptimization(caption: string, platformId: string) {
  const optimizations = {
    naver: {
      hasLocation: caption.includes('📍') ? 20 : 0,
      hasRating: caption.includes('⭐') ? 15 : 0,
      hasReceiptHint: caption.includes('영수증') || caption.includes('결제') ? 25 : 0,
      appropriateLength: caption.length >= 200 && caption.length <= 400 ? 20 : 0
    },
    instagram: {
      hasHashtags: (caption.match(/#/g) || []).length >= 6 ? 25 : 0,
      hasEmoji: (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length > 0 ? 15 : 0,
      hasQuestion: caption.includes('?') ? 20 : 0,
      appropriateLength: caption.length >= 80 && caption.length <= 140 ? 20 : 0
    },
    xiaohongshu: {
      hasStoryStructure: caption.includes('今天') && caption.includes('真的') ? 30 : 0,
      hasLocationTag: caption.includes('📍') ? 20 : 0,
      hasChineseHashtags: (caption.match(/#[\u4e00-\u9fff]/g) || []).length >= 3 ? 25 : 0,
      appropriateLength: caption.length >= 400 && caption.length <= 800 ? 25 : 0
    }
  }
  
  const platformOpt = optimizations[platformId as keyof typeof optimizations]
  if (!platformOpt) return 0
  
  return Object.values(platformOpt).reduce((sum, score) => sum + score, 0)
}
