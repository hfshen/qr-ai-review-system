'use client'

import { useEffect } from 'react'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW 등록 성공:', registration.scope)
          })
          .catch((registrationError) => {
            console.log('SW 등록 실패:', registrationError)
          })
      })
    }

    // PWA 설치 프롬프트 처리
    let deferredPrompt: any = null

    window.addEventListener('beforeinstallprompt', (e) => {
      // 기본 설치 프롬프트 방지
      e.preventDefault()
      // 이벤트 저장
      deferredPrompt = e
      
      // 설치 버튼 표시 (선택사항)
      showInstallButton()
    })

    // 앱 설치 완료 이벤트
    window.addEventListener('appinstalled', () => {
      console.log('PWA가 설치되었습니다')
      deferredPrompt = null
    })

    function showInstallButton() {
      // 설치 버튼을 표시하는 로직
      // 예: 헤더에 설치 버튼 추가
      const installButton = document.createElement('button')
      installButton.textContent = '앱 설치'
      installButton.className = 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
      installButton.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log(`사용자 선택: ${outcome}`)
          deferredPrompt = null
        }
      }
      
      // 헤더에 설치 버튼 추가 (실제 구현에서는 더 정교하게 처리)
      const header = document.querySelector('nav')
      if (header && !document.querySelector('.install-button')) {
        installButton.classList.add('install-button')
        header.appendChild(installButton)
      }
    }
  }, [])

  return <>{children}</>
}
