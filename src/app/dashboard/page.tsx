'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Agency, Branch, Platform, AgencyPlatform } from '@/types/database'
import Link from 'next/link'
import PlatformIntegration from '@/components/PlatformIntegration'
import PointDeposit from '@/components/PointDeposit'
import PointHistory from '@/components/PointHistory'
import QRCodeManager from '@/components/QRCodeManager'
import StatisticsDashboard from '@/components/StatisticsDashboard'
import AgencyStatisticsDashboard from '@/components/AgencyStatisticsDashboard'
import PlatformOAuth from '@/components/PlatformOAuth'
import { getAgencyBalance } from '@/lib/points'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [agencyPlatforms, setAgencyPlatforms] = useState<AgencyPlatform[]>([])
  const [agencyBalance, setAgencyBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showCreateAgency, setShowCreateAgency] = useState(false)
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
      const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'branches' | 'platforms' | 'statistics'>('overview')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // 프로필 정보 가져오기 - auth.uid()를 직접 사용
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error('프로필 로딩 오류:', profileError)
        }
        
        let finalProfileData = profileData
        
        if (!profileData) {
          // 프로필이 없으면 기본 프로필 생성
          console.log('프로필이 없어서 새로 생성합니다...')
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: user.id,
              email: user.email,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
              role: 'user'
            })
            .select()
            .single()

          if (createError) {
            console.error('프로필 생성 오류:', createError)
          } else {
            console.log('새 프로필 생성됨:', newProfile)
            setProfile(newProfile)
            finalProfileData = newProfile
          }
        } else {
          console.log('기존 프로필 로드됨:', profileData)
          setProfile(profileData)
        }
        
        // 에이전시 데이터 가져오기
        if (finalProfileData?.role === 'agency_owner' || finalProfileData?.role === 'admin') {
          console.log('에이전시 데이터 로딩 시작, 사용자 ID:', finalProfileData.id, '역할:', finalProfileData.role)
          
          let { data: agenciesData, error: agenciesError } = await supabase
            .from('agencies')
            .select(`
              *,
              users!agencies_owner_id_fkey (
                id,
                email,
                display_name,
                role
              )
            `)
            .eq('owner_id', finalProfileData.id)
          
          console.log('에이전시 조회 결과:', agenciesData, '오류:', agenciesError)
          
          // 에이전시 소유자인데 에이전시가 없으면 안내 메시지
          if (finalProfileData.role === 'agency_owner' && (!agenciesData || agenciesData.length === 0)) {
            console.log('에이전시 소유자이지만 에이전시가 없습니다. 관리자에게 문의하세요.')
            // 자동 생성은 RLS 정책 때문에 실패하므로 비활성화
            // 대신 관리자가 수동으로 생성한 에이전시를 조회하는 데 집중
          }
          
          console.log('최종 에이전시 데이터:', agenciesData)
          setAgencies(agenciesData || [])
          
          // 포인트 잔액 가져오기
          if (agenciesData && agenciesData.length > 0) {
            const balanceResult = await getAgencyBalance(agenciesData[0].id)
            if (balanceResult.success) {
              setAgencyBalance(balanceResult.balance || 0)
            }
          }
          
          // 지점 데이터 가져오기
          if (agenciesData && agenciesData.length > 0) {
            const { data: branchesData } = await supabase
              .from('branches')
              .select('*')
              .in('agency_id', agenciesData.map(a => a.id))
            
            setBranches(branchesData || [])
          }
          
          // 플랫폼 데이터 가져오기
          const { data: platformsData } = await supabase
            .from('platforms')
            .select('*')
          
          setPlatforms(platformsData || [])
          
          // 에이전시-플랫폼 연동 데이터 가져오기
          if (agenciesData && agenciesData.length > 0) {
            const { data: agencyPlatformsData } = await supabase
              .from('agency_platforms')
              .select('*')
              .in('agency_id', agenciesData.map(a => a.id))
            
            setAgencyPlatforms(agencyPlatformsData || [])
          }
        }
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleCreateBranch = async (branchData: {
    name: string
    address: string
    phone: string
    description: string
    industry: string
  }) => {
    console.log('지점 생성 시도, 현재 에이전시 수:', agencies.length)
    console.log('에이전시 데이터:', agencies)
    
    if (!agencies.length) {
      console.log('에이전시가 없어서 지점 생성 실패')
      alert('에이전시 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    console.log('에이전시 ID로 지점 생성:', agencies[0].id)
    const { error } = await supabase
      .from('branches')
      .insert({
        agency_id: agencies[0].id,
        ...branchData
      })

    if (error) {
      console.error('지점 생성 오류:', error)
      alert('지점 생성에 실패했습니다: ' + error.message)
    } else {
      console.log('지점 생성 성공, 목록 새로고침 중...')
      // 지점 목록 새로고침
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .in('agency_id', agencies.map(a => a.id))
      
      setBranches(branchesData || [])
      setShowCreateBranch(false)
      alert('지점이 성공적으로 생성되었습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
        <Link href="/" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  if (!profile || (profile.role !== 'agency_owner' && profile.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h2>
        <p className="text-gray-600 mb-4">에이전시 소유자 또는 관리자만 접근할 수 있습니다.</p>
        <Link href="/" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">🏢 에이전시 대시보드</h1>
        <p className="text-xl text-gray-600">에이전시와 지점을 관리하고 리뷰를 모니터링하세요</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '개요', icon: '📊' },
            { id: 'points', name: '포인트 관리', icon: '💰' },
            { id: 'branches', name: '지점 관리', icon: '🏪' },
            { id: 'platforms', name: '플랫폼 연동', icon: '🔗' },
            { id: 'statistics', name: '통계', icon: '📈' }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 에이전시가 없을 때 안내 메시지 */}
          {agencies.length === 0 && profile?.role === 'agency_owner' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-yellow-800">에이전시 설정이 필요합니다</h3>
                  <p className="text-yellow-700 mt-1">
                    에이전시 정보를 불러오는 중입니다. 잠시 후 새로고침하거나 관리자에게 문의하세요.
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    새로고침
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">🏢</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">에이전시</p>
                  <p className="text-2xl font-bold text-gray-900">{agencies.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">🏪</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">지점</p>
                  <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">포인트 잔액</p>
                  <p className="text-2xl font-bold text-gray-900">{agencyBalance.toLocaleString()}P</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">최근 활동</h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>최근 활동이 없습니다.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'points' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agencies.length > 0 && (
            <>
              <PointDeposit
                agencyId={agencies[0].id}
                currentBalance={agencyBalance}
                onDepositSuccess={setAgencyBalance}
              />
              <PointHistory
                agencyId={agencies[0].id}
                title="포인트 거래 내역"
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">지점 관리</h3>
            <button
              onClick={() => setShowCreateBranch(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              새 지점 생성
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">지점이 없습니다</h3>
              <p className="text-gray-600 mb-4">첫 번째 지점을 생성해보세요.</p>
              <button
                onClick={() => setShowCreateBranch(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                지점 생성하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{branch.name}</h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">편집</button>
                      <button className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">주소:</span> {branch.address}</p>
                    <p><span className="font-medium">연락처:</span> {branch.phone}</p>
                    <p><span className="font-medium">업종:</span> {branch.industry}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => setSelectedBranch(branch)}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      QR 코드 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'platforms' && (
        <PlatformOAuth 
          platforms={platforms.map(p => ({ ...p, is_connected: false }))}
          onConnectionUpdate={(platformId, isConnected) => {
            // 연동 상태 업데이트 로직
            console.log(`플랫폼 ${platformId} 연동 상태: ${isConnected}`)
          }}
        />
      )}

      {/* 통계 탭 */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">에이전시 통계</h2>
          <AgencyStatisticsDashboard />
        </div>
      )}

      {/* QR Code Manager Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">QR 코드 관리</h2>
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <QRCodeManager 
                branch={selectedBranch}
                onQRCodeGenerated={(qrCodeUrl) => {
                  // QR 코드가 생성되면 데이터베이스에 저장할 수 있음
                  console.log('QR 코드 생성됨:', qrCodeUrl)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 지점 생성 모달 */}
      {showCreateBranch && (
        <BranchCreateModal
          onSave={handleCreateBranch}
          onClose={() => setShowCreateBranch(false)}
        />
      )}
    </div>
  )
}

// 지점 생성 모달 컴포넌트
function BranchCreateModal({ 
  onSave, 
  onClose 
}: { 
  onSave: (data: {
    name: string
    address: string
    phone: string
    description: string
    industry: string
  }) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    industry: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">새 지점 생성</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지점명 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 강남점, 홍대점"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 서울시 강남구 테헤란로 123"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 02-1234-5678"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업종
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">업종을 선택하세요</option>
              <option value="restaurant">음식점</option>
              <option value="cafe">카페</option>
              <option value="beauty">미용실</option>
              <option value="hospital">병원</option>
              <option value="education">교육</option>
              <option value="retail">소매</option>
              <option value="service">서비스</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지점 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="지점에 대한 간단한 설명을 입력하세요"
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
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}