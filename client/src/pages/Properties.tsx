import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search, Filter, MapPin, Star, Bed, Bath, Square, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getProperties, Property, PropertyFilters } from "@/api/properties"
import { useToast } from "@/hooks/useToast"

export function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<PropertyFilters>({
    search: searchParams.get('search') || '',
    page: 1,
    limit: 12,
    sortBy: 'newest'
  })
  const [priceRange, setPriceRange] = useState([0, 5000000])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        const response = await getProperties(filters) as any
        setProperties(response.properties)
        setTotal(response.total)
        setTotalPages(response.totalPages)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load properties",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [filters, toast])

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchQuery, page: 1 }
    setFilters(newFilters)

    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams)
    if (searchQuery) {
      newSearchParams.set('search', searchQuery)
    } else {
      newSearchParams.delete('search')
    }
    setSearchParams(newSearchParams)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const propertyTypes = ['Flat', 'Office Apartment', 'Land', 'Garage', 'Godown', 'Plot']
  const amenities = ['AC', 'Lift', 'Parking', 'Gym', 'Swimming Pool', 'Security']

  const loadMore = () => {
    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-readable">Browse Properties</h1>
          <p className="text-muted-readable mt-1">
            Discover your perfect property from our extensive collection
          </p>
          {total > 0 && (
            <p className="text-sm text-muted-readable mt-1">
              Showing {properties.length} of {total} properties
            </p>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search properties by title, location, or type..."
            className="pl-10 bg-card-translucent border-gray-200 dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
          Search
        </Button>

        <Select onValueChange={(value) => handleFilterChange('type', value)}>
          <SelectTrigger className="w-48 bg-card-translucent border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent className="bg-card-solid border-gray-200 dark:border-gray-700">
            <SelectItem value="rent">For Rent</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-48 bg-card-translucent border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="bg-card-solid border-gray-200 dark:border-gray-700">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-card-translucent border-gray-200 dark:border-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card-solid border-gray-200 dark:border-gray-700">
            <SheetHeader>
              <SheetTitle className="text-readable">Filter Properties</SheetTitle>
              <SheetDescription className="text-muted-readable">
                Refine your search with advanced filters
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3 text-readable">Price Range</h3>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value)
                    handleFilterChange('priceMin', value[0])
                    handleFilterChange('priceMax', value[1])
                  }}
                  max={5000000}
                  step={50000}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-readable">
                  <span>${priceRange[0].toLocaleString()}</span>
                  <span>${priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Property Types */}
              <div>
                <h3 className="font-medium mb-3 text-readable">Property Type</h3>
                <div className="space-y-2">
                  {propertyTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={type}
                        onCheckedChange={(checked) => {
                          const currentTypes = filters.propertyType || []
                          if (checked) {
                            handleFilterChange('propertyType', [...currentTypes, type])
                          } else {
                            handleFilterChange('propertyType', currentTypes.filter(t => t !== type))
                          }
                        }}
                      />
                      <label htmlFor={type} className="text-sm text-readable">{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <h3 className="font-medium mb-3 text-readable">Bedrooms</h3>
                <Select onValueChange={(value) => handleFilterChange('bedrooms', parseInt(value))}>
                  <SelectTrigger className="bg-card-solid border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <h3 className="font-medium mb-3 text-readable">Bathrooms</h3>
                <Select onValueChange={(value) => handleFilterChange('bathrooms', parseInt(value))}>
                  <SelectTrigger className="bg-card-solid border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-medium mb-3 text-readable">Amenities</h3>
                <div className="space-y-2">
                  {amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox 
                        id={amenity}
                        onCheckedChange={(checked) => {
                          const currentAmenities = filters.amenities || []
                          if (checked) {
                            handleFilterChange('amenities', [...currentAmenities, amenity])
                          } else {
                            handleFilterChange('amenities', currentAmenities.filter(a => a !== amenity))
                          }
                        }}
                      />
                      <label htmlFor={amenity} className="text-sm text-readable">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card-solid border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-readable mb-2">No properties found</h3>
          <p className="text-muted-readable">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link key={property._id} to={`/properties/${property._id}`}>
              <Card className="bg-card-solid border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={property.images[0] || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-600 text-white">
                    {property.type}
                  </Badge>
                  <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-600 text-white">
                    {property.availability}
                  </Badge>
                  {property.images.length > 1 && (
                    <Badge className="absolute bottom-3 right-3 bg-black/70 text-white hover:bg-black/70">
                      +{property.images.length - 1} photos
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6 bg-card-solid">
                  <h3 className="font-semibold text-lg mb-2 text-readable line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-muted-readable mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm line-clamp-1">{property.location}</span>
                  </div>

                  {/* Property Features */}
                  {property.features.bedrooms && (
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-readable">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.features.bedrooms} bed
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.features.bathrooms} bath
                      </div>
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        {property.features.area} sqft
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      ${property.price.toLocaleString()}
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current mr-1" />
                      <span className="text-sm">{property.owner.reputation}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && properties.length > 0 && filters.page && filters.page < totalPages && (
        <div className="text-center">
          <Button 
            variant="outline" 
            className="bg-card-translucent border-gray-200 dark:border-gray-700"
            onClick={loadMore}
          >
            Load More Properties
          </Button>
        </div>
      )}
    </div>
  )
}