'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Platform {
  id: number
  name: string
  description: string
  default_reward: number
  is_connected: boolean
  oauth_url?: string
}

interface PlatformOAuthProps {
  platforms: Platform[]
  onConnectionUpdate: (platformId: number, isConnected: boolean) => void
}

export default function PlatformOAuth({ platforms, onConnectionUpdate }: PlatformOAuthProps) {
  const [connecting, setConnecting] = useState<number | null>(null)
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform.id)
    
    try {
      // 플랫폼별 OAuth URL 생성
      let oauthUrl = ''
      
      switch (platform.name.toLowerCase()) {
        case '네이버 리뷰':
          oauthUrl = `/auth/naver/callback`
          break
        case '인스타그램':
          oauthUrl = `/auth/instagram/callback`
          break
        case '틱톡':
          oauthUrl = `/auth/tiktok/callback`
          break
        case '小红书':
          oauthUrl = `/auth/xiaohongshu/callback`
          break
        case '구글 리뷰':
          oauthUrl = `/auth/google/callback`
          break
        default:
          throw new Error('지원하지 않는 플랫폼입니다.')
      }

      // OAuth 팝업 열기
      const popup = window.open(
        oauthUrl,
        'oauth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      }

      // 팝업에서 메시지 수신 대기
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          popup.close()
          window.removeEventListener('message', messageListener)
          onConnectionUpdate(platform.id, true)
          alert(`${platform.name} 연동이 완료되었습니다!`)
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup.close()
          window.removeEventListener('message', messageListener)
          alert(`연동 실패: ${event.data.error}`)
        }
      }

      window.addEventListener('message', messageListener)

      // 팝업이 닫혔는지 확인
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setConnecting(null)
        }
      }, 1000)

    } catch (error) {
      console.error('연동 오류:', error)
      alert(`연동 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`${platform.name} 연동을 해제하시겠습니까?`)) return

    try {
      // 연동 해제 로직 (실제 구현에서는 토큰 삭제 등)
      onConnectionUpdate(platform.id, false)
      alert(`${platform.name} 연동이 해제되었습니다.`)
    } catch (error) {
      console.error('연동 해제 오류:', error)
      alert('연동 해제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">플랫폼 연동</h3>
        <p className="text-sm text-gray-600">
          각 플랫폼과 연동하여 리뷰를 자동으로 게시할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">📱</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                <p className="text-sm text-gray-600">{platform.description}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">기본 보상</span>
                <span className="font-semibold text-blue-600">{platform.default_reward}P</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">연동 상태</span>
                <span className={`text-sm font-medium ${
                  platform.is_connected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {platform.is_connected ? '연동됨' : '미연동'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {platform.is_connected ? (
                <>
                  <button
                    onClick={() => handleDisconnect(platform)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    연동 해제
                  </button>
                  <button
                    onClick={() => window.open(`/platform/${platform.name.toLowerCase().replace(/\s+/g, '-')}/post`, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    리뷰 작성
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(platform)}
                  disabled={connecting === platform.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {connecting === platform.id ? '연동 중...' : '연동하기'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}