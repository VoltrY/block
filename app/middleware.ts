import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Korumalı rotalar
const protectedRoutes = ['/']
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // Kullanıcı giriş yapmamışsa ve korumalı bir sayfaya erişmeye çalışıyorsa
  if (!currentUser && protectedRoutes.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Kullanıcı giriş yapmışsa ve auth sayfalarına erişmeye çalışıyorsa (login gibi)
  if (currentUser && authRoutes.includes(path)) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// Hangi yolların bu middleware'i tetikleyeceğini belirtiyoruz
export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar hariç tüm yolları eşleştir:
     * - API rotaları (/api/*)
     * - Statik dosyalar (/_next/static/*)
     * - Favicon, robots.txt gibi dosyalar (/*.{ico,json})
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 