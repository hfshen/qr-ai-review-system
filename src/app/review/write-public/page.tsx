'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Branch, ReviewKeyword } from '@/types/database'
import Link from 'next/link'

function PublicReviewWriteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [keywords, setKeywords] = useState<ReviewKeyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<(string | number)[]>([])
  const [rating, setRating] = useState(0)
  const [images, setImages] = useState<File[]>([])
  const [aiReview, setAiReview] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [error, setError] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const branchId = searchParams.get('branch_id')
    
    if (!branchId) {
      router.push('/')
      return
    }

    fetchData(branchId)
  }, [searchParams, router])

  const fetchData = async (branchId: string) => {
    try {
      // 지점 정보와 키워드 가져오기
      const [branchResult, keywordsResult] = await Promise.all([
        supabase
          .from('branches')
          .select('*')
          .eq('id', branchId)
          .single(),
        supabase
          .from('review_keywords')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ])

      if (branchResult.error) throw branchResult.error
      if (keywordsResult.error) throw keywordsResult.error

      setBranch(branchResult.data)
      setKeywords(keywordsResult.data || [])
    } catch (error: any) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setImages(prev => [...prev, ...files].slice(0, 5)) // 최대 5개
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const toggleKeyword = (keywordId: string | number) => {
    setSelectedKeywords(prev => 
      prev.includes(keywordId) 
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    )
  }

  const generateAIReview = async () => {
    if (!branch || selectedKeywords.length === 0 || rating === 0) {
      setError('평점과 키워드를 선택해주세요.')
      return
    }

    setIsGeneratingAI(true)
    setError('')

    try {
      const selectedKeywordNames = keywords
        .filter(k => selectedKeywords.includes(k.id))
        .map(k => k.keyword || k.id)

      const response = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branchName: branch.name,
          rating: rating.toString(),
          keywords: selectedKeywordNames,
          images: images.length > 0 ? '이미지가 첨부되었습니다.' : '이미지 없음'
        }),
      })

      if (!response.ok) {
        throw new Error('AI 리뷰 생성에 실패했습니다.')
      }

      const data = await response.json()
      setAiReview(data.review)
    } catch (error: any) {
      console.error('AI 리뷰 생성 오류:', error)
      setError(error.message || 'AI 리뷰 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSubmit = async () => {
    if (!branch || selectedKeywords.length === 0 || rating === 0) {
      setError('모든 필수 항목을 입력해주세요.')
      return
    }

    if (!reviewerName.trim()) {
      setError('작성자 이름을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // 이미지 업로드
      const imageUrls: string[] = []
      for (const image of images) {
        const fileName = `${Date.now()}-${image.name}`
        const { data, error } = await supabase.storage
          .from('review-images')
          .upload(fileName, image)

        if (error) throw error
        imageUrls.push(data.path)
      }

      // 리뷰 저장 (비회원 리뷰)
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          branch_id: branch.id,
          user_id: null, // 비회원 리뷰
          reviewer_name: reviewerName,
          reviewer_email: reviewerEmail || null,
          rating: rating.toString(),
          content: aiReview || '',
          keywords: selectedKeywords,
          images: imageUrls,
          status: 'pending'
        })
        .select()
        .single()

      if (reviewError) throw reviewError

      // 플랫폼별 리뷰 생성 및 포스팅 페이지로 이동
      router.push(`/review/platform-share?review_id=${reviewData.id}`)
    } catch (error: any) {
      console.error('리뷰 저장 오류:', error)
      setError(error.message || '리뷰 저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">리뷰 작성 페이지를 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !branch) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              리뷰 작성하기
            </h1>
            <p className="text-gray-600">
              {branch?.name}에 대한 리뷰를 작성해주세요
            </p>
            <p className="text-sm text-blue-600 mt-2">
              로그인 없이도 작성 가능합니다
            </p>
          </div>
        </div>

        {/* 작성자 정보 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            작성자 정보
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="reviewer-name" className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="reviewer-name"
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="mobile-input"
                placeholder="이름을 입력해주세요"
                required
              />
            </div>
            <div>
              <label htmlFor="reviewer-email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 (선택사항)
              </label>
              <input
                id="reviewer-email"
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                className="mobile-input"
                placeholder="이메일을 입력해주세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                포인트 지급을 위해 이메일을 입력해주세요
              </p>
            </div>
          </div>
        </div>

        {/* 평점 선택 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            평점을 선택해주세요 <span className="text-red-500">*</span>
          </h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-4xl transition-all duration-200 ${
                  star <= rating
                    ? 'text-yellow-400 scale-110'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {rating > 0 ? `${rating}점 선택됨` : '평점을 선택해주세요'}
          </p>
        </div>

        {/* 키워드 선택 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            연관 검색어를 선택해주세요 <span className="text-red-500">*</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {keywords.map((keyword) => (
              <button
                key={keyword.id}
                onClick={() => toggleKeyword(keyword.id)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedKeywords.includes(keyword.id)
                    ? 'bg-blue-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {keyword.keyword || keyword.id}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {selectedKeywords.length}개 선택됨
          </p>
        </div>

        {/* 이미지 업로드 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            사진을 업로드해주세요 (선택사항)
          </h3>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="mobile-input"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI 리뷰 생성 */}
        <div className="mobile-card animate-slide-up mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI 리뷰 생성
          </h3>
          <div className="space-y-4">
            <button
              onClick={generateAIReview}
              disabled={isGeneratingAI || rating === 0 || selectedKeywords.length === 0}
              className="mobile-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAI ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>AI 리뷰 생성 중...</span>
                </div>
              ) : (
                '🤖 AI 리뷰 생성하기'
              )}
            </button>
            
            {aiReview && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  생성된 리뷰:
                </h4>
                <textarea
                  value={aiReview}
                  onChange={(e) => setAiReview(e.target.value)}
                  className="mobile-input h-32 resize-none"
                  placeholder="AI가 생성한 리뷰를 확인하고 수정할 수 있습니다."
                />
              </div>
            )}
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mobile-card animate-error-shake mb-6">
            <div className="text-center text-red-600">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="mobile-card animate-bounce-in">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || selectedKeywords.length === 0 || !reviewerName.trim()}
            className="mobile-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner w-4 h-4"></div>
                <span>리뷰 저장 중...</span>
              </div>
            ) : (
              '리뷰 완료하고 플랫폼 공유하기'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PublicReviewWritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mb-4"></div>
          <p className="text-gray-600">리뷰 작성 페이지를 준비하는 중...</p>
        </div>
      </div>
    }>
      <PublicReviewWriteContent />
    </Suspense>
  )
}