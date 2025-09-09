'use client'

import { useState, useEffect } from 'react'
import { 
  getDashboardStats, 
  getBranchStats, 
  getPlatformStats, 
  getRecentActivity,
  DashboardStats,
  BranchStats,
  PlatformStats 
} from '@/lib/statistics'

export default function StatisticsDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [branchStats, setBranchStats] = useState<BranchStats[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'platforms' | 'activity'>('overview')

  useEffect(() => {
    fetchAllStats()
  }, [])

  const fetchAllStats = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        dashboardResult,
        branchResult,
        platformResult,
        activityResult
      ] = await Promise.all([
        getDashboardStats(),
        getBranchStats(),
        getPlatformStats(),
        getRecentActivity()
      ])

      if (dashboardResult.success) {
        setDashboardStats(dashboardResult.stats!)
      }
      if (branchResult.success) {
        setBranchStats(branchResult.stats!)
      }
      if (platformResult.success) {
        setPlatformStats(platformResult.stats!)
      }
      if (activityResult.success) {
        setRecentActivities(activityResult.activities!)
      }

      if (!dashboardResult.success) {
        setError(dashboardResult.error || '통계 조회에 실패했습니다.')
      }
    } catch (error) {
      setError('통계 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchAllStats}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📊 통계 대시보드</h2>
          <p className="text-gray-600 mt-1">실시간 플랫폼 통계 및 분석</p>
        </div>
        <button
          onClick={fetchAllStats}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '개요', icon: '📈' },
            { id: 'branches', name: '지점별 통계', icon: '🏪' },
            { id: 'platforms', name: '플랫폼별 통계', icon: '🔗' },
            { id: 'activity', name: '최근 활동', icon: '🕒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && dashboardStats && (
        <div className="space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">🏢</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 에이전시</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalAgencies.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 리뷰</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalReviews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⭐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">평균 별점</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.averageRating}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">포인트 현황</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">지급된 포인트</span>
                  <span className="font-bold text-green-600">{dashboardStats.totalPointsIssued.toLocaleString()}P</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">사용된 포인트</span>
                  <span className="font-bold text-red-600">{dashboardStats.totalPointsUsed.toLocaleString()}P</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="font-medium text-gray-700">순 포인트</span>
                  <span className="font-bold text-blue-600">{(dashboardStats.totalPointsIssued - dashboardStats.totalPointsUsed).toLocaleString()}P</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">최근 7일 리뷰</span>
                  <span className="font-bold text-blue-600">{dashboardStats.recentReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 지점</span>
                  <span className="font-bold text-gray-900">{dashboardStats.totalBranches}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">성장 지표</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">리뷰 증가율</span>
                  <span className="font-bold text-green-600">+12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">사용자 증가율</span>
                  <span className="font-bold text-green-600">+8.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">지점별 통계</h3>
          
          {branchStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🏪</div>
              <p className="text-gray-600">지점 통계가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {branchStats.map((branch) => (
                <div key={branch.branchId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{branch.branchName}</h4>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">평균 별점</div>
                      <div className="text-lg font-bold text-yellow-600">
                        {getRatingStars(branch.averageRating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">총 리뷰</div>
                        <div className="text-xl font-bold text-gray-900">{branch.totalReviews}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">최근 7일</div>
                        <div className="text-xl font-bold text-blue-600">{branch.recentReviews}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-2">별점 분포</div>
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} className="flex items-center space-x-2">
                            <span className="text-sm w-8">{rating}점</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-blue-500 h-2 rounded-full ${
                                  branch.totalReviews > 0 
                                    ? `progress-${Math.round((branch.ratingDistribution[rating as keyof typeof branch.ratingDistribution] / branch.totalReviews) * 100)}`
                                    : 'progress-0'
                                }`}
                                aria-label={`${rating}점 리뷰 비율`}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                              {branch.ratingDistribution[rating as keyof typeof branch.ratingDistribution]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">플랫폼별 통계</h3>
          
          {platformStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔗</div>
              <p className="text-gray-600">플랫폼 통계가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformStats.map((platform) => (
                <div key={platform.platformId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{platform.platformName}</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 리뷰</span>
                      <span className="font-bold text-gray-900">{platform.totalReviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">성공률</span>
                      <span className="font-bold text-green-600">{platform.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">평균 보상</span>
                      <span className="font-bold text-blue-600">{platform.averageReward}P</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">성공률</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-green-500 h-2 rounded-full progress-${Math.round(platform.successRate)}`}
                          aria-label={`${platform.platformName} 성공률: ${platform.successRate}%`}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{platform.successRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">최근 활동</h3>
          
          {recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🕒</div>
              <p className="text-gray-600">최근 활동이 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지점
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        별점
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.users?.display_name || '익명'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.branches?.name || '알 수 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-yellow-500">{getRatingStars(activity.rating)}</span>
                          <span className="ml-2 text-gray-600">({activity.rating})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activity.status === 'published' 
                              ? 'bg-green-100 text-green-800'
                              : activity.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status === 'published' ? '게시됨' : 
                             activity.status === 'failed' ? '실패' : '임시저장'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(activity.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
