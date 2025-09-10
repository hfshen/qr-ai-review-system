'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Review, Branch, Agency } from '@/types/database'

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

export default function SmartPlatformSharing() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [review, setReview] = useState<Review | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null)
  const [error, setError] = useState('')
  
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
        const ratingStars = '⭐'.repeat(review.rating)
        return `📍 ${branch.name}\n\n${ratingStars} ${review.rating}/5점\n\n${review.content}\n\n#${branch.name} #리뷰 #방문후기`
      },
      shareMethod: 'deeplink',
      deeplinkUrl: (branch) => {
        // 네이버 지도 딥링크 (실제 좌표 사용)
        const lat = branch.latitude || 37.5665
        const lng = branch.longitude || 126.9780
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
        
        return `${review.content}\n\n📍 ${branch.name} ${'⭐'.repeat(review.rating)}\n\n${hashtags}`
      },
      shareMethod: 'web-share'
    },
    {
      id: 'xiaohongshu',
      name: '샤오홍슈',
      icon: '📖',
      color: 'bg-red-500',
      description: '중국어 스토리형 리뷰',
      instructions: [
        '중국어 캡션을 복사하세요',
        '샤오홍슈로 공유를 클릭하세요',
        '앱에서 붙여넣기하세요',
        '장소 태그를 꼭 선택하세요'
      ],
      captionTemplate: (review, branch) => {
        // 중국어 리뷰 템플릿 (스토리형)
        return `📍 ${branch.name}\n\n今天和朋友一起去了${branch.name}，环境真的很不错！\n\n${'⭐'.repeat(review.rating)} 评分：${review.rating}/5\n\n${review.content}\n\n#${branch.name} #探店 #美食 #推荐 #生活记录`
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

  const copyCaption = async (platformId: string) => {
    if (!review || !branch) return

    const config = platformConfigs.find(p => p.id === platformId)
    if (!config) return

    try {
      const caption = config.captionTemplate(review, branch)
      await navigator.clipboard.writeText(caption)
      setCopiedPlatform(platformId)
      
      // 성공 피드백
      setTimeout(() => setCopiedPlatform(null), 2000)
      
      // 포인트 지급
      await awardPoints(review.id, platformId, 'caption_copy')
    } catch (error) {
      console.error('캡션 복사 오류:', error)
      setError('캡션 복사에 실패했습니다.')
    }
  }

  const shareToPlatform = async (platformId: string) => {
    if (!review || !branch) return

    const config = platformConfigs.find(p => p.id === platformId)
    if (!config) return

    try {
      if (config.shareMethod === 'web-share') {
        // Web Share API 사용
        if (navigator.share) {
          const shareData: any = {
            title: `${branch.name} 리뷰`,
            text: config.captionTemplate(review, branch)
          }

          // 이미지가 있으면 파일로 공유
          if (review.images && review.images.length > 0) {
            try {
              const response = await fetch(review.images[0])
              const blob = await response.blob()
              const file = new File([blob], 'review.jpg', { type: 'image/jpeg' })
              
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file]
              }
            } catch (error) {
              console.log('이미지 공유 실패, 텍스트만 공유')
            }
          }

          await navigator.share(shareData)
          setSharedPlatform(platformId)
        } else {
          // 폴백: 캡션만 복사
          await copyCaption(platformId)
        }
      } else if (config.shareMethod === 'deeplink' && config.deeplinkUrl) {
        // 딥링크 사용
        const deeplinkUrl = config.deeplinkUrl(branch)
        
        // 먼저 캡션 복사
        await copyCaption(platformId)
        
        // 딥링크 실행
        window.location.href = deeplinkUrl
        
        // 폴백을 위한 타이머
        setTimeout(() => {
          if (confirm('네이버 앱이 설치되어 있지 않습니다. 웹으로 이동하시겠습니까?')) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(branch.name)}`, '_blank')
          }
        }, 2000)
      }

      // 포인트 지급
      await awardPoints(review.id, platformId, 'share')
      
    } catch (error) {
      console.error('플랫폼 공유 오류:', error)
      setError('공유에 실패했습니다.')
    }
  }

  const awardPoints = async (reviewId: string, platformId: string, action: string) => {
    try {
      const points = action === 'caption_copy' ? 10 : 20
      
      const { error } = await supabase
        .from('user_points')
        .insert({
          user_id: review.user_id,
          points: points,
          source: `${platformId}_${action}`,
          description: `${platformId} ${action} 포인트`
        })

      if (error) throw error
    } catch (error) {
      console.error('포인트 지급 오류:', error)
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
            <button
              onClick={() => router.push('/')}
              className="mobile-btn-primary"
            >
              홈으로 돌아가기
            </button>
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
              원탭 리뷰 배포
            </h1>
            <p className="text-gray-600">
              {branch?.name} 리뷰를 여러 플랫폼에 쉽게 공유하세요
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
                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{review.content}</p>
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
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    copiedPlatform === config.id
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {copiedPlatform === config.id ? '✅ 복사됨!' : '📋 캡션 복사'}
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
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="mobile-btn-primary w-full"
            >
              완료하고 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
