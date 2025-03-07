import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'BLOCK - Özel Mesajlaşma Uygulaması',
  description: 'BLOCK gerçek zamanlı mesajlaşma uygulaması',
  generator: 'BLOCK',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
