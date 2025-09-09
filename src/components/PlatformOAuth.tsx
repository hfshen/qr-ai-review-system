'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

type Platform = Database['public']['Tables']['platforms']['Row']
type UserPlatform = Database['public']['Tables']['user_platforms']['Row']

interface PlatformOAuthProps {
  userId: string
  platforms: Platform[]
  userPlatforms: UserPlatform[]
  onPlatformConnected: (platformId: number) => void
}

export default function PlatformOAuth({ userId, platforms, userPlatforms, onPlatformConnected }: PlatformOAuthProps) {
  const [connecting, setConnecting] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const getPlatformIcon = (platformCode: string) => {
    switch (platformCode) {
      case 'naver': return '🟢'
      case 'instagram': return '📷'
      case 'tiktok': return '🎵'
      case 'xiaohongshu': return '📖'
      case 'google': return '🔍'
      default: return '🌐'
    }
  }

  const getPlatformName = (platformCode: string) => {
    switch (platformCode) {
      case 'naver': return '네이버'
      case 'instagram': return '인스타그램'
      case 'tiktok': return '틱톡'
      case 'xiaohongshu': return '샤오홍슈'
      case 'google': return '구글'
      default: return platformCode
    }
  }

  const isPlatformConnected = (platformId: number) => {
    return userPlatforms.some(up => up.platform_id === platformId && up.connected)
  }

  const handleOAuthConnect = async (platform: Platform) => {
    setConnecting(platform.id)
    setError('')

    try {
      switch (platform.code) {
        case 'naver':
          await connectNaver(platform.id)
          break
        case 'instagram':
          await connectInstagram(platform.id)
          break
        case 'tiktok':
          await connectTikTok(platform.id)
          break
        case 'google':
          await connectGoogle(platform.id)
          break
        default:
          throw new Error('지원하지 않는 플랫폼입니다.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '연동 중 오류가 발생했습니다.')
      console.error('OAuth 연동 오류:', error)
    } finally {
      setConnecting(null)
    }
  }

  const connectNaver = async (platformId: number) => {
    // 네이버 OAuth URL 생성
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/naver/callback`
    
    if (!clientId) {
      throw new Error('네이버 클라이언트 ID가 설정되지 않았습니다.')
    }

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${platformId}`

    // 새 창에서 네이버 OAuth 열기
    const popup = window.open(naverAuthUrl, 'naver-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업을 허용해주세요.')
    }

    // 팝업에서 결과를 기다림
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        // 팝업이 닫혔을 때 연동 상태 확인
        checkConnectionStatus(platformId)
      }
    }, 1000)
  }

  const connectInstagram = async (platformId: number) => {
    // 인스타그램 OAuth URL 생성
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/instagram/callback`
    
    if (!clientId) {
      throw new Error('인스타그램 클라이언트 ID가 설정되지 않았습니다.')
    }

    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${platformId}`

    const popup = window.open(instagramAuthUrl, 'instagram-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업을 허용해주세요.')
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        checkConnectionStatus(platformId)
      }
    }, 1000)
  }

  const connectTikTok = async (platformId: number) => {
    // 틱톡 OAuth URL 생성
    const clientId = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/tiktok/callback`
    
    if (!clientId) {
      throw new Error('틱톡 클라이언트 ID가 설정되지 않았습니다.')
    }

    const tiktokAuthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&response_type=code&scope=user.info.basic&redirect_uri=${encodeURIComponent(redirectUri)}&state=${platformId}`

    const popup = window.open(tiktokAuthUrl, 'tiktok-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업을 허용해주세요.')
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        checkConnectionStatus(platformId)
      }
    }, 1000)
  }

  const connectGoogle = async (platformId: number) => {
    // 구글 OAuth URL 생성
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/google/callback`
    
    if (!clientId) {
      throw new Error('구글 클라이언트 ID가 설정되지 않았습니다.')
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/userinfo.profile&response_type=code&state=${platformId}`

    const popup = window.open(googleAuthUrl, 'google-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업을 허용해주세요.')
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        checkConnectionStatus(platformId)
      }
    }, 1000)
  }

  const checkConnectionStatus = async (platformId: number) => {
    try {
      const { data } = await supabase
        .from('user_platforms')
        .select('*')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .single()

      if (data && data.connected) {
        onPlatformConnected(platformId)
      }
    } catch (error) {
      console.error('연동 상태 확인 오류:', error)
    }
  }

  const handleDisconnect = async (platformId: number) => {
    if (!confirm('정말로 이 플랫폼과의 연동을 해제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('user_platforms')
        .update({ connected: false, account_identifier: null })
        .eq('user_id', userId)
        .eq('platform_id', platformId)

      if (error) throw error

      // 페이지 새로고침으로 상태 업데이트
      window.location.reload()
    } catch (error) {
      setError('연동 해제 중 오류가 발생했습니다.')
      console.error('연동 해제 오류:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">소셜 플랫폼 연동</h3>
        <p className="text-gray-600">리뷰를 게시할 플랫폼과 계정을 연동하세요</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const isConnected = isPlatformConnected(platform.id)
          const isConnecting = connecting === platform.id

          return (
            <div key={platform.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getPlatformIcon(platform.code)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{getPlatformName(platform.code)}</h4>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        연동됨
                      </span>
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        해제
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOAuthConnect(platform)}
                      disabled={isConnecting}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isConnecting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isConnecting ? '연동 중...' : '연동하기'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">연동 안내</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 각 플랫폼의 계정으로 로그인하여 연동을 완료하세요</li>
          <li>• 연동된 플랫폼에만 리뷰를 게시할 수 있습니다</li>
          <li>• 연동 해제는 언제든지 가능합니다</li>
          <li>• 개인정보는 안전하게 보호됩니다</li>
        </ul>
      </div>
    </div>
  )
}
