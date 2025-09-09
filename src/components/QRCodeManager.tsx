'use client'

import { useState, useEffect } from 'react'
import { generateQRCodeDataURL, generateReviewURL, downloadQRCode, openQRCodeInNewWindow } from '@/lib/qrcode'
import { Branch } from '@/types/database'

interface QRCodeManagerProps {
  branch: Branch
  onQRCodeGenerated?: (qrCodeUrl: string) => void
}

export default function QRCodeManager({ branch, onQRCodeGenerated }: QRCodeManagerProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    generateQRCode()
  }, [branch.id])

  const generateQRCode = async () => {
    setLoading(true)
    setError('')

    try {
      const reviewURL = generateReviewURL(branch.id)
      const dataURL = await generateQRCodeDataURL(reviewURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQrCodeUrl(dataURL)
      onQRCodeGenerated?.(dataURL)
    } catch (error) {
      setError('QR 코드 생성에 실패했습니다.')
      console.error('QR 코드 생성 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCodeUrl) {
      downloadQRCode(qrCodeUrl, `${branch.name}-qrcode.png`)
    }
  }

  const handleOpenInNewWindow = () => {
    if (qrCodeUrl) {
      openQRCodeInNewWindow(qrCodeUrl)
    }
  }

  const copyURL = () => {
    const reviewURL = generateReviewURL(branch.id)
    navigator.clipboard.writeText(reviewURL).then(() => {
      alert('URL이 클립보드에 복사되었습니다.')
    }).catch(() => {
      alert('URL 복사에 실패했습니다.')
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">QR 코드 관리</h3>
            <p className="text-sm text-gray-600 mt-1">{branch.name}</p>
          </div>
          <button
            onClick={generateQRCode}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '생성 중...' : '새로 생성'}
          </button>
        </div>

        {/* QR Code Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={generateQRCode}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : qrCodeUrl ? (
          <div className="space-y-4">
            {/* QR Code Image */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt={`${branch.name} QR 코드`}
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <span>📥</span>
                <span>다운로드</span>
              </button>
              
              <button
                onClick={handleOpenInNewWindow}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <span>🔍</span>
                <span>새 창에서 보기</span>
              </button>
              
              <button
                onClick={copyURL}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <span>📋</span>
                <span>URL 복사</span>
              </button>
            </div>

            {/* URL Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">리뷰 페이지 URL:</p>
              <p className="text-sm font-mono text-gray-800 break-all">
                {generateReviewURL(branch.id)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📋 사용 안내</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• QR 코드를 인쇄하여 매장에 부착하세요</li>
            <li>• 고객이 QR 코드를 스캔하면 리뷰 작성 페이지로 이동합니다</li>
            <li>• QR 코드는 지점별로 고유합니다</li>
            <li>• 필요시 언제든지 새로 생성할 수 있습니다</li>
          </ul>
        </div>

        {/* Print Preview */}
        {qrCodeUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">🖨️ 인쇄 미리보기</h4>
            <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
              <div className="flex items-center space-x-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Preview"
                  className="w-16 h-16"
                />
                <div>
                  <h5 className="font-bold text-gray-900">{branch.name}</h5>
                  <p className="text-sm text-gray-600">QR 코드를 스캔하여 리뷰를 작성하세요</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {branch.address && `📍 ${branch.address}`}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              위 디자인으로 인쇄하면 고객이 쉽게 인식할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
