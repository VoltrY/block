"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Menu, MessageSquare, Settings, Users, LogOut, Plus, Trash2, MoreVertical, Pencil } from "lucide-react"

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
import { channelsApi, messagesApi, usersApi } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import io from "socket.io-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { UploadAvatar } from "@/components/upload-avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Types
type Channel = {
  id: string
  name: string
  description: string
  type: "public" | "private"
  createdBy: {
    id: string
    username: string
    displayName: string
  }
  createdAt: string
}

type User = {
  id: string
  username: string
  displayName: string
  avatar: string
  status: "online" | "offline"
  lastSeen?: string
}

type Message = {
  id: string
  content: string
  sender: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
  channelId?: string
  receiver?: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
  readBy: string[]
  attachments: string[]
  createdAt: string
  isSystemMessage: boolean
  isDeleted: boolean
  isEdited: boolean
  originalContent: string
}

export default function Home() {
  const { user, logout, setUser } = useAuth()
  const { toast } = useToast()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [newChannelName, setNewChannelName] = useState("")
  const newChannelInputRef = useRef<HTMLInputElement | null>(null)
  const isMobile = useIsMobile()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State for data
  const [channels, setChannels] = useState<Channel[]>([])
  const [directUsers, setDirectUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Record<string, Message[]>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [socket, setSocket] = useState<any>(null)
  const [currentChatType, setCurrentChatType] = useState<'channel' | 'direct' | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChat, setCurrentChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState("")

  // Connect to socket
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token")
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        auth: { token }
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected")
      })

      socketInstance.on("connect_error", (error: Error) => {
        console.error("Socket connection error:", error)
      })

      // Handle new messages
      socketInstance.on("message:new", (data: Message) => {
        handleNewMessage(data)
      })

      // Handle message deletion
      socketInstance.on("message:delete", (data: { id: string, channelId?: string, receiverId?: string }) => {
        handleDeleteMessage(data)
      })

      // Handle user status updates
      socketInstance.on("status:update", (data: { userId: string, status: "online" | "offline", lastSeen: string }) => {
        handleStatusUpdate(data)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [user])

  // Load channels and users
  useEffect(() => {
    if (user) {
      loadChannels()
      loadUsers()
    }
  }, [user])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (currentChat && conversations[currentChat]) {
      scrollToBottom()
    }
  }, [currentChat, conversations])

  // Join channel room when current chat changes
  useEffect(() => {
    if (socket && currentChatType === 'channel' && currentChatId) {
      socket.emit('channel:join', currentChatId)
      
      // Mark messages as read
      markMessagesAsRead()
      
      return () => {
        socket.emit('channel:leave', currentChatId)
      }
    }
  }, [socket, currentChatType, currentChatId])

  // Format time helper
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load channels
  const loadChannels = async () => {
    try {
      setLoading(true)
      const response = await channelsApi.getChannels()
      if (response.success) {
        setChannels(response.channels)
        
        // Initialize unread counts for channels
        const counts = { ...unreadCounts }
        response.channels.forEach((channel: Channel) => {
          if (!counts[channel.name]) {
            counts[channel.name] = 0
          }
        })
        setUnreadCounts(counts)
      }
    } catch (error) {
      console.error("Error loading channels:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load channels"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAllUsers()
      if (response.success) {
        // Filter out current user
        const otherUsers = response.users.filter((u: User) => u.id !== user?.id)
        setDirectUsers(otherUsers)
        
        // Initialize unread counts for direct messages
        const counts = { ...unreadCounts }
        otherUsers.forEach((u: User) => {
          if (!counts[u.displayName]) {
            counts[u.displayName] = 0
          }
        })
        setUnreadCounts(counts)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load messages for a chat
  const loadMessages = async (chatId: string, chatType: 'channel' | 'direct') => {
    try {
      setLoading(true)
      let response
      
      if (chatType === 'channel') {
        response = await messagesApi.getMessages({ channelId: chatId })
      } else {
        response = await messagesApi.getMessages({ receiverId: chatId })
      }
      
      if (response.success) {
        // Find the chat name
        let chatName = ''
        if (chatType === 'channel') {
          const channel = channels.find(c => c.id === chatId)
          chatName = channel?.name || ''
        } else {
          const directUser = directUsers.find(u => u.id === chatId)
          chatName = directUser?.displayName || ''
        }
        
        // Update conversations with full message data including avatars
        setConversations(prev => ({
          ...prev,
          [chatName]: response.messages.map((msg: Message) => ({
            ...msg,
            sender: {
              ...msg.sender,
              avatar: msg.sender.avatar || `/placeholder.svg?height=40&width=40&text=${msg.sender.displayName.charAt(0)}`
            }
          }))
        }))
        
        // Clear unread count
        setUnreadCounts(prev => ({
          ...prev,
          [chatName]: 0
        }))
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle chat selection
  const handleChatSelect = (chatId: string, chatType: 'channel' | 'direct') => {
    setCurrentChatId(chatId)
    setCurrentChatType(chatType)
    
    // Find chat name
    let chatName = ''
    if (chatType === 'channel') {
      const channel = channels.find(c => c.id === chatId)
      chatName = channel?.name || ''
    } else {
      const directUser = directUsers.find(u => u.id === chatId)
      chatName = directUser?.displayName || ''
    }
    
    setCurrentChat(chatName)
    
    // Load messages
    loadMessages(chatId, chatType)
    
    // Close mobile menu if open
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !currentChatId || !currentChatType) return
    
    try {
      const messageData = {
        content: message,
        ...(currentChatType === 'channel' 
          ? { channelId: currentChatId } 
          : { receiverId: currentChatId })
      }
      
      // Önce mesajı UI'da göster (optimistic update)
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        sender: {
          id: user?.id || '',
          username: user?.username || '',
          displayName: user?.displayName || '',
          avatar: user?.avatar || `/placeholder.svg?height=40&width=40&text=${user?.displayName.charAt(0) || 'U'}`
        },
        ...(currentChatType === 'channel' ? { channelId: currentChatId } : {}),
        readBy: [user?.id || ''],
        attachments: [],
        createdAt: new Date().toISOString(),
        isSystemMessage: false,
        isDeleted: false,
        isEdited: false,
        originalContent: message
      }
      
      if (currentChat) {
        setConversations(prev => {
          const updatedConversations = { ...prev }
          if (!updatedConversations[currentChat]) {
            updatedConversations[currentChat] = []
          }
          updatedConversations[currentChat] = [...updatedConversations[currentChat], tempMessage]
          return updatedConversations
        })
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100)
      }
      
      // Clear message input
      setMessage("")
      
      // Send message to server
      await messagesApi.sendMessage(messageData)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      })
    }
  }

  // Handle new message from socket
  const handleNewMessage = (message: Message) => {
    // Find the chat this message belongs to
    let chatName = ''
    let chatId = ''
    
    if (message.channelId) {
      const channel = channels.find(c => c.id === message.channelId)
      if (channel) {
        chatName = channel.name
        chatId = channel.id
      }
    } else if (message.receiver) {
      // For direct messages, use the other person's name
      if (message.sender.id === user?.id) {
        chatName = message.receiver.displayName
        chatId = message.receiver.id
      } else {
        chatName = message.sender.displayName
        chatId = message.sender.id
      }
    }
    
    if (!chatName) return
    
    // Update conversations with the full message including sender's avatar
    setConversations(prev => {
      const updatedConversations = { ...prev }
      if (!updatedConversations[chatName]) {
        updatedConversations[chatName] = []
      }
      
      // Make sure we have the sender's avatar
      const fullMessage = {
        ...message,
        sender: {
          ...message.sender,
          avatar: message.sender.avatar || `/placeholder.svg?height=40&width=40&text=${message.sender.displayName.charAt(0)}`
        }
      }
      
      updatedConversations[chatName] = [...updatedConversations[chatName], fullMessage]
      return updatedConversations
    })
    
    // If this is the current chat, scroll to bottom
    if (currentChatId === chatId) {
      setTimeout(() => scrollToBottom(), 100)
    }
    
    // Update unread count if not the current chat
    if (chatId !== currentChatId && message.sender.id !== user?.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [chatName]: (prev[chatName] || 0) + 1
      }))
    }
  }

  // Handle user status update
  const handleStatusUpdate = (data: { userId: string, status: "online" | "offline", lastSeen: string }) => {
    // Update directUsers with new status
    setDirectUsers(prev => 
      prev.map(user => 
        user.id === data.userId 
          ? { ...user, status: data.status, lastSeen: data.lastSeen }
          : user
      )
    )
  }

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!currentChatId || !currentChatType) return
    
    try {
      if (currentChatType === 'channel') {
        await messagesApi.markAsRead({ channelId: currentChatId })
      } else {
        await messagesApi.markAsRead({ senderId: currentChatId })
      }
      
      // Update unread count
      if (currentChat) {
        setUnreadCounts(prev => ({
          ...prev,
          [currentChat]: 0
        }))
      }
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  // Create a new channel
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return
    
    try {
      const response = await channelsApi.createChannel({
        name: newChannelName,
        description: `${newChannelName} channel`
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Channel created successfully"
        })
        
        // Reload channels
        loadChannels()
        
        // Clear input
        setNewChannelName("")
      }
    } catch (error) {
      console.error("Error creating channel:", error)
    toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create channel"
      })
    }
  }

  // Toggle online status
  const handleToggleOnlineStatus = async () => {
    const newStatus = isOnline ? 'offline' : 'online'
    
    try {
      if (user) {
        await usersApi.updateUser(user.id, { status: newStatus })
        setIsOnline(!isOnline)
        
        // Emit status change to socket
        if (socket) {
          socket.emit('status:change', newStatus)
        }
      }
    } catch (error) {
      console.error("Error updating status:", error)
    toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status"
      })
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
  }

  // Handle channel deletion
  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    try {
      const response = await channelsApi.deleteChannel(channelId);
      
      if (response.success) {
        // Kanalı listeden kaldır
        setChannels(prev => prev.filter(c => c.id !== channelId));
        
        // Eğer silinmiş kanal açıksa ana sayfaya yönlendir
        if (currentChatId === channelId) {
          setCurrentChatId(null);
          setCurrentChatType(null);
          setCurrentChat(null);
        }
        
        // Konuşmaları ve okunmamış mesaj sayısını temizle
        setConversations(prev => {
          const updated = { ...prev };
          delete updated[channelName];
          return updated;
        });
        
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[channelName];
          return updated;
        });

    toast({
          title: "Başarılı",
          description: "Kanal başarıyla silindi"
        });
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kanal silinirken bir hata oluştu"
      });
    }
  };

  // Handle message edit
  const handleEditMessage = (message: Message) => {
    // Silinmiş, sistem mesajı veya geçici mesajları düzenlemeye izin verme
    if (message.isDeleted || message.isSystemMessage || message.id.startsWith('temp-')) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bu mesaj düzenlenemez"
      });
      return;
    }

    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleUpdateMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    // Geçici mesajları düzenlemeye çalışma
    if (editingMessage.id.startsWith('temp-')) {
      setEditingMessage(null);
      setEditContent('');
      return;
    }

    try {
      const response = await messagesApi.updateMessage(editingMessage.id, {
        content: editContent.trim()
      });

      if (response.success) {
        setConversations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(chatName => {
            updated[chatName] = updated[chatName].map(msg =>
              msg.id === editingMessage.id
                ? { ...msg, content: editContent.trim(), isEdited: true }
                : msg
            );
          });
          return updated;
        });

        setEditingMessage(null);
        setEditContent('');
    
    toast({
      title: "Başarılı",
          description: "Mesaj güncellendi"
        });
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj güncellenirken bir hata oluştu"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Geçici mesajları silmeye çalışma
    if (messageId.startsWith('temp-')) return;

    try {
      const response = await messagesApi.deleteMessage(messageId);

      if (response.success) {
        setConversations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(chatName => {
            updated[chatName] = updated[chatName].map(msg =>
              msg.id === messageId
                ? { ...msg, content: "Bu mesaj silindi", isDeleted: true }
                : msg
            );
          });
          return updated;
        });

        toast({
          title: "Başarılı",
          description: "Mesaj silindi"
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj silinirken bir hata oluştu"
    });
  }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
      <Button
        variant="ghost"
        size="icon"
          className="absolute left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out"
            : "w-64 border-r"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <SidebarContent
          channels={channels}
          directMessages={directUsers}
          currentChatId={currentChatId}
          unreadCounts={unreadCounts}
          handleChatSelect={handleChatSelect}
          setProfileOpen={setProfileOpen}
          user={user}
          onLogout={handleLogout}
          onlineStatus={isOnline}
          onToggleOnlineStatus={handleToggleOnlineStatus}
          onCreateChannel={handleCreateChannel}
          newChannelName={newChannelName}
          setNewChannelName={setNewChannelName}
          newChannelInputRef={newChannelInputRef}
          handleDeleteChannel={handleDeleteChannel}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {currentChat ? (
          <div className="flex h-full flex-col">
            {/* Chat header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
          <div className="flex items-center">
                  <h2 className="text-lg font-medium">{currentChat}</h2>
                </div>
              </div>
          </div>

            {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <p>Loading messages...</p>
                  </div>
                ) : conversations[currentChat]?.length === 0 ? (
                  <div className="flex justify-center p-4">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  conversations[currentChat]?.map((msg) => (
                    <div key={msg.id}>
                      {editingMessage?.id === msg.id ? (
                        <div className={`flex ${msg.sender.id === user?.id ? "justify-end" : "justify-start"}`}>
                          <div className="flex flex-col space-y-2 max-w-[80%]">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleUpdateMessage();
                                } else if (e.key === 'Escape') {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }
                              }}
                              className="min-w-[200px]"
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                              >
                                İptal
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleUpdateMessage}
                              >
                                Kaydet
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className={`flex max-w-[80%] items-start space-x-2 ${
                            msg.sender.id === user?.id ? "flex-row-reverse space-x-reverse ml-auto" : "flex-row"
                          }`}>
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage 
                                src={msg.sender.avatar || `/placeholder.svg?height=40&width=40&text=${msg.sender.displayName.charAt(0)}`} 
                                alt={msg.sender.displayName}
                              />
                              <AvatarFallback>{msg.sender.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {msg.sender.id === user?.id ? "Ben" : msg.sender.displayName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className={`rounded-lg p-3 relative group ${
                                  msg.sender.id === user?.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}>
                                  {msg.isDeleted ? (
                                    <div className="flex items-center justify-between">
                                      <span className="italic text-muted-foreground">Bu mesaj silindi</span>
                                      {msg.sender.id === user?.id && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-32 p-1" side="top" align="end">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-full justify-start text-xs text-destructive"
                                              onClick={() => handleDeleteMessage(msg.id)}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Sil
                                            </Button>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div>{msg.content}</div>
                                      {msg.sender.id === user?.id && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-32 p-1" side="top" align="end">
                                            {!msg.isDeleted && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start text-xs"
                                                onClick={() => handleEditMessage(msg)}
                                              >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Düzenle
                                              </Button>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-full justify-start text-xs text-destructive"
                                              onClick={() => handleDeleteMessage(msg.id)}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Sil
                                            </Button>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {msg.isEdited && !msg.isDeleted && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    düzenlendi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                </div>
                  ))
                )}
                <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

            {/* Message input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
              className="flex-1"
            />
                <Button type="submit" disabled={!message.trim() || loading}>
                  Gönder
                </Button>
          </form>
            </div>
              </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-medium">Hoş Geldiniz!</h2>
              <p className="mt-2 text-muted-foreground">
                Sohbet etmek için bir kanal veya kişi seçin.
              </p>
            </div>
          </div>
        )}
            </div>

      {/* Profile sheet */}
      {user && (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <UploadAvatar
                  currentAvatar={user.avatar}
                  displayName={user.displayName}
                  userId={user.id}
                  onAvatarUpdate={(newAvatar) => {
                    setUser(prev => prev ? { ...prev, avatar: newAvatar } : null)
                  }}
                />
                <div className="text-center">
                  <h2 className="text-xl font-bold">{user.displayName}</h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Durum</h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-3 w-3 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    ></div>
                    <span>{isOnline ? "Çevrimiçi" : "Çevrimdışı"}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Tema</h3>
                  <div className="flex items-center justify-between">
                    <span>Görünüm</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

// SidebarContent component
interface SidebarContentProps {
  channels: Channel[]
  directMessages: User[]
  currentChatId: string | null
  unreadCounts: Record<string, number>
  handleChatSelect: (chatId: string, chatType: 'channel' | 'direct') => void
  setProfileOpen: (open: boolean) => void
  user: any
  onLogout: () => void
  onlineStatus: boolean
  onToggleOnlineStatus: () => void
  onCreateChannel: () => void
  newChannelName: string
  setNewChannelName: (name: string) => void
  newChannelInputRef: React.RefObject<HTMLInputElement | null>
  handleDeleteChannel: (channelId: string, channelName: string) => void
}

function SidebarContent({
  channels,
  directMessages,
  currentChatId,
  unreadCounts,
  handleChatSelect,
  setProfileOpen,
  user,
  onLogout,
  onlineStatus,
  onToggleOnlineStatus,
  onCreateChannel,
  newChannelName,
  setNewChannelName,
  newChannelInputRef,
  handleDeleteChannel
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
              <div key={channel.id} className="flex items-center space-x-1">
              <Button
                  variant={currentChatId === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                  onClick={() => handleChatSelect(channel.id, 'channel')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{channel.name}</span>
                {unreadCounts[channel.name] > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCounts[channel.name]}
                  </span>
                )}
              </Button>
                {/* Kanal sahibi ise silme butonu göster */}
                {channel.createdBy.id === user?.id && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChannel(channel.id, channel.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between py-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Direkt Mesajlar</h2>
          </div>
          <div className="space-y-1">
            {directMessages.map((dm) => (
              <Button
                key={dm.id}
                variant={currentChatId === dm.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleChatSelect(dm.id, 'direct')}
              >
                <div className="relative mr-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={dm.avatar} />
                    <AvatarFallback>{dm.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {dm.status === 'online' && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-green-500 ring-1 ring-background"></span>
                  )}
                </div>
                <span className="flex-1 truncate">{dm.displayName}</span>
                {unreadCounts[dm.displayName] > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCounts[dm.displayName]}
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