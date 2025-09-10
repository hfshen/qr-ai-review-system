'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface AgencyStats {
  totalBranches: number
  totalReviews: number
  totalPointsSpent: number
  averageRating: number
  platformConnections: number
}

interface BranchStats {
  id: string
  name: string
  totalReviews: number
  averageRating: number
  pointsSpent: number
}

interface PlatformStats {
  id: number
  name: string
  connected: boolean
  totalReviews: number
  pointsSpent: number
}

export default function AgencyStatisticsDashboard() {
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null)
  const [branchStats, setBranchStats] = useState<BranchStats[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'platforms'>('overview')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchAgencyStats()
  }, [])

  const fetchAgencyStats = async () => {
    setLoading(true)
    setError('')

    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!profile || profile.role !== 'agency_owner') {
        setError('에이전시 소유자만 접근할 수 있습니다.')
        return
      }

      // 에이전시 정보 가져오기
      const { data: agency } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', profile.id)
        .single()

      if (!agency) {
        setError('에이전시 정보를 찾을 수 없습니다.')
        return
      }

      // 지점별 통계
      const { data: branches } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          reviews!inner(
            id,
            rating,
            status
          )
        `)
        .eq('agency_id', agency.id)

      // 플랫폼별 통계
      const { data: platforms } = await supabase
        .from('platforms')
        .select(`
          id,
          name,
          agency_platforms!inner(
            connected,
            agency_id
          )
        `)
        .eq('agency_platforms.agency_id', agency.id)

      // 포인트 거래 내역
      const { data: transactions } = await supabase
        .from('point_transactions')
        .select('points, transaction_type')
        .eq('agency_id', agency.id)

      // 통계 계산
      const branchStatsData: BranchStats[] = branches?.map(branch => {
        const reviews = branch.reviews || []
        const publishedReviews = reviews.filter((r: any) => r.status === 'published')
        const totalReviews = publishedReviews.length
        const averageRating = totalReviews > 0 
          ? publishedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews 
          : 0

        return {
          id: branch.id,
          name: branch.name,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          pointsSpent: 0 // TODO: 지점별 포인트 계산
        }
      }) || []

      const platformStatsData: PlatformStats[] = platforms?.map(platform => {
        const connection = platform.agency_platforms?.[0]
        return {
          id: platform.id,
          name: platform.name,
          connected: connection?.connected || false,
          totalReviews: 0, // TODO: 플랫폼별 리뷰 수 계산
          pointsSpent: 0 // TODO: 플랫폼별 포인트 계산
        }
      }) || []

      const totalReviews = branchStatsData.reduce((sum, branch) => sum + branch.totalReviews, 0)
      const totalPointsSpent = transactions?.reduce((sum, t) => 
        t.transaction_type === 'reward' ? sum + Math.abs(t.points) : sum, 0) || 0
      const averageRating = totalReviews > 0 
        ? branchStatsData.reduce((sum, branch) => sum + (branch.averageRating * branch.totalReviews), 0) / totalReviews
        : 0

      setAgencyStats({
        totalBranches: branchStatsData.length,
        totalReviews,
        totalPointsSpent,
        averageRating: Math.round(averageRating * 10) / 10,
        platformConnections: platformStatsData.filter(p => p.connected).length
      })

      setBranchStats(branchStatsData)
      setPlatformStats(platformStatsData)

    } catch (err) {
      console.error('통계 로딩 오류:', err)
      setError('통계를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchAgencyStats}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'branches', label: '지점별 통계', icon: '🏪' },
            { id: 'platforms', label: '플랫폼별 통계', icon: '🔗' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && agencyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🏪</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 지점 수</p>
                <p className="text-2xl font-semibold text-gray-900">{agencyStats.totalBranches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 리뷰 수</p>
                <p className="text-2xl font-semibold text-gray-900">{agencyStats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">지급 포인트</p>
                <p className="text-2xl font-semibold text-gray-900">{agencyStats.totalPointsSpent.toLocaleString()}P</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">평균 평점</p>
                <p className="text-2xl font-semibold text-gray-900">{agencyStats.averageRating}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 지점별 통계 탭 */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">지점별 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지점명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    리뷰 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지급 포인트
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchStats.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.totalReviews}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-1">⭐</span>
                        {branch.averageRating || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.pointsSpent.toLocaleString()}P
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 플랫폼별 통계 탭 */}
      {activeTab === 'platforms' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">플랫폼별 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    플랫폼
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연동 상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    리뷰 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지급 포인트
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {platformStats.map((platform) => (
                  <tr key={platform.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {platform.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        platform.connected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {platform.connected ? '연동됨' : '미연동'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {platform.totalReviews}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {platform.pointsSpent.toLocaleString()}P
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
