'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  condition: string
  earnedAt?: string
  progress?: number
  maxProgress?: number
}

interface UserLevel {
  level: number
  name: string
  points: number
  nextLevelPoints: number
  progress: number
  benefits: string[]
}

interface StreakBonus {
  currentStreak: number
  maxStreak: number
  nextBonus: number
  bonusMultiplier: number
}

export function useGamification(userId: string) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null)
  const [streakBonus, setStreakBonus] = useState<StreakBonus | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!userId) return
    
    fetchGamificationData()
  }, [userId])

  const fetchGamificationData = async () => {
    try {
      // 사용자 포인트 및 활동 데이터 조회
      const [pointsResult, reviewsResult, postingResult] = await Promise.all([
        supabase
          .from('user_points')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('reviews')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('posting_tracker')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'posted')
          .order('posted_at', { ascending: false })
      ])

      const totalPoints = pointsResult.data?.reduce((sum, p) => sum + p.points, 0) || 0
      const totalReviews = reviewsResult.data?.length || 0
      const totalPosts = postingResult.data?.length || 0

      // 배지 시스템
      const availableBadges = generateAvailableBadges()
      const earnedBadges = await checkEarnedBadges(userId, {
        totalPoints,
        totalReviews,
        totalPosts,
        reviews: reviewsResult.data || [],
        postings: postingResult.data || []
      })

      setBadges(earnedBadges)

      // 레벨 시스템
      const level = calculateUserLevel(totalPoints)
      setUserLevel(level)

      // 연속 게시 보너스
      const streak = calculateStreakBonus(postingResult.data || [])
      setStreakBonus(streak)

    } catch (error) {
      console.error('게임화 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAvailableBadges = (): Badge[] => [
    {
      id: 'first_review',
      name: '첫 리뷰',
      description: '첫 번째 리뷰를 작성했어요',
      icon: '🌟',
      color: 'bg-yellow-500',
      condition: 'reviews >= 1'
    },
    {
      id: 'review_master',
      name: '리뷰 마스터',
      description: '10개의 리뷰를 작성했어요',
      icon: '👑',
      color: 'bg-purple-500',
      condition: 'reviews >= 10'
    },
    {
      id: 'platform_explorer',
      name: '플랫폼 탐험가',
      description: '3개 플랫폼에 모두 게시했어요',
      icon: '🚀',
      color: 'bg-blue-500',
      condition: 'platforms >= 3'
    },
    {
      id: 'social_butterfly',
      name: '소셜 나비',
      description: '20개의 리뷰를 게시했어요',
      icon: '🦋',
      color: 'bg-pink-500',
      condition: 'posts >= 20'
    },
    {
      id: 'point_collector',
      name: '포인트 수집가',
      description: '1000포인트를 획득했어요',
      icon: '💰',
      color: 'bg-green-500',
      condition: 'points >= 1000'
    },
    {
      id: 'streak_keeper',
      name: '연속 게시왕',
      description: '7일 연속으로 게시했어요',
      icon: '🔥',
      color: 'bg-red-500',
      condition: 'streak >= 7'
    },
    {
      id: 'quality_reviewer',
      name: '품질 리뷰어',
      description: '평점 5점 리뷰를 5개 작성했어요',
      icon: '⭐',
      color: 'bg-yellow-500',
      condition: 'five_star_reviews >= 5'
    },
    {
      id: 'early_bird',
      name: '일찍 일어나는 새',
      description: '오전 9시 이전에 리뷰를 게시했어요',
      icon: '🐦',
      color: 'bg-orange-500',
      condition: 'early_posts >= 1'
    }
  ]

  const checkEarnedBadges = async (userId: string, stats: any): Promise<Badge[]> => {
    const availableBadges = generateAvailableBadges()
    const earnedBadges: Badge[] = []

    for (const badge of availableBadges) {
      let earned = false
      let progress = 0
      let maxProgress = 0

      switch (badge.id) {
        case 'first_review':
          earned = stats.totalReviews >= 1
          progress = stats.totalReviews
          maxProgress = 1
          break
        case 'review_master':
          earned = stats.totalReviews >= 10
          progress = stats.totalReviews
          maxProgress = 10
          break
        case 'platform_explorer':
          const platforms = new Set(stats.postings.map((p: any) => p.platform_id))
          earned = platforms.size >= 3
          progress = platforms.size
          maxProgress = 3
          break
        case 'social_butterfly':
          earned = stats.totalPosts >= 20
          progress = stats.totalPosts
          maxProgress = 20
          break
        case 'point_collector':
          earned = stats.totalPoints >= 1000
          progress = stats.totalPoints
          maxProgress = 1000
          break
        case 'streak_keeper':
          const streak = calculateStreakBonus(stats.postings).currentStreak
          earned = streak >= 7
          progress = streak
          maxProgress = 7
          break
        case 'quality_reviewer':
          const fiveStarReviews = stats.reviews.filter((r: any) => r.rating === 5).length
          earned = fiveStarReviews >= 5
          progress = fiveStarReviews
          maxProgress = 5
          break
        case 'early_bird':
          const earlyPosts = stats.postings.filter((p: any) => {
            const hour = new Date(p.posted_at).getHours()
            return hour < 9
          }).length
          earned = earlyPosts >= 1
          progress = earlyPosts
          maxProgress = 1
          break
      }

      if (earned) {
        earnedBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
          progress,
          maxProgress
        })
      } else if (progress > 0) {
        earnedBadges.push({
          ...badge,
          progress,
          maxProgress
        })
      }
    }

    return earnedBadges
  }

  const calculateUserLevel = (totalPoints: number): UserLevel => {
    const levels = [
      { level: 1, name: '리뷰 초보', points: 0, benefits: ['기본 포인트 획득'] },
      { level: 2, name: '리뷰 애호가', points: 100, benefits: ['+10% 보너스 포인트', '특별 배지'] },
      { level: 3, name: '리뷰 전문가', points: 300, benefits: ['+20% 보너스 포인트', '우선 지원'] },
      { level: 4, name: '리뷰 마스터', points: 600, benefits: ['+30% 보너스 포인트', 'VIP 혜택'] },
      { level: 5, name: '리뷰 레전드', points: 1000, benefits: ['+50% 보너스 포인트', '전용 기능'] }
    ]

    let currentLevel = levels[0]
    let nextLevel = levels[1]

    for (let i = 0; i < levels.length - 1; i++) {
      if (totalPoints >= levels[i].points && totalPoints < levels[i + 1].points) {
        currentLevel = levels[i]
        nextLevel = levels[i + 1]
        break
      }
    }

    if (totalPoints >= levels[levels.length - 1].points) {
      currentLevel = levels[levels.length - 1]
      nextLevel = levels[levels.length - 1]
    }

    const progress = nextLevel.points > currentLevel.points 
      ? ((totalPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100
      : 100

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      points: totalPoints,
      nextLevelPoints: nextLevel.points,
      progress: Math.min(progress, 100),
      benefits: currentLevel.benefits
    }
  }

  const calculateStreakBonus = (postings: any[]): StreakBonus => {
    if (postings.length === 0) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        nextBonus: 1,
        bonusMultiplier: 1
      }
    }

    // 날짜별 게시 횟수 계산
    const dailyPosts = postings.reduce((acc, posting) => {
      const date = new Date(posting.posted_at).toDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 연속 게시 일수 계산
    const sortedDates = Object.keys(dailyPosts).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )

    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 0

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null
      
      if (nextDate) {
        const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayDiff === 1) {
          tempStreak++
        } else {
          maxStreak = Math.max(maxStreak, tempStreak + 1)
          tempStreak = 0
        }
      } else {
        tempStreak++
      }
    }

    currentStreak = tempStreak
    maxStreak = Math.max(maxStreak, currentStreak)

    // 보너스 계산
    const nextBonus = Math.ceil(currentStreak / 3) * 3
    const bonusMultiplier = 1 + Math.floor(currentStreak / 3) * 0.1

    return {
      currentStreak,
      maxStreak,
      nextBonus,
      bonusMultiplier: Math.min(bonusMultiplier, 2.0) // 최대 2배
    }
  }

  const awardStreakBonus = async (userId: string, basePoints: number) => {
    if (!streakBonus) return basePoints

    const bonusPoints = Math.floor(basePoints * (streakBonus.bonusMultiplier - 1))
    
    if (bonusPoints > 0) {
      try {
        await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            points: bonusPoints,
            source: 'streak_bonus',
            description: `연속 게시 보너스 (${streakBonus.currentStreak}일)`
          })
      } catch (error) {
        console.error('연속 게시 보너스 지급 오류:', error)
      }
    }

    return basePoints + bonusPoints
  }

  return {
    badges,
    userLevel,
    streakBonus,
    loading,
    awardStreakBonus
  }
}

// 배지 컬렉션 컴포넌트
export function BadgeCollection({ userId }: { userId: string }) {
  const { badges, loading } = useGamification(userId)

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mb-2"></div>
          <p className="text-gray-600 text-sm">배지 로딩 중...</p>
        </div>
      </div>
    )
  }

  const earnedBadges = badges.filter(b => b.earnedAt)
  const progressBadges = badges.filter(b => !b.earnedAt && b.progress && b.progress > 0)

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏆 나의 배지
      </h3>

      {/* 획득한 배지 */}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">획득한 배지</h4>
          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                <div className="text-center">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-medium text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행 중인 배지 */}
      {progressBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">진행 중인 배지</h4>
          <div className="space-y-3">
            {progressBadges.map((badge) => (
              <div key={badge.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-xl opacity-50">{badge.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>진행률</span>
                        <span>{badge.progress}/{badge.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(badge.progress! / badge.maxProgress!) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnedBadges.length === 0 && progressBadges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600 text-sm">첫 번째 배지를 획득해보세요!</p>
        </div>
      )}
    </div>
  )
}

// 레벨 시스템 컴포넌트
export function UserLevelWidget({ userId }: { userId: string }) {
  const { userLevel, loading } = useGamification(userId)

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mb-2"></div>
          <p className="text-gray-600 text-sm">레벨 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!userLevel) return null

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 나의 레벨
      </h3>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-blue-600 mb-1">
          Lv.{userLevel.level}
        </div>
        <div className="text-lg font-medium text-gray-900 mb-1">
          {userLevel.name}
        </div>
        <div className="text-sm text-gray-600">
          {userLevel.points} 포인트
        </div>
      </div>

      {/* 레벨 진행률 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>다음 레벨까지</span>
          <span>{userLevel.nextLevelPoints - userLevel.points} 포인트</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${userLevel.progress}%` }}
          ></div>
        </div>
      </div>

      {/* 레벨 혜택 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">현재 레벨 혜택</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          {userLevel.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span>✨</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// 연속 게시 보너스 컴포넌트
export function StreakBonusWidget({ userId }: { userId: string }) {
  const { streakBonus, loading } = useGamification(userId)

  if (loading) {
    return (
      <div className="mobile-card animate-fade-in">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mb-2"></div>
          <p className="text-gray-600 text-sm">연속 게시 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!streakBonus) return null

  return (
    <div className="mobile-card animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔥 연속 게시 보너스
      </h3>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-red-600 mb-2">
          {streakBonus.currentStreak}일
        </div>
        <div className="text-sm text-gray-600">
          현재 연속 게시 중
        </div>
      </div>

      {/* 보너스 배율 */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {streakBonus.bonusMultiplier.toFixed(1)}배
          </div>
          <div className="text-sm text-red-700">
            포인트 보너스 배율
          </div>
        </div>
      </div>

      {/* 다음 보너스까지 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">다음 보너스까지</span>
          <span className="text-sm font-medium text-gray-900">
            {streakBonus.nextBonus - streakBonus.currentStreak}일
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(streakBonus.currentStreak / streakBonus.nextBonus) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 최고 기록 */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <div className="text-sm text-gray-600">
          최고 기록: <span className="font-medium text-gray-900">{streakBonus.maxStreak}일</span>
        </div>
      </div>
    </div>
  )
}
