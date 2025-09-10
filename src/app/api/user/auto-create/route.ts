import { NextRequest, NextResponse } from 'next/server'
import { createBrowserClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { deviceId, branchId } = await request.json()

    if (!deviceId || !branchId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 기존 사용자 확인 (디바이스 ID로)
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle()

    if (searchError) {
      throw searchError
    }

    if (existingUser) {
      // 기존 사용자 반환
      return NextResponse.json({
        user: existingUser,
        isNew: false
      })
    }

    // 새 사용자 생성
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        device_id: deviceId,
        display_name: `사용자_${deviceId.slice(-6)}`,
        email: null,
        role: 'user',
        points_balance: 0,
        is_anonymous: true
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      user: newUser,
      isNew: true
    })
  } catch (error) {
    console.error('사용자 자동 생성 오류:', error)
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
