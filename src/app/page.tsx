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
    // 환경 변수를 직접 확인하고 전달
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">설정 오류</h2>
          <p className="text-gray-600">
            Supabase 환경 변수가 설정되지 않았습니다. 
            .env.local 파일을 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-5xl font-bold text-gray-900 animate-fade-in">
          🤖 AI 자동 리뷰 플랫폼
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-slide-up">
          QR 코드를 스캔하고 AI가 자동으로 리뷰를 생성해드립니다
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 animate-slide-up">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              👤 사용자
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                QR 코드 스캔으로 간편한 리뷰 작성
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                AI가 자동으로 자연스러운 리뷰 생성
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                여러 플랫폼에 한 번에 게시
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                포인트 적립으로 보상 받기
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 animate-slide-up">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🏢 에이전시
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                지점별 QR 코드 생성 및 관리
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                플랫폼 연동 및 수수료 설정
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                리뷰 통계 및 분석
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                포인트 충전 및 관리
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900">시작하기</h3>
          {user ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                로그인된 사용자: {user.email}
              </div>
              <UserProfile user={user} />
            </div>
          ) : (
            <AuthForm />
          )}
        </div>
      </div>

      {/* How it Works */}
      <div className="space-y-8 py-12">
        <h3 className="text-3xl font-bold text-gray-900 text-center">리뷰 작성 방법</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "1", title: "QR 스캔", desc: "매장의 QR 코드를 스캔하세요" },
            { step: "2", title: "사진 촬영", desc: "최대 3장의 사진을 촬영하세요" },
            { step: "3", title: "별점 선택", desc: "1-5점 별점과 키워드를 선택하세요" },
            { step: "4", title: "AI 생성", desc: "AI가 자동으로 리뷰를 생성합니다" }
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center animate-slide-up hover:shadow-md transition-shadow duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-blue-600">{item.step}</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}