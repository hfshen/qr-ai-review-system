'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getUserPoints, usePoints } from '@/lib/points'
import PointHistory from '@/components/PointHistory'

type User = Database['public']['Tables']['users']['Row']
type MarketplaceProduct = Database['public']['Tables']['marketplace_products']['Row']

interface MarketplaceProps {
  user: User
}

export default function Marketplace({ user }: MarketplaceProps) {
  const [userPoints, setUserPoints] = useState(0)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [pointsResult, productsResult] = await Promise.all([
        getUserPoints(user.id),
        supabase
          .from('marketplace_products')
          .select('*')
          .eq('is_active', true)
          .order('points_cost', { ascending: true })
      ])

      if (pointsResult.success) {
        setUserPoints(pointsResult.points || 0)
      }

      if (productsResult.error) {
        throw productsResult.error
      }

      setProducts(productsResult.data || [])
    } catch (error) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (product: MarketplaceProduct) => {
    if (userPoints < product.points_cost) {
      setError('포인트가 부족합니다.')
      return
    }

    if (!confirm(`${product.name}을(를) ${product.points_cost.toLocaleString()}포인트로 구매하시겠습니까?`)) {
      return
    }

    setPurchasing(product.id)
    setError('')

    try {
      // 상품 구매 기록 생성
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('product_purchases')
        .insert({
          user_id: user.id,
          product_id: product.id,
          points_spent: product.points_cost,
          status: 'completed',
          redemption_code: generateRedemptionCode(),
          notes: `구매일: ${new Date().toLocaleDateString('ko-KR')}`
        })
        .select()
        .single()

      if (purchaseError) {
        throw purchaseError
      }

      // 포인트 차감
      const pointsResult = await usePoints(user.id, product.points_cost, 'purchase')
      
      if (pointsResult.success) {
        setUserPoints(prev => prev - product.points_cost)
        alert(`구매가 완료되었습니다!\n상품: ${product.name}\n사용 포인트: ${product.points_cost.toLocaleString()}P\n잔여 포인트: ${(userPoints - product.points_cost).toLocaleString()}P`)
      } else {
        throw new Error(pointsResult.error || '포인트 차감에 실패했습니다.')
      }
    } catch (error) {
      setError('구매 중 오류가 발생했습니다.')
      console.error('Error purchasing product:', error)
    } finally {
      setPurchasing(null)
    }
  }

  const generateRedemptionCode = () => {
    return 'REDEEM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coupon': return '🎫'
      case 'giftcard': return '💳'
      case 'service': return '🛠️'
      default: return '🛍️'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">마켓플레이스 로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">🛍️ 마켓플레이스</h1>
        <p className="text-xl text-gray-600">포인트로 다양한 상품을 구매하세요!</p>
        
        {/* User Points Display */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">보유 포인트</div>
          <div className="text-3xl font-bold">{userPoints.toLocaleString()}P</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="space-y-4">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-6xl">{getCategoryIcon(product.category)}</div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                <p className="text-gray-600 mt-1">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {product.points_cost.toLocaleString()}P
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {product.category === 'coupon' ? '쿠폰' : 
                     product.category === 'giftcard' ? '기프트카드' :
                     product.category === 'service' ? '서비스' : '일반'}
                  </span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(product)}
                disabled={userPoints < product.points_cost || purchasing === product.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  userPoints >= product.points_cost
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${purchasing === product.id ? 'opacity-50' : ''}`}
              >
                {purchasing === product.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    구매 중...
                  </div>
                ) : userPoints >= product.points_cost ? (
                  '구매하기'
                ) : (
                  '포인트 부족'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">상품이 없습니다</h3>
          <p className="text-gray-600">곧 새로운 상품이 추가될 예정입니다!</p>
        </div>
      )}

      {/* Point History */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">포인트 거래 내역</h2>
        <PointHistory userId={user.id} />
      </div>
    </div>
  )
}