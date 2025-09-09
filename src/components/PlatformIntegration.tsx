'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

type Platform = Database['public']['Tables']['platforms']['Row']

interface PlatformIntegrationProps {
  branchId: string
  onPlatformsUpdate?: (platforms: Platform[]) => void
}

export default function PlatformIntegration({ branchId, onPlatformsUpdate }: PlatformIntegrationProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [rewardAmounts, setRewardAmounts] = useState<Record<string, number>>({})
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchPlatforms()
    fetchBranchPlatforms()
  }, [branchId])

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms')
      const data = await response.json()
      
      if (data.platforms) {
        setPlatforms(data.platforms)
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBranchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_platforms')
        .select(`
          platform_id,
          reward_per_review,
          platforms (id, name, code)
        `)
        .eq('agency_id', (await getAgencyId()))

      if (error) {
        console.error('Error fetching branch platforms:', error)
        return
      }

      if (data) {
        const platformIds = data.map(p => p.platform_id)
        const rewards = data.reduce((acc, p) => {
          acc[p.platform_id] = p.reward_per_review
          return acc
        }, {} as Record<string, number>)

        setSelectedPlatforms(platformIds)
        setRewardAmounts(rewards)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getAgencyId = async () => {
    const { data: branch } = await supabase
      .from('branches')
      .select('agency_id')
      .eq('id', branchId)
      .single()
    
    return branch?.agency_id
  }

  const handlePlatformToggle = async (platformId: string, checked: boolean) => {
    try {
      const agencyId = await getAgencyId()
      
      if (checked) {
        // 플랫폼 추가
        const { error } = await supabase
          .from('agency_platforms')
          .insert({
            agency_id: agencyId,
            platform_id: platformId,
            reward_per_review: 100 // 기본값
          })

        if (error) {
          console.error('Error adding platform:', error)
          return
        }

        setSelectedPlatforms(prev => [...prev, platformId])
        setRewardAmounts(prev => ({ ...prev, [platformId]: 100 }))
      } else {
        // 플랫폼 제거
        const { error } = await supabase
          .from('agency_platforms')
          .delete()
          .eq('agency_id', agencyId)
          .eq('platform_id', platformId)

        if (error) {
          console.error('Error removing platform:', error)
          return
        }

        setSelectedPlatforms(prev => prev.filter(id => id !== platformId))
        setRewardAmounts(prev => {
          const newRewards = { ...prev }
          delete newRewards[platformId]
          return newRewards
        })
      }

      onPlatformsUpdate?.(platforms.filter(p => selectedPlatforms.includes(p.id)))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleRewardChange = async (platformId: string, amount: number) => {
    try {
      const agencyId = await getAgencyId()
      
      const { error } = await supabase
        .from('agency_platforms')
        .update({ reward_per_review: amount })
        .eq('agency_id', agencyId)
        .eq('platform_id', platformId)

      if (error) {
        console.error('Error updating reward:', error)
        return
      }

      setRewardAmounts(prev => ({ ...prev, [platformId]: amount }))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div className="animate-pulse">플랫폼 로딩 중...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">소셜 플랫폼 연동</h3>
      
      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.id)}
                onChange={(e) => handlePlatformToggle(platform.id, e.target.checked)}
                aria-label={`${platform.name} 플랫폼 연동`}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium">{platform.name}</div>
                <div className="text-sm text-gray-500">{platform.description}</div>
              </div>
            </div>
            
            {selectedPlatforms.includes(platform.id) && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">리뷰당 보상:</label>
                <input
                  type="number"
                  value={rewardAmounts[platform.id] || 100}
                  onChange={(e) => handleRewardChange(platform.id, parseInt(e.target.value))}
                  min="0"
                  aria-label={`${platform.name} 리뷰당 보상`}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm text-gray-500">포인트</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>• 체크된 플랫폼에 리뷰가 자동으로 게시됩니다</p>
        <p>• 리뷰당 보상 포인트를 설정할 수 있습니다</p>
        <p>• 플랫폼 연동은 에이전시 소유자만 설정할 수 있습니다</p>
      </div>
    </div>
  )
}
