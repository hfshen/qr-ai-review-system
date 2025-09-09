'use client'

import { useState, useEffect } from 'react'
import { 
  getComprehensiveAnalytics, 
  getPredictiveAnalytics, 
  getCustomReports,
  generateReportData,
  getCustomerSegmentation
} from '@/lib/advanced-analytics'

interface AdvancedAnalyticsDashboardProps {
  className?: string
}

export default function AdvancedAnalyticsDashboard({ className = '' }: AdvancedAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)
  const [customReports, setCustomReports] = useState<any[]>([])
  const [segments, setSegments] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [analyticsResult, predictionsResult, reportsResult, segmentsResult] = await Promise.all([
        getComprehensiveAnalytics(dateRange.start, dateRange.end),
        getPredictiveAnalytics(),
        getCustomReports(),
        getCustomerSegmentation()
      ])

      if (analyticsResult.success) setAnalyticsData(analyticsResult.data)
      if (predictionsResult.success) setPredictions(predictionsResult.predictions)
      if (reportsResult.success) setCustomReports(reportsResult.reports || [])
      if (segmentsResult.success) setSegments(segmentsResult.segments)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'overview', name: '종합 개요', icon: '📊' },
    { id: 'predictions', name: '예측 분석', icon: '🔮' },
    { id: 'segments', name: '고객 세그먼트', icon: '👥' },
    { id: 'reports', name: '사용자 리포트', icon: '📋' },
    { id: 'trends', name: '트렌드 분석', icon: '📈' }
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
          <h2 className="text-2xl font-bold text-gray-900">고급 분석 대시보드</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">기간:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              />
            </div>
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
        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-6">
            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">총 리뷰 수</p>
                    <p className="text-3xl font-bold">{formatNumber(analyticsData.total_reviews)}</p>
                  </div>
                  <div className="text-blue-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">평균 별점</p>
                    <p className="text-3xl font-bold">{analyticsData.avg_rating.toFixed(1)}</p>
                  </div>
                  <div className="text-green-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">활성 사용자</p>
                    <p className="text-3xl font-bold">{formatNumber(analyticsData.user_engagement.active_users)}</p>
                  </div>
                  <div className="text-purple-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">리텐션율</p>
                    <p className="text-3xl font-bold">{analyticsData.user_engagement.retention_rate.toFixed(1)}%</p>
                  </div>
                  <div className="text-orange-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 감정 분포 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">감정 분포</h3>
                <div className="space-y-3">
                  {Object.entries(analyticsData.sentiment_distribution).map(([sentiment, count]) => (
                    <div key={sentiment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(sentiment)}`}>
                          {sentiment === 'positive' ? '긍정' : sentiment === 'negative' ? '부정' : '중립'}
                        </span>
                        <span className="text-sm text-gray-700">{count}개</span>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            sentiment === 'positive' ? 'bg-green-500' : 
                            sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                          style={{ 
                            width: `${(count as number / Object.values(analyticsData.sentiment_distribution).reduce((a: number, b: number) => a + b, 0)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 플랫폼 분포 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">플랫폼 분포</h3>
                <div className="space-y-3">
                  {analyticsData.platform_distribution.slice(0, 5).map((platform: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{platform.platform}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{platform.count}개</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${platform.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{platform.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 상위 키워드 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {analyticsData.top_keywords.slice(0, 10).map((keyword: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {keyword.keyword} ({keyword.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && predictions && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">예측 분석 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-indigo-100 text-sm">다음 달 예상 리뷰 수</p>
                  <p className="text-2xl font-bold">{formatNumber(predictions.predicted_reviews_next_month)}</p>
                </div>
                <div>
                  <p className="text-indigo-100 text-sm">예상 사용자 증가</p>
                  <p className="text-2xl font-bold">{formatNumber(predictions.predicted_user_growth)}</p>
                </div>
                <div>
                  <p className="text-indigo-100 text-sm">신뢰도</p>
                  <p className="text-2xl font-bold">{(predictions.confidence_score * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-red-800 mb-3">리스크 팩터</h4>
                <ul className="space-y-2">
                  {predictions.risk_factors.map((risk: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-green-800 mb-3">기회 요소</h4>
                <ul className="space-y-2">
                  {predictions.opportunities.map((opportunity: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'segments' && segments && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">고객 세그먼트 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(segments).map(([segmentName, users]: [string, any]) => (
                <div key={segmentName} className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {segmentName === 'high_value' ? '고가치 고객' :
                     segmentName === 'active' ? '활성 고객' :
                     segmentName === 'new' ? '신규 고객' :
                     segmentName === 'at_risk' ? '이탈 위험' : segmentName}
                  </h4>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{users.length}명</p>
                  <p className="text-sm text-gray-600">
                    전체 사용자의 {((users.length / analyticsData?.total_users) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">사용자 정의 리포트</h3>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                새 리포트 생성
              </button>
            </div>
            
            {customReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customReports.map((report) => (
                  <div key={report.id} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">리포트가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">새로운 사용자 정의 리포트를 생성해보세요.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && analyticsData && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">월별 트렌드</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                {analyticsData.monthly_trends.slice(0, 6).map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{trend.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">리뷰: {trend.reviews}개</span>
                      <span className="text-sm text-gray-600">평점: {trend.avg_rating.toFixed(1)}</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ 
                            width: `${Math.min(100, (trend.reviews / Math.max(...analyticsData.monthly_trends.map((t: any) => t.reviews))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
