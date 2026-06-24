import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'GoMate',
  description: 'Entregas en tiempo real',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GoMate',
  },
}

export const viewport: Viewport = {
  themeColor: '#3730C8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0D0D0D' }}>
        {children}
      </body>
    </html>
  )
}