'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type DatabaseUser = Database['public']['Tables']['users']['Row']

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()
        
        setProfile(profileData)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          getUser()
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Hydration 불일치 방지를 위해 마운트되지 않았을 때는 기본 상태 표시
  if (!mounted) {
    return (
      <>
        {/* 모바일 헤더 - 기본 상태 */}
        <header className="mobile-header animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">AI 리뷰</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <a 
                href="/auth" 
                className="mobile-btn-primary text-sm py-2 px-4"
              >
                로그인
              </a>
            </div>
          </div>
        </header>

        {/* 데스크톱 헤더 - 기본 상태 */}
        <nav className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🤖 AI 리뷰 플랫폼
                </h1>
              </div>
              
              <div className="flex items-center space-x-6">
                <a href="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                  홈
                </a>
                <a href="/marketplace" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                  마켓플레이스
                </a>
                <a href="/auth" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                  로그인
                </a>
              </div>
            </div>
          </div>
        </nav>
      </>
    )
  }

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="mobile-header animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">AI 리뷰</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {!loading && user && profile && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {profile.display_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
            
            {!loading && !user && (
              <a 
                href="/auth" 
                className="mobile-btn-primary text-sm py-2 px-4"
              >
                로그인
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="mobile-modal-content animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {profile?.display_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{profile?.display_name || '사용자'}</h3>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                </div>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                <a 
                  href="/" 
                  className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={toggleMenu}
                >
                  <span className="text-xl">🏠</span>
                  <span className="font-medium text-gray-900">홈</span>
                </a>

                {profile?.role === 'user' && (
                  <>
                    <a 
                      href="/marketplace" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">🛒</span>
                      <span className="font-medium text-gray-900">마켓플레이스</span>
                    </a>
                    <a 
                      href="/profile" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">👤</span>
                      <span className="font-medium text-gray-900">프로필</span>
                    </a>
                  </>
                )}

                {profile?.role === 'agency_owner' && (
                  <>
                    <a 
                      href="/dashboard" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">📊</span>
                      <span className="font-medium text-gray-900">에이전시 대시보드</span>
                    </a>
                    <a 
                      href="/marketplace" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">🛒</span>
                      <span className="font-medium text-gray-900">마켓플레이스</span>
                    </a>
                  </>
                )}

                {profile?.role === 'admin' && (
                  <>
                    <a 
                      href="/admin" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">⚙️</span>
                      <span className="font-medium text-gray-900">관리자 패널</span>
                    </a>
                    <a 
                      href="/dashboard" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">📊</span>
                      <span className="font-medium text-gray-900">대시보드</span>
                    </a>
                    <a 
                      href="/marketplace" 
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                      onClick={toggleMenu}
                    >
                      <span className="text-xl">🛒</span>
                      <span className="font-medium text-gray-900">마켓플레이스</span>
                    </a>
                  </>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLogout()
                      toggleMenu()
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">로그아웃</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* 데스크톱 헤더 (숨김) */}
      <nav className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🤖 AI 리뷰 플랫폼
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* 공통 메뉴 */}
              <a href="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                홈
              </a>
              
              {/* 역할별 메뉴 */}
              {!loading && profile && (
                <>
                  {/* 일반 사용자 메뉴 */}
                  {profile.role === 'user' && (
                    <>
                      <a href="/marketplace" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        마켓플레이스
                      </a>
                      <a href="/profile" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        프로필
                      </a>
                    </>
                  )}
                  
                  {/* 에이전시 소유자 메뉴 */}
                  {profile.role === 'agency_owner' && (
                    <>
                      <a href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        에이전시 대시보드
                      </a>
                      <a href="/marketplace" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        마켓플레이스
                      </a>
                    </>
                  )}
                  
                  {/* 관리자 메뉴 */}
                  {profile.role === 'admin' && (
                    <>
                      <a href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        관리자 패널
                      </a>
                      <a href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        대시보드
                      </a>
                      <a href="/marketplace" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                        마켓플레이스
                      </a>
                    </>
                  )}
                </>
              )}
              
              {/* 로그인하지 않은 사용자 */}
              {!loading && !user && (
                <>
                  <a href="/marketplace" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    마켓플레이스
                  </a>
                  <a href="/auth" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                    로그인
                  </a>
                </>
              )}
              
              {/* User Info & Logout */}
              {!loading && user && profile && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {profile.display_name}님
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors duration-200"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}