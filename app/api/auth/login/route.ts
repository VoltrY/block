import { NextResponse } from 'next/server'

// Mock kullanıcı veritabanı
// Gerçek uygulamada bu MongoDB veritabanından gelecek
const mockUsers = [
  {
    id: '1',
    username: 'enes',
    email: 'enes@blurmsg.com',
    password: 'enesdemirezen', // Gerçek uygulamada hashlenmiş olmalı
    displayName: 'Enes Demirezen',
    avatar: '/placeholder.svg?height=40&width=40&text=E',
  }
]

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Kullanıcı adı veya e-posta ile giriş yapabilme
    const user = mockUsers.find(
      (u) => (u.username === username || u.email === username) && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      )
    }

    // Kullanıcı bilgilerini döndürürken şifreyi çıkaralım
    const { password: _, ...userWithoutPassword } = user

    // JWT token oluşturma işlemi gerçek uygulamada burada yapılacak
    // Şimdilik basit bir başarılı yanıt döndürelim
    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      user: userWithoutPassword,
      // JWT token burada eklenecek
      token: 'mock-jwt-token',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
} 