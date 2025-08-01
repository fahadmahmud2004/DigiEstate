import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { getOwnerComplaints, Complaint } from "@/api/complaints"
import { AppealDialog } from "@/components/AppealDialog"
import { sendMessage } from "@/api/messages"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  Calendar,
  MessageSquare,
  Gavel,
  User
} from "lucide-react"

export function PropertyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [appealDialogOpen, setAppealDialogOpen] = useState(false)
  const [messagingOwner, setMessagingOwner] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const response = await getOwnerComplaints()
      setComplaints(response.complaints)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'destructive'
      case 'in-progress': return 'secondary'
      case 'resolved': return 'default'
      case 'dismissed': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fraudulent Listing': return <AlertTriangle className="h-4 w-4" />
      case 'Inappropriate Behavior': return <FileText className="h-4 w-4" />
      case 'Payment Issues': return <MessageSquare className="h-4 w-4" />
      case 'Other': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleAppealClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setAppealDialogOpen(true)
  }

  const handleMessageComplainant = async (complaint: Complaint) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to send a message",
        variant: "destructive",
      })
      return
    }

    setMessagingOwner(true)
    try {
      await sendMessage({
        receiverId: complaint.complainant._id,
        content: `Hi! I'm the owner of the property "${complaint.target.name}" that you complained about. I'd like to discuss this with you and address your concerns.`,
        propertyId: complaint.target._id
      })

      toast({
        title: "Success",
        description: "Message sent successfully! Redirecting to messages...",
      })

      // Redirect to messages page after a short delay
      setTimeout(() => {
        navigate('/messages')
      }, 1500)

    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setMessagingOwner(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-readable">Property Complaints</h1>
          <p className="text-muted-readable">View and respond to complaints about your properties</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {complaints.filter(c => c.status === 'open').length} Open
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {complaints.filter(c => c.status === 'in-progress').length} In Progress
          </Badge>
          <Badge variant="default" className="text-sm">
            {complaints.filter(c => c.status === 'resolved').length} Resolved
          </Badge>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Complaints
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Great news! No complaints have been filed against your properties.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(complaint.type)}
                    <div>
                      <CardTitle className="text-lg">Complaint #{complaint._id.slice(-8)}</CardTitle>
                      <CardDescription>
                        Property: {complaint.target.name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(complaint.status)}>
                    {complaint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Complaint Details</h4>
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

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Complainant:</span>
                      <div className="text-gray-600 dark:text-gray-400">
                        {complaint.complainant.name}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Filed:</span>
                      <div className="text-gray-600 dark:text-gray-400">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {complaint.resolution && (
                    <div>
                      <h4 className="font-medium mb-2">Admin Resolution</h4>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gavel className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Administrator</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {complaint.resolution}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {complaint.status === 'open' && (
                        <>
                          <Button 
                            onClick={() => handleMessageComplainant(complaint)}
                            disabled={messagingOwner}
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <User className="h-4 w-4 mr-2" />
                            {messagingOwner ? "Sending..." : "Message Complainant"}
                          </Button>
                          <Button 
                            onClick={() => handleAppealClick(complaint)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Appeal Complaint
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Appeal Dialog */}
      {selectedComplaint && (
        <AppealDialog
          complaint={selectedComplaint}
          property={{
            _id: selectedComplaint.target._id,
            title: selectedComplaint.target.name
          }}
          isOpen={appealDialogOpen}
          onOpenChange={setAppealDialogOpen}
        />
      )}
    </div>
  )
} 