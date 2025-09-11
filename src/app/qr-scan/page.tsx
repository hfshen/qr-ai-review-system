'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Branch, Agency } from '@/types/database'

function QRScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [error, setError] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const branchId = searchParams.get('branch_id')
    if (!branchId) {
      setError('잘못된 QR 코드입니다.')
      setLoading(false)
      return
    }

    fetchBranchInfo(branchId)
  }, [searchParams])

  const fetchBranchInfo = async (branchId: string) => {
    try {
      // 지점 정보 가져오기
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

  const handleStartReview = async () => {
    if (!branch) return
    
    // 공개 가계 정보 페이지로 리다이렉트
    router.push(`/store/${branch.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">QR 코드 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="mobile-card animate-error-shake">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mobile-btn-primary"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* QR 스캔 성공 헤더 */}
        <div className="mobile-card animate-fade-in mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              QR 코드 스캔 완료!
            </h1>
            <p className="text-gray-600">
              리뷰를 작성하여 포인트를 획득하세요
            </p>
          </div>
        </div>

        {/* 지점 정보 카드 */}
        {branch && agency && (
          <div className="mobile-card animate-slide-up mb-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {branch.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {agency.name}
                </p>
                {branch.description && (
                  <p className="text-sm text-gray-500">
                    {branch.description}
                  </p>
                )}
              </div>

              {/* 지점 상세 정보 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {branch.address && (
                    <div>
                      <span className="font-medium text-gray-700">주소:</span>
                      <p className="text-gray-600">{branch.address}</p>
                    </div>
                  )}
                  {branch.phone && (
                    <div>
                      <span className="font-medium text-gray-700">전화:</span>
                      <p className="text-gray-600">{branch.phone}</p>
                    </div>
                  )}
                  {branch.hours && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">운영시간:</span>
                      <p className="text-gray-600">{branch.hours}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 리뷰 작성 시작 버튼 */}
        <div className="mobile-card animate-bounce-in">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              리뷰 작성하고 포인트 받기
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-green-500">📸</span>
                <span>사진 업로드</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-yellow-500">⭐</span>
                <span>평점 선택 (1~5점)</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-blue-500">🏷️</span>
                <span>연관 검색어 선택</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-purple-500">🤖</span>
                <span>AI 리뷰 자동 생성</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-orange-500">🚀</span>
                <span>다중 플랫폼 포스팅</span>
              </div>
            </div>
            
            <button
              onClick={handleStartReview}
              className="mobile-btn-primary w-full"
            >
              리뷰 작성 시작하기
            </button>
          </div>
        </div>

        {/* 포인트 정보 */}
        <div className="mobile-card animate-fade-in">
          <div className="text-center">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              포인트 획득 안내
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QRScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">QR 코드 정보를 확인하는 중...</p>
        </div>
      </div>
    }>
      <QRScanContent />
    </Suspense>
  )
}
