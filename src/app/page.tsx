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

      {/* 상세 스텝바이스텝 가이드 섹션 */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              🎯 완벽한 리뷰 작성 가이드
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              단계별로 따라하면 누구나 쉽게 완성도 높은 리뷰를 작성할 수 있습니다
            </p>
          </div>

          {/* 스텝 1: QR 스캔 */}
          <div className="mb-16 step-connector">
            <div className="mobile-card step-hover-lift animate-slide-up">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl mb-4 step-pulse">
                      <span className="text-3xl">📱</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold step-number">
                      1
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">QR 코드 스캔하기</h3>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      매장에 있는 QR 코드를 카메라로 스캔
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      자동으로 매장 정보와 메뉴가 로드됨
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      리뷰 작성 페이지로 자동 이동
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스텝 2: 리뷰 작성 */}
          <div className="mb-16 step-connector">
            <div className="mobile-card step-hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl mb-4 step-pulse">
                      <span className="text-3xl">✍️</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold step-number">
                      2
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">리뷰 작성하기</h3>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      간단한 평점과 키워드 선택 (예: 맛있어요, 친절해요)
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      사진 업로드 (선택사항)
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      AI가 자동으로 완성도 높은 리뷰 텍스트 생성
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스텝 3: AI 캡션 생성 */}
          <div className="mb-16 step-connector">
            <div className="mobile-card step-hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl mb-4 step-pulse">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold step-number">
                      3
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">AI 캡션 생성</h3>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      플랫폼별 최적화된 캡션 자동 생성
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      해시태그와 이모지 자동 추가
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      개인 취향에 맞춘 맞춤형 문체 적용
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스텝 4: 스마트 공유 */}
          <div className="mb-16 step-connector">
            <div className="mobile-card step-hover-lift animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl mb-4 step-pulse">
                      <span className="text-3xl">📤</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold step-number">
                      4
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">스마트 공유</h3>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      원하는 플랫폼 선택 (네이버, 인스타그램, 틱톡 등)
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      원탭으로 해당 앱으로 자동 이동
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      미리 작성된 내용으로 바로 게시 가능
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스텝 5: 포인트 획득 */}
          <div className="mb-16 step-connector">
            <div className="mobile-card step-hover-lift animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl mb-4 step-pulse">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold step-number">
                      5
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">포인트 획득</h3>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      리뷰 작성 완료 시 자동으로 포인트 적립
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      연속 작성 시 보너스 포인트 추가 지급
                    </p>
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      포인트로 다양한 혜택과 쿠폰 교환 가능
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="mobile-card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 animate-scale-in step-content-fade">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">전체 과정이 단 5분!</h3>
              <p className="text-gray-600 mb-4">
                복잡한 과정 없이 간단한 터치만으로 완성도 높은 리뷰를 작성하고 공유할 수 있습니다.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">#간편함</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">#AI자동화</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">#원탭공유</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">#포인트적립</span>
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