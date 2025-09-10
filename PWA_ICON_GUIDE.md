# PWA 아이콘 생성 가이드

## 현재 상황
- PWA 매니페스트에서 참조하는 아이콘 파일들이 없어서 404 오류 발생
- Service Worker 파일이 없어서 404 오류 발생

## 해결 방법

### 1. 아이콘 파일 생성
다음 크기의 아이콘 파일들을 생성해야 합니다:
- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 2. 아이콘 디자인 요구사항
- **주제**: AI 리뷰 플랫폼
- **색상**: 파란색 계열 (#3b82f6)
- **아이콘**: 🤖 로봇 이모지 또는 QR 코드 관련 아이콘
- **형식**: PNG, 투명 배경 가능

### 3. 임시 해결책
아이콘 파일이 없을 때는 매니페스트에서 아이콘 섹션을 주석 처리하거나 제거할 수 있습니다.

### 4. 온라인 아이콘 생성 도구
- [Favicon Generator](https://www.favicon-generator.org/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Icon Generator](https://iconifier.net/)

## 현재 생성된 파일들
✅ sw.js - Service Worker 파일
✅ manifest.json - PWA 매니페스트 파일
⏳ icons/ - 아이콘 파일들 (생성 필요)
