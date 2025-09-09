'use client'

import { useState } from 'react'
import { useTheme, useAccessibility, useVoiceInput, useFocusManagement } from '@/lib/accessibility'

interface AccessibilitySettingsProps {
  className?: string
}

export default function AccessibilitySettings({ className = '' }: AccessibilitySettingsProps) {
  const { theme, setTheme, actualTheme } = useTheme()
  const { 
    fontSize, 
    setFontSize, 
    highContrast, 
    setHighContrast, 
    reducedMotion, 
    setReducedMotion,
    screenReader,
    setScreenReader
  } = useAccessibility()
  const { isSupported, isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput()
  const { focusElement, announceToScreenReader } = useFocusManagement()
  
  const [activeTab, setActiveTab] = useState('theme')
  const [showVoiceInput, setShowVoiceInput] = useState(false)

  const tabs = [
    { id: 'theme', name: '테마', icon: '🌙' },
    { id: 'accessibility', name: '접근성', icon: '♿' },
    { id: 'voice', name: '음성 입력', icon: '🎤' },
    { id: 'keyboard', name: '키보드', icon: '⌨️' }
  ]

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    announceToScreenReader(`테마가 ${newTheme === 'light' ? '라이트' : newTheme === 'dark' ? '다크' : '시스템'} 모드로 변경되었습니다.`)
  }

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size)
    announceToScreenReader(`폰트 크기가 ${size === 'small' ? '작게' : size === 'large' ? '크게' : '보통'}로 변경되었습니다.`)
  }

  const handleHighContrastToggle = () => {
    setHighContrast(!highContrast)
    announceToScreenReader(`고대비 모드가 ${!highContrast ? '활성화' : '비활성화'}되었습니다.`)
  }

  const handleReducedMotionToggle = () => {
    setReducedMotion(!reducedMotion)
    announceToScreenReader(`애니메이션 감소 모드가 ${!reducedMotion ? '활성화' : '비활성화'}되었습니다.`)
  }

  const handleScreenReaderToggle = () => {
    setScreenReader(!screenReader)
    announceToScreenReader(`스크린 리더 모드가 ${!screenReader ? '활성화' : '비활성화'}되었습니다.`)
  }

  const handleVoiceInputToggle = () => {
    if (isListening) {
      stopListening()
      setShowVoiceInput(false)
    } else {
      startListening()
      setShowVoiceInput(true)
    }
  }

  const handleSkipToContent = () => {
    focusElement('main-content')
    announceToScreenReader('메인 콘텐츠로 이동했습니다.')
  }

  const handleSkipToNavigation = () => {
    focusElement('main-navigation')
    announceToScreenReader('네비게이션으로 이동했습니다.')
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">접근성 설정</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkipToContent}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              콘텐츠로 이동
            </button>
            <button
              onClick={handleSkipToNavigation}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              네비게이션으로 이동
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="mr-2" aria-hidden="true">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-6">
        {activeTab === 'theme' && (
          <div className="space-y-6" role="tabpanel" id="theme-panel" aria-labelledby="theme-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">테마 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    테마 선택
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        theme === 'light' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-white border border-gray-300 rounded"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">라이트</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        theme === 'dark' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-800 border border-gray-600 rounded"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">다크</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`p-4 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        theme === 'system' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">시스템</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    현재 테마: <span className="font-medium">{actualTheme === 'light' ? '라이트' : '다크'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-6" role="tabpanel" id="accessibility-panel" aria-labelledby="accessibility-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">접근성 설정</h3>
              <div className="space-y-6">
                {/* 폰트 크기 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    폰트 크기
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleFontSizeChange(size)}
                        className={`p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          fontSize === size 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`mx-auto mb-1 ${
                            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                          }`}>
                            Aa
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {size === 'small' ? '작게' : size === 'large' ? '크게' : '보통'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 접근성 옵션들 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        고대비 모드
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        텍스트와 배경의 대비를 높입니다
                      </p>
                    </div>
                    <button
                      onClick={handleHighContrastToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        highContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={highContrast}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        애니메이션 감소
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        움직임에 민감한 사용자를 위해 애니메이션을 줄입니다
                      </p>
                    </div>
                    <button
                      onClick={handleReducedMotionToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        reducedMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={reducedMotion}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          reducedMotion ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        스크린 리더 모드
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        스크린 리더 사용자를 위한 추가 정보를 제공합니다
                      </p>
                    </div>
                    <button
                      onClick={handleScreenReaderToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        screenReader ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={screenReader}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          screenReader ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-6" role="tabpanel" id="voice-panel" aria-labelledby="voice-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">음성 입력</h3>
              
              {!isSupported ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    음성 입력이 지원되지 않는 브라우저입니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <button
                      onClick={handleVoiceInputToggle}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isListening
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          음성 입력 중지
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                          음성 입력 시작
                        </>
                      )}
                    </button>
                  </div>

                  {showVoiceInput && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">음성 입력 결과</h4>
                        <button
                          onClick={clearTranscript}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          지우기
                        </button>
                      </div>
                      <div className="min-h-[100px] p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        {transcript || (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {isListening ? '음성을 인식하고 있습니다...' : '음성 입력을 시작하세요.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">사용 방법</h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• "음성 입력 시작" 버튼을 클릭하세요</li>
                      <li>• 마이크 권한을 허용하세요</li>
                      <li>• 명확하게 말씀하세요</li>
                      <li>• 완료되면 "음성 입력 중지" 버튼을 클릭하세요</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'keyboard' && (
          <div className="space-y-6" role="tabpanel" id="keyboard-panel" aria-labelledby="keyboard-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">키보드 단축키</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">기본 단축키</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Tab</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">다음 요소로 이동</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Shift + Tab</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">이전 요소로 이동</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Enter</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">선택/확인</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Escape</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">취소/닫기</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Space</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">활성화/토글</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Arrow Keys</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">방향 이동</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Home</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">처음으로 이동</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">End</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">끝으로 이동</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">접근성 팁</h4>
                  <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                    <li>• 모든 기능은 키보드만으로 사용할 수 있습니다</li>
                    <li>• 포커스가 있는 요소는 시각적으로 표시됩니다</li>
                    <li>• 스크린 리더 사용자는 ARIA 라벨을 통해 정보를 얻을 수 있습니다</li>
                    <li>• 고대비 모드를 사용하면 더 명확하게 볼 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
