'use client'

import { useState, useEffect } from 'react'
import { 
  getSubscriptionPlans, 
  getUserSubscription, 
  createSubscription, 
  cancelSubscription,
  getAPIMarketplace,
  getAPIUsage,
  checkSubscriptionStatus,
  checkUsageLimits
} from '@/lib/business-features'

interface BusinessDashboardProps {
  className?: string
}

export default function BusinessDashboard({ className = '' }: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState('subscription')
  const [plans, setPlans] = useState<any[]>([])
  const [userSubscription, setUserSubscription] = useState<any>(null)
  const [apiMarketplace, setApiMarketplace] = useState<any[]>([])
  const [apiUsage, setApiUsage] = useState<any[]>([])
  const [usageLimits, setUsageLimits] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [plansResult, subscriptionResult, apiResult, usageResult] = await Promise.all([
        getSubscriptionPlans(),
        getUserSubscription('current-user-id'), // 실제로는 현재 사용자 ID 사용
        getAPIMarketplace(),
        getAPIUsage('current-user-id')
      ])

      if (plansResult.success) setPlans(plansResult.plans || [])
      if (subscriptionResult.success) setUserSubscription(subscriptionResult.subscription)
      if (apiResult.success) setApiMarketplace(apiResult.apis || [])
      if (usageResult.success) setApiUsage(usageResult.usage || [])

      // 사용량 제한 확인
      const limitsResult = await checkUsageLimits('current-user-id', 'reviews')
      if (limitsResult.success) {
        setUsageLimits(limitsResult)
      }
    } catch (error) {
      console.error('Error loading business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    try {
      const result = await createSubscription('current-user-id', planId, 'payment-method-id')
      
      if (result.success) {
        alert('구독이 성공적으로 생성되었습니다!')
        loadData() // 데이터 새로고침
      } else {
        alert(result.error || '구독 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('구독 생성 중 오류가 발생했습니다.')
    }
  }

  const handleCancelSubscription = async () => {
    if (confirm('구독을 취소하시겠습니까?')) {
      try {
        const result = await cancelSubscription('current-user-id', userSubscription.id)
        
        if (result.success) {
          alert('구독이 취소되었습니다.')
          loadData() // 데이터 새로고침
        } else {
          alert(result.error || '구독 취소에 실패했습니다.')
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error)
        alert('구독 취소 중 오류가 발생했습니다.')
      }
    }
  }

  const formatPrice = (price: number, currency: string = 'KRW') => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const tabs = [
    { id: 'subscription', name: '구독 관리', icon: '💳' },
    { id: 'api', name: 'API 마켓플레이스', icon: '🔌' },
    { id: 'usage', name: '사용량 현황', icon: '📊' },
    { id: 'billing', name: '결제 내역', icon: '💰' }
  ]

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">비즈니스 관리</h2>
          <div className="flex items-center space-x-4">
            {userSubscription && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">구독 활성</span>
              </div>
            )}
            <button
              onClick={loadData}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      {/* 탭 콘텐츠 */}
      <div className="p-6">
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* 현재 구독 상태 */}
            {userSubscription ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">활성 구독</h3>
                    <p className="text-sm text-green-600">
                      {userSubscription.subscription_plans?.name} - {formatPrice(userSubscription.subscription_plans?.price)}
                    </p>
                    <p className="text-xs text-green-500">
                      다음 결제일: {formatDate(userSubscription.current_period_end)}
                    </p>
                  </div>
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    구독 취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800">구독이 없습니다</h3>
                <p className="text-sm text-yellow-600">무료 플랜을 사용 중입니다. 업그레이드하여 더 많은 기능을 이용하세요.</p>
              </div>
            )}

            {/* 구독 플랜 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">구독 플랜</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-6 ${
                      plan.is_popular 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {plan.is_popular && (
                      <div className="text-center mb-4">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                          인기
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-gray-500">
                          /{plan.interval === 'monthly' ? '월' : '년'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        plan.is_popular
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                    >
                      {userSubscription?.plan_id === plan.id ? '현재 플랜' : '구독하기'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">API 마켓플레이스</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                  <option value="all">모든 카테고리</option>
                  <option value="ai">AI</option>
                  <option value="analytics">분석</option>
                  <option value="communication">통신</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apiMarketplace.map((api) => (
                <div key={api.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{api.name}</h4>
                      <p className="text-sm text-gray-600">{api.category}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {formatPrice(api.price_per_call)}/호출
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{api.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {api.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      제한: {api.rate_limit_per_minute}회/분
                    </span>
                    <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      사용하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">사용량 현황</h3>
            
            {/* 사용량 제한 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">리뷰 수</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {usageLimits.current || 0}/{usageLimits.limit || 0}
                    </p>
                  </div>
                  <div className="text-blue-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, ((usageLimits.current || 0) / (usageLimits.limit || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">API 호출</p>
                    <p className="text-2xl font-bold text-green-800">
                      {apiUsage.reduce((sum, usage) => sum + usage.request_count, 0)}
                    </p>
                  </div>
                  <div className="text-green-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">성공률</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {apiUsage.length > 0 
                        ? Math.round((apiUsage.reduce((sum, usage) => sum + usage.success_count, 0) / 
                          apiUsage.reduce((sum, usage) => sum + usage.request_count, 0)) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="text-purple-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">총 비용</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {formatPrice(apiUsage.reduce((sum, usage) => sum + usage.total_cost, 0))}
                    </p>
                  </div>
                  <div className="text-orange-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* API 사용량 상세 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">API 사용량 상세</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성공</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">실패</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiUsage.map((usage, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usage.endpoint}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usage.request_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{usage.success_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{usage.error_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(usage.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">결제 내역</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">결제 내역이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">아직 결제 내역이 없습니다.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
