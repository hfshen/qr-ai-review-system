'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Review, Branch, Agency } from '@/types/database'
import Link from 'next/link'

interface PlatformConfig {
  id: string
  name: string
  icon: string
  color: string
  description: string
  instructions: string[]
  captionTemplate: (review: Review, branch: Branch) => string
  shareMethod: 'web-share' | 'deeplink' | 'copy-only'
  deeplinkUrl?: (branch: Branch) => string
}

function PlatformShareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [review, setReview] = useState<Review | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [personalizedCaptions, setPersonalizedCaptions] = useState<Record<string, string>>({})
  const [isGeneratingCaption, setIsGeneratingCaption] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 플랫폼별 설정
  const platformConfigs: PlatformConfig[] = [
    {
      id: 'naver',
      name: '네이버 플레이스',
      icon: '🟢',
      color: 'bg-green-500',
      description: '방문자리뷰로 더 잘 노출돼요',
      instructions: [
        '캡션을 복사하세요',
        '네이버 리뷰 쓰기를 클릭하세요',
        '사진을 선택하고 캡션을 붙여넣으세요',
        '영수증 사진을 첨부하면 더 잘 노출됩니다'
      ],
      captionTemplate: (review, branch) => {
        const ratingStars = '⭐'.repeat(parseInt(review.rating.toString()))
        return `📍 ${branch.name}\n\n${ratingStars} ${review.rating}/5점\n\n${(review as any).content || (review as any).text || ''}\n\n#${branch.name} #리뷰 #방문후기`
      },
      shareMethod: 'deeplink',
      deeplinkUrl: (branch) => {
        // 네이버 지도 딥링크 (실제 좌표 사용)
        const lat = (branch as any).latitude || 37.5665
        const lng = (branch as any).longitude || 126.9780
        return `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(branch.name)}&appname=${encodeURIComponent(window.location.origin)}`
      }
    },
    {
      id: 'instagram',
      name: '인스타그램',
      icon: '📷',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: '피드/릴스/스토리에 게시',
      instructions: [
        '캡션을 복사하세요',
        '인스타그램으로 공유를 클릭하세요',
        '앱에서 붙여넣기하세요',
        '해시태그 6-10개를 추가하세요'
      ],
      captionTemplate: (review, branch) => {
        const hashtags = [
          `#${branch.name.replace(/\s+/g, '')}`,
          '#맛집',
          '#리뷰',
          '#추천',
          '#방문후기',
          '#데이트',
          '#친구모임',
          '#맛스타그램'
        ].join(' ')
        
        return `${(review as any).content || (review as any).text || ''}\n\n📍 ${branch.name} ${'⭐'.repeat(parseInt(review.rating.toString()))}\n\n${hashtags}`
      },
      shareMethod: 'web-share'
    },
    {
      id: 'kakao',
      name: '카카오톡',
      icon: '💬',
      color: 'bg-yellow-500',
      description: '친구들과 공유하기',
      instructions: [
        '캡션을 복사하세요',
        '카카오톡으로 공유를 클릭하세요',
        '친구에게 전송하세요',
        '카카오톡 링크도 함께 공유하세요'
      ],
      captionTemplate: (review, branch) => {
        return `📍 ${branch.name} 방문 후기\n\n${'⭐'.repeat(parseInt(review.rating.toString()))} ${review.rating}/5점\n\n${(review as any).content || (review as any).text || ''}\n\n#${branch.name} #리뷰 #추천`
      },
      shareMethod: 'web-share'
    },
    {
      id: 'facebook',
      name: '페이스북',
      icon: '📘',
      color: 'bg-blue-600',
      description: '페이스북 포스트로 공유',
      instructions: [
        '캡션을 복사하세요',
        '페이스북으로 공유를 클릭하세요',
        '포스트에 붙여넣기하세요',
        '위치 태그를 추가하세요'
      ],
      captionTemplate: (review, branch) => {
        return `📍 ${branch.name}\n\n${'⭐'.repeat(parseInt(review.rating.toString()))} ${review.rating}/5점\n\n${(review as any).content || (review as any).text || ''}\n\n#${branch.name} #리뷰 #추천 #방문후기`
      },
      shareMethod: 'web-share'
    }
  ]

  useEffect(() => {
    const reviewId = searchParams.get('review_id')
    if (!reviewId) {
      router.push('/')
      return
    }

    fetchData(reviewId)
  }, [searchParams, router])

  const fetchData = async (reviewId: string) => {
    try {
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          branches (
            id,
            name,
            address,
            latitude,
            longitude,
            agencies (
              id,
              name
            )
          )
        `)
        .eq('id', reviewId)
        .single()

      if (reviewError) throw reviewError

      setReview(reviewData)
      setBranch(reviewData.branches)
      setAgency(reviewData.branches.agencies)
    } catch (error: any) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const generatePersonalizedCaption = async (platformId: string) => {
    if (!review || !branch) return

    setIsGeneratingCaption(platformId)
    try {
      const response = await fetch('/api/ai/personalized-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review,
          branch,
          platformId,
          userPreferences: {
            tone: '자연스러운',
            length: '적당한',
            style: '균형잡힌'
          }
        }),
      })

      if (!response.ok) throw new Error('개인화된 캡션 생성 실패')

      const data = await response.json()
      setPersonalizedCaptions(prev => ({
        ...prev,
        [platformId]: data.caption
      }))
    } catch (error) {
      console.error('개인화된 캡션 생성 오류:', error)
      // 폴백: 기본 캡션 사용
      const config = platformConfigs.find(p => p.id === platformId)
      if (config) {
        const fallbackCaption = config.captionTemplate(review, branch)
        setPersonalizedCaptions(prev => ({
          ...prev,
          [platformId]: fallbackCaption
        }))
      }
    } finally {
      setIsGeneratingCaption(null)
    }
  }

  const copyCaption = async (platformId: string) => {
    if (!review || !branch) return

    // 개인화된 캡션이 없으면 먼저 생성
    if (!personalizedCaptions[platformId]) {
      await generatePersonalizedCaption(platformId)
      return
    }

    try {
      const caption = personalizedCaptions[platformId]
      await navigator.clipboard.writeText(caption)
      setCopiedPlatform(platformId)
      
      // 성공 피드백
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (error) {
      console.error('캡션 복사 오류:', error)
      setError('캡션 복사에 실패했습니다.')
    }
  }

  const shareToPlatform = async (platformId: string) => {
    if (!review || !branch) return

    try {
      // 개인화된 캡션이 없으면 먼저 생성
      if (!personalizedCaptions[platformId]) {
        await generatePersonalizedCaption(platformId)
        return
      }

      const config = platformConfigs.find(p => p.id === platformId)
      if (!config) return

      if (config.shareMethod === 'deeplink' && config.deeplinkUrl) {
        // 딥링크로 공유
        const deeplinkUrl = config.deeplinkUrl(branch)
        window.open(deeplinkUrl, '_blank')
      } else if (config.shareMethod === 'web-share') {
        // 웹 공유 API 사용
        if (navigator.share) {
          await navigator.share({
            title: `${branch.name} 리뷰`,
            text: personalizedCaptions[platformId],
            url: window.location.href
          })
        } else {
          // 폴백: 클립보드에 복사
          await navigator.clipboard.writeText(personalizedCaptions[platformId])
          alert('캡션이 클립보드에 복사되었습니다. 앱에서 붙여넣기하세요.')
        }
      }
      
      setSharedPlatform(platformId)
      setTimeout(() => setSharedPlatform(null), 3000)
      
    } catch (error) {
      console.error('플랫폼 공유 오류:', error)
      setError('공유에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">플랫폼 공유 페이지를 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="mobile-card animate-error-shake">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Link href="/" className="mobile-btn-primary">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mobile-card animate-fade-in mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              리뷰 플랫폼 공유
            </h1>
            <p className="text-gray-600">
              {branch?.name} 리뷰를 여러 플랫폼에 쉽게 공유하세요
            </p>
            <p className="text-sm text-blue-600 mt-2">
              로그인 없이도 사용 가능합니다
            </p>
          </div>
        </div>

        {/* 리뷰 미리보기 */}
        {review && branch && (
          <div className="mobile-card animate-slide-up mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              작성된 리뷰
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">가게:</span>
                <span className="text-gray-600">{branch.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">평점:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < parseInt(review.rating.toString()) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{(review as any).content || (review as any).text || ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* 플랫폼별 공유 버튼 */}
        <div className="space-y-4 mb-6">
          {platformConfigs.map((config) => (
            <div key={config.id} className="mobile-card animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center text-2xl`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{config.name}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
              </div>

              {/* 사용법 안내 */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">사용법:</h5>
                <ol className="text-xs text-gray-600 space-y-1">
                  {config.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 font-bold">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => copyCaption(config.id)}
                  disabled={isGeneratingCaption === config.id}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    copiedPlatform === config.id
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                  }`}
                >
                  {isGeneratingCaption === config.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>생성 중...</span>
                    </div>
                  ) : copiedPlatform === config.id ? (
                    '✅ 복사됨!'
                  ) : (
                    '📋 캡션 복사'
                  )}
                </button>
                
                <button
                  onClick={() => shareToPlatform(config.id)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    sharedPlatform === config.id
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {sharedPlatform === config.id ? '✅ 공유됨!' : '🚀 공유하기'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 포인트 정보 */}
        <div className="mobile-card animate-fade-in mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            포인트 획득 안내
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-blue-600 font-medium">캡션 복사</div>
              <div className="text-blue-800 font-bold">+10P</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-purple-600 font-medium">플랫폼 공유</div>
              <div className="text-purple-800 font-bold">+20P</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            * 포인트는 회원가입 후 지급됩니다
          </p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mobile-card animate-error-shake mb-6">
            <div className="text-center text-red-600">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* 완료 버튼 */}
        <div className="mobile-card animate-bounce-in">
          <div className="text-center space-y-3">
            <button
              onClick={() => router.push('/')}
              className="mobile-btn-primary w-full"
            >
              완료하고 홈으로 돌아가기
            </button>
            <Link
              href="/auth"
              className="block text-sm text-blue-600 hover:text-blue-800"
            >
              회원가입하고 포인트 받기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatformSharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">플랫폼 공유 페이지를 준비하는 중...</p>
        </div>
      </div>
    }>
      <PlatformShareContent />
    </Suspense>
  )
}