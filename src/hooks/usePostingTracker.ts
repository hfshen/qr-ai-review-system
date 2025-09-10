'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface PostingTracker {
  id: string
  platformId: string
  reviewId: string
  userId: string
  status: 'pending' | 'shared' | 'posted' | 'failed'
  sharedAt?: string
  postedAt?: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
  }
  createdAt: string
}

interface RealTimeStats {
  totalShares: number
  totalPosts: number
  successRate: number
  avgEngagement: number
  platformBreakdown: Record<string, number>
  recentActivity: PostingTracker[]
}

export function usePostingTracker(userId: string) {
  const [tracker, setTracker] = useState<PostingTracker[]>([])
  const [stats, setStats] = useState<RealTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!userId) return
    
    fetchPostingHistory()
    setupRealtimeSubscription()
  }, [userId])

  const fetchPostingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('posting_tracker')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setTracker(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('포스팅 히스토리 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('posting_tracker_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posting_tracker',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('실시간 업데이트:', payload)
          fetchPostingHistory() // 데이터 새로고침
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const calculateStats = (data: PostingTracker[]) => {
    const totalShares = data.filter(t => t.status === 'shared' || t.status === 'posted').length
    const totalPosts = data.filter(t => t.status === 'posted').length
    const successRate = totalShares > 0 ? (totalPosts / totalShares) * 100 : 0
    
    const platformBreakdown = data.reduce((acc, t) => {
      acc[t.platformId] = (acc[t.platformId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgEngagement = data
      .filter(t => t.engagement)
      .reduce((sum, t) => {
        const engagement = t.engagement || {}
        return sum + (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0)
      }, 0) / Math.max(data.filter(t => t.engagement).length, 1)

    setStats({
      totalShares,
      totalPosts,
      successRate,
      avgEngagement,
      platformBreakdown,
      recentActivity: data.slice(0, 10)
    })
  }

  const trackShare = async (platformId: string, reviewId: string) => {
    try {
      const { data, error } = await supabase
        .from('posting_tracker')
        .insert({
          platform_id: platformId,
          review_id: reviewId,
          user_id: userId,
          status: 'shared',
          shared_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('공유 추적 오류:', error)
      return null
    }
  }

  const trackPosting = async (trackerId: string, status: 'posted' | 'failed', engagement?: any) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'posted') {
        updateData.posted_at = new Date().toISOString()
        if (engagement) {
          updateData.engagement = engagement
        }
      }

      const { error } = await supabase
        .from('posting_tracker')
        .update(updateData)
        .eq('id', trackerId)

      if (error) throw error
    } catch (error) {
      console.error('포스팅 추적 오류:', error)
    }
  }

  const reportPostingSuccess = async (trackerId: string, engagement?: any) => {
    await trackPosting(trackerId, 'posted', engagement)
  }

  const reportPostingFailure = async (trackerId: string) => {
    await trackPosting(trackerId, 'failed')
  }

  return {
    tracker,
    stats,
    loading,
    trackShare,
    reportPostingSuccess,
    reportPostingFailure
  }
}

// 성과 추적 컴포넌트
export function PostingPerformanceWidget({ userId }: { userId: string }) {
  const { stats, loading } = usePostingTracker(userId)

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mb-2"></div>
          <p className="text-gray-600 text-sm">성과 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 나의 리뷰 성과
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-blue-600 font-medium text-sm">총 공유</div>
          <div className="text-blue-800 font-bold text-xl">{stats.totalShares}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-green-600 font-medium text-sm">성공률</div>
          <div className="text-green-800 font-bold text-xl">{stats.successRate.toFixed(0)}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">플랫폼별 활동</span>
        </div>
        {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
          <div key={platform} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {platform === 'naver' ? '🟢 네이버' :
               platform === 'instagram' ? '📷 인스타' :
               platform === 'xiaohongshu' ? '📖 샤오홍슈' : platform}
            </span>
            <span className="text-sm text-gray-600">{count}회</span>
          </div>
        ))}
      </div>

      {stats.recentActivity.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">최근 활동</h4>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {activity.platformId === 'naver' ? '🟢' :
                   activity.platformId === 'instagram' ? '📷' :
                   activity.platformId === 'xiaohongshu' ? '📖' : '📱'}
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activity.status === 'posted' ? 'bg-green-100 text-green-800' :
                  activity.status === 'shared' ? 'bg-blue-100 text-blue-800' :
                  activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status === 'posted' ? '게시완료' :
                   activity.status === 'shared' ? '공유완료' :
                   activity.status === 'failed' ? '실패' : '대기중'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 게시 완료 확인 모달
export function PostingConfirmationModal({ 
  isOpen, 
  onClose, 
  trackerId, 
  platformId 
}: { 
  isOpen: boolean
  onClose: () => void
  trackerId: string
  platformId: string 
}) {
  const [engagement, setEngagement] = useState({
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0
  })
  const [isReporting, setIsReporting] = useState(false)
  
  const { reportPostingSuccess, reportPostingFailure } = usePostingTracker('')

  const handleSuccess = async () => {
    setIsReporting(true)
    try {
      await reportPostingSuccess(trackerId, engagement)
      onClose()
    } catch (error) {
      console.error('성공 보고 오류:', error)
    } finally {
      setIsReporting(false)
    }
  }

  const handleFailure = async () => {
    setIsReporting(true)
    try {
      await reportPostingFailure(trackerId)
      onClose()
    } catch (error) {
      console.error('실패 보고 오류:', error)
    } finally {
      setIsReporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mobile-modal-content animate-scale-in">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            게시 완료 확인
          </h3>
          
          <p className="text-gray-600 mb-4">
            {platformId === 'naver' ? '네이버 플레이스' :
             platformId === 'instagram' ? '인스타그램' :
             platformId === 'xiaohongshu' ? '샤오홍슈' : platformId}에 
            리뷰를 성공적으로 게시하셨나요?
          </p>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  좋아요 수
                </label>
                <input
                  type="number"
                  value={engagement.likes}
                  onChange={(e) => setEngagement(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                  className="mobile-input text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  댓글 수
                </label>
                <input
                  type="number"
                  value={engagement.comments}
                  onChange={(e) => setEngagement(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                  className="mobile-input text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSuccess}
              disabled={isReporting}
              className="flex-1 mobile-btn-primary disabled:opacity-50"
            >
              {isReporting ? '보고 중...' : '✅ 성공적으로 게시됨'}
            </button>
            <button
              onClick={handleFailure}
              disabled={isReporting}
              className="flex-1 mobile-btn-secondary disabled:opacity-50"
            >
              {isReporting ? '보고 중...' : '❌ 게시 실패'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
