'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { User as DatabaseUser } from '@/types/database'
import Marketplace from '@/components/Marketplace'

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        // 사용자 프로필 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error('프로필 로딩 오류:', profileError)
        }
        
        if (!profileData) {
          // 프로필이 없으면 기본 프로필 생성
          console.log('프로필이 없어서 새로 생성합니다...')
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: user.id,
              email: user.email,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
              role: 'user'
            })
            .select()
            .single()

          if (createError) {
            console.error('프로필 생성 오류:', createError)
          } else {
            console.log('새 프로필 생성됨:', newProfile)
            setProfile(newProfile)
          }
        } else {
          console.log('기존 프로필 로드됨:', profileData)
          setProfile(profileData)
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-4">마켓플레이스를 이용하려면 로그인해주세요.</p>
          <a 
            href="/" 
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Marketplace user={profile} />
    </div>
  )
}
