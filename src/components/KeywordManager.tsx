'use client'

import { useState, useEffect } from 'react'
import { 
  getAllReviewKeywords, 
  addReviewKeyword, 
  updateReviewKeyword, 
  deleteReviewKeyword,
  initializeDefaultKeywords,
  groupKeywordsByRating,
  ReviewKeyword 
} from '@/lib/keywords'

export default function KeywordManager() {
  const [keywords, setKeywords] = useState<ReviewKeyword[]>([])
  const [groupedKeywords, setGroupedKeywords] = useState<Record<number, ReviewKeyword[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingKeyword, setEditingKeyword] = useState<ReviewKeyword | null>(null)
  const [newKeyword, setNewKeyword] = useState({ rating: 5, keyword: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await getAllReviewKeywords()
      
      if (result.success) {
        setKeywords(result.keywords || [])
        setGroupedKeywords(groupKeywordsByRating(result.keywords || []))
      } else {
        setError(result.error || '키워드 조회에 실패했습니다.')
      }
    } catch (error) {
      setError('키워드 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.keyword.trim()) {
      alert('키워드를 입력해주세요.')
      return
    }

    setIsAdding(true)
    
    try {
      const result = await addReviewKeyword(newKeyword.rating, newKeyword.keyword)
      
      if (result.success) {
        setNewKeyword({ rating: 5, keyword: '' })
        fetchKeywords() // 새로고침
        alert('키워드가 추가되었습니다.')
      } else {
        alert(result.error || '키워드 추가에 실패했습니다.')
      }
    } catch (error) {
      alert('키워드 추가 중 오류가 발생했습니다.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateKeyword = async (id: number, keyword: string) => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.')
      return
    }

    try {
      const result = await updateReviewKeyword(id, keyword)
      
      if (result.success) {
        setEditingKeyword(null)
        fetchKeywords() // 새로고침
        alert('키워드가 수정되었습니다.')
      } else {
        alert(result.error || '키워드 수정에 실패했습니다.')
      }
    } catch (error) {
      alert('키워드 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteKeyword = async (id: number) => {
    if (!confirm('이 키워드를 삭제하시겠습니까?')) {
      return
    }

    try {
      const result = await deleteReviewKeyword(id)
      
      if (result.success) {
        fetchKeywords() // 새로고침
        alert('키워드가 삭제되었습니다.')
      } else {
        alert(result.error || '키워드 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('키워드 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleInitializeDefaults = async () => {
    if (!confirm('기본 키워드로 초기화하시겠습니까? 기존 키워드는 모두 삭제됩니다.')) {
      return
    }

    try {
      const result = await initializeDefaultKeywords()
      
      if (result.success) {
        fetchKeywords() // 새로고침
        alert('기본 키워드가 초기화되었습니다.')
      } else {
        alert(result.error || '기본 키워드 초기화에 실패했습니다.')
      }
    } catch (error) {
      alert('기본 키워드 초기화 중 오류가 발생했습니다.')
    }
  }

  const getRatingText = (rating: number) => {
    const ratingTexts = {
      1: '매우 불만족',
      2: '불만족',
      3: '보통',
      4: '만족',
      5: '매우 만족'
    }
    return ratingTexts[rating as keyof typeof ratingTexts] || `${rating}점`
  }

  const getRatingColor = (rating: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-green-100 text-green-800',
      5: 'bg-blue-100 text-blue-800'
    }
    return colors[rating as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">리뷰 키워드 관리</h2>
          <p className="text-gray-600 mt-1">별점별 추천 키워드를 관리하세요</p>
        </div>
        <button
          onClick={handleInitializeDefaults}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          기본 키워드 초기화
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Add New Keyword */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">새 키워드 추가</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="newKeyword" className="block text-sm font-medium text-gray-700 mb-2">
              키워드
            </label>
            <input
              id="newKeyword"
              type="text"
              value={newKeyword.keyword}
              onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="키워드를 입력하세요"
            />
          </div>
          <div className="w-32">
            <label htmlFor="newRating" className="block text-sm font-medium text-gray-700 mb-2">
              별점
            </label>
            <select
              id="newRating"
              value={newKeyword.rating}
              onChange={(e) => setNewKeyword({ ...newKeyword, rating: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <option key={rating} value={rating}>
                  {rating}점 - {getRatingText(rating)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddKeyword}
              disabled={isAdding || !newKeyword.keyword.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {isAdding ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      </div>

      {/* Keywords by Rating */}
      <div className="space-y-6">
        {[5, 4, 3, 2, 1].map(rating => (
          <div key={rating} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(rating)}`}>
                {rating}점 - {getRatingText(rating)}
              </div>
              <span className="text-sm text-gray-500">
                {groupedKeywords[rating]?.length || 0}개 키워드
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedKeywords[rating]?.map((keyword) => (
                <div key={keyword.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  {editingKeyword?.id === keyword.id ? (
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        defaultValue={keyword.keyword}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateKeyword(keyword.id, e.currentTarget.value)
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateKeyword(keyword.id, (e as any).target.value)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingKeyword(null)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-900">{keyword.keyword}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingKeyword(keyword)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDeleteKeyword(keyword.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )) || (
                <div className="col-span-full text-center py-4 text-gray-500">
                  키워드가 없습니다.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">📊 키워드 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(rating => (
            <div key={rating} className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(rating)}`}>
                {rating}점
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-2">
                {groupedKeywords[rating]?.length || 0}
              </div>
              <div className="text-sm text-blue-700">개 키워드</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-blue-900">{keywords.length}</div>
          <div className="text-sm text-blue-700">총 키워드 수</div>
        </div>
      </div>
    </div>
  )
}
