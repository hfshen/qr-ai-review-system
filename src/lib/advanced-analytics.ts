import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface AnalyticsData {
  total_reviews: number
  total_users: number
  total_agencies: number
  total_branches: number
  avg_rating: number
  sentiment_distribution: {
    positive: number
    negative: number
    neutral: number
  }
  platform_distribution: {
    platform: string
    count: number
    percentage: number
  }[]
  monthly_trends: {
    month: string
    reviews: number
    users: number
    avg_rating: number
  }[]
  top_keywords: {
    keyword: string
    count: number
    sentiment: string
  }[]
  user_engagement: {
    active_users: number
    new_users: number
    retention_rate: number
    avg_reviews_per_user: number
  }
  business_performance: {
    agency_id: string
    agency_name: string
    total_reviews: number
    avg_rating: number
    sentiment_score: number
    growth_rate: number
  }[]
}

export interface PredictiveAnalytics {
  predicted_reviews_next_month: number
  predicted_user_growth: number
  predicted_sentiment_trend: 'improving' | 'declining' | 'stable'
  risk_factors: string[]
  opportunities: string[]
  confidence_score: number
}

export interface CustomReport {
  id: string
  name: string
  description: string
  filters: {
    date_range: { start: string; end: string }
    platforms: string[]
    agencies: string[]
    sentiment: string[]
    rating_range: { min: number; max: number }
  }
  metrics: string[]
  chart_types: string[]
  created_at: string
  updated_at: string
}

/**
 * 종합 분석 데이터 조회
 */
export async function getComprehensiveAnalytics(
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const end = endDate || new Date().toISOString()

    // 기본 통계 조회
    const [reviewsResult, usersResult, agenciesResult, branchesResult] = await Promise.all([
      supabase.from('reviews').select('*', { count: 'exact' }).gte('created_at', start).lte('created_at', end),
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('agencies').select('*', { count: 'exact' }),
      supabase.from('branches').select('*', { count: 'exact' })
    ])

    // 평균 별점 계산
    const { data: avgRatingData } = await supabase
      .from('reviews')
      .select('rating')
      .gte('created_at', start)
      .lte('created_at', end)

    const avgRating = avgRatingData?.length 
      ? avgRatingData.reduce((sum, r) => sum + r.rating, 0) / avgRatingData.length 
      : 0

    // 감정 분포 조회
    const { data: sentimentData } = await supabase
      .from('sentiment_analysis')
      .select('sentiment')
      .gte('created_at', start)
      .lte('created_at', end)

    const sentimentDistribution = {
      positive: sentimentData?.filter(s => s.sentiment === 'positive').length || 0,
      negative: sentimentData?.filter(s => s.sentiment === 'negative').length || 0,
      neutral: sentimentData?.filter(s => s.sentiment === 'neutral').length || 0
    }

    // 플랫폼 분포 조회
    const { data: platformData } = await supabase
      .from('reviews')
      .select('platform_id, platforms(name)')
      .gte('created_at', start)
      .lte('created_at', end)

    const platformCounts = platformData?.reduce((acc, review) => {
      const platformName = (review.platforms as any)?.name || 'Unknown'
      acc[platformName] = (acc[platformName] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const totalPlatformReviews = Object.values(platformCounts).reduce((sum, count) => sum + count, 0)
    const platformDistribution = Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count,
      percentage: totalPlatformReviews > 0 ? (count / totalPlatformReviews) * 100 : 0
    }))

    // 월별 트렌드 조회
    const { data: monthlyData } = await supabase
      .from('reviews')
      .select('created_at, rating')
      .gte('created_at', new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    const monthlyTrends = monthlyData?.reduce((acc, review) => {
      const month = new Date(review.created_at).toISOString().substring(0, 7)
      if (!acc[month]) {
        acc[month] = { reviews: 0, ratings: [], users: new Set() }
      }
      acc[month].reviews++
      acc[month].ratings.push(review.rating)
      return acc
    }, {} as Record<string, { reviews: number; ratings: number[]; users: Set<string> }>) || {}

    const monthlyTrendsArray = Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      reviews: data.reviews,
      users: data.users.size,
      avg_rating: data.ratings.length > 0 
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
        : 0
    }))

    // 상위 키워드 조회
    const { data: keywordData } = await supabase
      .from('sentiment_analysis')
      .select('keywords, sentiment')
      .gte('created_at', start)
      .lte('created_at', end)

    const keywordCounts = keywordData?.reduce((acc, analysis) => {
      analysis.keywords?.forEach((keyword: string) => {
        if (!acc[keyword]) {
          acc[keyword] = { count: 0, sentiments: [] }
        }
        acc[keyword].count++
        acc[keyword].sentiments.push(analysis.sentiment)
      })
      return acc
    }, {} as Record<string, { count: number; sentiments: string[] }>) || {}

    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        sentiment: data.sentiments.length > 0 
          ? data.sentiments.reduce((acc, s) => {
              acc[s] = (acc[s] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          : {}
      }))

    // 사용자 참여도 조회
    const { data: userEngagementData } = await supabase
      .from('users')
      .select('id, created_at')

    const activeUsers = userEngagementData?.filter(user => 
      new Date(user.created_at) >= new Date(start)
    ).length || 0

    const newUsers = userEngagementData?.filter(user => 
      new Date(user.created_at) >= new Date(start)
    ).length || 0

    const totalUsers = userEngagementData?.length || 0
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    const avgReviewsPerUser = totalUsers > 0 ? (reviewsResult.count || 0) / totalUsers : 0

    // 비즈니스 성과 조회
    const { data: businessData } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        reviews!inner(rating, created_at),
        sentiment_analysis!inner(sentiment)
      `)
      .gte('reviews.created_at', start)
      .lte('reviews.created_at', end)

    const businessPerformance = businessData?.map(agency => {
      const reviews = (agency as any).reviews || []
      const sentiments = (agency as any).sentiment_analysis || []
      
      const totalReviews = reviews.length
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
        : 0
      
      const positiveSentiments = sentiments.filter((s: any) => s.sentiment === 'positive').length
      const sentimentScore = sentiments.length > 0 ? (positiveSentiments / sentiments.length) * 100 : 0
      
      return {
        agency_id: agency.id,
        agency_name: agency.name,
        total_reviews: totalReviews,
        avg_rating: avgRating,
        sentiment_score: sentimentScore,
        growth_rate: 0 // 계산 로직 필요
      }
    }) || []

    const analyticsData: AnalyticsData = {
      total_reviews: reviewsResult.count || 0,
      total_users: usersResult.count || 0,
      total_agencies: agenciesResult.count || 0,
      total_branches: branchesResult.count || 0,
      avg_rating: avgRating,
      sentiment_distribution: sentimentDistribution,
      platform_distribution: platformDistribution,
      monthly_trends: monthlyTrendsArray,
      top_keywords: topKeywords,
      user_engagement: {
        active_users: activeUsers,
        new_users: newUsers,
        retention_rate: retentionRate,
        avg_reviews_per_user: avgReviewsPerUser
      },
      business_performance: businessPerformance
    }

    return { success: true, data: analyticsData }
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error)
    return { success: false, error: '종합 분석 데이터 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 예측 분석 수행
 */
export async function getPredictiveAnalytics(): Promise<{ success: boolean; predictions?: PredictiveAnalytics; error?: string }> {
  try {
    // 과거 데이터 기반 예측 로직
    const { data: historicalData } = await supabase
      .from('reviews')
      .select('created_at, rating')
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (!historicalData || historicalData.length === 0) {
      return { success: false, error: '예측을 위한 충분한 데이터가 없습니다.' }
    }

    // 간단한 선형 회귀를 통한 예측
    const monthlyCounts = historicalData.reduce((acc, review) => {
      const month = new Date(review.created_at).toISOString().substring(0, 7)
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const months = Object.keys(monthlyCounts).sort()
    const counts = months.map(month => monthlyCounts[month])

    // 선형 트렌드 계산
    const n = counts.length
    const sumX = months.reduce((sum, _, i) => sum + i, 0)
    const sumY = counts.reduce((sum, count) => sum + count, 0)
    const sumXY = months.reduce((sum, _, i) => sum + i * counts[i], 0)
    const sumXX = months.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 다음 달 예측
    const predictedReviewsNextMonth = Math.max(0, Math.round(slope * n + intercept))
    const predictedUserGrowth = Math.max(0, Math.round(predictedReviewsNextMonth * 0.1))

    // 감정 트렌드 분석
    const recentSentiments = historicalData.slice(-30).map(() => 'positive') // 임시 로직
    const positiveRatio = recentSentiments.filter(s => s === 'positive').length / recentSentiments.length
    
    let predictedSentimentTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (positiveRatio > 0.7) predictedSentimentTrend = 'improving'
    else if (positiveRatio < 0.3) predictedSentimentTrend = 'declining'

    // 리스크 팩터 및 기회 식별
    const riskFactors: string[] = []
    const opportunities: string[] = []

    if (predictedReviewsNextMonth < counts[counts.length - 1] * 0.8) {
      riskFactors.push('리뷰 수 감소 예상')
    }

    if (positiveRatio > 0.8) {
      opportunities.push('긍정적 감정 증가로 인한 마케팅 기회')
    }

    const predictions: PredictiveAnalytics = {
      predicted_reviews_next_month: predictedReviewsNextMonth,
      predicted_user_growth: predictedUserGrowth,
      predicted_sentiment_trend: predictedSentimentTrend,
      risk_factors: riskFactors,
      opportunities: opportunities,
      confidence_score: 0.75 // 임시값
    }

    return { success: true, predictions }
  } catch (error) {
    console.error('Error generating predictive analytics:', error)
    return { success: false, error: '예측 분석 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 정의 리포트 생성
 */
export async function createCustomReport(
  name: string,
  description: string,
  filters: CustomReport['filters'],
  metrics: string[],
  chartTypes: string[]
): Promise<{ success: boolean; report?: CustomReport; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        name,
        description,
        filters,
        metrics,
        chart_types: chartTypes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating custom report:', error)
      return { success: false, error: error.message }
    }

    return { success: true, report: data }
  } catch (error) {
    console.error('Error creating custom report:', error)
    return { success: false, error: '사용자 정의 리포트 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 정의 리포트 조회
 */
export async function getCustomReports(): Promise<{ success: boolean; reports?: CustomReport[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching custom reports:', error)
      return { success: false, error: error.message }
    }

    return { success: true, reports: data || [] }
  } catch (error) {
    console.error('Error fetching custom reports:', error)
    return { success: false, error: '사용자 정의 리포트 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 리포트 데이터 생성
 */
export async function generateReportData(
  reportId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: report, error: reportError } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError) {
      console.error('Error fetching report:', reportError)
      return { success: false, error: reportError.message }
    }

    // 필터에 따른 데이터 조회
    let query = supabase.from('reviews').select('*')
    
    if (report.filters.date_range) {
      query = query
        .gte('created_at', report.filters.date_range.start)
        .lte('created_at', report.filters.date_range.end)
    }

    if (report.filters.platforms && report.filters.platforms.length > 0) {
      query = query.in('platform_id', report.filters.platforms)
    }

    if (report.filters.rating_range) {
      query = query
        .gte('rating', report.filters.rating_range.min)
        .lte('rating', report.filters.rating_range.max)
    }

    const { data: reportData, error: dataError } = await query

    if (dataError) {
      console.error('Error fetching report data:', dataError)
      return { success: false, error: dataError.message }
    }

    // 메트릭에 따른 데이터 처리
    const processedData = processReportData(reportData || [], report.metrics)

    return { success: true, data: processedData }
  } catch (error) {
    console.error('Error generating report data:', error)
    return { success: false, error: '리포트 데이터 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 리포트 데이터 처리
 */
function processReportData(data: any[], metrics: string[]): any {
  const processed: any = {}

  metrics.forEach(metric => {
    switch (metric) {
      case 'total_reviews':
        processed.total_reviews = data.length
        break
      case 'avg_rating':
        processed.avg_rating = data.length > 0 
          ? data.reduce((sum, r) => sum + r.rating, 0) / data.length 
          : 0
        break
      case 'rating_distribution':
        processed.rating_distribution = data.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1
          return acc
        }, {})
        break
      case 'platform_distribution':
        processed.platform_distribution = data.reduce((acc, review) => {
          acc[review.platform_id] = (acc[review.platform_id] || 0) + 1
          return acc
        }, {})
        break
      case 'monthly_trends':
        processed.monthly_trends = data.reduce((acc, review) => {
          const month = new Date(review.created_at).toISOString().substring(0, 7)
          if (!acc[month]) acc[month] = 0
          acc[month]++
          return acc
        }, {})
        break
    }
  })

  return processed
}

/**
 * A/B 테스트 데이터 조회
 */
export async function getABTestResults(
  testId: string
): Promise<{ success: boolean; results?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ab_tests')
      .select(`
        *,
        variants(*),
        results(*)
      `)
      .eq('id', testId)
      .single()

    if (error) {
      console.error('Error fetching A/B test results:', error)
      return { success: false, error: error.message }
    }

    return { success: true, results: data }
  } catch (error) {
    console.error('Error fetching A/B test results:', error)
    return { success: false, error: 'A/B 테스트 결과 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 고객 세그멘테이션 분석
 */
export async function getCustomerSegmentation(): Promise<{ success: boolean; segments?: any; error?: string }> {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        reviews(rating, created_at),
        sentiment_analysis(sentiment)
      `)

    if (error) {
      console.error('Error fetching user data for segmentation:', error)
      return { success: false, error: error.message }
    }

    // 간단한 세그멘테이션 로직
    const segments = {
      high_value: users?.filter(user => {
        const reviews = (user as any).reviews || []
        return reviews.length >= 10 && reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length >= 4
      }) || [],
      active: users?.filter(user => {
        const reviews = (user as any).reviews || []
        return reviews.length >= 5
      }) || [],
      new: users?.filter(user => {
        const reviews = (user as any).reviews || []
        return reviews.length <= 2
      }) || [],
      at_risk: users?.filter(user => {
        const sentiments = (user as any).sentiment_analysis || []
        const negativeCount = sentiments.filter((s: any) => s.sentiment === 'negative').length
        return negativeCount >= 3
      }) || []
    }

    return { success: true, segments }
  } catch (error) {
    console.error('Error performing customer segmentation:', error)
    return { success: false, error: '고객 세그멘테이션 분석 중 오류가 발생했습니다.' }
  }
}
