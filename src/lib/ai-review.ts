import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ReviewGenerationRequest {
  images: string[] // Base64 encoded images
  keywords: string[]
  rating: number
  branchInfo: {
    name: string
    description?: string
    industry?: string
    address?: string
  }
  userPreferences?: {
    tone?: 'formal' | 'casual' | 'friendly'
    language?: 'ko' | 'en'
  }
}

export interface ReviewGenerationResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function generateReview(request: ReviewGenerationRequest): Promise<ReviewGenerationResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다.'
      }
    }

    // 이미지 분석을 위한 프롬프트 구성
    const imageAnalysisPrompt = request.images.length > 0 
      ? `사용자가 촬영한 ${request.images.length}장의 사진을 분석하여 다음 정보를 파악해주세요:
        - 음식/서비스의 품질과 상태
        - 분위기와 환경
        - 특별한 특징이나 포인트
        - 전반적인 인상`
      : ''

    // 별점에 따른 톤 조정
    const toneByRating = {
      1: '매우 불만족스러운',
      2: '불만족스러운', 
      3: '보통인',
      4: '만족스러운',
      5: '매우 만족스러운'
    }

    // 키워드 기반 추가 정보
    const keywordContext = request.keywords.length > 0 
      ? `사용자가 선택한 키워드: ${request.keywords.join(', ')}`
      : ''

    // 지점 정보 컨텍스트
    const branchContext = `
지점명: ${request.branchInfo.name}
${request.branchInfo.description ? `설명: ${request.branchInfo.description}` : ''}
${request.branchInfo.industry ? `업종: ${request.branchInfo.industry}` : ''}
${request.branchInfo.address ? `주소: ${request.branchInfo.address}` : ''}
    `.trim()

    const systemPrompt = `당신은 전문적인 리뷰 작성 AI입니다. 사용자가 제공한 정보를 바탕으로 자연스럽고 진정성 있는 리뷰를 작성해주세요.

주요 지침:
1. ${toneByRating[request.rating as keyof typeof toneByRating]} 경험을 반영한 톤으로 작성
2. 구체적이고 생생한 표현 사용
3. 과도한 홍보성 표현 지양
4. 개인적인 경험과 감정을 자연스럽게 포함
5. 한국어로 작성 (사용자가 영어를 요청한 경우 제외)
6. 100-200자 내외의 적절한 길이
7. 이모지 사용 금지

${branchContext}

${imageAnalysisPrompt}

${keywordContext}

위 정보를 바탕으로 자연스럽고 진정성 있는 리뷰를 작성해주세요.`

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `${request.rating}점 별점으로 리뷰를 작성해주세요.`
      }
    ]

    // 이미지가 있는 경우 vision 모델 사용
    if (request.images.length > 0) {
      const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = request.images.map(image => ({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
          detail: 'low' // 비용 절약을 위해 low detail 사용
        }
      }))

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: '위 사진들을 분석하여 리뷰를 작성해주세요.'
          },
          ...imageContents
        ]
      })

      // Vision 모델 사용
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      })

      return {
        success: true,
        content: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined
      }
    } else {
      // 텍스트만으로 리뷰 생성
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      })

      return {
        success: true,
        content: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined
      }
    }
  } catch (error) {
    console.error('AI 리뷰 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '리뷰 생성 중 오류가 발생했습니다.'
    }
  }
}

// 이미지를 Base64로 변환하는 유틸리티 함수
export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // data:image/jpeg;base64, 부분을 제거하고 base64 부분만 반환
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 여러 이미지를 Base64로 변환
export async function convertImagesToBase64(files: File[]): Promise<string[]> {
  const promises = files.map(file => convertImageToBase64(file))
  return Promise.all(promises)
}

// Mock 데이터 대신 실제 AI 응답을 사용하는 함수 (기존 코드와의 호환성)
export async function generateMockReview(
  images: string[],
  keywords: string[],
  rating: number,
  branchInfo: any
): Promise<string> {
  const result = await generateReview({
    images,
    keywords,
    rating,
    branchInfo
  })

  if (result.success && result.content) {
    return result.content
  } else {
    // AI 생성 실패 시 기본 템플릿 반환
    const templates = {
      1: '이번 방문은 기대에 못 미쳤습니다. 개선이 필요한 부분이 있어 보입니다.',
      2: '전반적으로 아쉬운 점이 있었습니다. 더 나은 서비스를 기대해봅니다.',
      3: '보통 수준의 경험이었습니다. 특별한 점은 없었지만 나쁘지 않았습니다.',
      4: '만족스러운 경험이었습니다. 좋은 서비스를 받을 수 있어서 기뻤습니다.',
      5: '정말 훌륭한 경험이었습니다! 강력히 추천하고 싶습니다.'
    }
    
    return templates[rating as keyof typeof templates] || templates[3]
  }
}
