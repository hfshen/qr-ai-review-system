'use client'

import { useState } from 'react'
import { useAccessibility, useVoiceInput, useFocusManagement } from '@/lib/accessibility'

interface AccessibilitySettingsProps {
  className?: string
}

export default function AccessibilitySettings({ className = '' }: AccessibilitySettingsProps) {
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
  
  const [activeTab, setActiveTab] = useState('accessibility')
  const [showVoiceInput, setShowVoiceInput] = useState(false)

  const tabs = [
    { id: 'accessibility', name: '접근성', icon: '♿' },
    { id: 'voice', name: '음성 입력', icon: '🎤' },
    { id: 'keyboard', name: '키보드', icon: '⌨️' }
  ]

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

  const handleSkipToContent = () => {
    focusElement('main-content')
    announceToScreenReader('메인 콘텐츠로 이동했습니다.')
  }

  const handleSkipToNavigation = () => {
    focusElement('main-navigation')
    announceToScreenReader('네비게이션으로 이동했습니다.')
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">접근성 설정</h2>
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
      <div className="border-b border-gray-200">
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {activeTab === 'accessibility' && (
          <div className="space-y-6" role="tabpanel" id="accessibility-panel" aria-labelledby="accessibility-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">접근성 설정</h3>
              <div className="space-y-6">
                {/* 폰트 크기 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    폰트 크기
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleFontSizeChange(size)}
                        className={`p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          fontSize === size 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`mx-auto mb-1 ${
                            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                          }`}>
                            Aa
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {size === 'small' ? '작게' : size === 'large' ? '크게' : '보통'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 고대비 모드 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      고대비 모드
                    </label>
                    <p className="text-xs text-gray-500">
                      텍스트와 배경의 대비를 높여 가독성을 향상시킵니다
                    </p>
                  </div>
                  <button
                    onClick={handleHighContrastToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      highContrast ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 애니메이션 감소 모드 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      애니메이션 감소 모드
                    </label>
                    <p className="text-xs text-gray-500">
                      움직임에 민감한 사용자를 위해 애니메이션을 줄입니다
                    </p>
                  </div>
                  <button
                    onClick={handleReducedMotionToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 스크린 리더 모드 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      스크린 리더 모드
                    </label>
                    <p className="text-xs text-gray-500">
                      스크린 리더 사용자를 위한 추가 정보를 제공합니다
                    </p>
                  </div>
                  <button
                    onClick={handleScreenReaderToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      screenReader ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
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
        )}

        {activeTab === 'voice' && (
          <div className="space-y-6" role="tabpanel" id="voice-panel" aria-labelledby="voice-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">음성 입력</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">
                      음성으로 텍스트를 입력할 수 있습니다
                    </p>
                    {!isSupported && (
                      <p className="text-red-500 text-sm mt-1">
                        이 브라우저는 음성 인식을 지원하지 않습니다
                      </p>
                    )}
                  </div>
                  <button
                    onClick={showVoiceInput ? stopListening : startListening}
                    disabled={!isSupported}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isListening
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
                    }`}
                  >
                    {isListening ? '🎤 중지' : '🎤 시작'}
                  </button>
                </div>

                {isListening && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">음성 입력 결과</h4>
                      <button
                        onClick={clearTranscript}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        지우기
                      </button>
                    </div>
                    <div className="min-h-[100px] p-3 bg-white rounded border border-gray-200">
                      {transcript ? (
                        <p className="text-gray-900">{transcript}</p>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          음성을 인식하는 중입니다...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">사용 방법</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 마이크 권한을 허용해주세요</li>
                    <li>• 명확하고 천천히 말씀해주세요</li>
                    <li>• 조용한 환경에서 사용하세요</li>
                    <li>• 한국어로 말씀해주세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keyboard' && (
          <div className="space-y-6" role="tabpanel" id="keyboard-panel" aria-labelledby="keyboard-tab">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">키보드 단축키</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">기본 단축키</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Tab</span>
                      <span className="text-xs text-gray-500">다음 요소로 이동</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Shift + Tab</span>
                      <span className="text-xs text-gray-500">이전 요소로 이동</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Enter</span>
                      <span className="text-xs text-gray-500">선택/확인</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Escape</span>
                      <span className="text-xs text-gray-500">취소/닫기</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Space</span>
                      <span className="text-xs text-gray-500">활성화/토글</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Arrow Keys</span>
                      <span className="text-xs text-gray-500">방향 이동</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Home</span>
                      <span className="text-xs text-gray-500">처음으로 이동</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">End</span>
                      <span className="text-xs text-gray-500">끝으로 이동</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">접근성 팁</h4>
                  <ul className="text-xs text-green-800 space-y-1">
                    <li>• 키보드만으로 모든 기능을 사용할 수 있습니다</li>
                    <li>• 고대비 모드를 사용하면 더 명확하게 볼 수 있습니다</li>
                    <li>• 스크린 리더와 함께 사용할 수 있습니다</li>
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