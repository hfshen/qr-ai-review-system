'use client'

import { useState, useEffect } from 'react'
import { getPointTransactions, PointTransaction } from '@/lib/points'

interface PointHistoryProps {
  userId?: string
  agencyId?: string
  title?: string
}

export default function PointHistory({ userId, agencyId, title = '포인트 거래 내역' }: PointHistoryProps) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchTransactions()
  }, [userId, agencyId])

  const fetchTransactions = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await getPointTransactions(userId, agencyId, 50)
      
      if (result.success) {
        setTransactions(result.transactions || [])
      } else {
        setError(result.error || '거래 내역을 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('거래 내역을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'reward':
        return '리뷰 보상'
      case 'purchase':
        return '마켓 구매'
      case 'agency_deposit':
        return '포인트 충전'
      case 'admin_adjust':
        return '관리자 조정'
      default:
        return type
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'reward':
        return 'text-green-600'
      case 'purchase':
        return 'text-red-600'
      case 'agency_deposit':
        return 'text-blue-600'
      case 'admin_adjust':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <p className="text-gray-600">거래 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                    {getTransactionTypeText(transaction.transaction_type)}
                  </div>
                  {transaction.memo && (
                    <span className="text-sm text-gray-600">{transaction.memo}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(transaction.created_at)}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-bold ${
                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}P
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {transactions.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={fetchTransactions}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            최신 내역 새로고침
          </button>
        </div>
      )}
    </div>
  )
}
