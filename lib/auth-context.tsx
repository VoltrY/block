"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

// Kullanıcı tipi tanımı
type User = {
  id: string
  username: string
  email: string
  displayName: string
  avatar: string
  status: string
}

// Auth context için tip tanımı
type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider bileşeni
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

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
        try {
          const response = await authApi.getCurrentUser()
          if (response.success) {
            setUser(response.user)
          }
        } catch (error) {
          console.error("Auth check error:", error)
          // Token geçersizse temizle
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
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
      const response = await authApi.login(username, password)
      
      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      
      setUser(response.user)
      router.push("/")
      return response
    } catch (error: any) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout fonksiyonu
  const logout = async () => {
    try {
      // Backend'e logout isteği gönder
      if (user) {
        await authApi.logout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Local storage'dan kullanıcı bilgilerini temizle
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
      router.push("/login")
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    setUser,
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