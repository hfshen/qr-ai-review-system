'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthForm() {
  const [user, setUser] = useState<User | null>(null)
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
    if (!supabase) return

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  if (!supabase) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Supabase 설정 오류</p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg text-gray-700">안녕하세요, {user.email}님!</p>
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          onClick={() => supabase.auth.signOut()}
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            로그인
          </h3>
          <p className="text-gray-600">
            계정에 로그인하여 AI 리뷰 플랫폼을 이용하세요
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                  }
                }
              }
            }}
            providers={['google']}
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          />
        </div>
      </div>
    </div>
  )
}