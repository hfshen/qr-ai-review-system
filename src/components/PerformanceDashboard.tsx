'use client'

import { useState, useEffect } from 'react'
import { 
  getPerformanceMetrics, 
  getSystemHealth, 
  getCacheStats, 
  generatePerformanceRecommendations,
  getMemoryUsage,
  getNetworkStatus
} from '@/lib/performance-monitoring'

interface PerformanceDashboardProps {
  className?: string
}

export default function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<any[]>([])
  const [health, setHealth] = useState<any[]>([])
  const [cacheStats, setCacheStats] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0, percentage: 0 })
  const [networkStatus, setNetworkStatus] = useState({ online: false, connectionType: '', effectiveType: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // 30초마다 업데이트
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const memoryInterval = setInterval(() => {
      setMemoryUsage(getMemoryUsage())
    }, 5000)

    const networkInterval = setInterval(async () => {
      const status = await getNetworkStatus()
      setNetworkStatus(status)
    }, 10000)

    return () => {
      clearInterval(memoryInterval)
      clearInterval(networkInterval)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [metricsResult, healthResult, cacheResult, recommendationsResult] = await Promise.all([
        getPerformanceMetrics(),
        getSystemHealth(),
        getCacheStats(),
        generatePerformanceRecommendations()
      ])

      if (metricsResult.success) setMetrics(metricsResult.metrics || [])
      if (healthResult.success) setHealth(healthResult.health || [])
      if (cacheResult.success) setCacheStats(cacheResult.stats || [])
      if (recommendationsResult.success) setRecommendations(recommendationsResult.recommendations || [])
    } catch (error) {
      console.error('Error loading performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPerformanceRating = (hitRate: number) => {
    if (hitRate >= 80) return { text: 'Excellent', color: 'text-green-600' }
    if (hitRate >= 60) return { text: 'Good', color: 'text-blue-600' }
    if (hitRate >= 40) return { text: 'Fair', color: 'text-yellow-600' }
    return { text: 'Poor', color: 'text-red-600' }
  }

  const tabs = [
    { id: 'overview', name: '개요', icon: '📊' },
    { id: 'api', name: 'API 성능', icon: '🚀' },
    { id: 'system', name: '시스템 헬스', icon: '💚' },
    { id: 'cache', name: '캐시 성능', icon: '⚡' },
    { id: 'recommendations', name: '최적화 제안', icon: '💡' }
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
          <h2 className="text-2xl font-bold text-gray-900">성능 모니터링</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${networkStatus.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {networkStatus.online ? '온라인' : '오프라인'}
              </span>
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 시스템 상태 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">평균 응답 시간</p>
                    <p className="text-2xl font-bold">
                      {metrics.length > 0 
                        ? Math.round(metrics.reduce((sum, m) => sum + m.response_time, 0) / metrics.length) + 'ms'
                        : '0ms'
                      }
                    </p>
                  </div>
                  <div className="text-blue-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">시스템 상태</p>
                    <p className="text-2xl font-bold">
                      {health.filter(h => h.status === 'healthy').length}/{health.length}
                    </p>
                  </div>
                  <div className="text-green-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">메모리 사용량</p>
                    <p className="text-2xl font-bold">{memoryUsage.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="text-purple-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-3">
                {metrics.slice(0, 5).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        metric.status_code < 400 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{metric.method} {metric.endpoint}</span>
                    </div>
                    <span className="text-sm text-gray-500">{metric.response_time}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">엔드포인트</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메서드</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 응답시간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">에러율</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 수</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.slice(0, 10).map((metric, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.endpoint}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          metric.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          metric.method === 'POST' ? 'bg-green-100 text-green-800' :
                          metric.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {metric.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.response_time}ms</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          metric.status_code >= 400 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.status_code >= 400 ? '에러' : '정상'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {health.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{service.service_name}</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">응답 시간</span>
                      <span className="text-sm font-medium">{service.response_time}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">에러율</span>
                      <span className="text-sm font-medium">{service.error_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">가동률</span>
                      <span className="text-sm font-medium">{service.uptime_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">마지막 체크</span>
                      <span className="text-sm font-medium">
                        {new Date(service.last_check).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캐시 키</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">히트율</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성능</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 요청</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 접근</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cacheStats.map((stat, index) => {
                    const rating = getPerformanceRating(stat.hit_rate)
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.cache_key}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{stat.hit_rate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${rating.color}`}>
                            {rating.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.hit_count + stat.miss_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(stat.last_accessed).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">최적화 제안 없음</h3>
                <p className="mt-1 text-sm text-gray-500">현재 시스템이 최적 상태입니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
