import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '아트앤브릿지',
  description: '갤러리 전시회 정보를 손쉽게 찾아보세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

