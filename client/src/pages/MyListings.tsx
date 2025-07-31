import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Edit, Trash2, Eye, MessageCircle, Calendar, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getMyListings, deleteProperty, Property } from "@/api/properties"
import { useToast } from "@/hooks/useToast"

export function MyListings() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const response = await getMyListings() as any
        setProperties(response.properties)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your listings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMyListings()
  }, [toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-600 hover:bg-green-600'
      case 'Pending Verification':
        return 'bg-yellow-600 hover:bg-yellow-600'
      case 'Flagged':
        return 'bg-red-600 hover:bg-red-600'
      case 'Rejected':
        return 'bg-gray-800 hover:bg-gray-800'  // Dark gray for rejected/deleted by admin
      default:
        return 'bg-gray-600 hover:bg-gray-600'
    }
  }

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return

    setDeleteLoading(propertyToDelete._id)
    try {
      await deleteProperty(propertyToDelete._id)
      
      // Remove the deleted property from the list
      setProperties(prev => prev.filter(p => p._id !== propertyToDelete._id))
      
      toast({
        title: "Success",
        description: "Property deleted successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
      setDeleteDialogOpen(false)
      setPropertyToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPropertyToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Listings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your property listings and track their performance
          </p>
        </div>
        <Link to="/create-listing">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Create New Listing
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {properties.filter(p => p.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {properties.reduce((sum, p) => sum + p.views, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {properties.reduce((sum, p) => sum + p.inquiries, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Inquiries</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">
              {properties.reduce((sum, p) => sum + p.bookings, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="h-48 bg-gray-200 animate-pulse rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No listings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first property listing to get started
            </p>
            <Link to="/create-listing">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Create Your First Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={property.images[0] || '/placeholder-property.jpg'}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-3 left-3 ${getStatusColor(property.status)}`}>
                  {property.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-lg">
                    {property.status !== 'Rejected' && (
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Listing
                      </DropdownMenuItem>
                    )}
                    <Link to={`/properties/${property._id}`}>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </Link>
                    {property.status !== 'Rejected' && (
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteClick(property)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Listing
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {property.description}
                </p>

                {/* Show note for rejected properties */}
                {property.status === 'Rejected' && (
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-3 mb-3 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Property Removed:</strong> This property was removed by an administrator. 
                      You can still view its details and performance metrics here.
                    </p>
                  </div>
                )}

                <div className="text-2xl font-bold text-blue-600 mb-4">
                  ${property.price.toLocaleString()}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{property.views}</div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{property.inquiries}</div>
                    <div className="text-xs text-gray-600">Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{property.bookings}</div>
                    <div className="text-xs text-gray-600">Bookings</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link to={`/properties/${property._id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  {property.status !== 'Rejected' && (
                    <>
                      <Button variant="outline" size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{propertyToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteLoading === propertyToDelete?._id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading === propertyToDelete?._id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}