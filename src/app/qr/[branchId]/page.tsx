'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Branch, ReviewKeyword, Platform } from '@/types/database'
import Webcam from 'react-webcam'
import Link from 'next/link'
import FileUpload from '@/components/FileUpload'

interface QRReviewPageProps {
  params: {
    branchId: string
  }
}

export default function QRReviewPage({ params }: QRReviewPageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [keywords, setKeywords] = useState<ReviewKeyword[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: 촬영, 2: 별점/키워드, 3: AI 생성, 4: 플랫폼 선택, 5: 완료
  const [rating, setRating] = useState<number>(0)
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([])
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [useCamera, setUseCamera] = useState(true)
  const [aiContent, setAiContent] = useState('')
  const [finalContent, setFinalContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const webcamRef = useRef<Webcam>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await Promise.all([
          fetchBranch(params.branchId),
          fetchKeywords(),
          fetchPlatforms()
        ])
      }
      setLoading(false)
    }

    getUser()
  }, [params.branchId])

  const fetchBranch = async (branchId: string) => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single()

    if (error) {
      console.error('Error fetching branch:', error)
      return
    }

    setBranch(data)
  }

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('review_keywords')
      .select('*')

    if (error) {
      console.error('Error fetching keywords:', error)
      return
    }

    setKeywords(data || [])
  }

  const fetchPlatforms = async () => {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')

    if (error) {
      console.error('Error fetching platforms:', error)
      return
    }

    setPlatforms(data || [])
  }

  const capturePhoto = () => {
    if (webcamRef.current && capturedImages.length < 3) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        setCapturedImages([...capturedImages, imageSrc])
      }
    }
  }

  const removeImage = (index: number) => {
    setCapturedImages(capturedImages.filter((_, i) => i !== index))
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    setSelectedKeywords([])
  }

  const handleKeywordToggle = (keywordId: number) => {
    if (selectedKeywords.includes(keywordId)) {
      setSelectedKeywords(selectedKeywords.filter(id => id !== keywordId))
    } else if (selectedKeywords.length < 5) {
      setSelectedKeywords([...selectedKeywords, keywordId])
    }
  }

  const generateAIReview = async () => {
    if (!branch || selectedKeywords.length === 0) return

    setIsGenerating(true)
    try {
      const selectedKeywordTexts = keywords
        .filter(k => selectedKeywords.includes(k.id))
        .map(k => k.keyword)

      // 이미지를 Base64로 변환
      const imagesToSend = useCamera ? capturedImages : uploadedFiles

      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          keywords: selectedKeywordTexts,
          branchInfo: {
            name: branch.name,
            description: branch.description,
            industry: branch.industry,
            address: branch.address
          },
          images: imagesToSend
        })
      })

      const data = await response.json()

      if (data.success) {
        setAiContent(data.review)
        setFinalContent(data.review)
        console.log('AI 리뷰 생성 성공:', data.review)
        if (data.usage) {
          console.log('토큰 사용량:', data.usage)
        }
      } else {
        console.error('Failed to generate review:', data.error)
        // 폴백으로 기본 리뷰 생성
        const fallbackReview = `이번에 ${branch.name}에 방문했는데 ${selectedKeywordTexts.join(', ')}가 특히 인상적이었습니다. 좋은 경험이었어요!`
        setAiContent(fallbackReview)
        setFinalContent(fallbackReview)
      }
    } catch (error) {
      console.error('Error generating review:', error)
      // 폴백으로 기본 리뷰 생성
      const fallbackReview = `이번에 ${branch.name}에 방문했는데 좋은 경험이었어요!`
      setAiContent(fallbackReview)
      setFinalContent(fallbackReview)
    } finally {
      setIsGenerating(false)
    }
  }

  const publishReview = async () => {
    if (!user || !branch || selectedPlatforms.length === 0) return

    setIsPublishing(true)
    try {
      // 리뷰 생성
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          branch_id: branch.id,
          rating: rating,
          selected_keyword_id: selectedKeywords[0], // 첫 번째 키워드 사용
          ai_content: aiContent,
          final_content: finalContent,
          status: 'published'
        })
        .select()
        .single()

      if (reviewError) {
        console.error('Error creating review:', reviewError)
        return
      }

      // 미디어 정보 저장
      const mediaFiles = useCamera ? capturedImages : uploadedFiles
      for (let i = 0; i < mediaFiles.length; i++) {
        const filePath = mediaFiles[i]
        const mediaType = filePath.includes('image') ? 'image' : 'video'
        
        await supabase
          .from('review_media')
          .insert({
            review_id: review.id,
            file_path: filePath,
            media_type: mediaType
          })
      }

      // 플랫폼별 리뷰 게시 (실제로는 각 플랫폼 API 호출)
      for (const platformId of selectedPlatforms) {
        // 실제 플랫폼 API 호출 로직
        console.log(`Publishing to platform ${platformId}`)
      }

      setStep(5)
    } catch (error) {
      console.error('Error publishing review:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">지점을 찾을 수 없습니다</h2>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{branch.name}</h1>
          <p className="text-gray-600">{branch.description}</p>
          <div className="text-sm text-gray-500 mt-2">
            업종: {branch.industry} | 주소: {branch.address}
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 5 && (
                  <div className={`w-8 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <span className={step >= 1 ? 'text-blue-600' : ''}>촬영</span>
            <span className={`mx-4 ${step >= 2 ? 'text-blue-600' : ''}`}>별점/키워드</span>
            <span className={`mx-4 ${step >= 3 ? 'text-blue-600' : ''}`}>AI 생성</span>
            <span className={`mx-4 ${step >= 4 ? 'text-blue-600' : ''}`}>플랫폼 선택</span>
            <span className={step >= 5 ? 'text-blue-600' : ''}>완료</span>
          </div>
        </div>

        {/* 단계 1: 사진 촬영 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">미디어 추가</h2>
            <p className="text-gray-600 mb-4">최대 3장의 사진 또는 비디오를 추가하세요</p>
            
            {/* 촬영 방식 선택 */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setUseCamera(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    useCamera 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📷 카메라 촬영
                </button>
                <button
                  onClick={() => setUseCamera(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !useCamera 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📁 파일 업로드
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {useCamera ? (
                <div>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={capturePhoto}
                    disabled={capturedImages.length >= 3}
                    className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    사진 촬영 ({capturedImages.length}/3)
                  </button>
                </div>
              ) : (
                <div>
                  <FileUpload
                    onFilesUploaded={setUploadedFiles}
                    userId={user?.id}
                    maxFiles={3}
                    maxSizeMB={10}
                    acceptedTypes={['image', 'video']}
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">
                  {useCamera ? '촬영된 사진' : '업로드된 파일'}
                </h3>
                <div className="space-y-2">
                  {useCamera ? (
                    capturedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={image} alt={`Captured ${index + 1}`} className="w-full rounded-lg" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    uploadedFiles.map((filePath, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">
                            {filePath.includes('image') ? '🖼️' : '🎥'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{filePath.split('/').pop()}</p>
                            <p className="text-xs text-gray-500">
                              {filePath.includes('image') ? '이미지' : '비디오'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newFiles = uploadedFiles.filter((_, i) => i !== index)
                            setUploadedFiles(newFiles)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(2)}
                disabled={(useCamera && capturedImages.length === 0) || (!useCamera && uploadedFiles.length === 0)}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                다음 단계
              </button>
            </div>
          </div>
        )}

        {/* 단계 2: 별점 및 키워드 선택 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">별점 및 키워드 선택</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">별점을 선택하세요</h3>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className={`text-3xl ${
                      rating >= star ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && '매우 불만족'}
                {rating === 2 && '불만족'}
                {rating === 3 && '보통'}
                {rating === 4 && '만족'}
                {rating === 5 && '매우 만족'}
              </p>
            </div>

            {rating > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">키워드를 선택하세요 (최대 5개)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {keywords
                    .filter(k => k.rating === rating)
                    .map((keyword) => (
                      <button
                        key={keyword.id}
                        onClick={() => handleKeywordToggle(keyword.id)}
                        className={`p-2 rounded text-sm ${
                          selectedKeywords.includes(keyword.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {keyword.keyword}
                      </button>
                    ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  선택된 키워드: {selectedKeywords.length}/5
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                이전 단계
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={rating === 0 || selectedKeywords.length === 0}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                다음 단계
              </button>
            </div>
          </div>
        )}

        {/* 단계 3: AI 리뷰 생성 */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">AI 리뷰 생성</h2>
            
            {!aiContent ? (
              <div className="text-center">
                <button
                  onClick={generateAIReview}
                  disabled={isGenerating}
                  className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {isGenerating ? 'AI 리뷰 생성 중...' : 'AI 리뷰 생성하기'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-3">AI가 생성한 리뷰</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-800">{aiContent}</p>
                </div>
                
                <h3 className="text-lg font-semibold mb-3">리뷰 수정 (선택사항)</h3>
                <textarea
                  value={finalContent}
                  onChange={(e) => setFinalContent(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="리뷰를 수정하거나 그대로 사용하세요"
                />
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                이전 단계
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!aiContent}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                다음 단계
              </button>
            </div>
          </div>
        )}

        {/* 단계 4: 플랫폼 선택 */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">게시할 플랫폼 선택</h2>
            <p className="text-gray-600 mb-6">리뷰를 게시할 플랫폼을 선택하세요</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedPlatforms.includes(platform.id)) {
                      setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id))
                    } else {
                      setSelectedPlatforms([...selectedPlatforms, platform.id])
                    }
                  }}
                >
                  <h3 className="font-semibold text-lg mb-2">{platform.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{platform.description}</p>
                  <div className="text-sm text-green-600">
                    리워드: {platform.default_reward} 포인트
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(3)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                이전 단계
              </button>
              <button
                onClick={publishReview}
                disabled={selectedPlatforms.length === 0 || isPublishing}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {isPublishing ? '게시 중...' : '리뷰 게시하기'}
              </button>
            </div>
          </div>
        )}

        {/* 단계 5: 완료 */}
        {step === 5 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">리뷰 게시 완료!</h2>
            <p className="text-gray-600 mb-6">
              리뷰가 성공적으로 게시되었습니다. 포인트가 적립되었습니다.
            </p>
            <div className="space-x-4">
              <Link
                href="/"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                홈으로 돌아가기
              </Link>
              <button
                onClick={() => {
                  setStep(1)
                  setRating(0)
                  setSelectedKeywords([])
                  setCapturedImages([])
                  setAiContent('')
                  setFinalContent('')
                  setSelectedPlatforms([])
                }}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                새 리뷰 작성
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
