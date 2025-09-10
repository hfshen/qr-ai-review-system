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
    <div className="min-h-screen bg-white">
      {/* 히어로 섹션 - 컴팩트 모바일 버전 */}
      <section className="px-4 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4">
            <span className="text-xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            AI 리뷰 플랫폼
          </h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            QR 스캔 → AI 리뷰 생성 → 자동 게시
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => {
                const authForm = document.querySelector('[data-auth-form]')
                if (authForm) {
                  authForm.scrollIntoView({ behavior: 'smooth' })
                } else {
                  window.location.href = '#auth-section'
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              시작하기
            </button>
            <a 
              href="/marketplace" 
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              둘러보기
            </a>
          </div>
        </div>
      </section>

      {/* 컴팩트 스텝 가이드 섹션 */}
      <section className="px-4 py-6 bg-gray-50">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            📱 사용 방법
          </h2>
          <p className="text-xs text-gray-600">
            5단계로 간단하게 완성
          </p>
        </div>

        {/* 컴팩트 스텝 리스트 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <span className="text-sm font-medium text-gray-900">QR 코드 스캔</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">매장 QR 코드를 카메라로 스캔</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <span className="text-sm font-medium text-gray-900">리뷰 작성</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">평점과 키워드 선택, AI가 텍스트 생성</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-medium text-gray-900">AI 캡션 생성</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">플랫폼별 최적화된 캡션과 해시태그</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">📤</span>
                <span className="text-sm font-medium text-gray-900">스마트 공유</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">원탭으로 소셜미디어에 자동 게시</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span className="text-sm font-medium text-gray-900">포인트 획득</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">자동 적립 및 보너스 포인트</p>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm font-medium text-blue-800">✨ 전체 과정 단 5분 완성!</p>
        </div>
      </section>

      {/* 컴팩트 포인트 시스템 섹션 */}
      <section className="px-4 py-6">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            💰 포인트 시스템
          </h2>
          <p className="text-xs text-gray-600">
            리뷰 작성으로 포인트 획득
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-yellow-50 rounded-lg text-center">
            <div className="text-2xl mb-2">⭐</div>
            <h4 className="text-sm font-medium text-gray-900">리뷰 작성</h4>
            <p className="text-xs text-gray-600">50-200P</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="text-sm font-medium text-gray-900">목표 달성</h4>
            <p className="text-xs text-gray-600">보너스</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl mb-2">🎁</div>
            <h4 className="text-sm font-medium text-gray-900">포인트 사용</h4>
            <p className="text-xs text-gray-600">다양한 혜택</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="text-sm font-medium text-gray-900">등급 시스템</h4>
            <p className="text-xs text-gray-600">더 많은 혜택</p>
          </div>
        </div>
      </section>

      {/* 컴팩트 CTA 섹션 */}
      <section className="px-4 py-6 bg-blue-50">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            지금 바로 시작해보세요!
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            간편한 가입으로 모든 기능을 무료로 체험
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => {
                const authSection = document.getElementById('auth-section')
                if (authSection) {
                  authSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              무료로 시작하기
            </button>
            <a 
              href="/marketplace" 
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              둘러보기
            </a>
          </div>
        </div>
      </section>

      {/* 컴팩트 로그인 섹션 */}
      <section id="auth-section" className="px-4 py-6">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            로그인 또는 회원가입
          </h2>
          <p className="text-sm text-gray-600">
            계정을 만들고 시작해보세요
          </p>
        </div>
        <div data-auth-form>
          <AuthForm />
        </div>
      </section>
    </div>
  )
}