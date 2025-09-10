import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { branchName, rating, keywords, images } = await request.json()

    if (!branchName || !rating || !keywords) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 프롬프트 구성
    const prompt = `
다음 정보를 바탕으로 한국어와 중국어로 리뷰를 작성해주세요:

가게명: ${branchName}
평점: ${rating}/5점
키워드: ${keywords.join(', ')}
이미지: ${images}

요구사항:
1. 한국어와 중국어 두 언어로 작성
2. 자연스럽고 진정성 있는 리뷰
3. 평점에 맞는 적절한 내용
4. 선택된 키워드를 자연스럽게 포함
5. 각 언어별로 100-150자 정도
6. 고객의 실제 경험을 바탕으로 한 구체적인 내용

형식:
한국어: [한국어 리뷰 내용]
中文: [중국어 리뷰 내용]
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 전문적인 리뷰 작성자입니다. 고객의 실제 경험을 바탕으로 자연스럽고 진정성 있는 리뷰를 작성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const review = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ review })
  } catch (error) {
    console.error('AI 리뷰 생성 오류:', error)
    return NextResponse.json(
      { error: 'AI 리뷰 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
