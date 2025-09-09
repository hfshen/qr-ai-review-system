'use client'

import { useState } from 'react'
import { depositAgencyPoints, calculateBonusPoints, pointsToWon } from '@/lib/points'

interface PointDepositProps {
  agencyId: string
  currentBalance: number
  onDepositSuccess: (newBalance: number) => void
}

export default function PointDeposit({ agencyId, currentBalance, onDepositSuccess }: PointDepositProps) {
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [isDepositing, setIsDepositing] = useState(false)
  const [error, setError] = useState<string>('')

  const bonusPoints = calculateBonusPoints(depositAmount)
  const totalPoints = depositAmount + bonusPoints

  const handleDeposit = async () => {
    if (depositAmount < 10000) {
      setError('최소 충전 금액은 10,000원입니다.')
      return
    }

    setIsDepositing(true)
    setError('')

    try {
      const result = await depositAgencyPoints(agencyId, depositAmount)
      
      if (result.success) {
        onDepositSuccess(currentBalance + totalPoints)
        setDepositAmount(0)
        alert(`포인트 충전이 완료되었습니다!\n충전 포인트: ${depositAmount.toLocaleString()}P\n보너스 포인트: ${bonusPoints.toLocaleString()}P\n총 포인트: ${totalPoints.toLocaleString()}P`)
      } else {
        setError(result.error || '포인트 충전 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('포인트 충전 중 오류가 발생했습니다.')
    } finally {
      setIsDepositing(false)
    }
  }

  const presetAmounts = [50000, 100000, 200000, 500000, 1000000]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">포인트 충전</h3>
      
      {/* 현재 잔액 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">현재 잔액</span>
          <span className="text-2xl font-bold text-blue-600">
            {currentBalance.toLocaleString()}P
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          ({pointsToWon(currentBalance).toLocaleString()}원 상당)
        </div>
      </div>

      {/* 충전 금액 입력 */}
      <div className="space-y-4">
        <div>
          <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
            충전 금액 (원)
          </label>
          <input
            id="depositAmount"
            type="number"
            min="10000"
            step="1000"
            value={depositAmount || ''}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="충전할 금액을 입력하세요"
          />
        </div>

        {/* 빠른 선택 버튼 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">빠른 선택</p>
          <div className="grid grid-cols-5 gap-2">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setDepositAmount(amount)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  depositAmount === amount
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {amount.toLocaleString()}원
              </button>
            ))}
          </div>
        </div>

        {/* 보너스 정보 */}
        {depositAmount > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">충전 혜택</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">기본 포인트:</span>
                <span className="font-medium">{depositAmount.toLocaleString()}P</span>
              </div>
              {bonusPoints > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">보너스 포인트:</span>
                  <span className="font-medium text-green-600">+{bonusPoints.toLocaleString()}P</span>
                </div>
              )}
              <div className="flex justify-between border-t border-green-200 pt-1">
                <span className="font-medium text-gray-700">총 포인트:</span>
                <span className="font-bold text-green-700">{totalPoints.toLocaleString()}P</span>
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 충전 버튼 */}
        <button
          onClick={handleDeposit}
          disabled={depositAmount < 10000 || isDepositing}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isDepositing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>충전 중...</span>
            </div>
          ) : (
            `포인트 충전 (${totalPoints.toLocaleString()}P)`
          )}
        </button>
      </div>

      {/* 충전 안내 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">충전 안내</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 최소 충전 금액: 10,000원</li>
          <li>• 1원 = 1포인트로 충전됩니다</li>
          <li>• 충전 금액에 따라 추가 보너스 포인트를 받으실 수 있습니다</li>
          <li>• 충전된 포인트는 리뷰 보상 지급에 사용됩니다</li>
        </ul>
      </div>
    </div>
  )
}
