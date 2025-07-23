import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Phone, Mail, MessageCircle, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMyBookings, Booking } from "@/api/bookings"
import { useToast } from "@/hooks/useToast"

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getMyBookings() as any
        setBookings(response.bookings)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your bookings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [toast])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Declined':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-600 hover:bg-green-600'
      case 'Declined':
        return 'bg-red-600 hover:bg-red-600'
      case 'Completed':
        return 'bg-blue-600 hover:bg-blue-600'
      default:
        return 'bg-yellow-600 hover:bg-yellow-600'
    }
  }

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings
    return bookings.filter(booking => booking.status.toLowerCase() === status.toLowerCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your property viewing requests and appointments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {filterBookings('pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {filterBookings('accepted').length}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {filterBookings('completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {filterBookings('declined').length}
            </div>
            <div className="text-sm text-gray-600">Declined</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'accepted', 'completed', 'declined'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 animate-pulse rounded mb-4"></div>
                      <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterBookings(tab).length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No {tab === 'all' ? '' : tab} bookings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tab === 'all' 
                      ? "You haven't made any booking requests yet"
                      : `You don't have any ${tab} bookings`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(tab).map((booking) => (
                  <Card key={booking._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={booking.property.images[0] || '/placeholder-property.jpg'}
                            alt={booking.property.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {booking.property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.property.location}
                            </div>
                            <div className="text-lg font-bold text-blue-600 mt-1">
                              ${booking.property.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.status)}
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Booking Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Booking Details</h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                              <span>Date: {new Date(booking.preferredDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-2 text-gray-600" />
                              <span>Time: {booking.preferredTime}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Reference: </span>
                              <span className="text-blue-600">{booking.referenceNumber}</span>
                            </div>
                            {booking.message && (
                              <div className="text-sm">
                                <span className="font-medium">Message: </span>
                                <span className="text-gray-600">{booking.message}</span>
                              </div>
                            )}
                            {booking.declineReason && (
                              <div className="text-sm">
                                <span className="font-medium text-red-600">Decline Reason: </span>
                                <span className="text-red-600">{booking.declineReason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Seller Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Property Owner</h4>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={booking.seller.avatar} />
                              <AvatarFallback className="bg-blue-600 text-white">
                                {booking.seller.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{booking.seller.name}</div>
                              <div className="text-sm text-gray-600">{booking.seller.email}</div>
                            </div>
                          </div>
                          {booking.status === 'Accepted' && (
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start text-sm">
                                <Phone className="h-4 w-4 mr-2" />
                                {booking.seller.phone}
                              </Button>
                              <Button variant="outline" className="w-full justify-start text-sm">
                                <Mail className="h-4 w-4 mr-2" />
                                {booking.seller.email}
                              </Button>
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Message
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Information */}
                      {booking.payment && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm font-medium">Amount:</span>
                              <div className="text-lg font-bold text-green-600">
                                ${booking.payment.amount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Method:</span>
                              <div className="text-sm">{booking.payment.method}</div>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Status:</span>
                              <Badge className={
                                booking.payment.status === 'Completed' 
                                  ? 'bg-green-600 hover:bg-green-600'
                                  : booking.payment.status === 'Failed'
                                  ? 'bg-red-600 hover:bg-red-600'
                                  : 'bg-yellow-600 hover:bg-yellow-600'
                              }>
                                {booking.payment.status}
                              </Badge>
                            </div>
                          </div>
                          {booking.payment.transactionId && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Transaction ID: </span>
                              <span className="text-blue-600">{booking.payment.transactionId}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking Date */}
                      <div className="mt-4 text-xs text-gray-500">
                        Booked on {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString()}
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