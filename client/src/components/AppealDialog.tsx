import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createAppeal } from "@/api/appeals"
import { useToast } from "@/hooks/useToast"
import { AlertTriangle, MessageSquare } from "lucide-react"

interface AppealDialogProps {
  complaint: {
    _id: string
    type: string
    description: string
    status: string
  }
  property: {
    _id: string
    title: string
  }
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AppealDialog({ complaint, property, isOpen, onOpenChange }: AppealDialogProps) {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please provide a detailed response to the complaint",
        variant: "destructive",
      })
      return
    }

    console.log('Appeal data being sent:', {
      complaint_id: complaint._id,
      property_id: property._id,
      message: message.trim(),
      evidence_photos: []
    })

    setSubmitting(true)
    try {
      await createAppeal({
        complaint_id: complaint._id,
        property_id: property._id,
        message: message.trim(),
        evidence_photos: []
      })

      toast({
        title: "Success",
        description: "Appeal submitted successfully! Our team will review it.",
      })
      
      setMessage("")
      onOpenChange(false)
    } catch (error: any) {
      console.error('Appeal submission error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit appeal",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Appeal Complaint</span>
          </DialogTitle>
          <DialogDescription>
            Provide a detailed response to the complaint about your property
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Property</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="font-medium">{property.title}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Original Complaint</h4>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{complaint.type}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complaint.description}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="appeal-message">Your Response</Label>
            <Textarea
              id="appeal-message"
              placeholder="Please provide a detailed response explaining your side of the story, any clarifications, or evidence that refutes the complaint..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-2">
              Be specific and provide any relevant details that could help resolve this issue.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Appeal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 