import { useEffect, useState } from "react"
import { Bell, Check, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getNotifications, markNotificationAsRead, deleteNotification, Notification } from "@/api/notifications"
import { useToast } from "@/hooks/useToast"

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications() as any
        setNotifications(response.notifications)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load notifications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [toast])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      )
      toast({
        title: "Success",
        description: "Notification marked as read",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId))
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅'
      case 'payment':
        return '💰'
      case 'message':
        return '💬'
      case 'admin':
        return '🛡️'
      case 'system':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-600 hover:bg-blue-600'
      case 'payment':
        return 'bg-green-600 hover:bg-green-600'
      case 'message':
        return 'bg-purple-600 hover:bg-purple-600'
      case 'admin':
        return 'bg-red-600 hover:bg-red-600'
      case 'system':
        return 'bg-gray-600 hover:bg-gray-600'
      default:
        return 'bg-blue-600 hover:bg-blue-600'
    }
  }

  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead)
      case 'read':
        return notifications.filter(n => n.isRead)
      default:
        return notifications
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with your property activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500 hover:bg-red-500">
            {unreadCount} unread
          </Badge>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        {['all', 'unread', 'read'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterNotifications(tab).length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No {tab === 'all' ? '' : tab} notifications
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tab === 'all'
                      ? "You're all caught up! No notifications to show."
                      : `You don't have any ${tab} notifications.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterNotifications(tab).map((notification) => (
                  <Card
                    key={notification._id}
                    className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      !notification.isRead ? 'ring-2 ring-blue-500/20' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <Badge className={getNotificationColor(notification.type)}>
                                  {notification.type}
                                </Badge>
                                {!notification.isRead && (
                                  <Badge className="bg-red-500 hover:bg-red-500 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!notification.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification._id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteNotification(notification._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}