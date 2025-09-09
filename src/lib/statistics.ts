import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DashboardStats {
  totalUsers: number
  totalAgencies: number
  totalBranches: number
  totalReviews: number
  totalPointsIssued: number
  totalPointsUsed: number
  recentReviews: number
  averageRating: number
}

export interface BranchStats {
  branchId: string
  branchName: string
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  recentReviews: number
}

export interface PlatformStats {
  platformId: number
  platformName: string
  totalReviews: number
  successRate: number
  averageReward: number
}

/**
 * 전체 대시보드 통계 조회
 */
export async function getDashboardStats(): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  try {
    // 병렬로 모든 통계 조회
    const [
      usersResult,
      agenciesResult,
      branchesResult,
      reviewsResult,
      pointsIssuedResult,
      pointsUsedResult,
      recentReviewsResult,
      averageRatingResult
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('agencies').select('id', { count: 'exact', head: true }),
      supabase.from('branches').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('point_transactions').select('points').eq('transaction_type', 'reward'),
      supabase.from('point_transactions').select('points').eq('transaction_type', 'purchase'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('reviews').select('rating').eq('status', 'published')
    ])

    // 포인트 합계 계산
    const totalPointsIssued = pointsIssuedResult.data?.reduce((sum, tx) => sum + (tx.points || 0), 0) || 0
    const totalPointsUsed = Math.abs(pointsUsedResult.data?.reduce((sum, tx) => sum + (tx.points || 0), 0) || 0)

    // 평균 별점 계산
    const ratings = averageRatingResult.data?.map(r => r.rating) || []
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

    const stats: DashboardStats = {
      totalUsers: usersResult.count || 0,
      totalAgencies: agenciesResult.count || 0,
      totalBranches: branchesResult.count || 0,
      totalReviews: reviewsResult.count || 0,
      totalPointsIssued,
      totalPointsUsed,
      recentReviews: recentReviewsResult.count || 0,
      averageRating: Math.round(averageRating * 10) / 10
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { success: false, error: '통계 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 지점별 통계 조회
 */
export async function getBranchStats(): Promise<{ success: boolean; stats?: BranchStats[]; error?: string }> {
  try {
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select(`
        id,
        name,
        reviews (
          id,
          rating,
          created_at,
          status
        )
      `)

    if (branchesError) {
      console.error('Error fetching branch stats:', branchesError)
      return { success: false, error: branchesError.message }
    }

    const branchStats: BranchStats[] = branches?.map(branch => {
      const reviews = branch.reviews || []
      const publishedReviews = reviews.filter((r: any) => r.status === 'published')
      
      const ratingDistribution = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      }
      
      publishedReviews.forEach((review: any) => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingDistribution[review.rating as keyof typeof ratingDistribution]++
        }
      })

      const totalReviews = publishedReviews.length
      const averageRating = totalReviews > 0 
        ? publishedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
        : 0

      const recentReviews = publishedReviews.filter((review: any) => 
        new Date(review.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        recentReviews
      }
    }) || []

    return { success: true, stats: branchStats }
  } catch (error) {
    console.error('Error fetching branch stats:', error)
    return { success: false, error: '지점 통계 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 플랫폼별 통계 조회
 */
export async function getPlatformStats(): Promise<{ success: boolean; stats?: PlatformStats[]; error?: string }> {
  try {
    // 플랫폼 목록 조회
    const { data: platforms, error: platformsError } = await supabase
      .from('platforms')
      .select('id, name, default_reward')

    if (platformsError) {
      console.error('Error fetching platforms:', platformsError)
      return { success: false, error: platformsError.message }
    }

    // 각 플랫폼별로 리뷰 통계 조회
    const platformStats: PlatformStats[] = []
    
    for (const platform of platforms || []) {
      // 해당 플랫폼의 리뷰 조회
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, status')
        .eq('platform_id', platform.id)

      if (reviewsError) {
        console.error(`Error fetching reviews for platform ${platform.id}:`, reviewsError)
        continue
      }

      const publishedReviews = reviews?.filter(r => r.status === 'published') || []
      const totalReviews = publishedReviews.length
      const successRate = reviews && reviews.length > 0 ? (totalReviews / reviews.length) * 100 : 0

      // 에이전시 플랫폼 연동에서 평균 보상 조회
      const { data: agencyPlatforms, error: agencyPlatformsError } = await supabase
        .from('agency_platforms')
        .select('reward_per_review')
        .eq('platform_id', platform.id)

      const rewards = agencyPlatforms?.map(ap => ap.reward_per_review) || [platform.default_reward]
      const averageReward = rewards.length > 0 
        ? rewards.reduce((sum, reward) => sum + reward, 0) / rewards.length
        : platform.default_reward

      platformStats.push({
        platformId: platform.id,
        platformName: platform.name,
        totalReviews,
        successRate: Math.round(successRate * 10) / 10,
        averageReward: Math.round(averageReward)
      })
    }

    return { success: true, stats: platformStats }
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return { success: false, error: '플랫폼 통계 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 최근 활동 조회
 */
export async function getRecentActivity(): Promise<{ success: boolean; activities?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        status,
        created_at,
        branches!inner (
          name
        ),
        users!inner (
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent activity:', error)
      return { success: false, error: error.message }
    }

    return { success: true, activities: data || [] }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, error: '최근 활동 조회 중 오류가 발생했습니다.' }
  }
}
