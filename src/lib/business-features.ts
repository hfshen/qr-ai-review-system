import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  max_reviews: number
  max_users: number
  max_agencies: number
  api_calls_limit: number
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface WhiteLabelConfig {
  id: string
  client_id: string
  client_name: string
  domain: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  custom_css?: string
  custom_js?: string
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface APIMarketplace {
  id: string
  name: string
  description: string
  endpoint: string
  method: string
  price_per_call: number
  currency: string
  category: string
  tags: string[]
  documentation_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface APIUsage {
  id: string
  user_id: string
  api_id: string
  endpoint: string
  method: string
  request_count: number
  success_count: number
  error_count: number
  total_cost: number
  period_start: string
  period_end: string
  created_at: string
}

/**
 * 구독 플랜 조회
 */
export async function getSubscriptionPlans(): Promise<{ success: boolean; plans?: SubscriptionPlan[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching subscription plans:', error)
      return { success: false, error: error.message }
    }

    return { success: true, plans: data || [] }
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return { success: false, error: '구독 플랜 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 구독 상태 조회
 */
export async function getUserSubscription(userId: string): Promise<{ success: boolean; subscription?: UserSubscription; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true, subscription: data }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return { success: false, error: '사용자 구독 상태 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 구독 생성
 */
export async function createSubscription(
  userId: string,
  planId: string,
  paymentMethodId: string
): Promise<{ success: boolean; subscription?: UserSubscription; error?: string }> {
  try {
    // 플랜 정보 조회
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('Error fetching plan:', planError)
      return { success: false, error: planError.message }
    }

    // 기존 구독 취소
    await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')

    // 새 구독 생성
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'yearly' ? 12 : 1))

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true, subscription: data }
  } catch (error) {
    console.error('Error creating subscription:', error)
    return { success: false, error: '구독 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 구독 취소
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        cancel_at_period_end: true,
        status: 'cancelled'
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return { success: false, error: '구독 취소 중 오류가 발생했습니다.' }
  }
}

/**
 * 화이트라벨 설정 조회
 */
export async function getWhiteLabelConfig(domain: string): Promise<{ success: boolean; config?: WhiteLabelConfig; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching white label config:', error)
      return { success: false, error: error.message }
    }

    return { success: true, config: data }
  } catch (error) {
    console.error('Error fetching white label config:', error)
    return { success: false, error: '화이트라벨 설정 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 화이트라벨 설정 생성
 */
export async function createWhiteLabelConfig(
  clientId: string,
  config: Omit<WhiteLabelConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; whiteLabelConfig?: WhiteLabelConfig; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('white_label_configs')
      .insert({
        client_id: clientId,
        ...config
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating white label config:', error)
      return { success: false, error: error.message }
    }

    return { success: true, whiteLabelConfig: data }
  } catch (error) {
    console.error('Error creating white label config:', error)
    return { success: false, error: '화이트라벨 설정 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * API 마켓플레이스 조회
 */
export async function getAPIMarketplace(): Promise<{ success: boolean; apis?: APIMarketplace[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('api_marketplace')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API marketplace:', error)
      return { success: false, error: error.message }
    }

    return { success: true, apis: data || [] }
  } catch (error) {
    console.error('Error fetching API marketplace:', error)
    return { success: false, error: 'API 마켓플레이스 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * API 사용량 조회
 */
export async function getAPIUsage(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; usage?: APIUsage[]; error?: string }> {
  try {
    let query = supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('period_start', startDate)
    }
    if (endDate) {
      query = query.lte('period_end', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching API usage:', error)
      return { success: false, error: error.message }
    }

    return { success: true, usage: data || [] }
  } catch (error) {
    console.error('Error fetching API usage:', error)
    return { success: false, error: 'API 사용량 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * API 호출 기록
 */
export async function recordAPICall(
  userId: string,
  apiId: string,
  endpoint: string,
  method: string,
  success: boolean,
  cost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // 기존 사용량 조회
    const { data: existingUsage } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('api_id', apiId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString())
      .single()

    if (existingUsage) {
      // 기존 사용량 업데이트
      const { error } = await supabase
        .from('api_usage')
        .update({
          request_count: existingUsage.request_count + 1,
          success_count: existingUsage.success_count + (success ? 1 : 0),
          error_count: existingUsage.error_count + (success ? 0 : 1),
          total_cost: existingUsage.total_cost + cost
        })
        .eq('id', existingUsage.id)

      if (error) {
        console.error('Error updating API usage:', error)
        return { success: false, error: error.message }
      }
    } else {
      // 새로운 사용량 생성
      const { error } = await supabase
        .from('api_usage')
        .insert({
          user_id: userId,
          api_id: apiId,
          endpoint,
          method,
          request_count: 1,
          success_count: success ? 1 : 0,
          error_count: success ? 0 : 1,
          total_cost: cost,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString()
        })

      if (error) {
        console.error('Error creating API usage:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error recording API call:', error)
    return { success: false, error: 'API 호출 기록 중 오류가 발생했습니다.' }
  }
}

/**
 * 구독 상태 확인
 */
export async function checkSubscriptionStatus(userId: string): Promise<{ 
  success: boolean; 
  hasActiveSubscription: boolean; 
  plan?: SubscriptionPlan; 
  error?: string 
}> {
  try {
    const subscriptionResult = await getUserSubscription(userId)
    
    if (!subscriptionResult.success) {
      return { success: false, hasActiveSubscription: false, error: subscriptionResult.error }
    }

    if (!subscriptionResult.subscription) {
      return { success: true, hasActiveSubscription: false }
    }

    // 구독 만료 확인
    const now = new Date()
    const periodEnd = new Date(subscriptionResult.subscription.current_period_end)
    
    if (now > periodEnd) {
      // 구독 만료 처리
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscriptionResult.subscription.id)
      
      return { success: true, hasActiveSubscription: false }
    }

    // 플랜 정보 조회
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscriptionResult.subscription.plan_id)
      .single()

    return { 
      success: true, 
      hasActiveSubscription: true, 
      plan: plan || undefined 
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return { success: false, hasActiveSubscription: false, error: '구독 상태 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용량 제한 확인
 */
export async function checkUsageLimits(
  userId: string,
  resourceType: 'reviews' | 'users' | 'agencies' | 'api_calls'
): Promise<{ success: boolean; withinLimit: boolean; current: number; limit: number; error?: string }> {
  try {
    const subscriptionResult = await checkSubscriptionStatus(userId)
    
    if (!subscriptionResult.success) {
      return { success: false, withinLimit: false, current: 0, limit: 0, error: subscriptionResult.error }
    }

    if (!subscriptionResult.hasActiveSubscription || !subscriptionResult.plan) {
      // 무료 플랜 제한
      const freeLimits = {
        reviews: 10,
        users: 1,
        agencies: 1,
        api_calls: 100
      }
      
      const limit = freeLimits[resourceType]
      
      // 현재 사용량 조회
      let current = 0
      switch (resourceType) {
        case 'reviews':
          const { count: reviewCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          current = reviewCount || 0
          break
        case 'users':
          current = 1 // 현재 사용자
          break
        case 'agencies':
          const { count: agencyCount } = await supabase
            .from('agencies')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId)
          current = agencyCount || 0
          break
        case 'api_calls':
          const { data: apiUsage } = await supabase
            .from('api_usage')
            .select('request_count')
            .eq('user_id', userId)
            .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          current = apiUsage?.reduce((sum, usage) => sum + usage.request_count, 0) || 0
          break
      }
      
      return { 
        success: true, 
        withinLimit: current < limit, 
        current, 
        limit 
      }
    }

    // 유료 플랜 제한
    const plan = subscriptionResult.plan
    const limits = {
      reviews: plan.max_reviews,
      users: plan.max_users,
      agencies: plan.max_agencies,
      api_calls: plan.api_calls_limit
    }
    
    const limit = limits[resourceType]
    
    // 현재 사용량 조회 (위와 동일한 로직)
    let current = 0
    switch (resourceType) {
      case 'reviews':
        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        current = reviewCount || 0
        break
      case 'users':
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        current = userCount || 0
        break
      case 'agencies':
        const { count: agencyCount } = await supabase
          .from('agencies')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId)
        current = agencyCount || 0
        break
      case 'api_calls':
        const { data: apiUsage } = await supabase
          .from('api_usage')
          .select('request_count')
          .eq('user_id', userId)
          .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        current = apiUsage?.reduce((sum, usage) => sum + usage.request_count, 0) || 0
        break
    }
    
    return { 
      success: true, 
      withinLimit: current < limit, 
      current, 
      limit 
    }
  } catch (error) {
    console.error('Error checking usage limits:', error)
    return { success: false, withinLimit: false, current: 0, limit: 0, error: '사용량 제한 확인 중 오류가 발생했습니다.' }
  }
}
