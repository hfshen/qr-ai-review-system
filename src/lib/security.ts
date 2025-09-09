import { createBrowserClient } from '@supabase/ssr'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface TwoFactorAuth {
  id: string
  user_id: string
  secret: string
  backup_codes: string[]
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface RateLimit {
  id: string
  user_id?: string
  ip_address: string
  endpoint: string
  method: string
  request_count: number
  window_start: string
  window_end: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  ip_address: string
  user_agent: string
  details: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

export interface SecurityEvent {
  id: string
  event_type: string
  user_id?: string
  ip_address: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  created_at: string
  resolved_at?: string
}

/**
 * 2FA 설정 생성
 */
export async function setupTwoFactorAuth(userId: string): Promise<{ success: boolean; qrCodeUrl?: string; backupCodes?: string[]; error?: string }> {
  try {
    // 기존 2FA 설정 확인
    const { data: existing2FA } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing2FA?.is_enabled) {
      return { success: false, error: '2FA가 이미 활성화되어 있습니다.' }
    }

    // 새로운 시크릿 생성
    const secret = authenticator.generateSecret()
    const serviceName = 'AI 리뷰 플랫폼'
    const accountName = userId

    // 백업 코드 생성
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    )

    // QR 코드 URL 생성
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

    // 데이터베이스에 저장
    const { error } = await supabase
      .from('two_factor_auth')
      .upsert({
        user_id: userId,
        secret: secret,
        backup_codes: backupCodes,
        is_enabled: false
      })

    if (error) {
      console.error('Error setting up 2FA:', error)
      return { success: false, error: error.message }
    }

    return { success: true, qrCodeUrl, backupCodes }
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return { success: false, error: '2FA 설정 중 오류가 발생했습니다.' }
  }
}

/**
 * 2FA 인증 확인
 */
export async function verifyTwoFactorAuth(
  userId: string, 
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: twoFA } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!twoFA) {
      return { success: false, error: '2FA가 설정되지 않았습니다.' }
    }

    // TOTP 토큰 검증
    const isValidToken = authenticator.verify({ token, secret: twoFA.secret })
    
    if (!isValidToken) {
      // 백업 코드 확인
      const isValidBackupCode = twoFA.backup_codes.includes(token)
      
      if (isValidBackupCode) {
        // 백업 코드 사용 시 제거
        const updatedBackupCodes = twoFA.backup_codes.filter(code => code !== token)
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedBackupCodes })
          .eq('user_id', userId)
      } else {
        return { success: false, error: '유효하지 않은 인증 코드입니다.' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    return { success: false, error: '2FA 인증 중 오류가 발생했습니다.' }
  }
}

/**
 * 2FA 활성화
 */
export async function enableTwoFactorAuth(
  userId: string, 
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification = await verifyTwoFactorAuth(userId, token)
    
    if (!verification.success) {
      return verification
    }

    const { error } = await supabase
      .from('two_factor_auth')
      .update({ is_enabled: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error enabling 2FA:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error enabling 2FA:', error)
    return { success: false, error: '2FA 활성화 중 오류가 발생했습니다.' }
  }
}

/**
 * 2FA 비활성화
 */
export async function disableTwoFactorAuth(
  userId: string, 
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 비밀번호 확인 (실제 구현에서는 해시된 비밀번호와 비교)
    // 여기서는 간단히 처리
    
    const { error } = await supabase
      .from('two_factor_auth')
      .update({ is_enabled: false })
      .eq('user_id', userId)

    if (error) {
      console.error('Error disabling 2FA:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return { success: false, error: '2FA 비활성화 중 오류가 발생했습니다.' }
  }
}

/**
 * 레이트 리미팅 체크
 */
export async function checkRateLimit(
  userId: string | null,
  ipAddress: string,
  endpoint: string,
  method: string,
  limit: number = 100,
  windowMinutes: number = 15
): Promise<{ success: boolean; allowed: boolean; remaining: number; resetTime: string; error?: string }> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

    // 기존 요청 수 조회
    let query = supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .eq('method', method)
      .gte('window_start', windowStart.toISOString())

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: existingLimits } = await query

    const currentCount = existingLimits?.reduce((sum, limit) => sum + limit.request_count, 0) || 0

    if (currentCount >= limit) {
      const resetTime = new Date(now.getTime() + windowMinutes * 60 * 1000)
      return {
        success: true,
        allowed: false,
        remaining: 0,
        resetTime: resetTime.toISOString()
      }
    }

    // 새로운 요청 기록
    const { error } = await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        endpoint,
        method,
        request_count: 1,
        window_start: now.toISOString(),
        window_end: new Date(now.getTime() + windowMinutes * 60 * 1000).toISOString()
      })

    if (error) {
      console.error('Error recording rate limit:', error)
    }

    return {
      success: true,
      allowed: true,
      remaining: limit - currentCount - 1,
      resetTime: new Date(now.getTime() + windowMinutes * 60 * 1000).toISOString()
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { success: false, allowed: false, remaining: 0, resetTime: '', error: '레이트 리미팅 체크 중 오류가 발생했습니다.' }
  }
}

/**
 * 감사 로그 기록
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  ipAddress: string,
  userAgent: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details,
        severity
      })

    if (error) {
      console.error('Error logging audit event:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error logging audit event:', error)
    return { success: false, error: '감사 로그 기록 중 오류가 발생했습니다.' }
  }
}

/**
 * 보안 이벤트 기록
 */
export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  ipAddress: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        ip_address: ipAddress,
        description,
        severity,
        resolved: false
      })

    if (error) {
      console.error('Error logging security event:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error logging security event:', error)
    return { success: false, error: '보안 이벤트 기록 중 오류가 발생했습니다.' }
  }
}

/**
 * 의심스러운 활동 감지
 */
export async function detectSuspiciousActivity(
  userId: string | null,
  ipAddress: string,
  action: string
): Promise<{ suspicious: boolean; reasons: string[] }> {
  try {
    const reasons: string[] = []
    
    // 최근 1시간 내 동일 IP에서 많은 요청
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { data: recentRequests } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString())

    if (recentRequests && recentRequests.length > 100) {
      reasons.push('짧은 시간 내 과도한 요청')
    }

    // 비정상적인 시간대 활동
    const hour = new Date().getHours()
    if (hour < 6 || hour > 23) {
      reasons.push('비정상적인 시간대 활동')
    }

    // 여러 IP에서 동일 사용자 접근
    if (userId) {
      const { data: userIPs } = await supabase
        .from('audit_logs')
        .select('ip_address')
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo.toISOString())

      const uniqueIPs = new Set(userIPs?.map(log => log.ip_address) || [])
      if (uniqueIPs.size > 3) {
        reasons.push('여러 IP에서 동시 접근')
      }
    }

    // 의심스러운 활동이 감지되면 보안 이벤트 기록
    if (reasons.length > 0) {
      await logSecurityEvent(
        'suspicious_activity',
        userId,
        ipAddress,
        `의심스러운 활동 감지: ${reasons.join(', ')}`,
        reasons.length > 2 ? 'high' : 'medium'
      )
    }

    return { suspicious: reasons.length > 0, reasons }
  } catch (error) {
    console.error('Error detecting suspicious activity:', error)
    return { suspicious: false, reasons: [] }
  }
}

/**
 * 보안 이벤트 조회
 */
export async function getSecurityEvents(
  limit: number = 50,
  severity?: string
): Promise<{ success: boolean; events?: SecurityEvent[]; error?: string }> {
  try {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching security events:', error)
      return { success: false, error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error) {
    console.error('Error fetching security events:', error)
    return { success: false, error: '보안 이벤트 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 감사 로그 조회
 */
export async function getAuditLogs(
  userId?: string,
  limit: number = 100
): Promise<{ success: boolean; logs?: AuditLog[]; error?: string }> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, logs: data || [] }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return { success: false, error: '감사 로그 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 보안 이벤트 해결
 */
export async function resolveSecurityEvent(
  eventId: string,
  resolution: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('security_events')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (error) {
      console.error('Error resolving security event:', error)
      return { success: false, error: error.message }
    }

    // 해결 로그 기록
    await logAuditEvent(
      null,
      'security_event_resolved',
      'security_event',
      eventId,
      'system',
      'system',
      { resolution }
    )

    return { success: true }
  } catch (error) {
    console.error('Error resolving security event:', error)
    return { success: false, error: '보안 이벤트 해결 중 오류가 발생했습니다.' }
  }
}

/**
 * IP 차단
 */
export async function blockIP(
  ipAddress: string,
  reason: string,
  duration: number = 24 // 시간
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ipAddress,
        reason,
        blocked_until: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
      })

    if (error) {
      console.error('Error blocking IP:', error)
      return { success: false, error: error.message }
    }

    // 보안 이벤트 기록
    await logSecurityEvent(
      'ip_blocked',
      null,
      ipAddress,
      `IP 차단: ${reason}`,
      'high'
    )

    return { success: true }
  } catch (error) {
    console.error('Error blocking IP:', error)
    return { success: false, error: 'IP 차단 중 오류가 발생했습니다.' }
  }
}

/**
 * 차단된 IP 확인
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .gt('blocked_until', new Date().toISOString())
      .single()

    return !!data
  } catch (error) {
    console.error('Error checking blocked IP:', error)
    return false
  }
}
