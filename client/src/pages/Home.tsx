import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, MapPin, Building, TrendingUp, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProperties, Property } from "@/api/properties"
import { useToast } from "@/hooks/useToast"


export function Home() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await getProperties({ limit: 3, sortBy: 'popular' }) as any
        setFeaturedProperties(response.properties)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load featured properties",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProperties()
  }, [toast])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Find Your Perfect Property
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Discover amazing properties for rent and sale in prime locations
          </p>

          <div className="flex gap-4 max-w-2xl">
          <div className="flex-1 relative">
            {/* 🔍 Icon positioned absolutely inside input container */}
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-300 z-10 pointer-events-none"
            />
            
            {/* 👇 Your custom input, padded left to make room for the icon */}
            <Input
              placeholder="Search by location, property type, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-white/80 dark:bg-white/10 text-black dark:text-white border border-gray-300 dark:border-white/30 placeholder:text-gray-500 dark:placeholder:text-white/70 backdrop-blur-md"
            />
          </div>
            <Button
            onClick={handleSearch}
            className="transition-colors duration-200
                      bg-white text-blue-600 hover:bg-gray-100
                      dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
          >
            Search
          </Button>
          </div>

          <div className="flex gap-4 mt-6">
          <Link to="/properties?type=rent">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 dark:border-white/30 dark:text-white dark:hover:bg-white/20
                        border-gray-300 text-blue-700 hover:bg-gray-100"
            >
              For Rent
            </Button>
          </Link>
          <Link to="/properties?type=sale">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 dark:border-white/30 dark:text-white dark:hover:bg-white/20
                        border-gray-300 text-blue-700 hover:bg-gray-100"
            >
              For Sale
            </Button>
          </Link>
        </div>
        </div>

        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Building, label: "Active Listings", value: "1,234", color: "text-blue-600" },
          { icon: Users, label: "Happy Customers", value: "5,678", color: "text-green-600" },
          { icon: TrendingUp, label: "Properties Sold", value: "890", color: "text-purple-600" },
          { icon: Star, label: "Average Rating", value: "4.8", color: "text-yellow-600" },
        ].map((stat, index) => (
          <Card key={index} className="bg-card-solid border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-readable">{stat.value}</div>
              <div className="text-sm text-muted-readable">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Properties */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-readable">Featured Properties</h2>
          <Link to="/properties">
            <Button variant="outline" className="border-gray-200 dark:border-gray-700">View All Properties</Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
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
                  </div>
                  <CardContent className="p-6 bg-card-solid">
                    <h3 className="font-semibold text-lg mb-2 text-readable line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-muted-readable mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm line-clamp-1">{property.location}</span>
                    </div>
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building className="h-6 w-6" />
              List Your Property
            </CardTitle>
            <CardDescription className="text-green-100">
              Start earning by listing your property on our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/create-listing">
              <Button className="bg-white text-green-600 hover:bg-white/90">
                Create Listing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-6 w-6" />
              Find Properties
            </CardTitle>
            <CardDescription className="text-purple-100">
              Browse through thousands of verified properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/properties">
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                Browse Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}