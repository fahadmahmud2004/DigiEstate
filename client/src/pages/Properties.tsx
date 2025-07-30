import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search, Filter, MapPin, Star, Bed, Bath, Square, Grid, List, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { getProperties, Property, PropertyFilters } from "@/api/properties"
import { useToast } from "@/hooks/useToast"
import { Label } from "@/components/ui/label"

export function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
  const amenities = ['AC', 'Lift', 'Parking']

  const loadMore = () => {
    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Properties
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Find your perfect property from our curated collection
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="hidden md:flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {total > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{properties.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{total}</span> properties
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by location, property type, or features..."
                  className="pl-12 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="w-full sm:w-40 h-12 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-full sm:w-44 h-12 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 px-6 border-gray-300 dark:border-gray-600">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-96 bg-white dark:bg-gray-800">
                  <SheetHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <SheetTitle className="text-gray-900 dark:text-white">Filter Properties</SheetTitle>
                    <SheetDescription className="text-gray-600 dark:text-gray-400">
                      Refine your search with specific criteria
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-8 mt-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    
                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Price Range</h3>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => {
                          setPriceRange(value)
                          handleFilterChange('priceMin', value[0])
                          handleFilterChange('priceMax', value[1])
                        }}
                        max={5000000}
                        step={50000}
                        className="mb-3"
                      />
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>${priceRange[0].toLocaleString()}</span>
                        <span>${priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Property Type */}
                    <div>
                      <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Property Type</h3>
                      <Select onValueChange={(value) => handleFilterChange('propertyType', value === 'any' ? undefined : value)}>
                        <SelectTrigger className="border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Property Type</SelectItem>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Bedrooms & Bathrooms */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Bedrooms</h3>
                        <Select onValueChange={(value) => handleFilterChange('bedrooms', value === 'any' ? undefined : parseInt(value))}>
                          <SelectTrigger className="border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Bathrooms</h3>
                        <Select onValueChange={(value) => handleFilterChange('bathrooms', value === 'any' ? undefined : parseInt(value))}>
                          <SelectTrigger className="border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Amenities */}
                    <div>
                      <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Amenities</h3>
                      <div className="space-y-3">
                        {amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-3">
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
                            <label htmlFor={amenity} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              {amenity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Additional Filters */}
                    <div>
                      <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Additional Details</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="area" className="text-sm text-gray-600 dark:text-gray-400">Minimum Area (sq ft)</Label>
                          <Input
                            id="area"
                            type="number"
                            min={0}
                            placeholder="e.g., 1000"
                            className="mt-1 border-gray-300 dark:border-gray-600"
                            onChange={(e) => handleFilterChange('area', e.target.value ? Math.max(0, parseInt(e.target.value)) : undefined)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="isCornerPlot"
                              onCheckedChange={(checked) => handleFilterChange('isCornerPlot', checked)}
                            />
                            <label htmlFor="isCornerPlot" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              Corner Plot
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="isFurnished"
                              onCheckedChange={(checked) => handleFilterChange('isFurnished', checked)}
                            />
                            <label htmlFor="isFurnished" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              Furnished
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button onClick={handleSearch} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4 w-3/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search criteria or filters to find more properties.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ page: 1, limit: 12, sortBy: 'newest' })
                  setSearchQuery('')
                  setPriceRange([0, 5000000])
                }}
                className="border-gray-300 dark:border-gray-600"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {properties.map((property) => (
              <Link key={property._id} to={`/properties/${property._id}`} className="group">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600">
                  
                  {/* Property Image */}
                  <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={property.images[0] || '/placeholder-property.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-property.jpg';
                      }}
                    />
                    
                    {/* Property Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className="bg-white/90 text-gray-800 backdrop-blur-sm hover:bg-white/90 font-medium">
                        {property.type}
                      </Badge>
                      {property.listingType && (
                        <Badge className={`font-medium ${
                          property.listingType === 'Rent' 
                            ? 'bg-green-500/90 text-white hover:bg-green-500/90' 
                            : 'bg-blue-500/90 text-white hover:bg-blue-500/90'
                        } backdrop-blur-sm`}>
                          For {property.listingType}
                        </Badge>
                      )}
                    </div>

                    {/* Image Count */}
                    {property.images.length > 1 && (
                      <Badge className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/70 backdrop-blur-sm">
                        {property.images.length} photos
                      </Badge>
                    )}

                    {/* Availability Status */}
                    <div className="absolute bottom-4 right-4">
                      <Badge className={`font-medium ${
                        property.availability === 'Available' 
                          ? 'bg-emerald-500/90 text-white hover:bg-emerald-500/90' 
                          : 'bg-orange-500/90 text-white hover:bg-orange-500/90'
                      } backdrop-blur-sm`}>
                        {property.availability}
                      </Badge>
                    </div>
                  </div>

                  {/* Property Details */}
                  <CardContent className="p-6">
                    
                    {/* Property Title */}
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm line-clamp-1">{property.location}</span>
                    </div>

                    {/* Property Features */}
                    {property.features.bedrooms && (
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span>{property.features.bedrooms} bed{property.features.bedrooms > 1 ? 's' : ''}</span>
                        </div>
                        {property.features.bathrooms && (
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            <span>{property.features.bathrooms} bath{property.features.bathrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {property.features.area && (
                          <div className="flex items-center">
                            <Square className="h-4 w-4 mr-1" />
                            <span>{property.features.area.toLocaleString()} sqft</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${property.price.toLocaleString()}
                        {property.listingType === 'Rent' && <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>}
                      </div>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        <span className="text-sm font-medium">{property.owner.reputation}</span>
                      </div>
                    </div>

                    {/* Property Stats */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <span>{property.views} views</span>
                      <span>Listed {new Date(property.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && properties.length > 0 && filters.page && filters.page < totalPages && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={loadMore}
            >
              Load More Properties
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}