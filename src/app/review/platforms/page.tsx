'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Review, Platform, AgencyPlatform } from '@/types/database'

function PlatformPostingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState<string[]>([])
  const [review, setReview] = useState<Review | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<AgencyPlatform[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
      // 리뷰 정보 가져오기
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          branches (
            id,
            name,
            agencies (
              id,
              name
            )
          )
        `)
        .eq('id', reviewId)
        .single()

      if (reviewError) throw reviewError

      // 플랫폼 정보 가져오기
      const { data: platformsData, error: platformsError } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true)

      if (platformsError) throw platformsError

      // 연동된 플랫폼 정보 가져오기
      const { data: connectedData, error: connectedError } = await supabase
        .from('agency_platforms')
        .select(`
          *,
          platforms (
            id,
            name,
            description,
            posting_format
          )
        `)
        .eq('agency_id', reviewData.branches.agencies.id)
        .eq('is_active', true)

      if (connectedError) throw connectedError

      setReview(reviewData)
      setPlatforms(platformsData || [])
      setConnectedPlatforms(connectedData || [])
    } catch (error: any) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const postToPlatform = async (platformId: string) => {
    if (!review) return

    setPosting(prev => [...prev, platformId])
    setError('')

    try {
      const response = await fetch('/api/publish-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.id,
          platformId: platformId,
          content: review.content,
          rating: review.rating,
          images: review.images
        }),
      })

      if (!response.ok) {
        throw new Error('플랫폼 포스팅에 실패했습니다.')
      }

      const data = await response.json()
      
      // 포스팅 성공 시 포인트 지급
      await awardPoints(review.id, platformId)
      
      setSuccess(`${data.platformName}에 성공적으로 포스팅되었습니다!`)
    } catch (error: any) {
      console.error('플랫폼 포스팅 오류:', error)
      setError(error.message || '플랫폼 포스팅 중 오류가 발생했습니다.')
    } finally {
      setPosting(prev => prev.filter(id => id !== platformId))
    }
  }

  const awardPoints = async (reviewId: string, platformId: string) => {
    try {
      // 기본 포인트 지급
      const { error: pointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: review.user_id,
          points: 50,
          source: 'review_creation',
          description: '리뷰 작성 포인트'
        })

      if (pointsError) throw pointsError

      // 플랫폼 포스팅 포인트 지급
      const { error: platformPointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: review.user_id,
          points: 20,
          source: 'platform_posting',
          description: `${platformId} 플랫폼 포스팅 포인트`
        })

      if (platformPointsError) throw platformPointsError
    } catch (error) {
      console.error('포인트 지급 오류:', error)
    }
  }

  const formatReviewForPlatform = (platform: Platform, review: Review) => {
    const baseContent = review.content || ''
    const rating = review.rating
    const branchName = review.branches?.name || ''

    // 플랫폼별 포맷팅
    switch (platform.name.toLowerCase()) {
      case 'naver':
        return `📍 ${branchName}\n\n${baseContent}\n\n평점: ${rating}/5 ⭐`
      case 'instagram':
        return `${baseContent}\n\n📍 ${branchName}\n⭐ ${rating}/5\n\n#리뷰 #맛집 #추천`
      case 'tiktok':
        return `${baseContent}\n\n📍 ${branchName} ⭐${rating}/5`
      case 'google':
        return `${baseContent}\n\n평점: ${rating}/5점`
      case 'xiaohongshu':
        return `${baseContent}\n\n📍 ${branchName}\n⭐ ${rating}/5\n\n#美食 #推荐 #探店`
      default:
        return `${baseContent}\n\n평점: ${rating}/5점`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">플랫폼 포스팅 페이지를 준비하는 중...</p>
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
              플랫폼 포스팅
            </h1>
            <p className="text-gray-600">
              리뷰를 여러 플랫폼에 동시에 포스팅하세요
            </p>
          </div>
        </div>

        {/* 리뷰 미리보기 */}
        {review && (
          <div className="mobile-card animate-slide-up mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              작성된 리뷰
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">가게:</span>
                <span className="text-gray-600">{review.branches?.name}</span>
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

        {/* 연동된 플랫폼 목록 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            포스팅 가능한 플랫폼
          </h3>
          <div className="space-y-3">
            {connectedPlatforms.map((connection) => {
              const platform = connection.platforms
              const isPosting = posting.includes(platform.id)
              
              return (
                <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {platform.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => postToPlatform(platform.id)}
                      disabled={isPosting}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isPosting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isPosting ? (
                        <div className="flex items-center space-x-2">
                          <div className="loading-spinner w-3 h-3"></div>
                          <span>포스팅 중...</span>
                        </div>
                      ) : (
                        '포스팅하기'
                      )}
                    </button>
                  </div>
                  
                  {/* 플랫폼별 포맷 미리보기 */}
                  {review && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-600 mb-1">포스팅 미리보기:</p>
                      <p className="text-gray-800">
                        {formatReviewForPlatform(platform, review)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 포인트 정보 */}
        <div className="mobile-card animate-fade-in mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            포인트 획득 안내
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-green-600 font-medium">리뷰 작성</div>
              <div className="text-green-800 font-bold">+50P</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-blue-600 font-medium">플랫폼 포스팅</div>
              <div className="text-blue-800 font-bold">+20P × {connectedPlatforms.length}</div>
            </div>
          </div>
        </div>

        {/* 오류/성공 메시지 */}
        {error && (
          <div className="mobile-card animate-error-shake mb-6">
            <div className="text-center text-red-600">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mobile-card animate-fade-in mb-6">
            <div className="text-center text-green-600">
              <span className="text-green-500 text-xl mr-2">✅</span>
              {success}
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

export default function PlatformPostingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">플랫폼 포스팅 페이지를 준비하는 중...</p>
        </div>
      </div>
    }>
      <PlatformPostingContent />
    </Suspense>
  )
}
