import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, Controller, FieldName } from "react-hook-form"
import { useDropzone } from 'react-dropzone'
import { Plus, X, Upload, MapPin, Building, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createProperty } from "@/api/properties"
import { useToast } from "@/hooks/useToast"

interface PropertyFormData {
  listingType: 'Sale' | 'Rent'
  title: string
  description: string
  type: string
  price: number
  location: string
  availability: string
  features: {
    bedrooms?: number;
    bathrooms?: number;
    floorNumber?: number;
    totalFloors?: number;
    area?: number;
    roadWidth?: number;
    isCornerPlot?: boolean;
    parkingSpaces?: number;
    isFurnished?: boolean;
    hasAC: boolean;
    hasLift: boolean;
    hasParking: boolean;
    customFeatures: string[];
  }
  nearbyFacilities: { name: string; distance: number }[]
}

export function CreateListing() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<File[]>([])
  const [customFeature, setCustomFeature] = useState("")
  const [facilityName, setFacilityName] = useState("")
  const [facilityDistance, setFacilityDistance] = useState("")

  const { register, handleSubmit, watch, setValue, control, trigger, formState: { errors } } = useForm<PropertyFormData>({
    defaultValues: {
      listingType: 'Sale',
      features: {
        hasAC: false, hasLift: false, hasParking: false, isCornerPlot: false, isFurnished: false, customFeatures: []
      },
      nearbyFacilities: []
    }
  })

  const propertyType = watch("type")
  const customFeatures = watch("features.customFeatures") || []
  const nearbyFacilities = watch("nearbyFacilities") || []

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      setValue("features.customFeatures", [...customFeatures, customFeature.trim()]); setCustomFeature("");
    }
  }
  const removeCustomFeature = (index: number) => {
    setValue("features.customFeatures", customFeatures.filter((_, i) => i !== index));
  }
  const addFacility = () => {
    if (facilityName.trim() && facilityDistance) {
      setValue("nearbyFacilities", [...nearbyFacilities, { name: facilityName.trim(), distance: parseFloat(facilityDistance) }]);
      setFacilityName(""); setFacilityDistance("");
    }
  }
  const removeFacility = (index: number) => {
    setValue("nearbyFacilities", nearbyFacilities.filter((_, i) => i !== index));
  }
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prevImages => [...prevImages, ...acceptedFiles].slice(0, 10));
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] }
  });
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (images.length === 0) {
      toast({ title: "Images Required", description: "Please upload at least one image.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    
    const dataToSend = { ...data };
    delete (dataToSend as any).images;

    Object.entries(dataToSend).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));
    });

    images.forEach(imageFile => {
      formData.append('images', imageFile);
    });

    try {
      await createProperty(formData);
      toast({ title: "Success", description: "Property listing created successfully!" });
      navigate("/my-listings");
    } catch (error) {
      toast({ title: "Error", description: "Failed to create property listing.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // **THE FIX IS HERE:** This function validates the current step before proceeding.
  const handleNext = async () => {
    let fieldsToValidate: FieldName<PropertyFormData>[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'type', 'availability', 'price', 'location'];
    }
    // Add validation for other steps if needed
    // if (currentStep === 2) { ... }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(s => s + 1);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { id: 1, title: "Basic Information" }, { id: 2, title: "Features & Amenities" },
    { id: 3, title: "Images & Facilities" }, { id: 4, title: "Review & Submit" }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-3xl font-bold">Create Property Listing</h1>
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-grow">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{step.id}</div>
            <p className={`ml-2 text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.title}</p>
            {index < steps.length - 1 && <div className={`flex-grow h-1 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 1 && (
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Controller name="listingType" control={control} render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                  <Label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 justify-center"><RadioGroupItem value="Sale" id="sale" /><Home className="h-4 w-4" /> For Sale</Label>
                  <Label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 justify-center"><RadioGroupItem value="Rent" id="rent" /><Building className="h-4 w-4" /> For Rent</Label>
                </RadioGroup>
              )} />
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input id="title" {...register("title", { required: "Title is required" })} />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" {...register("description", { required: "Description is required" })} rows={4} />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Property Type *</Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: "Property type is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Flat">Flat</SelectItem>
                          <SelectItem value="Office Apartment">Office Apartment</SelectItem>
                          <SelectItem value="Land">Land</SelectItem>
                          <SelectItem value="Garage">Garage</SelectItem>
                          <SelectItem value="Godown">Godown</SelectItem>
                          <SelectItem value="Plot">Plot</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                </div>
                <div>
                  <Label>Availability *</Label>
                  <Controller
                    name="availability"
                    control={control}
                    rules={{ required: "Availability is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Occupied">Occupied</SelectItem>
                          <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.availability && <p className="text-red-500 text-sm mt-1">{errors.availability.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" type="number" {...register("price", { required: "Price is required", valueAsNumber: true, min: { value: 1, message: "Price must be greater than 0" } })} />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" {...register("location", { required: "Location is required" })} />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === 2 && (
          <Card>
            <CardHeader><CardTitle>Features & Amenities</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {(propertyType === "Flat" || propertyType === "Office Apartment") && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {propertyType === "Flat" && <>
                    <div><Label>Bedrooms</Label><Input type="number" {...register("features.bedrooms", { valueAsNumber: true, min: 0 })} /></div>
                    <div><Label>Bathrooms</Label><Input type="number" {...register("features.bathrooms", { valueAsNumber: true, min: 0 })} /></div>
                  </>}
                  <div><Label>Floor Number</Label><Input type="number" {...register("features.floorNumber", { valueAsNumber: true, min: 0 })} /></div>
                  <div><Label>Total Floors</Label><Input type="number" {...register("features.totalFloors", { valueAsNumber: true, min: { value: 1, message: "Total floors must be at least 1" } })} /></div>
                </div>
              )}
              {(propertyType === "Land" || propertyType === "Plot") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div><Label>Area (sq ft)</Label><Input type="number" {...register("features.area", { valueAsNumber: true, min: 1 })} /></div>
                  <div><Label>Road Width (ft)</Label><Input type="number" {...register("features.roadWidth", { valueAsNumber: true, min: 1 })} /></div>
                  <div className="flex items-center gap-2 pt-6"><Controller name="features.isCornerPlot" control={control} render={({ field }) => <Checkbox id="isCornerPlot" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="isCornerPlot">Corner Plot</Label></div>
                </div>
              )}
              {propertyType === "Office Apartment" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div><Label>Parking Spaces</Label><Input type="number" {...register("features.parkingSpaces", { valueAsNumber: true, min: 0 })} /></div>
                    <div className="flex items-center gap-2 pt-6"><Controller name="features.isFurnished" control={control} render={({ field }) => <Checkbox id="isFurnished" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="isFurnished">Furnished</Label></div>
                 </div>
              )}
              <div>
                <Label>Basic Amenities</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center gap-2"><Controller name="features.hasAC" control={control} render={({ field }) => <Checkbox id="hasAC" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="hasAC">A/C</Label></div>
                  <div className="flex items-center gap-2"><Controller name="features.hasLift" control={control} render={({ field }) => <Checkbox id="hasLift" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="hasLift">Elevator</Label></div>
                  <div className="flex items-center gap-2"><Controller name="features.hasParking" control={control} render={({ field }) => <Checkbox id="hasParking" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="hasParking">Parking</Label></div>
                </div>
              </div>
              <div>
                <Label>Custom Features</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="e.g., Rooftop Garden" value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} />
                  <Button type="button" onClick={addCustomFeature}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeCustomFeature(index)} /></Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === 3 && (
          <Card>
            <CardHeader><CardTitle>Images & Nearby Facilities</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Property Images *</Label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-blue-500' : 'border-gray-300'}`}>
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p>{isDragActive ? "Drop files here" : "Drag & drop, or click to select"}</p>
                </div>
                {images.length === 0 && errors.root && <p className="text-red-500 text-sm mt-1">At least one image is required.</p>}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative"><img src={URL.createObjectURL(file)} alt="" className="w-full h-24 object-cover rounded-md" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={() => removeImage(index)}><X className="h-3 w-3" /></Button></div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Nearby Facilities</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Facility name" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
                  <Input type="number" placeholder="Distance (km)" value={facilityDistance} onChange={(e) => setFacilityDistance(e.target.value)} className="w-40" />
                  <Button type="button" onClick={addFacility}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2 mt-4">
                  {nearbyFacilities.map((facility, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded"><span>{facility.name} ({facility.distance} km)</span><Button type="button" variant="ghost" size="sm" onClick={() => removeFacility(index)}><X className="h-4 w-4" /></Button></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === 4 && (
            <Card>
                <CardHeader><CardTitle>Review Your Listing</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Title:</strong> {watch("title")}</p>
                    <p><strong>Listing Type:</strong> {watch("listingType")}</p>
                    <p><strong>Property Type:</strong> {watch("type")}</p>
                    <p><strong>Price:</strong> ${watch("price")?.toLocaleString()}</p>
                    <p><strong>Location:</strong> {watch("location")}</p>
                    <p><strong>Description:</strong> {watch("description")}</p>
                    <div><strong>Images:</strong><div className="mt-2 grid grid-cols-4 gap-4">{images.map((file, index) => (<img key={index} src={URL.createObjectURL(file)} alt="" className="w-full h-20 object-cover rounded" />))}</div></div>
                </CardContent>
            </Card>
        )}
        <div className="flex justify-between mt-8">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1}>Previous</Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={handleNext}>Next</Button>
          ) : (
            <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Listing"}</Button>
          )}
        </div>
      </form>
    </div>
  )
}
