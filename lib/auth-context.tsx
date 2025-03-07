"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Kullanıcı tipi tanımı
type User = {
  id: string
  username: string
  email: string
  displayName: string
  avatar: string
}

// Auth context için tip tanımı
type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider bileşeni
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Sayfa yüklendiğinde oturum durumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Local storage'dan token kontrolü
        const token = localStorage.getItem("token")
        
        if (!token) {
          setLoading(false)
          return
        }

        // Token varsa kullanıcı bilgilerini al
        // Gerçek uygulamada burada token doğrulaması yapılacak
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login fonksiyonu
  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Giriş yapılamadı")
      }

      const data = await response.json()
      
      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      setUser(data.user)
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout fonksiyonu
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 