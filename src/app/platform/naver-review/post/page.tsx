'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function NaverReviewPost() {
  const [formData, setFormData] = useState({
    placeName: '',
    rating: 5,
    content: '',
    images: [] as File[]
  })
  const [uploading, setUploading] = useState(false)
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      // 이미지 업로드
      const imageUrls: string[] = []
      for (const image of formData.images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // 리뷰 데이터 준비
      const reviewData = {
        platform: '네이버 리뷰',
        place_name: formData.placeName,
        rating: formData.rating,
        content: formData.content,
        images: imageUrls,
        status: 'pending'
      }

      // 네이버 API로 리뷰 게시 (실제 구현에서는 네이버 API 호출)
      const response = await fetch('/api/publish-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'naver',
          ...reviewData
        })
      })

      if (!response.ok) {
        throw new Error('리뷰 게시에 실패했습니다.')
      }

      alert('리뷰가 성공적으로 게시되었습니다!')
      
      // 폼 초기화
      setFormData({
        placeName: '',
        rating: 5,
        content: '',
        images: []
      })

    } catch (error) {
      console.error('리뷰 게시 오류:', error)
      alert(`리뷰 게시 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">네이버 리뷰 작성</h1>
            <p className="text-gray-600">
              네이버 플레이스에 리뷰를 작성하고 포인트를 받으세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-2">
                장소명 *
              </label>
              <input
                type="text"
                id="placeName"
                required
                value={formData.placeName}
                onChange={(e) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 스타벅스 강남점"
              />
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                평점 *
              </label>
              <select
                id="rating"
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5점)</option>
                <option value={4}>⭐⭐⭐⭐ (4점)</option>
                <option value={3}>⭐⭐⭐ (3점)</option>
                <option value={2}>⭐⭐ (2점)</option>
                <option value={1}>⭐ (1점)</option>
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 내용 *
              </label>
              <textarea
                id="content"
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="리뷰 내용을 작성해주세요..."
              />
            </div>

            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                사진 (선택사항)
              </label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`업로드된 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-blue-600 text-lg mr-2">💰</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">포인트 보상</p>
                  <p className="text-sm text-blue-600">이 리뷰로 100P를 받을 수 있습니다.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                {uploading ? '게시 중...' : '리뷰 게시하기'}
              </button>
              <button
                type="button"
                onClick={() => window.close()}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
