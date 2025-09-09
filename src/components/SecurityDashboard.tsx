'use client'

import { useState, useEffect } from 'react'
import { 
  setupTwoFactorAuth, 
  verifyTwoFactorAuth, 
  enableTwoFactorAuth, 
  disableTwoFactorAuth,
  getSecurityEvents,
  getAuditLogs,
  resolveSecurityEvent,
  blockIP,
  isIPBlocked
} from '@/lib/security'

interface SecurityDashboardProps {
  className?: string
}

export default function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [twoFAStatus, setTwoFAStatus] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verificationToken, setVerificationToken] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [eventsResult, logsResult] = await Promise.all([
        getSecurityEvents(50),
        getAuditLogs(undefined, 100)
      ])

      if (eventsResult.success) setSecurityEvents(eventsResult.events || [])
      if (logsResult.success) setAuditLogs(logsResult.logs || [])
    } catch (error) {
      console.error('Error loading security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    try {
      const result = await setupTwoFactorAuth('current-user-id') // 실제로는 현재 사용자 ID 사용
      
      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl || '')
        setBackupCodes(result.backupCodes || [])
        setShowBackupCodes(true)
      } else {
        alert(result.error || '2FA 설정 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      alert('2FA 설정 중 오류가 발생했습니다.')
    }
  }

  const handleVerify2FA = async () => {
    try {
      const result = await verifyTwoFactorAuth('current-user-id', verificationToken)
      
      if (result.success) {
        alert('2FA 인증이 성공했습니다!')
        setVerificationToken('')
      } else {
        alert(result.error || '2FA 인증에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      alert('2FA 인증 중 오류가 발생했습니다.')
    }
  }

  const handleEnable2FA = async () => {
    try {
      const result = await enableTwoFactorAuth('current-user-id', verificationToken)
      
      if (result.success) {
        alert('2FA가 성공적으로 활성화되었습니다!')
        setTwoFAStatus({ is_enabled: true })
        setShowBackupCodes(false)
      } else {
        alert(result.error || '2FA 활성화에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      alert('2FA 활성화 중 오류가 발생했습니다.')
    }
  }

  const handleDisable2FA = async () => {
    if (confirm('2FA를 비활성화하시겠습니까? 보안이 약화될 수 있습니다.')) {
      try {
        const result = await disableTwoFactorAuth('current-user-id', 'password')
        
        if (result.success) {
          alert('2FA가 비활성화되었습니다.')
          setTwoFAStatus({ is_enabled: false })
        } else {
          alert(result.error || '2FA 비활성화에 실패했습니다.')
        }
      } catch (error) {
        console.error('Error disabling 2FA:', error)
        alert('2FA 비활성화 중 오류가 발생했습니다.')
      }
    }
  }

  const handleResolveEvent = async (eventId: string) => {
    try {
      const result = await resolveSecurityEvent(eventId, '관리자에 의해 해결됨')
      
      if (result.success) {
        alert('보안 이벤트가 해결되었습니다.')
        loadData() // 데이터 새로고침
      } else {
        alert(result.error || '보안 이벤트 해결에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error resolving security event:', error)
      alert('보안 이벤트 해결 중 오류가 발생했습니다.')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'overview', name: '보안 개요', icon: '🛡️' },
    { id: 'twofa', name: '2단계 인증', icon: '🔐' },
    { id: 'events', name: '보안 이벤트', icon: '⚠️' },
    { id: 'logs', name: '감사 로그', icon: '📋' },
    { id: 'settings', name: '보안 설정', icon: '⚙️' }
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
          <h2 className="text-2xl font-bold text-gray-900">보안 대시보드</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">보안 상태 양호</span>
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
            {/* 보안 상태 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">보안 점수</p>
                    <p className="text-3xl font-bold">85/100</p>
                  </div>
                  <div className="text-green-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">활성 세션</p>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <div className="text-blue-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">미해결 이벤트</p>
                    <p className="text-3xl font-bold">{securityEvents.filter(e => !e.resolved).length}</p>
                  </div>
                  <div className="text-orange-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">2FA 활성화</p>
                    <p className="text-3xl font-bold">{twoFAStatus?.is_enabled ? 'ON' : 'OFF'}</p>
                  </div>
                  <div className="text-purple-200">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 보안 이벤트 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 보안 이벤트</h3>
              <div className="space-y-3">
                {securityEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                      <span className="text-sm text-gray-700">{event.description}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                      {!event.resolved && (
                        <button
                          onClick={() => handleResolveEvent(event.id)}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          해결
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'twofa' && (
          <div className="space-y-6">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">2단계 인증 설정</h3>
              
              {!twoFAStatus?.is_enabled ? (
                <div className="space-y-4">
                  {!qrCodeUrl ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">2단계 인증을 설정하여 계정 보안을 강화하세요.</p>
                      <button
                        onClick={handleSetup2FA}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        2FA 설정 시작
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          인증 앱에서 다음 QR 코드를 스캔하세요:
                        </p>
                        <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto border border-gray-300 rounded" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          인증 코드 입력
                        </label>
                        <input
                          type="text"
                          value={verificationToken}
                          onChange={(e) => setVerificationToken(e.target.value)}
                          placeholder="6자리 인증 코드"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleVerify2FA}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          인증 확인
                        </button>
                        <button
                          onClick={handleEnable2FA}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          2FA 활성화
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showBackupCodes && backupCodes.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">백업 코드</h4>
                      <p className="text-xs text-yellow-700 mb-3">
                        이 코드들을 안전한 곳에 보관하세요. 각 코드는 한 번만 사용할 수 있습니다.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="text-xs font-mono bg-white p-2 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-green-600">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-lg font-semibold">2단계 인증이 활성화되어 있습니다</p>
                  </div>
                  <button
                    onClick={handleDisable2FA}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    2FA 비활성화
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">보안 이벤트</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                  <option value="all">모든 심각도</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이벤트 유형</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">심각도</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 주소</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityEvents.map((event, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.event_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{event.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.ip_address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.resolved ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {event.resolved ? '해결됨' : '미해결'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {!event.resolved && (
                          <button
                            onClick={() => handleResolveEvent(event.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            해결
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">감사 로그</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                  <option value="all">모든 작업</option>
                  <option value="login">로그인</option>
                  <option value="logout">로그아웃</option>
                  <option value="create">생성</option>
                  <option value="update">수정</option>
                  <option value="delete">삭제</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리소스</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 주소</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">심각도</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">보안 설정</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">세션 관리</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">세션 타임아웃</span>
                    <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                      <option value="15">15분</option>
                      <option value="30">30분</option>
                      <option value="60">1시간</option>
                      <option value="120">2시간</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">동시 세션 제한</span>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">레이트 리미팅</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">API 요청 제한</span>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">로그인 시도 제한</span>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">로그인 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">보안 이벤트 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">의심스러운 활동 알림</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">IP 차단</h4>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="IP 주소 입력"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <button className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      차단
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    차단된 IP: 0개
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
