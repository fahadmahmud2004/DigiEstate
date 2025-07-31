import { useEffect, useState, useRef } from "react"
import { Send, Paperclip, Search, MoreVertical, Plus, X, Upload, FileText, Download, Home, MapPin, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getConversations, getMessages, sendMessage, markConversationAsRead, sendMessageWithFiles, downloadMessageFile, sendAIMessage, Conversation, Message } from "@/api/messages"
import { searchUsers, User } from "@/api/users"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [isAIChat, setIsAIChat] = useState(false)
  const [aiConversationId] = useState("ai_chat")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        console.log("Fetching conversations...")
        const response = await getConversations() as any
        console.log("Conversations fetched:", response.conversations)
        setConversations(response.conversations)
        if (response.conversations.length > 0) {
          setSelectedConversation(response.conversations[0]._id)
        }
      } catch (error: any) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load conversations",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [toast])

  useEffect(() => {
    if (selectedConversation && !isAIChat) {
      const fetchMessages = async () => {
        try {
          console.log("Fetching messages for conversation:", selectedConversation)
          const response = await getMessages(selectedConversation) as any
          console.log("Messages fetched:", response.messages)
          
          // Debug: Check for property context in messages
          const messagesWithProperty = response.messages.filter((msg: any) => msg.propertyId)
          if (messagesWithProperty.length > 0) {
            console.log("Messages with property context found:", messagesWithProperty.map((msg: any) => ({
              id: msg._id,
              propertyId: msg.propertyId,
              propertyTitle: msg.propertyTitle,
              propertyLocation: msg.propertyLocation,
              propertyPrice: msg.propertyPrice
            })))
          } else {
            console.log("No messages with property context found")
          }
          
          setMessages(response.messages)
          // Mark conversation as read when opened
          await markConversationAsRead(selectedConversation)
          // Update conversation unread count in the list
          setConversations(prev => prev.map(conv =>
            conv._id === selectedConversation
              ? { ...conv, unreadCount: 0 }
              : conv
          ))
        } catch (error: any) {
          console.error("Error fetching messages:", error)
          toast({
            title: "Error",
            description: error.message || "Failed to load messages",
            variant: "destructive",
          })
        }
      }

      fetchMessages()
    } else if (isAIChat) {
      // Clear messages for AI chat
      setMessages([])
    }
  }, [selectedConversation, isAIChat, toast])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFiles) || !selectedConversation || !currentUser) return

    setSendingMessage(true)
    setUploadingFiles(!!selectedFiles)

    try {
      console.log("Sending message:", newMessage, "with files:", selectedFiles)
      
      if (isAIChat) {
        // Handle AI chat
        const userMessage: Message = {
          _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: {
            _id: currentUser.id,
            name: currentUser.name
          },
          receiver: {
            _id: 'ai',
            name: 'DigiEstate AI'
          },
          content: newMessage.trim(),
          isRead: true,
          createdAt: new Date().toISOString()
        }

        // Add user message to chat
        setMessages(prev => [...prev, userMessage])
        setNewMessage("")
        setSelectedFiles(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Get AI response
        const aiResponse = await sendAIMessage({
          message: newMessage.trim(),
          conversationHistory: messages
        })

        // Add AI response to chat
        setMessages(prev => [...prev, aiResponse.message])

        toast({
          title: "Success",
          description: "Message sent to AI successfully"
        })
      } else {
        // Handle regular chat
        const conversation = conversations.find(c => c._id === selectedConversation)
        const receiverId = conversation?.participants.find(p => p._id !== currentUser.id)?._id

        if (receiverId) {
          let response: any

          if (selectedFiles && selectedFiles.length > 0) {
            // Send message with files
            response = await sendMessageWithFiles({
              receiverId,
              content: newMessage.trim() || "(File attachment)",
              files: selectedFiles
            })
          } else {
            // Send regular message
            response = await sendMessage({
              receiverId,
              content: newMessage.trim()
            })
          }

          console.log("Message sent:", response.message)
          setMessages(prev => [...prev, response.message])
          setNewMessage("")
          setSelectedFiles(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          // Update conversation list with new last message
          setConversations(prev => prev.map(conv =>
            conv._id === selectedConversation
              ? {
                  ...conv,
                  lastMessage: response.message,
                  updatedAt: response.message.createdAt
                }
              : conv
          ))

          toast({
            title: "Success",
            description: selectedFiles ? "Message and files sent successfully" : "Message sent successfully"
          })
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
      setUploadingFiles(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (files.length > 5) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 5 files at once",
          variant: "destructive",
        })
        return
      }

      // Check file sizes (10MB per file)
      const maxSize = 10 * 1024 * 1024 // 10MB
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
          toast({
            title: "File too large",
            description: `${files[i].name} is too large. Maximum file size is 10MB.`,
            variant: "destructive",
          })
          return
        }
      }

      setSelectedFiles(files)
      console.log("Selected files:", Array.from(files).map(f => f.name))
    }
  }

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (index: number) => {
    if (selectedFiles) {
      const dt = new DataTransfer()
      for (let i = 0; i < selectedFiles.length; i++) {
        if (i !== index) {
          dt.items.add(selectedFiles[i])
        }
      }
      setSelectedFiles(dt.files.length > 0 ? dt.files : null)
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files
      }
    }
  }

  const handleDownloadFile = async (filename: string) => {
    try {
      await downloadMessageFile(filename)
      toast({
        title: "Success",
        description: "File downloaded successfully"
      })
    } catch (error: any) {
      console.error("Error downloading file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handlePropertyClick = async (propertyId: string) => {
    try {
      // First, try to fetch the property to see if it still exists
      const response = await fetch(`http://localhost:3001/api/properties/${propertyId}`)
      
      if (response.ok) {
        // Property exists, navigate to it
        navigate(`/properties/${propertyId}`)
      } else if (response.status === 404) {
        // Property was deleted, show user-friendly message with context
        toast({
          title: "Property No Longer Available",
          description: "This property has been removed or deleted. However, you can still see the conversation context above.",
          variant: "destructive",
        })
      } else {
        // Other error, generic message
        toast({
          title: "Error",
          description: "Unable to load property details at this time.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking property:", error)
      toast({
        title: "Error",
        description: "Unable to load property details. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleViewImage = async (filename: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      // For images, we'll open in a new tab with proper auth headers
      // Note: This is a workaround since img src can't include auth headers
      const response = await fetch(`http://localhost:3001/api/messages/download/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load image')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error: any) {
      console.error("Error viewing image:", error)
      toast({
        title: "Error", 
        description: error.message || "Failed to view image",
        variant: "destructive",
      })
    }
  }

  const handleStartNewConversation = async (user: User) => {
    try {
      console.log("Starting new conversation with user:", user.name)
      
      // Prevent users from messaging themselves
      if (currentUser?.id === user._id) {
        toast({
          title: "Error",
          description: "You cannot start a conversation with yourself",
          variant: "destructive",
        })
        return
      }
      
      // Create a new conversation ID
      const newConversationId = `conv_${currentUser?.id}_${user._id}`

      // Check if conversation already exists
      const existingConv = conversations.find(c => c._id === newConversationId)
      if (existingConv) {
        console.log("Conversation already exists, selecting it")
        setSelectedConversation(existingConv._id)
        setShowNewMessageDialog(false)
        return
      }

      // Create new conversation
      const newConversation: Conversation = {
        _id: newConversationId,
        participants: [
          { _id: currentUser?.id || '', name: currentUser?.name || 'You' },
          { _id: user._id, name: user.name, avatar: user.avatar }
        ],
        lastMessage: {
          _id: 'temp',
          sender: { _id: currentUser?.id || '', name: currentUser?.name || 'You' },
          receiver: { _id: user._id, name: user.name },
          content: 'Start a conversation...',
          isRead: true,
          createdAt: new Date().toISOString()
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      }

      console.log("Created new conversation:", newConversation)
      setConversations(prev => [newConversation, ...prev])
      setSelectedConversation(newConversationId)
      setMessages([])
      setShowNewMessageDialog(false)

      toast({
        title: "Success",
        description: `Started conversation with ${user.name}`
      })
    } catch (error: any) {
      console.error("Error starting conversation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      })
    }
  }

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setUsers([])
      return
    }

    setLoadingUsers(true)
    try {
      console.log("Searching users with query:", query)
      const response = await searchUsers(query) as any
      console.log("Users found:", response.users)
      setUsers(response.users)
    } catch (error: any) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to search users",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAIChat = () => {
    setIsAIChat(true)
    setSelectedConversation(aiConversationId)
    setMessages([])
    setNewMessage("")
    setSelectedFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRegularChat = () => {
    setIsAIChat(false)
    if (conversations.length > 0) {
      setSelectedConversation(conversations[0]._id)
    } else {
      setSelectedConversation(null)
    }
    setMessages([])
    setNewMessage("")
    setSelectedFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const selectedConv = conversations.find(c => c._id === selectedConversation)

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Conversations List */}
      <div className="w-1/3">
        <Card className="h-full bg-card-solid border border-border shadow-lg">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-readable">Messages</h2>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={isAIChat ? "default" : "outline"}
                    onClick={handleAIChat}
                    className={isAIChat ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <Bot className="h-4 w-4 mr-1" />
                    AI Chat
                  </Button>
                  <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card-solid border border-border">
                    <DialogHeader>
                      <DialogTitle className="text-readable">Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-readable" />
                        <Input
                          placeholder="Search users..."
                          className="pl-10 bg-background border-border"
                          value={searchQuery}
                          onChange={(e) => handleSearchUsers(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-64">
                        {loadingUsers ? (
                          <div className="p-4 space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
                                <div className="flex-1">
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-1"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-4 text-center text-muted-readable">
                            {searchQuery ? 'No users found' : 'Search for users to start a conversation'}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {users.map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer rounded-lg"
                                onClick={() => handleStartNewConversation(user)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-readable truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-readable truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-readable" />
              <Input placeholder="Search conversations..." className="pl-10 bg-background border-border" />
            </div>
          </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold text-readable mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-muted-readable text-sm mb-4">
                    Start a conversation by clicking the "New" button above
                  </p>
                  <Button
                    onClick={() => setShowNewMessageDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Conversation
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(p => p._id !== currentUser?.id)
                    return (
                      <div
                        key={conversation._id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation._id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedConversation(conversation._id)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherParticipant?.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {otherParticipant?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-readable truncate">
                              {otherParticipant?.name}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 hover:bg-red-500 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-readable truncate">
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.property && (
                            <p className="text-xs text-blue-600 truncate">
                              Re: {conversation.property.title}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <Card className="h-full bg-card-solid border border-border shadow-lg">
          {isAIChat ? (
            <CardContent className="p-0 h-full flex flex-col">
              {/* AI Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-600 text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-readable">
                      DigiEstate AI Assistant
                    </h3>
                    <p className="text-sm text-muted-readable">
                      Your real estate AI assistant
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleRegularChat}
                  title="Switch to regular chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-readable">
                        Start chatting with AI about real estate!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === currentUser?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-accent text-readable'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender._id === currentUser?.id ? 'text-blue-100' : 'text-muted-readable'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* AI Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me about real estate..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-background border-border"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {sendingMessage ? (
                      <Upload className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : selectedConv ? (
            <CardContent className="p-0 h-full flex flex-col">
              {/* Regular Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConv.participants.find(p => p._id !== currentUser?.id)?.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedConv.participants.find(p => p._id !== currentUser?.id)?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-readable">
                      {selectedConv.participants.find(p => p._id !== currentUser?.id)?.name}
                    </h3>
                    {selectedConv.property && (
                      <p className="text-sm text-muted-readable">
                        {selectedConv.property.title}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-readable">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === currentUser?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-accent text-readable'
                          }`}
                        >
                          {/* Property Context - Show if message has property context */}
                          {message.propertyId && (
                            <div 
                              className={`mb-2 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
                                message.sender._id === currentUser?.id
                                  ? 'bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30'
                                  : 'bg-accent/50 border-border hover:bg-accent'
                              }`}
                              onClick={() => message.propertyId && handlePropertyClick(message.propertyId)}
                            >
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium truncate">
                                      {message.propertyTitle || 'Property Discussion'}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      Property
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex-1 min-w-0">
                                      {message.propertyLocation && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="text-xs opacity-75 truncate">
                                            {message.propertyLocation}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {message.propertyPrice && (
                                      <span className="text-xs font-medium opacity-90 ml-2">
                                        ${Number(message.propertyPrice).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Message Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, index) => {
                                const fileName = attachment.split('/').pop() || attachment
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
                                
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      message.sender._id === currentUser?.id
                                        ? 'bg-blue-500/20 border-blue-400/30'
                                        : 'bg-accent/50 border-border'
                                    }`}
                                  >
                                    {isImage ? (
                                      <div className="cursor-pointer" onClick={() => handleViewImage(fileName)}>
                                        <div className="bg-accent p-2 rounded flex items-center gap-2">
                                          <FileText className="h-4 w-4 flex-shrink-0" />
                                          <span className="flex-1 text-xs truncate">{fileName}</span>
                                          <span className="text-xs text-muted-readable">Image</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <FileText className="h-4 w-4 flex-shrink-0" />
                                        <span className="flex-1 text-xs truncate">{fileName}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDownloadFile(fileName)}
                                          className={`p-1 h-6 w-6 ${
                                            message.sender._id === currentUser?.id
                                              ? 'hover:bg-blue-500/30 text-blue-100'
                                              : 'hover:bg-accent'
                                          }`}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          <p className={`text-xs mt-1 ${
                            message.sender._id === currentUser?.id ? 'text-blue-100' : 'text-muted-readable'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                {!isAIChat && (
                  <>
                    {/* File Preview */}
                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="mb-3 p-3 bg-accent/50 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-readable">
                            Selected Files ({selectedFiles.length}/5)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFiles(null)
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ""
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-card-solid rounded border border-border">
                              <FileText className="h-4 w-4 text-muted-readable" />
                              <span className="flex-1 text-sm truncate text-readable">{file.name}</span>
                              <span className="text-xs text-muted-readable">
                                {(file.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleFileUploadClick}
                        disabled={sendingMessage || uploadingFiles}
                      >
                        {uploadingFiles ? (
                          <Upload className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-background border-border"
                        disabled={sendingMessage || uploadingFiles}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !selectedFiles) || sendingMessage || uploadingFiles}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sendingMessage || uploadingFiles ? (
                          <Upload className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-readable mb-2">
                  {isAIChat ? "Start chatting with AI" : "Select a conversation"}
                </h3>
                <p className="text-muted-readable">
                  {isAIChat 
                    ? "Ask me about real estate, property advice, market insights, and more!"
                    : "Choose a conversation from the list to start messaging"
                  }
                </p>
                {isAIChat && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      What can I help you with?
                    </h4>
                    <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <li>• Property buying and selling advice</li>
                      <li>• Market trends and analysis</li>
                      <li>• Investment opportunities</li>
                      <li>• Legal and financial guidance</li>
                      <li>• Property valuation insights</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}