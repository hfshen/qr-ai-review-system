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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
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

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🤖 AI 리뷰 플랫폼
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
              홈
            </a>
            <a href="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
              대시보드
            </a>
            <a href="/marketplace" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
              마켓플레이스
            </a>
            <a href="/admin" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
              관리자
            </a>
            
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
  )
}
