import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Plus, X, Upload, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createProperty } from "@/api/properties"
import { useToast } from "@/hooks/useToast"

interface PropertyFormData {
  title: string
  description: string
  type: string
  price: number
  location: string
  availability: string
  features: {
    bedrooms?: number
    bathrooms?: number
    floorNumber?: number
    totalFloors?: number
    area?: number
    roadWidth?: number
    isCornerPlot?: boolean
    parkingSpaces?: number
    isFurnished?: boolean
    hasAC: boolean
    hasLift: boolean
    hasParking: boolean
    customFeatures: string[]
  }
  nearbyFacilities: { name: string; distance: number }[]
}

export function CreateListing() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const [customFeature, setCustomFeature] = useState("")
  const [facilityName, setFacilityName] = useState("")
  const [facilityDistance, setFacilityDistance] = useState("")

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PropertyFormData>({
    defaultValues: {
      features: {
        hasAC: false,
        hasLift: false,
        hasParking: false,
        customFeatures: []
      },
      nearbyFacilities: []
    }
  })

  const propertyType = watch("type")
  const customFeatures = watch("features.customFeatures") || []
  const nearbyFacilities = watch("nearbyFacilities") || []

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      setValue("features.customFeatures", [...customFeatures, customFeature.trim()])
      setCustomFeature("")
    }
  }

  const removeCustomFeature = (index: number) => {
    setValue("features.customFeatures", customFeatures.filter((_, i) => i !== index))
  }

  const addFacility = () => {
    if (facilityName.trim() && facilityDistance) {
      setValue("nearbyFacilities", [
        ...nearbyFacilities,
        { name: facilityName.trim(), distance: parseFloat(facilityDistance) }
      ])
      setFacilityName("")
      setFacilityDistance("")
    }
  }

  const removeFacility = (index: number) => {
    setValue("nearbyFacilities", nearbyFacilities.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PropertyFormData) => {
    setLoading(true)
    try {
      await createProperty({
        ...data,
        images,
        videos: []
      })
      toast({
        title: "Success",
        description: "Property listing created successfully!",
      })
      navigate("/my-listings")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create property listing",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, title: "Basic Information", description: "Property details and type" },
    { id: 2, title: "Features & Amenities", description: "Property features and facilities" },
    { id: 3, title: "Images & Location", description: "Photos and nearby facilities" },
    { id: 4, title: "Review & Submit", description: "Review your listing" }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Property Listing</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          List your property and connect with potential buyers or renters
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= step.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step.id}
            </div>
            <div className="ml-3 hidden md:block">
              <p className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-4 ${
                currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  placeholder="e.g., Modern 3BHK Apartment in Downtown"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description", { required: "Description is required" })}
                  placeholder="Describe your property in detail..."
                  rows={4}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Property Type *</Label>
                  <Select onValueChange={(value) => setValue("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flat">Flat</SelectItem>
                      <SelectItem value="Office Apartment">Office Apartment</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Garage">Garage</SelectItem>
                      <SelectItem value="Godown">Godown</SelectItem>
                      <SelectItem value="Plot">Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="availability">Availability *</Label>
                  <Select onValueChange={(value) => setValue("availability", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Occupied">Occupied</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    {...register("price", { required: "Price is required", min: 1 })}
                    placeholder="Enter price"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    {...register("location", { required: "Location is required" })}
                    placeholder="e.g., Downtown, City Center"
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Features & Amenities */}
        {currentStep === 2 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Features & Amenities</CardTitle>
              <CardDescription>Specify the features and amenities of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dynamic fields based on property type */}
              {(propertyType === "Flat" || propertyType === "Office Apartment") && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {propertyType === "Flat" && (
                    <>
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          {...register("features.bedrooms")}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          {...register("features.bathrooms")}
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="floorNumber">Floor Number</Label>
                    <Input
                      id="floorNumber"
                      type="number"
                      {...register("features.floorNumber")}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalFloors">Total Floors</Label>
                    <Input
                      id="totalFloors"
                      type="number"
                      {...register("features.totalFloors")}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {(propertyType === "Land" || propertyType === "Plot") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="area">Area (sq ft)</Label>
                    <Input
                      id="area"
                      type="number"
                      {...register("features.area")}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roadWidth">Road Width (ft)</Label>
                    <Input
                      id="roadWidth"
                      type="number"
                      {...register("features.roadWidth")}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="isCornerPlot"
                      onCheckedChange={(checked) => setValue("features.isCornerPlot", !!checked)}
                    />
                    <Label htmlFor="isCornerPlot">Corner Plot</Label>
                  </div>
                </div>
              )}

              {propertyType === "Office Apartment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                    <Input
                      id="parkingSpaces"
                      type="number"
                      {...register("features.parkingSpaces")}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="isFurnished"
                      onCheckedChange={(checked) => setValue("features.isFurnished", !!checked)}
                    />
                    <Label htmlFor="isFurnished">Furnished</Label>
                  </div>
                </div>
              )}

              {/* Common amenities */}
              <div>
                <Label>Basic Amenities</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasAC"
                      onCheckedChange={(checked) => setValue("features.hasAC", !!checked)}
                    />
                    <Label htmlFor="hasAC">Air Conditioning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasLift"
                      onCheckedChange={(checked) => setValue("features.hasLift", !!checked)}
                    />
                    <Label htmlFor="hasLift">Elevator</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasParking"
                      onCheckedChange={(checked) => setValue("features.hasParking", !!checked)}
                    />
                    <Label htmlFor="hasParking">Parking</Label>
                  </div>
                </div>
              </div>

              {/* Custom Features */}
              <div>
                <Label>Custom Features</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom feature..."
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                  />
                  <Button type="button" onClick={addCustomFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeCustomFeature(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images & Location */}
        {currentStep === 3 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Images & Nearby Facilities</CardTitle>
              <CardDescription>Upload property images and add nearby facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Property Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Drag and drop images here, or click to select</p>
                  <Button type="button" variant="outline" className="mt-2">
                    Select Images
                  </Button>
                </div>
              </div>

              {/* Nearby Facilities */}
              <div>
                <Label>Nearby Facilities</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Facility name (e.g., School, Hospital)"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Distance (km)"
                    value={facilityDistance}
                    onChange={(e) => setFacilityDistance(e.target.value)}
                    className="w-32"
                  />
                  <Button type="button" onClick={addFacility}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 mt-4">
                  {nearbyFacilities.map((facility, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{facility.name}</span>
                        <span className="text-sm text-gray-600">({facility.distance} km)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFacility(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Review Your Listing</CardTitle>
              <CardDescription>Please review all details before submitting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Property Title</h4>
                  <p className="text-gray-600">{watch("title")}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Type & Price</h4>
                  <p className="text-gray-600">{watch("type")} - ${watch("price")?.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Location</h4>
                  <p className="text-gray-600">{watch("location")}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {customFeatures.map((feature, index) => (
                      <Badge key={index} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}