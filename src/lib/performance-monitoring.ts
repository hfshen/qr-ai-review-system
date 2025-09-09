import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PerformanceMetric {
  id: string
  endpoint: string
  method: string
  response_time: number
  status_code: number
  user_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface SystemHealth {
  id: string
  service_name: string
  status: 'healthy' | 'degraded' | 'down'
  response_time: number
  error_rate: number
  uptime_percentage: number
  last_check: string
  created_at: string
}

export interface CacheStats {
  id: string
  cache_key: string
  hit_count: number
  miss_count: number
  hit_rate: number
  last_accessed: string
  created_at: string
}

export interface DatabaseQuery {
  id: string
  query: string
  execution_time: number
  rows_returned: number
  user_id?: string
  created_at: string
}

/**
 * API 응답 시간 측정 및 기록
 */
export async function trackApiPerformance(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        endpoint,
        method,
        response_time: responseTime,
        status_code: statusCode,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (error) {
      console.error('Error tracking API performance:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error tracking API performance:', error)
    return { success: false, error: '성능 추적 중 오류가 발생했습니다.' }
  }
}

/**
 * 시스템 헬스 체크
 */
export async function checkSystemHealth(): Promise<{ success: boolean; health?: SystemHealth[]; error?: string }> {
  try {
    const services = [
      { name: 'database', url: '/api/health/database' },
      { name: 'ai_service', url: '/api/health/ai' },
      { name: 'storage', url: '/api/health/storage' },
      { name: 'auth', url: '/api/health/auth' }
    ]

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now()
        try {
          const response = await fetch(service.url, { method: 'GET' })
          const responseTime = Date.now() - startTime
          const isHealthy = response.ok && responseTime < 1000

          return {
            service_name: service.name,
            status: isHealthy ? 'healthy' : 'degraded',
            response_time: responseTime,
            error_rate: response.ok ? 0 : 1,
            uptime_percentage: isHealthy ? 100 : 0,
            last_check: new Date().toISOString()
          }
        } catch (error) {
          return {
            service_name: service.name,
            status: 'down',
            response_time: Date.now() - startTime,
            error_rate: 1,
            uptime_percentage: 0,
            last_check: new Date().toISOString()
          }
        }
      })
    )

    const healthData = healthChecks
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)

    // 헬스 체크 결과 저장
    const { error } = await supabase
      .from('system_health')
      .insert(healthData)

    if (error) {
      console.error('Error saving health check:', error)
    }

    return { success: true, health: healthData }
  } catch (error) {
    console.error('Error checking system health:', error)
    return { success: false, error: '시스템 헬스 체크 중 오류가 발생했습니다.' }
  }
}

/**
 * 캐시 통계 업데이트
 */
export async function updateCacheStats(
  cacheKey: string,
  isHit: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingStats, error: fetchError } = await supabase
      .from('cache_stats')
      .select('*')
      .eq('cache_key', cacheKey)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching cache stats:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (existingStats) {
      // 기존 통계 업데이트
      const newHitCount = existingStats.hit_count + (isHit ? 1 : 0)
      const newMissCount = existingStats.miss_count + (isHit ? 0 : 1)
      const totalRequests = newHitCount + newMissCount
      const hitRate = totalRequests > 0 ? (newHitCount / totalRequests) * 100 : 0

      const { error } = await supabase
        .from('cache_stats')
        .update({
          hit_count: newHitCount,
          miss_count: newMissCount,
          hit_rate: hitRate,
          last_accessed: new Date().toISOString()
        })
        .eq('id', existingStats.id)

      if (error) {
        console.error('Error updating cache stats:', error)
        return { success: false, error: error.message }
      }
    } else {
      // 새로운 캐시 통계 생성
      const hitCount = isHit ? 1 : 0
      const missCount = isHit ? 0 : 1
      const hitRate = isHit ? 100 : 0

      const { error } = await supabase
        .from('cache_stats')
        .insert({
          cache_key: cacheKey,
          hit_count: hitCount,
          miss_count: missCount,
          hit_rate: hitRate,
          last_accessed: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating cache stats:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating cache stats:', error)
    return { success: false, error: '캐시 통계 업데이트 중 오류가 발생했습니다.' }
  }
}

/**
 * 데이터베이스 쿼리 성능 추적
 */
export async function trackDatabaseQuery(
  query: string,
  executionTime: number,
  rowsReturned: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('database_queries')
      .insert({
        query: query.substring(0, 1000), // 쿼리 길이 제한
        execution_time: executionTime,
        rows_returned: rowsReturned,
        user_id: userId
      })

    if (error) {
      console.error('Error tracking database query:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error tracking database query:', error)
    return { success: false, error: '데이터베이스 쿼리 추적 중 오류가 발생했습니다.' }
  }
}

/**
 * 성능 메트릭 조회
 */
export async function getPerformanceMetrics(
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<{ success: boolean; metrics?: PerformanceMetric[]; error?: string }> {
  try {
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching performance metrics:', error)
      return { success: false, error: error.message }
    }

    return { success: true, metrics: data || [] }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return { success: false, error: '성능 메트릭 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 시스템 헬스 상태 조회
 */
export async function getSystemHealth(): Promise<{ success: boolean; health?: SystemHealth[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false })

    if (error) {
      console.error('Error fetching system health:', error)
      return { success: false, error: error.message }
    }

    return { success: true, health: data || [] }
  } catch (error) {
    console.error('Error fetching system health:', error)
    return { success: false, error: '시스템 헬스 상태 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStats(): Promise<{ success: boolean; stats?: CacheStats[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cache_stats')
      .select('*')
      .order('hit_rate', { ascending: false })

    if (error) {
      console.error('Error fetching cache stats:', error)
      return { success: false, error: error.message }
    }

    return { success: true, stats: data || [] }
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    return { success: false, error: '캐시 통계 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 성능 최적화 제안 생성
 */
export async function generatePerformanceRecommendations(): Promise<{ success: boolean; recommendations?: string[]; error?: string }> {
  try {
    const recommendations: string[] = []

    // 느린 API 엔드포인트 분석
    const { data: slowEndpoints } = await supabase
      .from('performance_metrics')
      .select('endpoint, AVG(response_time) as avg_response_time')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .group('endpoint')
      .having('AVG(response_time)', 'gt', 1000)

    if (slowEndpoints && slowEndpoints.length > 0) {
      recommendations.push(`느린 엔드포인트 발견: ${slowEndpoints.map(e => e.endpoint).join(', ')}`)
    }

    // 캐시 히트율 분석
    const { data: lowHitRateCaches } = await supabase
      .from('cache_stats')
      .select('cache_key, hit_rate')
      .lt('hit_rate', 50)

    if (lowHitRateCaches && lowHitRateCaches.length > 0) {
      recommendations.push(`낮은 캐시 히트율: ${lowHitRateCaches.map(c => c.cache_key).join(', ')}`)
    }

    // 데이터베이스 쿼리 성능 분석
    const { data: slowQueries } = await supabase
      .from('database_queries')
      .select('query, AVG(execution_time) as avg_execution_time')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .group('query')
      .having('AVG(execution_time)', 'gt', 100)

    if (slowQueries && slowQueries.length > 0) {
      recommendations.push(`느린 데이터베이스 쿼리 발견: ${slowQueries.length}개`)
    }

    return { success: true, recommendations }
  } catch (error) {
    console.error('Error generating performance recommendations:', error)
    return { success: false, error: '성능 최적화 제안 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 메모리 사용량 모니터링
 */
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  if (typeof window === 'undefined') {
    return { used: 0, total: 0, percentage: 0 }
  }

  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }

  return { used: 0, total: 0, percentage: 0 }
}

/**
 * 네트워크 연결 상태 모니터링
 */
export function getNetworkStatus(): Promise<{ online: boolean; connectionType?: string; effectiveType?: string }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined') {
      resolve({ online: false })
      return
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    resolve({
      online: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType
    })
  })
}
