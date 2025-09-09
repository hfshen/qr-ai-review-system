import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * QR 코드를 데이터 URL로 생성
 */
export async function generateQRCodeDataURL(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    return await QRCode.toDataURL(text, defaultOptions)
  } catch (error) {
    console.error('QR 코드 생성 오류:', error)
    throw new Error('QR 코드 생성에 실패했습니다.')
  }
}

/**
 * QR 코드를 SVG 문자열로 생성
 */
export async function generateQRCodeSVG(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    return await QRCode.toString(text, { 
      type: 'svg',
      ...defaultOptions
    })
  } catch (error) {
    console.error('QR 코드 SVG 생성 오류:', error)
    throw new Error('QR 코드 SVG 생성에 실패했습니다.')
  }
}

/**
 * QR 코드를 Canvas 요소로 생성
 */
export async function generateQRCodeCanvas(
  canvas: HTMLCanvasElement,
  text: string, 
  options: QRCodeOptions = {}
): Promise<void> {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    await QRCode.toCanvas(canvas, text, defaultOptions)
  } catch (error) {
    console.error('QR 코드 Canvas 생성 오류:', error)
    throw new Error('QR 코드 Canvas 생성에 실패했습니다.')
  }
}

/**
 * 리뷰 페이지 URL 생성
 */
export function generateReviewURL(branchId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  return `${base}/qr/${branchId}`
}

/**
 * QR 코드 다운로드
 */
export function downloadQRCode(dataURL: string, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * QR 코드를 새 창에서 열기
 */
export function openQRCodeInNewWindow(dataURL: string): void {
  const newWindow = window.open()
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>QR 코드</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background-color: #f5f5f5;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" alt="QR Code" />
        </body>
      </html>
    `)
  }
}
