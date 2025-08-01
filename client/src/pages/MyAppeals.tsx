import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { getOwnerAppeals, Appeal } from "@/api/appeals"
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  Calendar,
  MessageSquare
} from "lucide-react"

export function MyAppeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAppeals()
  }, [])

  const fetchAppeals = async () => {
    setLoading(true)
    try {
      const response = await getOwnerAppeals()
      setAppeals(response.appeals)
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
      case 'pending': return 'secondary'
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
          <h1 className="text-2xl font-bold text-readable">My Appeals</h1>
          <p className="text-muted-readable">View and track your property complaint appeals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {appeals.filter(a => a.status === 'pending').length} Pending
          </Badge>
          <Badge variant="default" className="text-sm">
            {appeals.filter(a => a.status === 'approved').length} Approved
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {appeals.filter(a => a.status === 'rejected').length} Rejected
          </Badge>
        </div>
      </div>

      {/* Appeals List */}
      {appeals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Appeals Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You haven't submitted any appeals yet. Appeals are created when you respond to complaints about your properties.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <Card key={appeal._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appeal.status)}
                    <div>
                      <CardTitle className="text-lg">Appeal #{appeal._id ? appeal._id.slice(-8) : 'Unknown'}</CardTitle>
                      <CardDescription>
                        Property: {appeal.property_title || 'Unknown Property'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(appeal.status)}>
                    {appeal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Original Complaint</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{appeal.complaint_type}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {appeal.complaint_description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Your Appeal Message</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Your Response</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {appeal.message}
                      </p>
                    </div>
                  </div>

                  {appeal.admin_response && (
                    <div>
                      <h4 className="font-medium mb-2">Admin Response</h4>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Administrator</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appeal.admin_response}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted: {new Date(appeal.created_at).toLocaleDateString()}</span>
                    </div>
                    {appeal.resolved_at && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Resolved: {new Date(appeal.resolved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 