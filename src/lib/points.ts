import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PointTransaction {
  id: string
  user_id?: string
  agency_id?: string
  review_id?: string
  platform_id?: number
  points: number
  transaction_type: 'reward' | 'purchase' | 'agency_deposit' | 'admin_adjust'
  memo?: string
  created_at: string
}

export interface AgencyBalance {
  agency_id: string
  points_balance: number
  updated_at: string
}

export interface UserPoints {
  user_id: string
  points: number
  updated_at: string
}

export interface AgencyDeposit {
  id: string
  agency_id: string
  deposit_amount: number
  base_points: number
  bonus_points: number
  total_points: number
  created_at: string
}

/**
 * 사용자 포인트 잔액 조회
 */
export async function getUserPoints(userId: string): Promise<{ success: boolean; points?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때
      console.error('Error fetching user points:', error)
      return { success: false, error: error.message }
    }

    return { success: true, points: data?.points || 0 }
  } catch (error) {
    console.error('Error fetching user points:', error)
    return { success: false, error: '포인트 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 에이전시 포인트 잔액 조회
 */
export async function getAgencyBalance(agencyId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('agency_balances')
      .select('points_balance')
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching agency balance:', error)
      return { success: false, error: error.message }
    }

    // 잔액 레코드가 없으면 0으로 초기화
    if (!data) {
      console.log('에이전시 잔액 레코드가 없어서 초기화합니다:', agencyId)
      const { error: insertError } = await supabase
        .from('agency_balances')
        .insert({
          agency_id: agencyId,
          points_balance: 0
        })

      if (insertError) {
        console.error('에이전시 잔액 초기화 오류:', insertError)
        return { success: false, error: insertError.message }
      }

      return { success: true, balance: 0 }
    }

    return { success: true, balance: data.points_balance || 0 }
  } catch (error) {
    console.error('Error fetching agency balance:', error)
    return { success: false, error: '포인트 잔액 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 포인트 거래 내역 조회
 */
export async function getPointTransactions(
  userId?: string,
  agencyId?: string,
  limit: number = 50
): Promise<{ success: boolean; transactions?: PointTransaction[]; error?: string }> {
  try {
    let query = supabase
      .from('point_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching point transactions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, transactions: data || [] }
  } catch (error) {
    console.error('Error fetching point transactions:', error)
    return { success: false, error: '거래 내역 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 에이전시 포인트 충전
 */
export async function depositAgencyPoints(
  agencyId: string,
  depositAmount: number,
  paymentMethod: string = 'card'
): Promise<{ success: boolean; deposit?: AgencyDeposit; error?: string }> {
  try {
    const bonusPoints = calculateBonusPoints(depositAmount)
    const basePoints = depositAmount
    const totalPoints = basePoints + bonusPoints

    const { data, error } = await supabase
      .from('agency_deposits')
      .insert({
        agency_id: agencyId,
        deposit_amount: depositAmount,
        base_points: basePoints,
        bonus_points: bonusPoints,
        total_points: totalPoints,
        payment_method: paymentMethod,
        payment_status: 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('Error depositing agency points:', error)
      return { success: false, error: error.message }
    }

    return { success: true, deposit: data }
  } catch (error) {
    console.error('Error depositing agency points:', error)
    return { success: false, error: '포인트 충전 중 오류가 발생했습니다.' }
  }
}

/**
 * 포인트 사용 (마켓플레이스 구매)
 */
export async function usePoints(
  userId: string,
  points: number,
  memo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 먼저 사용자 포인트 확인
    const userPointsResult = await getUserPoints(userId)
    if (!userPointsResult.success) {
      return { success: false, error: userPointsResult.error }
    }

    if ((userPointsResult.points || 0) < points) {
      return { success: false, error: '포인트가 부족합니다.' }
    }

    // 포인트 거래 기록 생성
    const { error } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        points: -points, // 음수로 차감
        transaction_type: 'purchase',
        memo: memo
      })

    if (error) {
      console.error('Error using points:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error using points:', error)
    return { success: false, error: '포인트 사용 중 오류가 발생했습니다.' }
  }
}

/**
 * 보너스 포인트 계산 (guide.md의 계산 로직)
 */
export function calculateBonusPoints(depositAmount: number): number {
  if (depositAmount >= 1000000) {        // 100만원 이상: 50% 보너스
    return Math.floor(depositAmount * 0.5)
  } else if (depositAmount >= 500000) {   // 50만 이상: 30% 보너스
    return Math.floor(depositAmount * 0.3)
  } else if (depositAmount >= 100000) {   // 10만 이상: 20% 보너스
    return Math.floor(depositAmount * 0.2)
  } else if (depositAmount >= 50000) {    // 5만 이상: 10% 보너스
    return Math.floor(depositAmount * 0.1)
  } else {
    return 0
  }
}

/**
 * 포인트를 원화로 변환 (1포인트 = 1원)
 */
export function pointsToWon(points: number): number {
  return points
}

/**
 * 원화를 포인트로 변환 (1원 = 1포인트)
 */
export function wonToPoints(won: number): number {
  return Math.floor(won)
}
