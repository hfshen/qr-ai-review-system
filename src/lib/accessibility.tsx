'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AccessibilityContextType {
  fontSize: 'small' | 'medium' | 'large'
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void
  reducedMotion: boolean
  setReducedMotion: (enabled: boolean) => void
  screenReader: boolean
  setScreenReader: (enabled: boolean) => void
}

interface VoiceInputContextType {
  isSupported: boolean
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  clearTranscript: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)
const VoiceInputContext = createContext<VoiceInputContextType | undefined>(undefined)

// 접근성 프로바이더
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [screenReader, setScreenReader] = useState(false)

  useEffect(() => {
    // 로컬 스토리지에서 접근성 설정 불러오기
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null
    const savedHighContrast = localStorage.getItem('highContrast') === 'true'
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true'
    const savedScreenReader = localStorage.getItem('screenReader') === 'true'

    if (savedFontSize) setFontSize(savedFontSize)
    if (savedHighContrast) setHighContrast(savedHighContrast)
    if (savedReducedMotion) setReducedMotion(savedReducedMotion)
    if (savedScreenReader) setScreenReader(savedScreenReader)

    // 시스템 설정 감지
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setReducedMotion(true)
    }
  }, [])

  useEffect(() => {
    // 폰트 크기 적용
    const root = document.documentElement
    root.style.setProperty('--font-size-multiplier', 
      fontSize === 'small' ? '0.875' : fontSize === 'large' ? '1.125' : '1'
    )

    // 고대비 모드 적용
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // 애니메이션 감소 모드 적용
    if (reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // 스크린 리더 모드 적용
    if (screenReader) {
      root.classList.add('screen-reader-mode')
    } else {
      root.classList.remove('screen-reader-mode')
    }
  }, [fontSize, highContrast, reducedMotion, screenReader])

  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size)
    localStorage.setItem('fontSize', size)
  }

  const handleSetHighContrast = (enabled: boolean) => {
    setHighContrast(enabled)
    localStorage.setItem('highContrast', enabled.toString())
  }

  const handleSetReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled)
    localStorage.setItem('reducedMotion', enabled.toString())
  }

  const handleSetScreenReader = (enabled: boolean) => {
    setScreenReader(enabled)
    localStorage.setItem('screenReader', enabled.toString())
  }

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      setFontSize: handleSetFontSize,
      highContrast,
      setHighContrast: handleSetHighContrast,
      reducedMotion,
      setReducedMotion: handleSetReducedMotion,
      screenReader,
      setScreenReader: handleSetScreenReader
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// 음성 입력 프로바이더
export function VoiceInputProvider({ children }: { children: ReactNode }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Web Speech API 지원 확인
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'ko-KR'

        recognitionInstance.onstart = () => {
          setIsListening(true)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(prev => prev + finalTranscript + interimTranscript)
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript('')
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
  }

  return (
    <VoiceInputContext.Provider value={{
      isSupported,
      isListening,
      transcript,
      startListening,
      stopListening,
      clearTranscript
    }}>
      {children}
    </VoiceInputContext.Provider>
  )
}

// 훅들
export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export function useVoiceInput() {
  const context = useContext(VoiceInputContext)
  if (context === undefined) {
    throw new Error('useVoiceInput must be used within a VoiceInputProvider')
  }
  return context
}

// 키보드 네비게이션 훅
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 키로 모달 닫기
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]')
        const lastModal = modals[modals.length - 1] as HTMLElement
        if (lastModal) {
          const closeButton = lastModal.querySelector('[data-close-modal]') as HTMLElement
          if (closeButton) {
            closeButton.click()
          }
        }
      }

      // Tab 키로 포커스 관리
      if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}

// 포커스 관리 훅
export function useFocusManagement() {
  const focusElement = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return { focusElement, announceToScreenReader }
}

// 색상 대비 검사 함수
export function checkColorContrast(foreground: string, background: string): number {
  // 간단한 대비 비율 계산 (실제로는 더 정확한 알고리즘 사용)
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g)
    if (!rgb) return 0
    
    const [r, g, b] = rgb.map(Number)
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

// 접근성 검사 함수
export function checkAccessibility(element: HTMLElement): string[] {
  const issues: string[] = []

  // 이미지 alt 텍스트 확인
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push('이미지에 alt 텍스트가 없습니다.')
    }
  })

  // 링크 텍스트 확인
  const links = element.querySelectorAll('a')
  links.forEach(link => {
    if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
      issues.push('링크에 텍스트가 없습니다.')
    }
  })

  // 폼 라벨 확인
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const label = element.querySelector(`label[for="${id}"]`)
    const ariaLabel = input.getAttribute('aria-label')
    
    if (!label && !ariaLabel) {
      issues.push('폼 요소에 라벨이 없습니다.')
    }
  })

  // 색상 대비 확인
  const textElements = element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const contrast = checkColorContrast(color, backgroundColor)
      if (contrast < 4.5) {
        issues.push('텍스트와 배경의 색상 대비가 부족합니다.')
      }
    }
  })

  return issues
}
