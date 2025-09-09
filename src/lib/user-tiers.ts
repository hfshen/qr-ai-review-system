import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UserTier {
  id: string
  name: string
  level: number
  min_points: number
  max_points: number
  benefits: string[]
  color: string
  icon: string
  created_at: string
}

export interface UserTierProgress {
  current_tier: UserTier
  next_tier?: UserTier
  progress_percentage: number
  points_to_next: number
  current_points: number
}

export interface TierBenefit {
  id: string
  tier_id: string
  benefit_type: 'discount' | 'bonus' | 'feature' | 'priority'
  benefit_value: number
  benefit_description: string
  is_active: boolean
  created_at: string
}

// 기본 사용자 등급 정의
export const defaultUserTiers: Omit<UserTier, 'id' | 'created_at'>[] = [
  {
    name: '브론즈',
    level: 1,
    min_points: 0,
    max_points: 9999,
    benefits: [
      '기본 리뷰 작성',
      '포인트 적립',
      '마켓플레이스 이용'
    ],
    color: '#CD7F32',
    icon: '🥉'
  },
  {
    name: '실버',
    level: 2,
    min_points: 10000,
    max_points: 49999,
    benefits: [
      '브론즈 혜택',
      '5% 추가 포인트 보너스',
      '우선 고객 지원',
      '특별 이벤트 참여'
    ],
    color: '#C0C0C0',
    icon: '🥈'
  },
  {
    name: '골드',
    level: 3,
    min_points: 50000,
    max_points: 99999,
    benefits: [
      '실버 혜택',
      '10% 추가 포인트 보너스',
      '전용 고객 지원',
      'VIP 이벤트 참여',
      '무료 프리미엄 기능'
    ],
    color: '#FFD700',
    icon: '🥇'
  },
  {
    name: '플래티넘',
    level: 4,
    min_points: 100000,
    max_points: 999999,
    benefits: [
      '골드 혜택',
      '15% 추가 포인트 보너스',
      '1:1 전담 고객 지원',
      '독점 이벤트 참여',
      '모든 프리미엄 기능 무료',
      '우선 신기능 체험'
    ],
    color: '#E5E4E2',
    icon: '💎'
  },
  {
    name: '다이아몬드',
    level: 5,
    min_points: 1000000,
    max_points: 9999999,
    benefits: [
      '플래티넘 혜택',
      '20% 추가 포인트 보너스',
      '24/7 전담 고객 지원',
      '독점 VIP 이벤트',
      '모든 기능 무제한 이용',
      '신기능 우선 체험',
      '개인 맞춤 서비스'
    ],
    color: '#B9F2FF',
    icon: '💠'
  }
]

/**
 * 사용자 등급 조회
 */
export async function getUserTiers(): Promise<{ success: boolean; tiers?: UserTier[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_tiers')
      .select('*')
      .order('level', { ascending: true })

    if (error) {
      console.error('Error fetching user tiers:', error)
      return { success: false, error: error.message }
    }

    return { success: true, tiers: data || [] }
  } catch (error) {
    console.error('Error fetching user tiers:', error)
    return { success: false, error: '사용자 등급 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자의 현재 등급 및 진행 상황 조회
 */
export async function getUserTierProgress(userId: string): Promise<{ success: boolean; progress?: UserTierProgress; error?: string }> {
  try {
    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('Error fetching user points:', pointsError)
      return { success: false, error: pointsError.message }
    }

    const currentPoints = userPoints?.points || 0

    // 모든 등급 조회
    const { data: tiers, error: tiersError } = await supabase
      .from('user_tiers')
      .select('*')
      .order('level', { ascending: true })

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError)
      return { success: false, error: tiersError.message }
    }

    if (!tiers || tiers.length === 0) {
      return { success: false, error: '등급 정보를 찾을 수 없습니다.' }
    }

    // 현재 등급 찾기
    const currentTier = tiers.find(tier => 
      currentPoints >= tier.min_points && currentPoints <= tier.max_points
    ) || tiers[0] // 기본값은 첫 번째 등급

    // 다음 등급 찾기
    const nextTier = tiers.find(tier => tier.level > currentTier.level)

    // 진행률 계산
    let progressPercentage = 100
    let pointsToNext = 0

    if (nextTier) {
      const tierRange = nextTier.min_points - currentTier.min_points
      const currentProgress = currentPoints - currentTier.min_points
      progressPercentage = Math.min(100, Math.max(0, (currentProgress / tierRange) * 100))
      pointsToNext = Math.max(0, nextTier.min_points - currentPoints)
    }

    return {
      success: true,
      progress: {
        current_tier: currentTier,
        next_tier: nextTier,
        progress_percentage: progressPercentage,
        points_to_next: pointsToNext,
        current_points: currentPoints
      }
    }
  } catch (error) {
    console.error('Error fetching user tier progress:', error)
    return { success: false, error: '사용자 등급 진행 상황 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 등급 생성
 */
export async function createUserTier(tierData: Omit<UserTier, 'id' | 'created_at'>): Promise<{ success: boolean; tier?: UserTier; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_tiers')
      .insert(tierData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user tier:', error)
      return { success: false, error: error.message }
    }

    return { success: true, tier: data }
  } catch (error) {
    console.error('Error creating user tier:', error)
    return { success: false, error: '사용자 등급 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 등급 업데이트
 */
export async function updateUserTier(tierId: string, tierData: Partial<UserTier>): Promise<{ success: boolean; tier?: UserTier; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_tiers')
      .update(tierData)
      .eq('id', tierId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user tier:', error)
      return { success: false, error: error.message }
    }

    return { success: true, tier: data }
  } catch (error) {
    console.error('Error updating user tier:', error)
    return { success: false, error: '사용자 등급 업데이트 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 등급 삭제
 */
export async function deleteUserTier(tierId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_tiers')
      .delete()
      .eq('id', tierId)

    if (error) {
      console.error('Error deleting user tier:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting user tier:', error)
    return { success: false, error: '사용자 등급 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 등급별 혜택 조회
 */
export async function getTierBenefits(tierId: string): Promise<{ success: boolean; benefits?: TierBenefit[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tier_benefits')
      .select('*')
      .eq('tier_id', tierId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tier benefits:', error)
      return { success: false, error: error.message }
    }

    return { success: true, benefits: data || [] }
  } catch (error) {
    console.error('Error fetching tier benefits:', error)
    return { success: false, error: '등급 혜택 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 등급별 혜택 추가
 */
export async function addTierBenefit(benefitData: Omit<TierBenefit, 'id' | 'created_at'>): Promise<{ success: boolean; benefit?: TierBenefit; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tier_benefits')
      .insert(benefitData)
      .select()
      .single()

    if (error) {
      console.error('Error adding tier benefit:', error)
      return { success: false, error: error.message }
    }

    return { success: true, benefit: data }
  } catch (error) {
    console.error('Error adding tier benefit:', error)
    return { success: false, error: '등급 혜택 추가 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 등급 업데이트 (포인트 변경 시 자동 호출)
 */
export async function updateUserTierBasedOnPoints(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('Error fetching user points:', pointsError)
      return { success: false, error: pointsError.message }
    }

    const currentPoints = userPoints?.points || 0

    // 모든 등급 조회
    const { data: tiers, error: tiersError } = await supabase
      .from('user_tiers')
      .select('*')
      .order('level', { ascending: true })

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError)
      return { success: false, error: tiersError.message }
    }

    // 현재 등급 찾기
    const currentTier = tiers.find(tier => 
      currentPoints >= tier.min_points && currentPoints <= tier.max_points
    )

    if (currentTier) {
      // 사용자 등급 정보 업데이트 (users 테이블에 tier_id 컬럼이 있다고 가정)
      const { error: updateError } = await supabase
        .from('users')
        .update({ tier_id: currentTier.id })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user tier:', updateError)
        return { success: false, error: updateError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating user tier based on points:', error)
    return { success: false, error: '사용자 등급 업데이트 중 오류가 발생했습니다.' }
  }
}

/**
 * 등급별 포인트 보너스 계산
 */
export function calculateTierBonus(basePoints: number, tierLevel: number): number {
  switch (tierLevel) {
    case 1: // 브론즈
      return 0
    case 2: // 실버
      return Math.floor(basePoints * 0.05)
    case 3: // 골드
      return Math.floor(basePoints * 0.10)
    case 4: // 플래티넘
      return Math.floor(basePoints * 0.15)
    case 5: // 다이아몬드
      return Math.floor(basePoints * 0.20)
    default:
      return 0
  }
}

/**
 * 등급별 색상 가져오기
 */
export function getTierColor(tierLevel: number): string {
  const tier = defaultUserTiers.find(t => t.level === tierLevel)
  return tier ? tier.color : '#CD7F32'
}

/**
 * 등급별 아이콘 가져오기
 */
export function getTierIcon(tierLevel: number): string {
  const tier = defaultUserTiers.find(t => t.level === tierLevel)
  return tier ? tier.icon : '🥉'
}

/**
 * 등급별 이름 가져오기
 */
export function getTierName(tierLevel: number): string {
  const tier = defaultUserTiers.find(t => t.level === tierLevel)
  return tier ? tier.name : '브론즈'
}
