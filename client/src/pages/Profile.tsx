import { useState, useEffect } from "react"
import { Camera, Edit, Save, X, Star, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getUserReviews, createUserReview, updateReview, deleteReview, Review, ReviewsResponse } from "@/api/reviews"
import { getUserProfile, updateUserProfile, changePassword, UserProfile } from "@/api/profile"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { getAvatarUrl } from "@/lib/utils"

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
  
  // Password change states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
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
          avatar: getAvatarUrl(response.user.avatar)
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
      // Update editData with the correct avatar URL after save
      setEditData(prev => ({
        ...prev,
        avatar: getAvatarUrl(response.user.avatar)
      }))
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
    const files = e.target.files
    if (files && files[0]) {
      setAvatarFile(files[0])
      setEditData(prev => ({ ...prev, avatar: URL.createObjectURL(files[0]) }))
    }
  }

  const handlePasswordChange = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast({
        title: "Success",
        description: response.message || "Password changed successfully!",
      })
      setPasswordDialogOpen(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      console.error('Password change error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  const handleReviewSubmit = async () => {
    if (!reviewData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    setReviewLoading(true)
    try {
      if (editingReview) {
        await updateReview(editingReview._id, { rating: reviewData.rating, comment: reviewData.comment })
        toast({
          title: "Success",
          description: "Review updated successfully!",
        })
      } else {
        await createUserReview(profileData!._id, { rating: reviewData.rating, comment: reviewData.comment })
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        })
      }

      // Refresh reviews
      if (profileData?._id) {
        const response = await getUserReviews(profileData._id) as any
        setReviews(response.data)
      }

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

      {/* Profile Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile information and avatar</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={loading} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editData.avatar} alt={profileData.name} />
                    <AvatarFallback className="text-lg">
                      {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profileData.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={profileData.status === 'active' ? 'default' : 'secondary'}>
                      {profileData.status}
                    </Badge>
                    <Badge variant="outline">{profileData.role}</Badge>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profileData.totalListings || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profileData.totalBookings || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{profileData.reputation || 4.5}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
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
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new password
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Enter your current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setPasswordDialogOpen(false)
                          resetPasswordForm()
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                          {passwordLoading ? 'Changing...' : 'Change Password'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                          value={reviewData.comment}
                          onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Share your experience..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleReviewSubmit} disabled={reviewLoading}>
                        {reviewLoading ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : reviews.reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.reviews.map((review) => (
                    <div key={review._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">by {review.reviewer.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditReview(review)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReview(review._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}