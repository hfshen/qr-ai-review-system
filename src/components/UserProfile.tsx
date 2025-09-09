'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { User as DatabaseUser } from '@/types/database'

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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
    const fetchProfile = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // 먼저 현재 사용자의 auth 정보를 가져옴
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          console.error('인증된 사용자 정보가 없습니다')
          setLoading(false)
          return
        }

        // auth_id로 사용자 프로필 조회
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .maybeSingle() // single() 대신 maybeSingle() 사용

        if (error) {
          console.error('프로필 로딩 오류:', error)
          setLoading(false)
          return
        }

        if (!data) {
          // 프로필이 없으면 기본 프로필 생성
          console.log('프로필이 없어서 새로 생성합니다...')
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: authUser.id,
              email: authUser.email,
              display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
              role: 'user'
            })
            .select()
            .single()

          if (createError) {
            console.error('프로필 생성 오류:', createError)
            setLoading(false)
            return
          }

          console.log('새 프로필 생성됨:', newProfile)
          setProfile(newProfile)
        } else {
          console.log('기존 프로필 로드됨:', data)
          setProfile(data)
        }
      } catch (error) {
        console.error('프로필 로딩 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user.id, supabase])

  const updateProfile = async (updates: Partial<DatabaseUser>) => {
    if (!profile || !supabase) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('auth_id', user.id)

      if (error) {
        console.error('프로필 업데이트 오류:', error)
        return
      }

      setProfile({ ...profile, ...updates })
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">프로필 로딩 중...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <p className="text-red-600">프로필을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {profile.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {profile.display_name}
            </h3>
            <p className="text-gray-600">
              {profile.email}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                표시 이름
              </label>
              <input
                id="display_name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={profile.display_name || ''}
                onChange={(e) => updateProfile({ display_name: e.target.value })}
                disabled={updating}
                placeholder="표시 이름을 입력하세요"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                역할
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={profile.role}
                onChange={(e) => updateProfile({ role: e.target.value as any })}
                disabled={updating || profile.role === 'admin'}
              >
                <option value="user">일반 사용자</option>
                <option value="agency_owner">에이전시 소유자</option>
                {profile.role === 'admin' && <option value="admin">관리자</option>}
              </select>
            </div>

            {/* Created At */}
            <div className="text-sm text-gray-500">
              가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => supabase?.auth.signOut()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}