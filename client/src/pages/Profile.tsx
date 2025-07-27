import { useState, useEffect } from "react"
import { Camera, Edit, Save, X, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getUserReviews, createUserReview, updateReview, deleteReview, Review, ReviewsResponse } from "@/api/reviews"
import { getUserProfile, updateUserProfile, UserProfile } from "@/api/profile"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"

export function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    avatar: ""
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [reviews, setReviews] = useState<ReviewsResponse>({ reviews: [], averageRating: 0, totalReviews: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true)
        const response = await getUserProfile()
        setProfileData(response.user)
        setEditData({
          name: response.user.name || "",
          phone: response.user.phone || "",
          avatar: response.user.avatar || ""
        })
      } catch (error: any) {
        console.error('Failed to load profile:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!profileData?._id) return

      try {
        const response = await getUserReviews(profileData._id) as any
        setReviews(response.data)
      } catch (error) {
        console.error('Failed to load user reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchUserReviews()
  }, [profileData?._id])

  const handleSave = async () => {
    if (!profileData) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', editData.name)
      formData.append('phone', editData.phone)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const response = await updateUserProfile(formData)
      setProfileData(response.user)
      toast({
        title: "Success",
        description: response.message || "Profile updated successfully!",
      })
      setIsEditing(false)
      setAvatarFile(null)
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
      setEditData(prev => ({ ...prev, avatar: URL.createObjectURL(e.target.files[0]) }))
    }
  }

  const handleReviewSubmit = async () => {
    if (!profileData || !reviewData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setReviewLoading(true)
    try {
      if (editingReview) {
        await updateReview(editingReview._id, reviewData)
        toast({
          title: "Success",
          description: "Review updated successfully!",
        })
      } else {
        await createUserReview(profileData._id, reviewData)
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        })
      }

      // Refresh reviews
      const response = await getUserReviews(profileData._id) as any
      setReviews(response.data)

      // Reset form
      setReviewData({ rating: 5, comment: '' })
      setEditingReview(null)
      setReviewDialogOpen(false)
    } catch (error: any) {
      console.error("Review submission error:", error.message)
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
      await deleteReview(reviewId)
      toast({
        title: "Success",
        description: "Review deleted successfully!",
      })

      // Refresh reviews
      if (profileData?._id) {
        const response = await getUserReviews(profileData._id) as any
        setReviews(response.data)
      }
    } catch (error: any) {
      console.error("Delete review error:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      })
    }
  }

  const startEditReview = (review: Review) => {
    setEditingReview(review)
    setReviewData({ rating: review.rating, comment: review.comment })
    setReviewDialogOpen(true)
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

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-16 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Profile not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load your profile information
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and profile picture</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={isEditing ? editData.avatar : profileData.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                      {profileData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          as="span"
                          size="icon"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </label>
                    </>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profileData.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-yellow-500 hover:bg-yellow-500">
                      ⭐ {reviews.averageRating > 0 ? reviews.averageRating : profileData.reputation} Rating
                    </Badge>
                    <Badge variant="outline">
                      Member since {new Date(profileData.joinDate).getFullYear()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? editData.name : profileData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled={true}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={isEditing ? editData.phone : profileData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{profileData.totalListings}</div>
                  <div className="text-sm text-gray-600">Total Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{profileData.totalBookings}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{reviews.averageRating > 0 ? reviews.averageRating : profileData.reputation}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{reviews.totalReviews}</div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Password & Security</h4>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SMS Notifications</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Created new listing", item: "Modern 3BHK Apartment", time: "2 hours ago" },
                  { action: "Received booking request", item: "Luxury Office Space", time: "1 day ago" },
                  { action: "Updated profile information", item: "", time: "3 days ago" },
                  { action: "Sent message", item: "Re: Property inquiry", time: "1 week ago" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">{activity.action}</div>
                      {activity.item && <div className="text-sm text-gray-600">{activity.item}</div>}
                    </div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
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
                        Share your experience with this user
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
                          placeholder="Share your thoughts about this user..."
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
                        {profileData && profileData._id === review.reviewerId && (
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
                  <p>No reviews yet. Be the first to review this user!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}