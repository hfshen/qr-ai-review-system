import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface EmailNotification {
  to: string
  subject: string
  html: string
  text?: string
}

export interface NotificationTemplate {
  type: 'review_received' | 'review_published' | 'points_earned' | 'points_depleted' | 'welcome'
  data: any
}

// 이메일 템플릿 생성
export function createEmailTemplate(template: NotificationTemplate): EmailNotification {
  switch (template.type) {
    case 'review_received':
      return {
        to: template.data.agencyEmail,
        subject: `새로운 리뷰가 등록되었습니다 - ${template.data.branchName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">새로운 리뷰 알림</h2>
            <p>안녕하세요! <strong>${template.data.branchName}</strong>에 새로운 리뷰가 등록되었습니다.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">리뷰 정보</h3>
              <p><strong>별점:</strong> ${template.data.rating}점</p>
              <p><strong>리뷰 내용:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
                "${template.data.content}"
              </p>
              <p><strong>작성일:</strong> ${new Date(template.data.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
            
            <p>더 자세한 내용은 관리자 패널에서 확인하실 수 있습니다.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              관리자 패널로 이동
            </a>
          </div>
        `,
        text: `새로운 리뷰가 등록되었습니다.\n\n지점: ${template.data.branchName}\n별점: ${template.data.rating}점\n내용: ${template.data.content}\n작성일: ${new Date(template.data.createdAt).toLocaleDateString('ko-KR')}`
      }

    case 'review_published':
      return {
        to: template.data.userEmail,
        subject: '리뷰가 성공적으로 게시되었습니다!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">리뷰 게시 완료</h2>
            <p>안녕하세요! 작성하신 리뷰가 성공적으로 게시되었습니다.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #16a34a;">게시 결과</h3>
              <p><strong>지점:</strong> ${template.data.branchName}</p>
              <p><strong>게시된 플랫폼:</strong> ${template.data.platforms.join(', ')}</p>
              <p><strong>적립 포인트:</strong> ${template.data.pointsEarned.toLocaleString()}P</p>
            </div>
            
            <p>적립된 포인트로 마켓플레이스에서 다양한 상품을 구매하실 수 있습니다!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace" 
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              마켓플레이스로 이동
            </a>
          </div>
        `,
        text: `리뷰가 성공적으로 게시되었습니다!\n\n지점: ${template.data.branchName}\n게시된 플랫폼: ${template.data.platforms.join(', ')}\n적립 포인트: ${template.data.pointsEarned.toLocaleString()}P`
      }

    case 'points_earned':
      return {
        to: template.data.userEmail,
        subject: `포인트가 적립되었습니다! (+${template.data.points.toLocaleString()}P)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">포인트 적립 알림</h2>
            <p>안녕하세요! 포인트가 적립되었습니다.</p>
            
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #f59e0b;">적립 내역</h3>
              <p><strong>적립 포인트:</strong> +${template.data.points.toLocaleString()}P</p>
              <p><strong>사유:</strong> ${template.data.reason}</p>
              <p><strong>현재 잔액:</strong> ${template.data.currentBalance.toLocaleString()}P</p>
            </div>
            
            <p>적립된 포인트로 마켓플레이스에서 다양한 상품을 구매하실 수 있습니다!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              마켓플레이스로 이동
            </a>
          </div>
        `,
        text: `포인트가 적립되었습니다!\n\n적립 포인트: +${template.data.points.toLocaleString()}P\n사유: ${template.data.reason}\n현재 잔액: ${template.data.currentBalance.toLocaleString()}P`
      }

    case 'points_depleted':
      return {
        to: template.data.agencyEmail,
        subject: '포인트 잔액이 부족합니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">포인트 잔액 부족 알림</h2>
            <p>안녕하세요! 에이전시 포인트 잔액이 부족합니다.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">현재 상태</h3>
              <p><strong>현재 잔액:</strong> ${template.data.currentBalance.toLocaleString()}P</p>
              <p><strong>최소 권장 잔액:</strong> 10,000P</p>
            </div>
            
            <p>리뷰 보상을 지속적으로 제공하려면 포인트를 충전해주세요.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              포인트 충전하기
            </a>
          </div>
        `,
        text: `포인트 잔액이 부족합니다.\n\n현재 잔액: ${template.data.currentBalance.toLocaleString()}P\n최소 권장 잔액: 10,000P`
      }

    case 'welcome':
      return {
        to: template.data.userEmail,
        subject: 'AI 리뷰 플랫폼에 오신 것을 환영합니다!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">환영합니다!</h2>
            <p>안녕하세요, <strong>${template.data.displayName}</strong>님!</p>
            <p>AI 리뷰 플랫폼에 가입해주셔서 감사합니다.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">시작하기</h3>
              <ol>
                <li>QR 코드를 스캔하여 리뷰 작성</li>
                <li>AI가 자동으로 자연스러운 리뷰 생성</li>
                <li>여러 플랫폼에 한 번에 게시</li>
                <li>포인트 적립으로 보상 받기</li>
              </ol>
            </div>
            
            <p>지금 바로 시작해보세요!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              시작하기
            </a>
          </div>
        `,
        text: `AI 리뷰 플랫폼에 가입해주셔서 감사합니다!\n\n시작하기:\n1. QR 코드를 스캔하여 리뷰 작성\n2. AI가 자동으로 자연스러운 리뷰 생성\n3. 여러 플랫폼에 한 번에 게시\n4. 포인트 적립으로 보상 받기`
      }

    default:
      throw new Error(`지원하지 않는 템플릿 타입: ${template.type}`)
  }
}

// 이메일 전송 (Supabase Edge Function 사용)
export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(notification),
    })

    return response.ok
  } catch (error) {
    console.error('이메일 전송 오류:', error)
    return false
  }
}

// 알림 전송 헬퍼 함수들
export async function sendReviewReceivedNotification(reviewData: any) {
  const template = createEmailTemplate({
    type: 'review_received',
    data: reviewData
  })
  
  return await sendEmail(template)
}

export async function sendReviewPublishedNotification(userData: any) {
  const template = createEmailTemplate({
    type: 'review_published',
    data: userData
  })
  
  return await sendEmail(template)
}

export async function sendPointsEarnedNotification(pointsData: any) {
  const template = createEmailTemplate({
    type: 'points_earned',
    data: pointsData
  })
  
  return await sendEmail(template)
}

export async function sendPointsDepletedNotification(agencyData: any) {
  const template = createEmailTemplate({
    type: 'points_depleted',
    data: agencyData
  })
  
  return await sendEmail(template)
}

export async function sendWelcomeNotification(userData: any) {
  const template = createEmailTemplate({
    type: 'welcome',
    data: userData
  })
  
  return await sendEmail(template)
}
