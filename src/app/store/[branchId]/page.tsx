'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Branch, Agency } from '@/types/database'
import Link from 'next/link'

interface PublicStorePageProps {
  params: {
    branchId: string
  }
}

export default function PublicStorePage({ params }: PublicStorePageProps) {
  const [branch, setBranch] = useState<Branch | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchBranchInfo(params.branchId)
  }, [params.branchId])

  const fetchBranchInfo = async (branchId: string) => {
    try {
      // 지점 정보와 에이전시 정보 가져오기
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select(`
          *,
          agencies (
            id,
            name,
            description,
            owner_id
          )
        `)
        .eq('id', branchId)
        .single()

      if (branchError) {
        throw branchError
      }

      if (!branchData) {
        throw new Error('지점 정보를 찾을 수 없습니다.')
      }

      setBranch(branchData)
      setAgency(branchData.agencies)
    } catch (error: any) {
      console.error('지점 정보 로딩 오류:', error)
      setError(error.message || '지점 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">가계 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="mobile-card animate-error-shake">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Link href="/" className="mobile-btn-primary">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mobile-card animate-fade-in mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {branch.name}
            </h1>
            {agency && (
              <p className="text-lg text-gray-600 mb-2">
                {agency.name}
              </p>
            )}
            {branch.description && (
              <p className="text-gray-500">
                {branch.description}
              </p>
            )}
          </div>
        </div>

        {/* 가계 상세 정보 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">가계 정보</h2>
          <div className="space-y-4">
            {branch.address && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-500 text-lg">📍</div>
                <div>
                  <p className="font-medium text-gray-700">주소</p>
                  <p className="text-gray-600">{branch.address}</p>
                </div>
              </div>
            )}
            
            {branch.phone && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-500 text-lg">📞</div>
                <div>
                  <p className="font-medium text-gray-700">전화번호</p>
                  <p className="text-gray-600">{branch.phone}</p>
                </div>
              </div>
            )}
            
            {branch.hours && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-500 text-lg">🕒</div>
                <div>
                  <p className="font-medium text-gray-700">운영시간</p>
                  <p className="text-gray-600">{branch.hours}</p>
                </div>
              </div>
            )}
            
            {branch.industry && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-500 text-lg">🏪</div>
                <div>
                  <p className="font-medium text-gray-700">업종</p>
                  <p className="text-gray-600">{branch.industry}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 작성 버튼 */}
        <div className="mobile-card animate-bounce-in mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              리뷰 작성하기
            </h3>
            <p className="text-gray-600 mb-6">
              이 가계에 대한 리뷰를 작성해주세요. 로그인 없이도 작성 가능합니다.
            </p>
            <Link
              href={`/review/write-public?branch_id=${branch.id}`}
              className="mobile-btn-primary w-full"
            >
              ✍️ 리뷰 작성하기
            </Link>
          </div>
        </div>

        {/* 포인트 안내 */}
        <div className="mobile-card animate-fade-in">
          <div className="text-center">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              리뷰 작성 혜택
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-green-600 font-medium">기본 포인트</div>
                <div className="text-green-800 font-bold">+50P</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-blue-600 font-medium">AI 리뷰</div>
                <div className="text-blue-800 font-bold">+30P</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-purple-600 font-medium">플랫폼 포스팅</div>
                <div className="text-purple-800 font-bold">+20P</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-orange-600 font-medium">총 획득</div>
                <div className="text-orange-800 font-bold">+100P</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * 포인트는 회원가입 후 지급됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}