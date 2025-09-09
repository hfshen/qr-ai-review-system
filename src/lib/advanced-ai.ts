import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
    disgust: number
  }
  keywords: string[]
}

export interface ReviewQuality {
  overall_score: number
  criteria: {
    grammar: number
    relevance: number
    helpfulness: number
    authenticity: number
    completeness: number
  }
  suggestions: string[]
  is_spam: boolean
  spam_probability: number
}

export interface PersonalizedReview {
  original_review: string
  personalized_review: string
  tone_adjustment: 'formal' | 'casual' | 'friendly' | 'professional'
  length_adjustment: 'short' | 'medium' | 'long'
  style_preferences: {
    use_emojis: boolean
    use_hashtags: boolean
    use_exclamations: boolean
    use_questions: boolean
  }
}

export interface UserProfile {
  user_id: string
  writing_style: {
    average_length: number
    preferred_tone: string
    common_words: string[]
    emoji_usage: number
    punctuation_style: string
  }
  preferences: {
    language: string
    formality: 'formal' | 'casual' | 'mixed'
    topics_of_interest: string[]
    avoid_words: string[]
  }
  behavior_patterns: {
    review_frequency: number
    preferred_platforms: string[]
    active_hours: number[]
    response_patterns: string[]
  }
}

/**
 * 감정 분석 수행
 */
export async function analyzeSentiment(text: string): Promise<{ success: boolean; analysis?: SentimentAnalysis; error?: string }> {
  try {
    const prompt = `
다음 리뷰 텍스트의 감정을 분석해주세요:

"${text}"

다음 JSON 형식으로 응답해주세요:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "emotions": {
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "surprise": 0.0-1.0,
    "disgust": 0.0-1.0
  },
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, analysis }
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    return { success: false, error: '감정 분석 중 오류가 발생했습니다.' }
  }
}

/**
 * 리뷰 품질 평가
 */
export async function evaluateReviewQuality(
  review: string,
  businessType?: string,
  rating?: number
): Promise<{ success: boolean; quality?: ReviewQuality; error?: string }> {
  try {
    const prompt = `
다음 리뷰의 품질을 평가해주세요:

리뷰: "${review}"
비즈니스 유형: ${businessType || '일반'}
별점: ${rating || '미지정'}

다음 기준으로 평가해주세요:
1. 문법 및 맞춤법 (0-100)
2. 관련성 (0-100)
3. 도움됨 (0-100)
4. 진정성 (0-100)
5. 완성도 (0-100)

다음 JSON 형식으로 응답해주세요:
{
  "overall_score": 0-100,
  "criteria": {
    "grammar": 0-100,
    "relevance": 0-100,
    "helpfulness": 0-100,
    "authenticity": 0-100,
    "completeness": 0-100
  },
  "suggestions": ["개선 제안1", "개선 제안2"],
  "is_spam": true/false,
  "spam_probability": 0.0-1.0
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800
    })

    const quality = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, quality }
  } catch (error) {
    console.error('Error evaluating review quality:', error)
    return { success: false, error: '리뷰 품질 평가 중 오류가 발생했습니다.' }
  }
}

/**
 * 개인화된 리뷰 생성
 */
export async function generatePersonalizedReview(
  originalReview: string,
  userProfile: UserProfile,
  targetPlatform: string
): Promise<{ success: boolean; personalized?: PersonalizedReview; error?: string }> {
  try {
    const prompt = `
다음 리뷰를 사용자의 선호도에 맞게 개인화해주세요:

원본 리뷰: "${originalReview}"
사용자 프로필: ${JSON.stringify(userProfile)}
대상 플랫폼: ${targetPlatform}

다음 JSON 형식으로 응답해주세요:
{
  "original_review": "원본 리뷰",
  "personalized_review": "개인화된 리뷰",
  "tone_adjustment": "formal" | "casual" | "friendly" | "professional",
  "length_adjustment": "short" | "medium" | "long",
  "style_preferences": {
    "use_emojis": true/false,
    "use_hashtags": true/false,
    "use_exclamations": true/false,
    "use_questions": true/false
  }
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    })

    const personalized = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, personalized }
  } catch (error) {
    console.error('Error generating personalized review:', error)
    return { success: false, error: '개인화된 리뷰 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 프로필 분석 및 업데이트
 */
export async function analyzeUserProfile(
  userId: string,
  reviews: string[]
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const prompt = `
다음 사용자의 리뷰들을 분석하여 프로필을 생성해주세요:

사용자 ID: ${userId}
리뷰들: ${JSON.stringify(reviews)}

다음 JSON 형식으로 응답해주세요:
{
  "user_id": "${userId}",
  "writing_style": {
    "average_length": 숫자,
    "preferred_tone": "문자열",
    "common_words": ["단어1", "단어2"],
    "emoji_usage": 0.0-1.0,
    "punctuation_style": "문자열"
  },
  "preferences": {
    "language": "ko",
    "formality": "formal" | "casual" | "mixed",
    "topics_of_interest": ["주제1", "주제2"],
    "avoid_words": ["단어1", "단어2"]
  },
  "behavior_patterns": {
    "review_frequency": 숫자,
    "preferred_platforms": ["플랫폼1", "플랫폼2"],
    "active_hours": [시간1, 시간2],
    "response_patterns": ["패턴1", "패턴2"]
  }
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1200
    })

    const profile = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, profile }
  } catch (error) {
    console.error('Error analyzing user profile:', error)
    return { success: false, error: '사용자 프로필 분석 중 오류가 발생했습니다.' }
  }
}

/**
 * 리뷰 추천 키워드 생성
 */
export async function generateRecommendedKeywords(
  businessType: string,
  rating: number,
  userProfile?: UserProfile
): Promise<{ success: boolean; keywords?: string[]; error?: string }> {
  try {
    const prompt = `
다음 조건에 맞는 리뷰 키워드를 추천해주세요:

비즈니스 유형: ${businessType}
별점: ${rating}/5
사용자 프로필: ${userProfile ? JSON.stringify(userProfile) : '없음'}

별점에 따른 키워드 스타일:
- 5점: 매우 긍정적, 추천하는 키워드
- 4점: 긍정적, 만족스러운 키워드
- 3점: 중립적, 보통인 키워드
- 2점: 부정적, 아쉬운 키워드
- 1점: 매우 부정적, 불만족 키워드

다음 JSON 형식으로 응답해주세요:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, keywords: result.keywords }
  } catch (error) {
    console.error('Error generating recommended keywords:', error)
    return { success: false, error: '추천 키워드 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 리뷰 자동 완성
 */
export async function autoCompleteReview(
  partialText: string,
  businessType: string,
  rating: number,
  userProfile?: UserProfile
): Promise<{ success: boolean; completion?: string; error?: string }> {
  try {
    const prompt = `
다음 부분적인 리뷰 텍스트를 완성해주세요:

부분 텍스트: "${partialText}"
비즈니스 유형: ${businessType}
별점: ${rating}/5
사용자 프로필: ${userProfile ? JSON.stringify(userProfile) : '없음'}

자연스럽고 일관성 있는 리뷰로 완성해주세요. 원래 텍스트의 톤과 스타일을 유지하면서 의미를 보완해주세요.

완성된 리뷰만 텍스트로 응답해주세요.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    const completion = response.choices[0].message.content || ''
    return { success: true, completion }
  } catch (error) {
    console.error('Error auto-completing review:', error)
    return { success: false, error: '리뷰 자동 완성 중 오류가 발생했습니다.' }
  }
}

/**
 * 리뷰 번역
 */
export async function translateReview(
  text: string,
  targetLanguage: string,
  preserveTone: boolean = true
): Promise<{ success: boolean; translation?: string; error?: string }> {
  try {
    const prompt = `
다음 리뷰를 ${targetLanguage}로 번역해주세요:

원본: "${text}"

번역 시 다음 사항을 고려해주세요:
- 원본의 톤과 감정을 유지
- 문화적 맥락에 맞게 조정
- 자연스러운 표현 사용
- 리뷰의 목적과 의도를 보존

번역된 텍스트만 응답해주세요.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600
    })

    const translation = response.choices[0].message.content || ''
    return { success: true, translation }
  } catch (error) {
    console.error('Error translating review:', error)
    return { success: false, error: '리뷰 번역 중 오류가 발생했습니다.' }
  }
}

/**
 * 리뷰 요약
 */
export async function summarizeReview(
  text: string,
  maxLength: number = 100
): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const prompt = `
다음 리뷰를 ${maxLength}자 이내로 요약해주세요:

원본: "${text}"

요약 시 다음 사항을 고려해주세요:
- 핵심 내용과 감정 유지
- 중요한 키워드 포함
- 자연스러운 문장으로 구성
- 원본의 톤 유지

요약된 텍스트만 응답해주세요.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    })

    const summary = response.choices[0].message.content || ''
    return { success: true, summary }
  } catch (error) {
    console.error('Error summarizing review:', error)
    return { success: false, error: '리뷰 요약 중 오류가 발생했습니다.' }
  }
}

/**
 * 감정 기반 리뷰 생성
 */
export async function generateEmotionBasedReview(
  businessType: string,
  rating: number,
  targetEmotion: 'joy' | 'satisfaction' | 'disappointment' | 'anger' | 'surprise',
  userProfile?: UserProfile
): Promise<{ success: boolean; review?: string; error?: string }> {
  try {
    const emotionPrompts = {
      joy: '기쁨과 만족감을 표현하는',
      satisfaction: '만족스러운 경험을 강조하는',
      disappointment: '아쉬움과 실망을 표현하는',
      anger: '불만과 화를 표현하는',
      surprise: '놀라움과 예상외의 경험을 표현하는'
    }

    const prompt = `
다음 조건에 맞는 리뷰를 생성해주세요:

비즈니스 유형: ${businessType}
별점: ${rating}/5
감정: ${emotionPrompts[targetEmotion]}
사용자 프로필: ${userProfile ? JSON.stringify(userProfile) : '없음'}

자연스럽고 진정성 있는 리뷰를 생성해주세요. 지정된 감정을 잘 표현하면서도 비즈니스에 대한 구체적인 피드백을 포함해주세요.

생성된 리뷰만 텍스트로 응답해주세요.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 400
    })

    const review = response.choices[0].message.content || ''
    return { success: true, review }
  } catch (error) {
    console.error('Error generating emotion-based review:', error)
    return { success: false, error: '감정 기반 리뷰 생성 중 오류가 발생했습니다.' }
  }
}
