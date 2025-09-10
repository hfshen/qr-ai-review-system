'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import AuthForm from '@/components/AuthForm'
import UserProfile from '@/components/UserProfile'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lusdvyyrxfhzimtgdqyv.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1c2R2eXlyeGZoemltdGdkcXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzEwNzQsImV4cCI6MjA3MjkwNzA3NH0.FKv__AA1fsVDrwrWYyilMCySx7IyZ9ZEzoM3-UOJOKw'
    
    try {
      return createBrowserClient(url, key)
    } catch (error) {
      console.error('Supabase 클라이언트 생성 오류:', error)
      return null
    }
  })

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

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

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mobile-card animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                환영합니다!
              </h1>
              <p className="text-gray-600">
                {user.email}로 로그인되었습니다.
              </p>
            </div>
            <UserProfile user={user} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6 animate-bounce-in">
              <span className="text-3xl">🤖</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              AI 리뷰 플랫폼
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              QR 코드를 스캔하고 AI가 생성한 리뷰를 소셜 미디어에 자동으로 게시하세요.
              <br className="hidden sm:block" />
              포인트를 모아 다양한 혜택을 받아보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <button 
                onClick={() => {
                  // 로그인 모달 표시 또는 로그인 페이지로 이동
                  const authForm = document.querySelector('[data-auth-form]')
                  if (authForm) {
                    authForm.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    // AuthForm 컴포넌트가 없으면 직접 표시
                    window.location.href = '#auth-section'
                  }
                }}
                className="mobile-btn-primary hover-lift"
              >
                🚀 지금 시작하기
              </button>
              <a 
                href="/marketplace" 
                className="mobile-btn-secondary hover-lift"
              >
                🛒 마켓플레이스 둘러보기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              간편한 3단계 프로세스
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              복잡한 과정 없이 몇 번의 터치로 완성되는 리뷰 시스템
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="mobile-card hover-lift animate-slide-up">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">QR 코드 스캔</h3>
                <p className="text-gray-600 leading-relaxed">
                  매장의 QR 코드를 스캔하여 간편하게 리뷰를 시작하세요.
                </p>
              </div>
            </div>
            
            <div className="mobile-card hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">AI 리뷰 생성</h3>
                <p className="text-gray-600 leading-relaxed">
                  인공지능이 당신의 경험을 바탕으로 완성도 높은 리뷰를 자동 생성합니다.
                </p>
              </div>
            </div>
            
            <div className="mobile-card hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4">
                  <span className="text-2xl">📤</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">자동 게시</h3>
                <p className="text-gray-600 leading-relaxed">
                  네이버, 인스타그램, 틱톡 등 다양한 플랫폼에 리뷰를 자동으로 게시합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 포인트 시스템 섹션 */}
      <section className="py-12 lg:py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mobile-card hover-lift animate-scale-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                포인트 시스템
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                리뷰 작성부터 등급 혜택까지, 다양한 방법으로 포인트를 획득하고 사용하세요
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                <div className="text-3xl mb-3">⭐</div>
                <h4 className="font-semibold mb-2 text-gray-900">리뷰 작성</h4>
                <p className="text-sm text-gray-600">리뷰당 50-200P</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-semibold mb-2 text-gray-900">목표 달성</h4>
                <p className="text-sm text-gray-600">보너스 포인트</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                <div className="text-3xl mb-3">🎁</div>
                <h4 className="font-semibold mb-2 text-gray-900">포인트 사용</h4>
                <p className="text-sm text-gray-600">다양한 혜택</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                <div className="text-3xl mb-3">🏆</div>
                <h4 className="font-semibold mb-2 text-gray-900">등급 시스템</h4>
                <p className="text-sm text-gray-600">더 많은 혜택</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mobile-card hover-lift animate-bounce-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              지금 바로 시작해보세요!
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              간편한 가입으로 AI 리뷰 플랫폼의 모든 기능을 무료로 체험해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  const authSection = document.getElementById('auth-section')
                  if (authSection) {
                    authSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="mobile-btn-primary hover-lift"
              >
                🚀 무료로 시작하기
              </button>
              <a 
                href="/marketplace" 
                className="mobile-btn-secondary hover-lift"
              >
                🛒 마켓플레이스 둘러보기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 로그인/회원가입 섹션 */}
      <section id="auth-section" className="py-12 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              로그인 또는 회원가입
            </h2>
            <p className="text-gray-600">
              계정을 만들고 AI 리뷰 플랫폼을 시작해보세요
            </p>
          </div>
          <div data-auth-form>
            <AuthForm />
          </div>
        </div>
      </section>
    </div>
  )
}