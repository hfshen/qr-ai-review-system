'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Agency, Branch, Review, User as DatabaseUser, Platform } from '@/types/database'
import Link from 'next/link'
import KeywordManager from '@/components/KeywordManager'
import StatisticsDashboard from '@/components/StatisticsDashboard'
import MarketplaceProducts from '@/components/MarketplaceProducts'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard'
import SecurityDashboard from '@/components/SecurityDashboard'
import BusinessDashboard from '@/components/BusinessDashboard'

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [users, setUsers] = useState<DatabaseUser[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [showPlatformModal, setShowPlatformModal] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchProfile(user.id)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const fetchProfile = async (authId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle()

    if (profileError) {
      console.error('프로필 로딩 오류:', profileError)
    }

    if (!profileData) {
      // 프로필이 없으면 기본 프로필 생성
      console.log('프로필이 없어서 새로 생성합니다...')
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          auth_id: authId,
          email: 'admin@example.com', // 실제 이메일로 변경 필요
          display_name: '관리자',
          role: 'admin'
        })
        .select()
        .single()

      if (createError) {
        console.error('프로필 생성 오류:', createError)
        setProfile(null)
      } else {
        console.log('새 프로필 생성됨:', newProfile)
        setProfile(newProfile)
      }
    } else {
      console.log('기존 프로필 로드됨:', profileData)
      setProfile(profileData)
    }

    if (profileData?.role === 'admin') {
      await Promise.all([
        fetchAgencies(),
        fetchBranches(),
        fetchReviews(),
        fetchUsers(),
        fetchPlatforms()
      ])
    }
  }

  const fetchAgencies = async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agencies:', error)
      return
    }

    setAgencies(data || [])
  }

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching branches:', error)
      return
    }

    setBranches(data || [])
  }

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching reviews:', error)
      return
    }

    setReviews(data || [])
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    setUsers(data || [])
  }

  const fetchPlatforms = async () => {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')

    if (error) {
      console.error('Error fetching platforms:', error)
      return
    }

    setPlatforms(data || [])
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return
    }

    await fetchUsers()
  }

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform)
    setShowPlatformModal(true)
  }

  const handleSavePlatform = async (platformData: Partial<Platform>) => {
    if (!editingPlatform) return

    const { error } = await supabase
      .from('platforms')
      .update(platformData)
      .eq('id', editingPlatform.id)

    if (error) {
      console.error('플랫폼 업데이트 오류:', error)
      alert('플랫폼 업데이트에 실패했습니다.')
    } else {
      setPlatforms(platforms.map(platform => 
        platform.id === editingPlatform.id ? { ...platform, ...platformData } : platform
      ))
      setShowPlatformModal(false)
      setEditingPlatform(null)
      alert('플랫폼이 성공적으로 업데이트되었습니다.')
    }
  }

  const handleDeletePlatform = async (platformId: number) => {
    if (!confirm('정말로 이 플랫폼을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', platformId)

    if (error) {
      console.error('플랫폼 삭제 오류:', error)
      alert('플랫폼 삭제에 실패했습니다.')
    } else {
      setPlatforms(platforms.filter(platform => platform.id !== platformId))
      alert('플랫폼이 성공적으로 삭제되었습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">관리자 권한이 필요합니다</h2>
        <p className="text-gray-600 mb-4">관리자만 접근할 수 있습니다.</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 패널</h1>
          <p className="text-gray-600">시스템 전체를 관리하고 모니터링하세요</p>
        </div>

        {/* 핵심 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', label: '개요', icon: '📊' },
              { id: 'users', label: '사용자 관리', icon: '👥' },
              { id: 'agencies', label: '에이전시 관리', icon: '🏢' },
              { id: 'branches', label: '지점 관리', icon: '📍' },
              { id: 'reviews', label: '리뷰 관리', icon: '⭐' },
              { id: 'platforms', label: '플랫폼 관리', icon: '🔗' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 주요 통계 카드 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">총 사용자</h3>
                    <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                    <p className="text-sm text-gray-500 mt-1">전체 등록 사용자</p>
                  </div>
                  <div className="text-4xl text-blue-500">👥</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">총 에이전시</h3>
                    <p className="text-3xl font-bold text-green-600">{agencies.length}</p>
                    <p className="text-sm text-gray-500 mt-1">등록된 에이전시</p>
                  </div>
                  <div className="text-4xl text-green-500">🏢</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">총 지점</h3>
                    <p className="text-3xl font-bold text-purple-600">{branches.length}</p>
                    <p className="text-sm text-gray-500 mt-1">QR 코드 생성된 지점</p>
                  </div>
                  <div className="text-4xl text-purple-500">📍</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">총 리뷰</h3>
                    <p className="text-3xl font-bold text-orange-600">{reviews.length}</p>
                    <p className="text-sm text-gray-500 mt-1">작성된 리뷰</p>
                  </div>
                  <div className="text-4xl text-orange-500">⭐</div>
                </div>
              </div>
            </div>

            {/* 추가 통계 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">플랫폼 연결 현황</h3>
                <div className="space-y-3">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{platform.name}</span>
                      <span className="text-sm font-medium text-gray-900">{platform.default_reward}P</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">오늘 리뷰</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reviews.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}개
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">이번 주 리뷰</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reviews.filter(r => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(r.created_at) > weekAgo;
                      }).length}개
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">평균 별점</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}점
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">데이터베이스</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API 서버</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI 서비스</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 빠른 액션 버튼 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-medium text-gray-900">사용자 관리</div>
                  <div className="text-sm text-gray-500">사용자 권한 및 정보 관리</div>
                </button>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🛍️</div>
                  <div className="font-medium text-gray-900">마켓플레이스</div>
                  <div className="text-sm text-gray-500">상품 및 구매 관리</div>
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium text-gray-900">통계 분석</div>
                  <div className="text-sm text-gray-500">상세 통계 및 분석</div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-medium text-gray-900">보안 관리</div>
                  <div className="text-sm text-gray-500">보안 설정 및 모니터링</div>
                </button>
              </div>
            </div>

            {/* 시스템 관리 섹션 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 관리</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <button
                  onClick={() => setActiveTab('keywords')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🏷️</div>
                  <div className="font-medium text-gray-900">키워드 관리</div>
                  <div className="text-sm text-gray-500">리뷰 키워드 설정</div>
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium text-gray-900">성능 모니터링</div>
                  <div className="text-sm text-gray-500">시스템 성능 추적</div>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-medium text-gray-900">고급 분석</div>
                  <div className="text-sm text-gray-500">데이터 분석 도구</div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-medium text-gray-900">보안 관리</div>
                  <div className="text-sm text-gray-500">보안 설정 및 모니터링</div>
                </button>
                <button
                  onClick={() => setActiveTab('business')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-medium text-gray-900">비즈니스 관리</div>
                  <div className="text-sm text-gray-500">비즈니스 설정</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">사용자 관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      표시 이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.display_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                          aria-label={`${user.display_name} 사용자 역할 변경`}
                        >
                          <option value="user">일반 사용자</option>
                          <option value="agency_owner">에이전시 소유자</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-red-600 hover:text-red-900">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 에이전시 관리 탭 */}
        {activeTab === 'agencies' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">에이전시 관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agencies.map((agency) => (
                    <tr key={agency.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agency.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agency.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agency.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          편집
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 지점 관리 탭 */}
        {activeTab === 'branches' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">지점 관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업종
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(branch.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          href={`/qr/${branch.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          QR 보기
                        </Link>
                        <button className="text-red-600 hover:text-red-900">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 리뷰 관리 탭 */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">리뷰 관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      별점
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      리뷰 내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {review.final_content || review.ai_content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          review.status === 'published' ? 'bg-green-100 text-green-800' :
                          review.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {review.status === 'published' ? '게시됨' :
                           review.status === 'draft' ? '임시저장' : '실패'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          보기
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 플랫폼 관리 탭 */}
        {activeTab === 'platforms' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">플랫폼 관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기본 리워드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {platforms.map((platform) => (
                    <tr key={platform.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {platform.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {platform.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {platform.default_reward} 포인트
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditPlatform(platform)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          편집
                        </button>
                        <button 
                          onClick={() => handleDeletePlatform(platform.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 키워드 관리 탭 */}
        {activeTab === 'keywords' && (
          <KeywordManager />
        )}

        {/* 마켓플레이스 관리 탭 */}
        {activeTab === 'marketplace' && (
          <MarketplaceProducts />
        )}

        {/* 통계 대시보드 탭 */}
        {activeTab === 'statistics' && (
          <StatisticsDashboard />
        )}

        {/* 성능 모니터링 탭 */}
        {activeTab === 'performance' && (
          <PerformanceDashboard />
        )}

        {/* 고급 분석 탭 */}
        {activeTab === 'analytics' && (
          <AdvancedAnalyticsDashboard />
        )}

        {/* 보안 관리 탭 */}
        {activeTab === 'security' && (
          <SecurityDashboard />
        )}

        {/* 비즈니스 관리 탭 */}
        {activeTab === 'business' && (
          <BusinessDashboard />
        )}

        {/* 플랫폼 편집 모달 */}
        {showPlatformModal && editingPlatform && (
          <PlatformEditModal
            platform={editingPlatform}
            onSave={handleSavePlatform}
            onClose={() => {
              setShowPlatformModal(false)
              setEditingPlatform(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// 플랫폼 편집 모달 컴포넌트
function PlatformEditModal({ 
  platform, 
  onSave, 
  onClose 
}: { 
  platform: Platform
  onSave: (data: Partial<Platform>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: platform.name,
    description: platform.description,
    default_reward: platform.default_reward
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">플랫폼 편집</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              플랫폼 이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 리워드 (포인트)
            </label>
            <input
              type="number"
              value={formData.default_reward}
              onChange={(e) => setFormData({ ...formData, default_reward: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
