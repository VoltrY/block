"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Menu, MessageSquare, Settings, Users, LogOut, Plus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"

export default function Home() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentChat, setCurrentChat] = useState("Genel Sohbet")
  const [message, setMessage] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [newChannelName, setNewChannelName] = useState("")
  const newChannelInputRef = useRef<HTMLInputElement>(null)

  // State for unread messages
  const [unreadCounts, setUnreadCounts] = useState({
    "Genel Sohbet": 0,
    Yardım: 2,
    Ali: 0,
    Ayşe: 3,
    Mehmet: 0,
  })

  const [conversations, setConversations] = useState<{
    [key: string]: { sender: string; text: string; time: string }[]
  }>({
    "Genel Sohbet": [
      { sender: "Ali", text: "Merhaba herkese!", time: "14:30" },
      { sender: "Ayşe", text: "Herkese selam!", time: "14:32" },
      { sender: "Mehmet", text: "Nasılsınız arkadaşlar?", time: "14:33" },
    ],
    Yardım: [
      { sender: "Sistem", text: "Yardım kanalına hoş geldiniz. Sorunuzu yazabilirsiniz.", time: "10:00" },
      { sender: "Ben", text: "Mesaj gönderme konusunda sorun yaşıyorum.", time: "10:15" },
      { sender: "Destek", text: "Size nasıl yardımcı olabiliriz?", time: "10:16" },
    ],
    Ali: [
      { sender: "Ali", text: "Merhaba, nasılsın?", time: "14:30" },
      { sender: "Ben", text: "İyiyim, teşekkürler! Sen nasılsın?", time: "14:32" },
      { sender: "Ali", text: "Ben de iyiyim, teşekkür ederim.", time: "14:33" },
    ],
    Ayşe: [
      { sender: "Ayşe", text: "Toplantı saat kaçta?", time: "09:30" },
      { sender: "Ben", text: "Saat 15:00'da", time: "09:31" },
      { sender: "Ayşe", text: "Teşekkürler, orada olacağım.", time: "09:32" },
    ],
    Mehmet: [
      { sender: "Mehmet", text: "Proje dosyalarını gönderebilir misin?", time: "11:20" },
      { sender: "Ben", text: "Tabii, hemen gönderiyorum.", time: "11:22" },
      { sender: "Mehmet", text: "Teşekkür ederim.", time: "11:25" },
    ],
  })

  const [userAvatars, setUserAvatars] = useState({
    Ali: "/placeholder.svg?height=40&width=40&text=A",
    Ayşe: "/placeholder.svg?height=40&width=40&text=AY",
    Mehmet: "/placeholder.svg?height=40&width=40&text=M",
    Sistem: "/placeholder.svg?height=40&width=40&text=S",
    Destek: "/placeholder.svg?height=40&width=40&text=D",
    Ben: user?.avatar || "/placeholder.svg?height=40&width=40&text=B",
  })

  // Kullanıcı girişinde avatar'ı güncelle
  useEffect(() => {
    if (user) {
      setUserAvatars(prev => ({
        ...prev,
        Ben: user.avatar || `/placeholder.svg?height=40&width=40&text=${user.displayName.charAt(0)}`
      }))
    }
  }, [user])

  const [channels, setChannels] = useState([
    { id: "general", name: "Genel Sohbet" },
    { id: "help", name: "Yardım" },
  ])

  const directMessages = [
    { id: "user1", name: "Ali", avatar: "/placeholder.svg?height=40&width=40&text=A", online: true },
    { id: "user2", name: "Ayşe", avatar: "/placeholder.svg?height=40&width=40&text=AY", online: false },
    { id: "user3", name: "Mehmet", avatar: "/placeholder.svg?height=40&width=40&text=M", online: true },
  ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setConversations({
        ...conversations,
        [currentChat]: [
          ...conversations[currentChat],
          {
            sender: "Ben",
            text: message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      })
      setMessage("")
    }
  }

  // Function to handle chat selection and clear unread count
  const handleChatSelect = (chatName: string) => {
    setCurrentChat(chatName)

    // Clear unread count for the selected chat
    if (unreadCounts[chatName] > 0) {
      setUnreadCounts({
        ...unreadCounts,
        [chatName]: 0,
      })
    }
  }

  const handleLogout = () => {
    logout();
    toast({
      title: "Çıkış yapıldı",
      description: "Başarıyla çıkış yaptınız."
    });
  }

  // Yeni kanal oluşturma fonksiyonu
  const handleCreateChannel = () => {
    if (!newChannelName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kanal adı boş olamaz."
      });
      return;
    }

    // Kanal adının benzersiz olup olmadığını kontrol et
    if (channels.some(channel => channel.name === newChannelName)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bu isimde bir kanal zaten var."
      });
      return;
    }

    // Yeni kanal oluştur
    const newChannelId = `channel-${Date.now()}`;
    const newChannel = { id: newChannelId, name: newChannelName };
    
    setChannels([...channels, newChannel]);
    
    // Yeni kanal için boş bir sohbet oluştur
    setConversations({
      ...conversations,
      [newChannelName]: [
        { 
          sender: "Sistem", 
          text: `"${newChannelName}" kanalına hoş geldiniz! Bu kanal yeni oluşturuldu.`, 
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
        }
      ]
    });

    // Yeni oluşturulan kanala geçiş yap
    setCurrentChat(newChannelName);
    
    // Formu sıfırla
    setNewChannelName("");
    
    toast({
      title: "Başarılı",
      description: `"${newChannelName}" kanalı oluşturuldu.`
    });
  }

  // Çevrimiçi/çevrimdışı durumunu değiştir
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "Çevrimdışı durumuna geçildi" : "Çevrimiçi durumuna geçildi",
      description: isOnline ? "Artık çevrimdışı görünüyorsunuz." : "Artık çevrimiçi görünüyorsunuz."
    });
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 md:hidden z-10"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 border-r bg-gradient-to-b from-blue-500/5 to-blue-500/10">
        <SidebarContent
          channels={channels}
          directMessages={directMessages}
          currentChat={currentChat}
          unreadCounts={unreadCounts}
          setCurrentChat={handleChatSelect}
          setProfileOpen={setProfileOpen}
          user={user}
          onLogout={handleLogout}
          onlineStatus={isOnline}
          onToggleOnlineStatus={toggleOnlineStatus}
          onCreateChannel={handleCreateChannel}
          newChannelName={newChannelName}
          setNewChannelName={setNewChannelName}
          newChannelInputRef={newChannelInputRef}
        />
      </div>

      {/* Sidebar - Mobile */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-blue-500/5 to-blue-500/10">
          <SidebarContent
            channels={channels}
            directMessages={directMessages}
            currentChat={currentChat}
            unreadCounts={unreadCounts}
            setCurrentChat={(chat) => {
              handleChatSelect(chat)
              setMobileMenuOpen(false)
            }}
            setProfileOpen={setProfileOpen}
            user={user}
            onLogout={handleLogout}
            onlineStatus={isOnline}
            onToggleOnlineStatus={toggleOnlineStatus}
            onCreateChannel={handleCreateChannel}
            newChannelName={newChannelName}
            setNewChannelName={setNewChannelName}
            newChannelInputRef={newChannelInputRef}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10">
          <div className="flex items-center">
            <h2 className="font-semibold text-blue-600">{currentChat}</h2>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {conversations[currentChat]?.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "Ben" ? "justify-end" : "justify-start"} mb-4`}>
                {msg.sender !== "Ben" && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={userAvatars[msg.sender] || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.sender === "Ben" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.sender !== "Ben" && <div className="font-semibold text-sm">{msg.sender}</div>}
                  <div>{msg.text}</div>
                  <div className="text-xs opacity-70 text-right mt-1">{msg.time}</div>
                </div>
                {msg.sender === "Ben" && (
                  <Avatar className="h-8 w-8 ml-2 mt-1">
                    <AvatarImage src={userAvatars["Ben"]} />
                    <AvatarFallback>{user?.displayName.charAt(0) || "B"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <footer className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Mesajınızı yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Gönder</Button>
          </form>
        </footer>
      </div>

      {/* Profile Panel */}
      {profileOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-blue-600">Profil</h2>
              <Button variant="ghost" size="icon" onClick={() => setProfileOpen(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.avatar || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback>{user?.displayName.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-1 right-1 flex h-4 w-4 rounded-full ring-2 ring-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <Button variant="outline" size="sm">
                Fotoğrafı Değiştir
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">İsim</label>
                <Input defaultValue={user?.displayName || "Kullanıcı"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <Tabs defaultValue={isOnline ? "online" : "offline"} onValueChange={(value) => setIsOnline(value === "online")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="online">Çevrimiçi</TabsTrigger>
                    <TabsTrigger value="offline">Çevrimdışı</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="mt-6">
                <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// SidebarContent bileşeni
interface SidebarContentProps {
  channels: { id: string; name: string }[]
  directMessages: { id: string; name: string; avatar: string; online: boolean }[]
  currentChat: string
  unreadCounts: Record<string, number>
  setCurrentChat: (chat: string) => void
  setProfileOpen: (open: boolean) => void
  user: any
  onLogout: () => void
  onlineStatus: boolean
  onToggleOnlineStatus: () => void
  onCreateChannel: () => void
  newChannelName: string
  setNewChannelName: (name: string) => void
  newChannelInputRef: React.RefObject<HTMLInputElement>
}

function SidebarContent({
  channels,
  directMessages,
  currentChat,
  unreadCounts,
  setCurrentChat,
  setProfileOpen,
  user,
  onLogout,
  onlineStatus,
  onToggleOnlineStatus,
  onCreateChannel,
  newChannelName,
  setNewChannelName,
  newChannelInputRef
}: SidebarContentProps) {
  return (
    <>
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" className="px-0" onClick={() => setProfileOpen(true)}>
          <div className="flex items-center">
            <div className="relative">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user?.avatar || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{user?.displayName.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 flex h-2 w-2 rounded-full ring-1 ring-background ${onlineStatus ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
            <div className="text-sm font-medium">{user?.displayName || "Kullanıcı"}</div>
          </div>
        </Button>
        <div className="flex">
          <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 overflow-auto p-3">
        <div>
          <div className="flex items-center justify-between py-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Kanallar</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yeni Kanal Oluştur</DialogTitle>
                  <DialogDescription>
                    Yeni bir sohbet kanalı oluşturmak için kanal adını girin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Input
                      ref={newChannelInputRef}
                      placeholder="Kanal adı"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">İptal</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={onCreateChannel}>Oluştur</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={currentChat === channel.name ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentChat(channel.name)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{channel.name}</span>
                {unreadCounts[channel.name] > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCounts[channel.name]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between py-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Direkt Mesajlar</h2>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {directMessages.map((dm) => (
              <Button
                key={dm.id}
                variant={currentChat === dm.name ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentChat(dm.name)}
              >
                <div className="relative mr-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={dm.avatar} />
                    <AvatarFallback>{dm.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {dm.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-green-500 ring-1 ring-background"></span>
                  )}
                </div>
                <span className="flex-1 truncate">{dm.name}</span>
                {unreadCounts[dm.name] > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCounts[dm.name]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}

