import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UploadResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * 파일을 Supabase Storage에 업로드
 */
export async function uploadFile(
  file: File,
  userId: string,
  reviewId?: string
): Promise<UploadResult> {
  try {
    // 파일 경로 생성: users/{userId}/reviews/{reviewId}/filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = reviewId 
      ? `users/${userId}/reviews/${reviewId}/${fileName}`
      : `users/${userId}/temp/${fileName}`

    // 파일 업로드
    const { data, error } = await supabase.storage
      .from('review-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, filePath: data.path }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: '파일 업로드 중 오류가 발생했습니다.' }
  }
}

/**
 * 파일을 Supabase Storage에서 다운로드
 */
export async function downloadFile(filePath: string): Promise<DownloadResult> {
  try {
    const { data, error } = await supabase.storage
      .from('review-media')
      .createSignedUrl(filePath, 3600) // 1시간 유효

    if (error) {
      console.error('Download error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('Download error:', error)
    return { success: false, error: '파일 다운로드 중 오류가 발생했습니다.' }
  }
}

/**
 * 파일을 Supabase Storage에서 삭제
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('review-media')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: '파일 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 이미지 파일인지 확인
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 비디오 파일인지 확인
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * 파일 크기 검증 (10MB 제한)
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 파일 타입 검증
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
  return allowedTypes.includes(file.type)
}
