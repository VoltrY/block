"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { authApi } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Eğer zaten giriş yapmışsa ana sayfaya yönlendir
  if (isAuthenticated) {
    router.push("/")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.email || !formData.password || !formData.displayName) {
      setError("Lütfen tüm alanları doldurun")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Kayıt işlemi
      const response = await authApi.register(
        formData.username, 
        formData.email, 
        formData.password, 
        formData.displayName
      )
      
      // Başarılı kayıt sonrası otomatik giriş
      await login(formData.username, formData.password)
      
      toast({
        title: "Başarılı",
        description: "Kayıt işlemi başarıyla tamamlandı",
      })
    } catch (err: any) {
      setError(err.message || "Kayıt sırasında bir hata oluştu")
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message || "Kayıt sırasında bir hata oluştu",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-blue-600">BLOCK</CardTitle>
          <CardDescription className="text-muted-foreground">
            Yeni bir hesap oluşturun
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  placeholder="Kullanıcı adı"
                  className="pl-10"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="E-posta adresi"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Görünen ad"
                  className="pl-10"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kayıt Ol"}
            </Button>
            <div className="text-center text-sm">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Giriş Yap
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 