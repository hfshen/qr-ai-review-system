'use client'

import { useState, useRef } from 'react'
import { uploadFile, isImageFile, isVideoFile, validateFileSize, validateFileType } from '@/lib/storage'

interface FileUploadProps {
  onFilesUploaded: (filePaths: string[]) => void
  userId?: string
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: ('image' | 'video')[]
  disabled?: boolean
}

export default function FileUpload({
  onFilesUploaded,
  userId = 'temp-user-id',
  maxFiles = 3,
  maxSizeMB = 10,
  acceptedTypes = ['image', 'video'],
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setErrors([])
    setUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        // 파일 검증
        if (!validateFileType(file)) {
          throw new Error(`${file.name}: 지원하지 않는 파일 형식입니다.`)
        }

        if (!validateFileSize(file, maxSizeMB)) {
          throw new Error(`${file.name}: 파일 크기가 ${maxSizeMB}MB를 초과합니다.`)
        }

        // 타입 검증
        const isImage = isImageFile(file)
        const isVideo = isVideoFile(file)
        
        if (acceptedTypes.includes('image') && !isImage && acceptedTypes.includes('video') && !isVideo) {
          throw new Error(`${file.name}: 이미지 또는 비디오 파일만 업로드 가능합니다.`)
        }

        if (acceptedTypes.includes('image') && !isImage) {
          throw new Error(`${file.name}: 이미지 파일만 업로드 가능합니다.`)
        }

        if (acceptedTypes.includes('video') && !isVideo) {
          throw new Error(`${file.name}: 비디오 파일만 업로드 가능합니다.`)
        }

        // 파일 업로드
        const result = await uploadFile(file, userId)
        
        if (!result.success) {
          throw new Error(`${file.name}: ${result.error}`)
        }

        return result.filePath!
      })

      const results = await Promise.all(uploadPromises)
      const newUploadedFiles = [...uploadedFiles, ...results].slice(0, maxFiles)
      
      setUploadedFiles(newUploadedFiles)
      onFilesUploaded(newUploadedFiles)
    } catch (error) {
      setErrors(prev => [...prev, error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'])
    } finally {
      setUploading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFilesUploaded(newFiles)
  }

  const getAcceptedTypesString = () => {
    const types: string[] = []
    if (acceptedTypes.includes('image')) types.push('image/*')
    if (acceptedTypes.includes('video')) types.push('video/*')
    return types.join(',')
  }

  return (
    <div className="space-y-4">
      {/* 파일 입력 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedTypesString()}
          onChange={handleFileSelect}
          disabled={disabled || uploading || uploadedFiles.length >= maxFiles}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || uploadedFiles.length >= maxFiles}
          className="text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm">업로드 중...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-lg font-medium">파일을 선택하거나 드래그하세요</p>
                <p className="text-sm text-gray-500">
                  최대 {maxFiles}개 파일, 각 {maxSizeMB}MB 이하
                </p>
                {acceptedTypes.includes('image') && acceptedTypes.includes('video') && (
                  <p className="text-sm text-gray-500">이미지 또는 비디오 파일</p>
                )}
                {acceptedTypes.includes('image') && !acceptedTypes.includes('video') && (
                  <p className="text-sm text-gray-500">이미지 파일만</p>
                )}
                {acceptedTypes.includes('video') && !acceptedTypes.includes('image') && (
                  <p className="text-sm text-gray-500">비디오 파일만</p>
                )}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드된 파일 ({uploadedFiles.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((filePath, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">
                    {filePath.includes('image') ? '🖼️' : '🎥'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {filePath.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {filePath.includes('image') ? '이미지' : '비디오'} 파일
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">업로드 오류</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
