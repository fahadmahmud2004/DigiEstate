import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { MapPin, Star, Bed, Bath, Square, Phone, Mail, ArrowLeft, Eye, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getPropertyById, Property } from "@/api/properties"
import { updatePropertyStatus, deleteProperty } from "@/api/admin"
import { useToast } from "@/hooks/useToast"

export function AdminPropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusReason, setStatusReason] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const response = await getPropertyById(id)
        setProperty(response.property)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load property",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id, toast])

  const handleUpdateStatus = async (status: string) => {
    if (!property) return
    
    try {
      const response = await updatePropertyStatus(property._id, status, statusReason)
      setStatusReason("")
      setShowFlagDialog(false)
      toast({
        title: "Success",
        description: response.message,
      })
      // Navigate back to properties list
      navigate('/admin/properties')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteProperty = async () => {
    if (!property) return
    
    try {
      const response = await deleteProperty(property._id, deleteReason)
      setShowDeleteDialog(false)
      setDeleteReason("")
      toast({
        title: "Success",
        description: response.message,
      })
      // Navigate back to properties list
      navigate('/admin/properties')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default'
      case 'Pending Verification':
        return 'secondary'
      case 'Flagged':
      case 'Rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-readable mb-2">Property not found</h3>
        <p className="text-muted-readable">The property you're looking for doesn't exist.</p>
        <Link to="/admin/properties">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/admin/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-readable">{property.title}</h1>
            <p className="text-muted-readable mt-1">
              Property ID: {property._id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(property.status)}>
            {property.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.images.length > 0 ? (
                  property.images.map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-property.jpg';
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-readable">No images available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-readable mb-2">Description</h3>
                <p className="text-muted-readable">{property.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-readable mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-readable">Type:</span>
                      <span className="text-readable">{property.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-readable">Price:</span>
                      <span className="text-readable font-semibold">${property.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-readable">Availability:</span>
                      <span className="text-readable">{property.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-readable">Location:</span>
                      <span className="text-readable">{property.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-readable mb-2">Features</h4>
                  <div className="space-y-2 text-sm">
                    {property.features?.bedrooms && (
                      <div className="flex justify-between">
                        <span className="text-muted-readable">Bedrooms:</span>
                        <span className="text-readable">{property.features.bedrooms}</span>
                      </div>
                    )}
                    {property.features?.bathrooms && (
                      <div className="flex justify-between">
                        <span className="text-muted-readable">Bathrooms:</span>
                        <span className="text-readable">{property.features.bathrooms}</span>
                      </div>
                    )}
                    {property.features?.area && (
                      <div className="flex justify-between">
                        <span className="text-muted-readable">Area:</span>
                        <span className="text-readable">{property.features.area} sq ft</span>
                      </div>
                    )}
                    {property.features?.parkingSpaces && (
                      <div className="flex justify-between">
                        <span className="text-muted-readable">Parking:</span>
                        <span className="text-readable">{property.features.parkingSpaces} spaces</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nearby Facilities */}
              {property.nearbyFacilities && property.nearbyFacilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-readable mb-2">Nearby Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.nearbyFacilities.map((facility, index) => (
                      <Badge key={index} variant="outline">
                        {facility.name} ({facility.distance}km)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Stats */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Property Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{property.views}</div>
                  <div className="text-sm text-muted-readable">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{property.inquiries}</div>
                  <div className="text-sm text-muted-readable">Inquiries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{property.bookings}</div>
                  <div className="text-sm text-muted-readable">Bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Property Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  {/* Assuming owner has a 'user' field with name and email */}
                  {/* This part of the original code was not updated by the user's edit */}
                  {/* For now, we'll just show a placeholder or remove if not available */}
                  {/* <User className="h-5 w-5 text-blue-600 dark:text-blue-400" /> */}
                </div>
                <div>
                  <div className="font-medium text-readable">{property.owner?.name || 'N/A'}</div>
                  <div className="text-sm text-muted-readable">{property.owner?.email || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-readable">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Reputation: {property.owner?.reputation || 4.5}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View as User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-readable">View as User</DialogTitle>
                    <DialogDescription className="text-muted-readable">
                      This will open the property in user view mode
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Link to={`/properties/${property._id}`} target="_blank">
                      <Button>Open in New Tab</Button>
                    </Link>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Property
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-readable">Edit Property</DialogTitle>
                    <DialogDescription className="text-muted-readable">
                      Edit property details and information
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Property Dialog */}
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Property
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-readable">Delete Property</DialogTitle>
                    <DialogDescription className="text-muted-readable">
                      This action cannot be undone. This will permanently delete the property and notify the owner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-readable">Delete Reason (Optional)</label>
                      <Textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Enter reason for deletion..."
                        className="bg-card-solid border-gray-200 dark:border-gray-700 mt-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteProperty}>
                      Delete Property
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-readable">Status Change Reason (Optional)</label>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className="bg-card-solid border-gray-200 dark:border-gray-700 mt-2"
                />
              </div>

              <div className="space-y-2">
                {property.status === 'Pending Verification' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus('Active')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Property
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus('Rejected')}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Property
                    </Button>
                  </>
                )}
                {property.status === 'Active' && (
                  <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Flag Property
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-readable">Flag Property</DialogTitle>
                        <DialogDescription className="text-muted-readable">
                          Flag this property for review. The owner will be notified.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-readable">Flag Reason (Optional)</label>
                          <Textarea
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder="Enter reason for flagging..."
                            className="bg-card-solid border-gray-200 dark:border-gray-700 mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => handleUpdateStatus('Flagged')}>
                          Flag Property
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {property.status === 'Flagged' && (
                  <Button
                    onClick={() => handleUpdateStatus('Active')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unflag Property
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 