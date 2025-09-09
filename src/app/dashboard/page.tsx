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
          }
        } else {
          console.log('기존 프로필 로드됨:', profileData)
          setProfile(profileData)
        }
        
        // 에이전시 데이터 가져오기
        if (profileData?.role === 'agency_owner' || profileData?.role === 'admin') {
          const { data: agenciesData } = await supabase
            .from('agencies')
            .select('*')
            .eq('owner_id', profileData.id)
          
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">플랫폼 연동</h3>
          
          {platforms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">플랫폼이 없습니다</h3>
              <p className="text-gray-600">관리자가 플랫폼을 설정해야 합니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform) => (
                <div key={platform.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">기본 보상:</span>
                      <span className="font-medium">{platform.default_reward}P</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">연동 상태:</span>
                      <span className="text-red-600">미연동</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    연동하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 통계 탭 */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">에이전시 통계</h2>
          <StatisticsDashboard />
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
    </div>
  )
}