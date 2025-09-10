// Web Share API 및 딥링크 유틸리티
export interface ShareData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export interface PlatformShareConfig {
  id: string
  name: string
  shareMethod: 'web-share' | 'deeplink' | 'copy-only'
  deeplinkUrl?: string
  fallbackUrl?: string
}

// Web Share API 지원 여부 확인
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

// 파일 공유 지원 여부 확인
export function isFileShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 
         'canShare' in navigator && 
         typeof navigator.canShare === 'function'
}

// 텍스트를 클립보드에 복사
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 폴백: 구식 방법
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  } catch (error) {
    console.error('클립보드 복사 실패:', error)
    return false
  }
}

// Web Share API로 공유
export async function shareWithWebAPI(shareData: ShareData): Promise<boolean> {
  try {
    if (!isWebShareSupported()) {
      throw new Error('Web Share API를 지원하지 않습니다.')
    }

    // 파일 공유가 필요한 경우
    if (shareData.files && shareData.files.length > 0) {
      if (!isFileShareSupported()) {
        throw new Error('파일 공유를 지원하지 않습니다.')
      }
      
      if (!navigator.canShare({ files: shareData.files })) {
        throw new Error('이 파일들을 공유할 수 없습니다.')
      }
    }

    await navigator.share(shareData)
    return true
  } catch (error) {
    console.error('Web Share API 공유 실패:', error)
    return false
  }
}

// 딥링크 실행
export function openDeeplink(deeplinkUrl: string, fallbackUrl?: string): void {
  try {
    // 딥링크 시도
    window.location.href = deeplinkUrl
    
    // 앱이 설치되어 있지 않은 경우를 위한 폴백
    if (fallbackUrl) {
      setTimeout(() => {
        if (confirm('앱이 설치되어 있지 않습니다. 웹으로 이동하시겠습니까?')) {
          window.open(fallbackUrl, '_blank')
        }
      }, 2000)
    }
  } catch (error) {
    console.error('딥링크 실행 실패:', error)
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank')
    }
  }
}

// 플랫폼별 딥링크 URL 생성
export function generateDeeplinkUrls(branch: any) {
  const lat = branch.latitude || 37.5665
  const lng = branch.longitude || 126.9780
  const name = encodeURIComponent(branch.name)
  const webUrl = encodeURIComponent(window.location.origin)

  return {
    // 네이버 지도
    naver: {
      deeplink: `nmap://place?lat=${lat}&lng=${lng}&name=${name}&appname=${webUrl}`,
      fallback: `https://map.naver.com/v5/search/${name}`
    },
    
    // 카카오맵
    kakao: {
      deeplink: `kakaomap://look?p=${lat},${lng}`,
      fallback: `https://map.kakao.com/link/search/${name}`
    },
    
    // 구글 맵
    google: {
      deeplink: `comgooglemaps://?q=${lat},${lng}`,
      fallback: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }
  }
}

// 플랫폼별 캡션 템플릿 생성
export function generateCaptionTemplates(review: any, branch: any) {
  const ratingStars = '⭐'.repeat(review.rating)
  
  return {
    // 네이버 플레이스 (한국어)
    naver: `📍 ${branch.name}\n\n${ratingStars} ${review.rating}/5점\n\n${review.content}\n\n#${branch.name.replace(/\s+/g, '')} #리뷰 #방문후기 #맛집`,
    
    // 인스타그램 (한국어 + 해시태그)
    instagram: `${review.content}\n\n📍 ${branch.name} ${ratingStars}\n\n#${branch.name.replace(/\s+/g, '')} #맛집 #리뷰 #추천 #방문후기 #데이트 #친구모임 #맛스타그램 #인스타그램`,
    
    // 샤오홍슈 (중국어 스토리형)
    xiaohongshu: `📍 ${branch.name}\n\n今天和朋友一起去了${branch.name}，环境真的很不错！\n\n${ratingStars} 评分：${review.rating}/5\n\n${review.content}\n\n#${branch.name.replace(/\s+/g, '')} #探店 #美食 #推荐 #生活记录 #小红书`,
    
    // 틱톡 (간결한 형식)
    tiktok: `${review.content}\n\n📍 ${branch.name} ${ratingStars}\n\n#${branch.name.replace(/\s+/g, '')} #맛집 #리뷰 #추천 #틱톡`,
    
    // 구글 (표준 리뷰 형식)
    google: `${review.content}\n\n평점: ${review.rating}/5점\n\n${branch.name}`
  }
}

// 이미지를 File 객체로 변환
export async function imageUrlToFile(imageUrl: string, filename: string = 'image.jpg'): Promise<File | null> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  } catch (error) {
    console.error('이미지를 File로 변환 실패:', error)
    return null
  }
}

// 플랫폼별 공유 실행
export async function executePlatformShare(
  platformId: string, 
  review: any, 
  branch: any, 
  images?: string[]
): Promise<{ success: boolean; method: string; error?: string }> {
  try {
    const captions = generateCaptionTemplates(review, branch)
    const caption = captions[platformId as keyof typeof captions]
    
    if (!caption) {
      throw new Error('지원하지 않는 플랫폼입니다.')
    }

    switch (platformId) {
      case 'naver': {
        const deeplinks = generateDeeplinkUrls(branch)
        const naverConfig = deeplinks.naver
        
        // 먼저 캡션 복사
        await copyToClipboard(caption)
        
        // 딥링크 실행
        openDeeplink(naverConfig.deeplink, naverConfig.fallback)
        
        return { success: true, method: 'deeplink' }
      }
      
      case 'instagram':
      case 'xiaohongshu': {
        // Web Share API 사용
        const shareData: ShareData = {
          title: `${branch.name} 리뷰`,
          text: caption
        }
        
        // 이미지가 있으면 파일로 공유
        if (images && images.length > 0) {
          const file = await imageUrlToFile(images[0], 'review.jpg')
          if (file) {
            shareData.files = [file]
          }
        }
        
        const shared = await shareWithWebAPI(shareData)
        
        if (!shared) {
          // 폴백: 캡션만 복사
          await copyToClipboard(caption)
          return { success: true, method: 'copy-fallback' }
        }
        
        return { success: true, method: 'web-share' }
      }
      
      case 'tiktok':
      case 'google': {
        // 캡션만 복사
        await copyToClipboard(caption)
        return { success: true, method: 'copy-only' }
      }
      
      default:
        throw new Error('지원하지 않는 플랫폼입니다.')
    }
  } catch (error) {
    console.error('플랫폼 공유 실행 실패:', error)
    return { 
      success: false, 
      method: 'error', 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }
  }
}

// 사용자 피드백 표시
export function showUserFeedback(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // 간단한 토스트 메시지 구현
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500'
  }`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    document.body.removeChild(toast)
  }, 3000)
}
