"use client"

import { useState, useRef } from "react"
import { Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usersApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface UploadAvatarProps {
  currentAvatar: string
  displayName: string
  userId: string
  onAvatarUpdate: (newAvatarUrl: string) => void
}

export function UploadAvatar({ currentAvatar, displayName, userId, onAvatarUpdate }: UploadAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir resim dosyası seçin"
      })
      return
    }

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır"
      })
      return
    }

    try {
      setIsUploading(true)

      // Dosyayı FormData olarak hazırla
      const formData = new FormData()
      formData.append('avatar', file)

      // API'ye gönder
      const response = await usersApi.updateAvatar(userId, formData)

      if (response.success) {
        onAvatarUpdate(response.user.avatar)
        toast({
          title: "Başarılı",
          description: "Profil fotoğrafı güncellendi"
        })
      }
    } catch (error) {
      console.error('Avatar yükleme hatası:', error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Profil fotoğrafı güncellenirken bir hata oluştu"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      <Avatar className="h-20 w-20">
        <AvatarImage src={currentAvatar} />
        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-6 w-6 text-white" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
} 