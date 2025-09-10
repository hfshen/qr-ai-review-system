'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface SocialProof {
  platformId: string
  todayCount: number
  weekCount: number
  totalCount: number
  recentUsers: Array<{
    id: string
    displayName: string
    platformId: string
    postedAt: string
    rating: number
  }>
  trendingKeywords: Array<{
    keyword: string
    count: number
  }>
  successStories: Array<{
    id: string
    displayName: string
    platformId: string
    engagement: number
    postedAt: string
  }>
}

export function useSocialProof() {
  const [socialProof, setSocialProof] = useState<SocialProof | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSocialProof()
    setupRealtimeSubscription()
  }, [])

  const fetchSocialProof = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // 오늘의 활동 통계
      const { data: todayActivity } = await supabase
        .from('posting_tracker')
        .select('platform_id, status')
        .gte('created_at', today)

      // 이번 주 활동 통계
      const { data: weekActivity } = await supabase
        .from('posting_tracker')
        .select('platform_id, status')
        .gte('created_at', weekAgo)

      // 전체 활동 통계
      const { data: totalActivity } = await supabase
        .from('posting_tracker')
        .select('platform_id, status')

      // 최근 사용자 활동
      const { data: recentUsers } = await supabase
        .from('posting_tracker')
        .select(`
          user_id,
          platform_id,
          posted_at,
          reviews!inner(rating, users!inner(display_name))
        `)
        .eq('status', 'posted')
        .not('posted_at', 'is', null)
        .order('posted_at', { ascending: false })
        .limit(10)

      // 인기 키워드
      const { data: keywordStats } = await supabase
        .from('reviews')
        .select('keywords')
        .gte('created_at', weekAgo)
        .not('keywords', 'is', null)

      // 성공 스토리 (높은 참여도)
      const { data: successStories } = await supabase
        .from('posting_tracker')
        .select(`
          user_id,
          platform_id,
          posted_at,
          engagement,
          reviews!inner(users!inner(display_name))
        `)
        .eq('status', 'posted')
        .not('engagement', 'is', null)
        .order('engagement', { ascending: false })
        .limit(5)

      // 데이터 처리
      const processedData = processSocialProofData({
        todayActivity: todayActivity || [],
        weekActivity: weekActivity || [],
        totalActivity: totalActivity || [],
        recentUsers: recentUsers || [],
        keywordStats: keywordStats || [],
        successStories: successStories || []
      })

      setSocialProof(processedData)
    } catch (error) {
      console.error('소셜 증명 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('social_proof_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posting_tracker'
        },
        () => {
          fetchSocialProof() // 데이터 새로고침
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  return { socialProof, loading }
}

function processSocialProofData(data: any): SocialProof {
  const platforms = ['naver', 'instagram', 'xiaohongshu']
  
  const platformStats = platforms.map(platformId => {
    const todayCount = data.todayActivity.filter((a: any) => a.platform_id === platformId && a.status === 'posted').length
    const weekCount = data.weekActivity.filter((a: any) => a.platform_id === platformId && a.status === 'posted').length
    const totalCount = data.totalActivity.filter((a: any) => a.platform_id === platformId && a.status === 'posted').length

    return {
      platformId,
      todayCount,
      weekCount,
      totalCount
    }
  })

  // 최근 사용자 활동 처리
  const recentUsers = data.recentUsers.map((user: any) => ({
    id: user.user_id,
    displayName: user.reviews?.users?.display_name || '익명',
    platformId: user.platform_id,
    postedAt: user.posted_at,
    rating: user.reviews?.rating || 0
  }))

  // 인기 키워드 처리
  const allKeywords = data.keywordStats.flatMap((review: any) => review.keywords || [])
  const keywordCounts = allKeywords.reduce((acc: any, keyword: string) => {
    acc[keyword] = (acc[keyword] || 0) + 1
    return acc
  }, {})

  const trendingKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([keyword, count]) => ({
      keyword,
      count: count as number
    }))

  // 성공 스토리 처리
  const successStories = data.successStories.map((story: any) => ({
    id: story.user_id,
    displayName: story.reviews?.users?.display_name || '익명',
    platformId: story.platform_id,
    engagement: story.engagement?.likes + story.engagement?.comments + story.engagement?.shares || 0,
    postedAt: story.posted_at
  }))

  return {
    platformId: 'all',
    todayCount: platformStats.reduce((sum, p) => sum + p.todayCount, 0),
    weekCount: platformStats.reduce((sum, p) => sum + p.weekCount, 0),
    totalCount: platformStats.reduce((sum, p) => sum + p.totalCount, 0),
    recentUsers,
    trendingKeywords,
    successStories
  }
}

// 소셜 증명 위젯 컴포넌트
export function SocialProofWidget() {
  const { socialProof, loading } = useSocialProof()

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mb-2"></div>
          <p className="text-gray-600 text-sm">활동 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!socialProof) return null

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔥 지금 뜨고 있어요!
      </h3>

      {/* 오늘의 활동 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-800 mb-1">
            {socialProof.todayCount}명
          </div>
          <div className="text-sm text-blue-600">
            오늘 리뷰를 게시했어요!
          </div>
        </div>
      </div>

      {/* 플랫폼별 활동 */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700">플랫폼별 활동</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-green-600 text-xs font-medium">네이버</div>
            <div className="text-green-800 font-bold">{socialProof.todayCount}명</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="text-purple-600 text-xs font-medium">인스타</div>
            <div className="text-purple-800 font-bold">{socialProof.todayCount}명</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <div className="text-red-600 text-xs font-medium">샤오홍슈</div>
            <div className="text-red-800 font-bold">{socialProof.todayCount}명</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      {socialProof.recentUsers.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700">최근 활동</h4>
          <div className="space-y-2">
            {socialProof.recentUsers.slice(0, 3).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName.charAt(0)}
                  </div>
                  <span className="text-gray-600">{user.displayName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">
                    {user.platformId === 'naver' ? '🟢' :
                     user.platformId === 'instagram' ? '📷' :
                     user.platformId === 'xiaohongshu' ? '📖' : '📱'}
                  </span>
                  <span className="text-gray-500">
                    {'⭐'.repeat(user.rating)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인기 키워드 */}
      {socialProof.trendingKeywords.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">인기 키워드</h4>
          <div className="flex flex-wrap gap-2">
            {socialProof.trendingKeywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword.keyword}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                #{keyword.keyword} ({keyword.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 동기부여 메시지 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            💡 <strong>{socialProof.weekCount}명</strong>이 이번 주에 리뷰를 게시했어요!
          </p>
          <p className="text-xs text-gray-500">
            당신도 지금 시작해보세요 ✨
          </p>
        </div>
      </div>
    </div>
  )
}

// 실시간 활동 피드
export function LiveActivityFeed() {
  const { socialProof, loading } = useSocialProof()

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-6 h-6 mb-2"></div>
          <p className="text-gray-600 text-sm">실시간 활동 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!socialProof || socialProof.recentUsers.length === 0) return null

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ⚡ 실시간 활동
      </h3>

      <div className="space-y-3">
        {socialProof.recentUsers.slice(0, 5).map((user, index) => (
          <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {user.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(user.postedAt).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-600">
                  {user.platformId === 'naver' ? '🟢 네이버 플레이스' :
                   user.platformId === 'instagram' ? '📷 인스타그램' :
                   user.platformId === 'xiaohongshu' ? '📖 샤오홍슈' : user.platformId}
                </span>
                <span className="text-xs text-yellow-600">
                  {'⭐'.repeat(user.rating)}
                </span>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              게시완료
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          💫 지금도 계속 새로운 리뷰가 올라오고 있어요!
        </p>
      </div>
    </div>
  )
}
