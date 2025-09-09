import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ error: '${error}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  if (!code || !state) {
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ error: '인증 코드가 없습니다' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  try {
    const platformId = parseInt(state)
    
    // 인스타그램 액세스 토큰 요청
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/instagram/callback`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('액세스 토큰을 받지 못했습니다')
    }

    // 인스타그램 사용자 정보 요청
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`)
    const userData = await userResponse.json()

    if (!userData.id) {
      throw new Error('사용자 정보를 받지 못했습니다')
    }

    // 사용자 플랫폼 연동 정보 업데이트
    const { error: updateError } = await supabase
      .from('user_platforms')
      .upsert({
        user_id: userData.id, // 실제로는 현재 로그인한 사용자 ID를 사용해야 함
        platform_id: platformId,
        connected: true,
        account_identifier: userData.username,
      })

    if (updateError) {
      throw updateError
    }

    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              success: true, 
              platform: 'instagram',
              user: '${userData.username}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('인스타그램 OAuth 오류:', error)
    
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              error: '인스타그램 연동 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
