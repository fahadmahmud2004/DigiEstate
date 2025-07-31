import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Scale, Upload, X, AlertCircle, FileImage } from "lucide-react"
import { createAppeal } from "@/api/appeals"
import { useToast } from "@/hooks/useToast"

interface AppealModalProps {
  isOpen: boolean
  onClose: () => void
  complaintId: string
  propertyId: string
  propertyTitle: string
  complaintType: string
  onAppealSubmitted?: () => void
}

export function AppealModal({ 
  isOpen, 
  onClose, 
  complaintId, 
  propertyId, 
  propertyTitle, 
  complaintType,
  onAppealSubmitted
}: AppealModalProps) {
  const [message, setMessage] = useState("")
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please provide your defense message",
        variant: "destructive"
      })
      return
    }

    if (message.trim().length < 50) {
      toast({
        title: "Error",
        description: "Please provide a more detailed defense (at least 50 characters)",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      await createAppeal({
        complaintId,
        propertyId,
        message: message.trim(),
        evidencePhotos
      })
      
      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted and will be reviewed by our admin team. You will receive a notification once a decision is made.",
      })
      
      // Reset form
      setMessage("")
      setEvidencePhotos([])
      
      // Call callback if provided
      if (onAppealSubmitted) {
        onAppealSubmitted()
      }
      
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit appeal",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check file count limit
    if (evidencePhotos.length + files.length > 5) {
      toast({
        title: "Too Many Files",
        description: "You can upload a maximum of 5 evidence photos",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const newPhotos: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: `${file.name} is too large. Maximum file size is 5MB.`,
            variant: "destructive"
          })
          continue
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not an image file. Please upload only images.`,
            variant: "destructive"
          })
          continue
        }

        // In a real implementation, you would upload these files to your server
        // For now, we'll create object URLs for preview
        const objectUrl = URL.createObjectURL(file)
        newPhotos.push(objectUrl)
      }
      
      setEvidencePhotos([...evidencePhotos, ...newPhotos])
      
      if (newPhotos.length > 0) {
        toast({
          title: "Files Uploaded",
          description: `${newPhotos.length} file(s) uploaded successfully`,
        })
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...evidencePhotos]
    // Revoke the object URL to free memory
    URL.revokeObjectURL(newPhotos[index])
    newPhotos.splice(index, 1)
    setEvidencePhotos(newPhotos)
    
    toast({
      title: "File Removed",
      description: "Evidence photo removed successfully",
    })
  }

  const handleClose = () => {
    // Clean up object URLs when closing
    evidencePhotos.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    
    // Reset form
    setMessage("")
    setEvidencePhotos([])
    setUploading(false)
    setSubmitting(false)
    
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-500" />
            Appeal Complaint Decision
          </DialogTitle>
          <DialogDescription>
            Submit an appeal for the complaint decision regarding your property "{propertyTitle}". 
            Provide a detailed defense and any supporting evidence to help us review your case.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Complaint Information */}
          <div className="bg-muted p-4 rounded-md border-l-4 border-l-orange-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Original Complaint Details</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Type:</strong> {complaintType}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Property:</strong> {propertyTitle}
                </p>
              </div>
            </div>
          </div>
          
          {/* Appeal Message */}
          <div className="grid gap-2">
            <Label htmlFor="message" className="text-base font-medium">
              Your Defense <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Please provide a detailed explanation of why you believe this complaint is unjustified. Include specific facts, circumstances, or evidence that support your position. Be clear and professional in your response..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 50 characters required</span>
              <span>{message.length}/2000</span>
            </div>
          </div>
          
          {/* Evidence Upload */}
          <div className="grid gap-3">
            <Label htmlFor="evidence" className="text-base font-medium">
              Supporting Evidence (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload documents, certificates, photos, or other evidence that supports your appeal. 
              Accepted formats: JPG, PNG, GIF. Maximum 5 files, 5MB each.
            </p>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
              <Input
                id="evidence"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || evidencePhotos.length >= 5}
              />
              <Label
                htmlFor="evidence"
                className={`cursor-pointer flex flex-col items-center gap-3 ${
                  uploading || evidencePhotos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="p-3 bg-muted rounded-full">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">
                    {uploading ? 'Uploading...' : 
                     evidencePhotos.length >= 5 ? 'Maximum files reached' : 
                     'Click to upload evidence photos'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {evidencePhotos.length}/5 files uploaded
                  </p>
                </div>
              </Label>
            </div>
            
            {/* Uploaded Files Preview */}
            {evidencePhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {evidencePhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      <img
                        src={photo}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                      disabled={submitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      <FileImage className="h-3 w-3 inline mr-1" />
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <Scale className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Important Notice</p>
                <ul className="text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Your appeal will be carefully reviewed by our admin team</li>
                  <li>The review process typically takes 3-5 business days</li>
                  <li>You will receive a notification with the final decision</li>
                  <li>Provide honest and accurate information to support your case</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={submitting || uploading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || uploading || !message.trim() || message.trim().length < 50}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Appeal...
              </>
            ) : (
              <>
                <Scale className="h-4 w-4 mr-2" />
                Submit Appeal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
