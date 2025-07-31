import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Car, 
  Wifi, 
  Wind, 
  Home, 
  Flag,
  AlertTriangle,
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar,
  Star,
  Heart,
  Share2,
  ArrowLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  DollarSign,
  Building,
  Users,
  CheckCircle,
  Shield,
  ImageIcon,
  VideoIcon,
  MapIcon,
  Clock,
  Scale,
  Camera,
  FileText,
  Send,
  BookOpen,
  Info
} from "lucide-react"
import { getPropertyById, Property } from "@/api/properties"
import { getUserReviews } from "@/api/reviews"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { AppealModal } from "@/components/AppealModal"

interface Review {
  _id: string
  reviewer: {
    _id: string
    name: string
    avatar?: string
  }
  rating: number
  comment: string
  createdAt: string
}

interface BuyRequest {
  _id: string
  propertyId: string
  buyerId: string
  sellerId: string
  offeredPrice: number
  message?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: string
}

// Complaint Modal Component
const ComplaintModal = ({ isOpen, onClose, propertyId, propertyTitle, user }) => {
  const [complaintType, setComplaintType] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const complaintTypes = [
    "Fake Listing",
    "Price Manipulation", 
    "False Documentation",
    "Misleading Information",
    "Suspicious Photos",
    "Contact Fraud",
    "Other"
  ]

  const handleSubmit = async () => {
    if (!complaintType || !description.trim()) {
      toast({
        title: "Error",
        description: "Please select a complaint type and provide a description",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/complaints/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          propertyId,
          type: complaintType,
          description: description.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit complaint')
      }
      
      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been submitted and will be reviewed by our team.",
      })
      
      onClose()
      setComplaintType("")
      setDescription("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit complaint",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Property Issue
          </DialogTitle>
          <DialogDescription>
            Report this property "{propertyTitle}" if you believe it violates our policies or contains fraudulent information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="complaint-type">Issue Type *</Label>
            <Select value={complaintType} onValueChange={setComplaintType}>
              <SelectTrigger>
                <SelectValue placeholder="Select the type of issue" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about the issue you've identified..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you found suspicious or misleading
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !complaintType || !description.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Buy Request Modal
const BuyRequestModal = ({ isOpen, onClose, property, user }) => {
  const [offeredPrice, setOfferedPrice] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!offeredPrice || parseFloat(offeredPrice) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid offer amount",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/buy-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          propertyId: property._id,
          offeredPrice: parseFloat(offeredPrice),
          message: message.trim() || `I would like to purchase your property for $${offeredPrice}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit buy request')
      }
      
      toast({
        title: "Buy Request Sent",
        description: "Your purchase offer has been sent to the property owner.",
      })
      
      onClose()
      setOfferedPrice("")
      setMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit buy request",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            Submit a purchase offer for "{property?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="offered-price">Your Offer Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="offered-price"
                type="number"
                placeholder="Enter your offer"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="pl-10"
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Listed price: ${property?.price?.toLocaleString()}
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !offeredPrice}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Sending..." : "Send Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Contact Owner Modal
const ContactModal = ({ isOpen, onClose, property, user }) => {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: property.owner._id,
          content: message.trim(),
          propertyId: property._id,
          propertyTitle: property.title,
          propertyLocation: property.location,
          propertyPrice: property.price
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property owner.",
      })
      
      onClose()
      setMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            Contact Property Owner
          </DialogTitle>
          <DialogDescription>
            Send a message to {property?.owner?.name} about "{property?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Your Message *</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in your property..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !message.trim()}
          >
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showAppealModal, setShowAppealModal] = useState(false)
  const [showBuyRequestModal, setShowBuyRequestModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [savedProperties, setSavedProperties] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const [propertyResponse, reviewsResponse] = await Promise.all([
          getPropertyById(id),
          getUserReviews(id, 'property')
        ])
        
        setProperty(propertyResponse.property)
        setReviews(reviewsResponse.reviews || [])
      } catch (error: any) {
        console.error('Error fetching property details:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load property details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [id, toast])

  useEffect(() => {
    // Load saved properties from localStorage
    const saved = JSON.parse(localStorage.getItem('savedProperties') || '[]')
    setSavedProperties(saved)
  }, [])

  const handleSaveProperty = () => {
    if (!property) return
    
    const saved = [...savedProperties]
    const index = saved.indexOf(property._id)
    
    if (index > -1) {
      saved.splice(index, 1)
      toast({
        title: "Removed from Saved",
        description: "Property removed from your saved list",
      })
    } else {
      saved.push(property._id)
      toast({
        title: "Saved Successfully",
        description: "Property added to your saved list",
      })
    }
    
    setSavedProperties(saved)
    localStorage.setItem('savedProperties', JSON.stringify(saved))
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `Check out this property: ${property?.title}`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Property link copied to clipboard",
      })
    }
  }

  const nextImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Property Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This property has been removed by the owner or is no longer available. It may have been sold, rented out, or deleted from the platform.
            </p>
            <Button onClick={() => navigate('/properties')} className="w-full">
              Browse Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative">
                {property.images && property.images.length > 0 ? (
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={property.images[currentImageIndex]}
                      alt={`${property.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    
                    {/* Image Navigation */}
                    {property.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {property.images.length}
                        </div>
                      </>
                    )}
                    
                    {/* Status Badge */}
                    <Badge 
                      className={`absolute top-4 left-4 ${
                        property.status === 'Active' ? 'bg-green-600' :
                        property.status === 'Sold' ? 'bg-red-600' :
                        property.status === 'Flagged' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}
                    >
                      {property.status}
                    </Badge>
                  </div>
                ) : (
                  <div className="h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No images available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {property.images && property.images.length > 1 && (
                <div className="p-4 grid grid-cols-6 gap-2">
                  {property.images.slice(0, 6).map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-16 cursor-pointer rounded-lg overflow-hidden transition-all ${
                        index === currentImageIndex ? 'ring-2 ring-blue-500' : 'hover:opacity-80'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {property.images.length > 6 && index === 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">
                          +{property.images.length - 6}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Property Information Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                          <div className="flex items-center mt-2 text-gray-600">
                            <MapPin className="mr-1 h-4 w-4" />
                            {property.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600">
                            ${property.price?.toLocaleString()}
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {property.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Key Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      {property.features?.bedrooms && (
                        <div className="flex items-center space-x-2">
                          <Bed className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{property.features.bedrooms}</span>
                          <span className="text-gray-600">Beds</span>
                        </div>
                      )}
                      {property.features?.bathrooms && (
                        <div className="flex items-center space-x-2">
                          <Bath className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{property.features.bathrooms}</span>
                          <span className="text-gray-600">Baths</span>
                        </div>
                      )}
                      {property.features?.area && (
                        <div className="flex items-center space-x-2">
                          <Square className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{property.features.area}</span>
                          <span className="text-gray-600">sqft</span>
                        </div>
                      )}
                      {property.features?.parkingSpaces && (
                        <div className="flex items-center space-x-2">
                          <Car className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{property.features.parkingSpaces}</span>
                          <span className="text-gray-600">Parking</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">About This Property</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>

                    {/* Videos Section */}
                    {property.videos && property.videos.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                          <VideoIcon className="h-5 w-5" />
                          Property Videos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {property.videos.map((video, index) => (
                            <div key={index} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                              <video
                                src={video}
                                controls
                                className="w-full h-full"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <div className="space-y-6">
                    {/* Property Details */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Property Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          {property.features?.floorNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Floor Number:</span>
                              <span className="font-medium">{property.features.floorNumber}</span>
                            </div>
                          )}
                          {property.features?.totalFloors && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Floors:</span>
                              <span className="font-medium">{property.features.totalFloors}</span>
                            </div>
                          )}
                          {property.features?.roadWidth && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Road Width:</span>
                              <span className="font-medium">{property.features.roadWidth} ft</span>
                            </div>
                          )}
                          {property.features?.isCornerPlot !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Corner Plot:</span>
                              <span className="font-medium">
                                {property.features.isCornerPlot ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Property Type:</span>
                            <span className="font-medium">{property.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Listing Type:</span>
                            <span className="font-medium">{property.listingType || 'Sale'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Availability:</span>
                            <span className="font-medium">{property.availability || 'Available'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Amenities & Features</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.features?.hasAC && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Wind className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Air Conditioning</span>
                          </div>
                        )}
                        {property.features?.hasLift && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Elevator</span>
                          </div>
                        )}
                        {property.features?.isFurnished && (
                          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                            <Home className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">Furnished</span>
                          </div>
                        )}
                        {property.features?.hasParking && (
                          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                            <Car className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Parking Available</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Custom Features */}
                      {property.features?.customFeatures && property.features.customFeatures.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Additional Features:</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.features.customFeatures.map((feature, index) => (
                              <Badge key={index} variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nearby Facilities */}
                    {property.nearbyFacilities && Array.isArray(property.nearbyFacilities) && property.nearbyFacilities.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Nearby Facilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {property.nearbyFacilities.map((facility, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">{facility.name}</span>
                              <span className="text-sm text-gray-600">{facility.distance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <MapIcon className="h-5 w-5" />
                        Property Location
                      </h3>
                      <div className="bg-gray-100 p-6 rounded-lg text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700">{property.location}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Interactive map integration would be implemented here
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Property Reviews</h3>
                      {reviews.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-semibold">{averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
                        </div>
                      )}
                    </div>

                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review._id} className="border-b border-gray-100 pb-6 last:border-b-0">
                            <div className="flex items-start space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={review.reviewer.avatar} />
                                <AvatarFallback>
                                  {review.reviewer.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{review.reviewer.name}</h4>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No reviews yet</p>
                        <p className="text-gray-400 text-sm">Be the first to review this property!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Owner Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Property Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={property.owner?.avatar} />
                    <AvatarFallback className="text-lg">
                      {property.owner?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{property.owner?.name || 'Property Owner'}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{property.owner?.reputation || 4.5}</span>
                      <span className="text-sm text-gray-500">rating</span>
                    </div>
                    {property.owner?.phone && (
                      <p className="text-sm text-gray-600 mt-1">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {property.owner.phone}
                      </p>
                    )}
                  </div>
                </div>

                {user && user.id !== property.owner._id ? (
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowContactModal(true)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                    
                    {property.listingType !== 'Rent' && property.status === 'Active' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => setShowBuyRequestModal(true)}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Make Offer
                      </Button>
                    )}
                    
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Visit
                    </Button>
                  </div>
                ) : user && user.id === property.owner._id ? (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800 font-medium">This is your property</p>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Sign in to contact the owner</p>
                    <Button 
                      variant="outline" 
                      className="mt-2 w-full" 
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSaveProperty}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${
                      savedProperties.includes(property._id) ? 'fill-red-500 text-red-500' : ''
                    }`} />
                    {savedProperties.includes(property._id) ? 'Saved' : 'Save Property'}
                  </Button>
                  
                  <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Property
                  </Button>
                  
                  {/* Complaint Button - Only show for non-owners and logged-in users */}
                  {user && property && user.id !== property.owner._id && (
                    <Button
                      variant="outline"
                      onClick={() => setShowComplaintModal(true)}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report Issue
                    </Button>
                  )}

                  {/* Appeal Button - Only show for property owners when property is flagged/rejected */}
                  {user && property && user.id === property.owner._id && 
                   (property.status === 'Flagged' || property.status === 'Rejected') && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAppealModal(true)}
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Scale className="mr-2 h-4 w-4" />
                      Appeal Decision
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Property Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Views</span>
                    </div>
                    <span className="font-medium">{property.views || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Inquiries</span>
                    </div>
                    <span className="font-medium">{property.inquiries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Bookings</span>
                    </div>
                    <span className="font-medium">{property.bookings || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Listed</span>
                    </div>
                    <span className="font-medium text-sm">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Safety First</h4>
                    <p className="text-sm text-amber-700">
                      Always verify property details in person. Never transfer money without proper documentation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        propertyId={property?._id}
        propertyTitle={property?.title}
        user={user}
      />

      {showAppealModal && (
        <AppealModal
          isOpen={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          complaintId="" // You'll need to pass the actual complaint ID
          propertyId={property._id}
          propertyTitle={property.title}
          complaintType="Property Action" // You'll need to pass the actual complaint type
        />
      )}

      <BuyRequestModal
        isOpen={showBuyRequestModal}
        onClose={() => setShowBuyRequestModal(false)}
        property={property}
        user={user}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        property={property}
        user={user}
      />
    </div>
  )
}
