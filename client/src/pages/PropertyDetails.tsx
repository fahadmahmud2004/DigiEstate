import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  MapPin, Star, Bed, Bath, Square, Car, Wind,
  Building, Phone, Mail, MessageCircle, Calendar,
  ArrowLeft, Heart, Share, Flag, ChevronLeft, ChevronRight,
  Edit, Trash2, X, ZoomIn
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getPropertyById, Property } from "@/api/properties"
import { createBooking } from "@/api/bookings"
import { getPropertyReviews, createPropertyReview, updateReview, deleteReview, Review, ReviewsResponse } from "@/api/reviews"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [bookingData, setBookingData] = useState({
    preferredDate: '',
    preferredTime: '',
    message: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [reviews, setReviews] = useState<ReviewsResponse>({ reviews: [], averageRating: 0, totalReviews: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return

      try {
        console.log(`[PropertyDetails] Fetching property with ID: ${id}`)
        const response = await getPropertyById(id) as any
        console.log(`[PropertyDetails] Property response:`, response)
        setProperty(response.property)
      } catch (error) {
        console.error(`[PropertyDetails] Error fetching property:`, error)
        toast({
          title: "Error",
          description: "Failed to load property details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id, toast])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return

      try {
        console.log(`[PropertyDetails] Fetching reviews for property ID: ${id}`)
        const response = await getPropertyReviews(id) as any
        console.log(`[PropertyDetails] Reviews response:`, response)
        setReviews(response.data)
      } catch (error) {
        console.error(`[PropertyDetails] Error fetching reviews:`, error)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [id])

  const handleBooking = async () => {
    if (!property || !bookingData.preferredDate || !bookingData.preferredTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setBookingLoading(true)
    try {
      await createBooking({
        propertyId: property._id,
        ...bookingData
      })
      toast({
        title: "Success",
        description: "Booking request sent successfully!",
      })
      setBookingData({ preferredDate: '', preferredTime: '', message: '' })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send booking request",
        variant: "destructive",
      })
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (!property || !user || !reviewData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    console.log(`[PropertyDetails] Submitting review for property ${property._id}`)
    console.log(`[PropertyDetails] Review data:`, reviewData)
    console.log(`[PropertyDetails] User:`, user)

    setReviewLoading(true)
    try {
      if (editingReview) {
        console.log(`[PropertyDetails] Updating existing review: ${editingReview._id}`)
        await updateReview(editingReview._id, reviewData)
        toast({
          title: "Success",
          description: "Review updated successfully!",
        })
      } else {
        console.log(`[PropertyDetails] Creating new property review`)
        const createResponse = await createPropertyReview(property._id, reviewData)
        console.log(`[PropertyDetails] Create review response:`, createResponse)
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        })
      }

      // Refresh reviews
      console.log(`[PropertyDetails] Refreshing reviews for property ${property._id}`)
      const response = await getPropertyReviews(property._id) as any
      console.log(`[PropertyDetails] Refreshed reviews response:`, response)
      setReviews(response.data)

      // Reset form
      setReviewData({ rating: 5, comment: '' })
      setEditingReview(null)
      setReviewDialogOpen(false)
    } catch (error: any) {
      console.error(`[PropertyDetails] Review submission error:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setReviewLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      console.log(`[PropertyDetails] Deleting review: ${reviewId}`)
      await deleteReview(reviewId)
      toast({
        title: "Success",
        description: "Review deleted successfully!",
      })

      // Refresh reviews
      if (property) {
        console.log(`[PropertyDetails] Refreshing reviews after deletion`)
        const response = await getPropertyReviews(property._id) as any
        console.log(`[PropertyDetails] Refreshed reviews after deletion:`, response)
        setReviews(response.data)
      }
    } catch (error: any) {
      console.error(`[PropertyDetails] Review deletion error:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      })
    }
  }

  const startEditReview = (review: Review) => {
    console.log(`[PropertyDetails] Starting to edit review:`, review)
    setEditingReview(review)
    setReviewData({ rating: review.rating, comment: review.comment })
    setReviewDialogOpen(true)
  }

  const nextImage = () => {
    if (property && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  const openImageModal = (index: number) => {
    setModalImageIndex(index)
    setImageModalOpen(true)
  }

  const closeImageModal = () => {
    setImageModalOpen(false)
  }

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageModalOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevModalImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextModalImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageModalOpen]);

  const nextModalImage = () => {
    if (property) {
      setModalImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevModalImage = () => {
    if (property) {
      setModalImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      )
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Property Not Found</h2>
        <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100 cursor-pointer group">
        <img
          src={property.images[currentImageIndex] || '/placeholder-property.jpg'}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={() => openImageModal(currentImageIndex)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-property.jpg';
          }}
        />
        
        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ZoomIn className="h-4 w-4" />
        </div>
        
        {property.images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-blue-600 hover:bg-blue-600">{property.type}</Badge>
                    <Badge className="bg-green-600 hover:bg-green-600">{property.availability}</Badge>
                    {reviews.totalReviews > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{reviews.averageRating}</span>
                        <span className="text-sm text-gray-500">({reviews.totalReviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    ${property.price.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Features */}
              {property.features.bedrooms && (
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 mr-2 text-gray-600" />
                    <span>{property.features.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-5 w-5 mr-2 text-gray-600" />
                    <span>{property.features.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="h-5 w-5 mr-2 text-gray-600" />
                    <span>{property.features.area} sqft</span>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Amenities & Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.features.hasAC && (
                  <div className="flex items-center">
                    <Wind className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Air Conditioning</span>
                  </div>
                )}
                {property.features.hasLift && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Elevator</span>
                  </div>
                )}
                {property.features.hasParking && (
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Parking</span>
                  </div>
                )}
                {property.features.customFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nearby Facilities */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Nearby Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.nearbyFacilities.map((facility, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{facility.name}</span>
                    <span className="text-sm text-gray-600">{facility.distance} km</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reviews & Ratings</CardTitle>
                  <CardDescription>
                    {reviews.totalReviews > 0
                      ? `${reviews.totalReviews} review${reviews.totalReviews > 1 ? 's' : ''} with an average rating of ${reviews.averageRating}/5`
                      : 'No reviews yet'
                    }
                  </CardDescription>
                </div>
                {user && (
                  <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingReview(null)
                          setReviewData({ rating: 5, comment: '' })
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Write a Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>{editingReview ? 'Edit Review' : 'Write a Review'}</DialogTitle>
                        <DialogDescription>
                          Share your experience with this property
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          {renderStars(reviewData.rating, true, (rating) =>
                            setReviewData(prev => ({ ...prev, rating }))
                          )}
                        </div>
                        <div>
                          <Label htmlFor="comment">Comment</Label>
                          <Textarea
                            id="comment"
                            placeholder="Share your thoughts about this property..."
                            value={reviewData.comment}
                            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleReviewSubmit}
                          disabled={reviewLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          {reviewLoading ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : reviews.reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.reviewer.avatar} />
                            <AvatarFallback className="bg-blue-600 text-white text-sm">
                              {review.reviewer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{review.reviewer.name}</div>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {user && user.id === review.reviewerId && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditReview(review)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReview(review._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet. Be the first to review this property!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Property Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={property.owner.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {property.owner.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{property.owner.name}</h4>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span className="text-sm">{property.owner.reputation} rating</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  {property.owner.phone}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  {property.owner.email}
                </Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booking */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Book Viewing</CardTitle>
              <CardDescription>Schedule a visit to this property</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Book Property Viewing</DialogTitle>
                    <DialogDescription>
                      Fill in your preferred date and time for viewing this property.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Preferred Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={bookingData.preferredDate}
                        onChange={(e) => setBookingData(prev => ({ ...prev, preferredDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Preferred Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={bookingData.preferredTime}
                        onChange={(e) => setBookingData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Any specific requirements or questions..."
                        value={bookingData.message}
                        onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <Button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {bookingLoading ? "Sending..." : "Send Booking Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Property Stats */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Property Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{property.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inquiries</span>
                  <span className="font-semibold">{property.inquiries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bookings</span>
                  <span className="font-semibold">{property.bookings}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed</span>
                  <span className="font-semibold">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-[40vw] max-h-[40vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={closeImageModal}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Main image */}
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={property.images[modalImageIndex] || '/placeholder-property.jpg'}
                alt={`${property.title} - Image ${modalImageIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-property.jpg';
                }}
              />
            </div>

            {/* Navigation buttons */}
            {property.images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 border-white/20"
                  onClick={prevModalImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 border-white/20"
                  onClick={nextModalImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {modalImageIndex + 1} of {property.images.length}
            </div>

            {/* Thumbnail strip */}
            {property.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[80vw] overflow-x-auto">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    className={`w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                      index === modalImageIndex 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:border-white/50'
                    }`}
                    onClick={() => setModalImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-property.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}