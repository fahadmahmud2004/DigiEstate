import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { getAdminComplaints, updateComplaintStatus, Complaint } from "@/api/complaints"
import { getAdminAppeals, updateAppealStatus, Appeal } from "@/api/appeals"
import { 
  MessageSquare, 
  FileText, 
  Gavel, 
  Eye, 
  CheckCircle, 
  XCircle,
  User,
  Building2,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Filter
} from "lucide-react"

interface UserReport extends Complaint {
  _id: string
  complainant: {
    _id: string
    name: string
    email: string
  }
  target: {
    _id: string
    name: string
    email: string
  }
  targetType: 'user' | 'property'
  type: 'Fraudulent Listing' | 'Inappropriate Behavior' | 'Payment Issues' | 'Other'
  description: string
  evidence: string[]
  status: 'open' | 'in-progress' | 'resolved' | 'dismissed'
  resolution: string
  adminNotes: string
  createdAt: string
  updatedAt: string
}

export function AdminUserReports() {
  const [reports, setReports] = useState<UserReport[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const [status, setStatus] = useState("")
  const [resolution, setResolution] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [filter, setFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<"complaints" | "appeals">("complaints")
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
    fetchAppeals()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await getAdminComplaints(1, 100)
      setReports(response.complaints)
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

  const fetchAppeals = async () => {
    try {
      const response = await getAdminAppeals(1, 100)
      setAppeals(response.appeals)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedReport || !status) return

    try {
      const response = await updateComplaintStatus(
        selectedReport._id,
        status,
        resolution,
        adminNotes
      )
      
      setReports(reports.map(report =>
        report._id === selectedReport._id ? response.complaint : report
      ))
      
      setSelectedReport(null)
      setStatus("")
      setResolution("")
      setAdminNotes("")
      
      toast({
        title: "Success",
        description: `Report status updated to ${status}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateAppealStatus = async () => {
    if (!selectedAppeal || !status) return

    try {
      const response = await updateAppealStatus(
        selectedAppeal._id,
        status,
        adminNotes
      )
      
      setAppeals(appeals.map(appeal =>
        appeal._id === selectedAppeal._id ? response.appeal : appeal
      ))
      
      setSelectedAppeal(null)
      setStatus("")
      setAdminNotes("")
      
      toast({
        title: "Success",
        description: `Appeal status updated to ${status}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
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
      case 'Inappropriate Behavior': return <User className="h-4 w-4" />
      case 'Payment Issues': return <FileText className="h-4 w-4" />
      case 'Other': return <MessageSquare className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Fraudulent Listing': return 'destructive'
      case 'Inappropriate Behavior': return 'secondary'
      case 'Payment Issues': return 'outline'
      case 'Other': return 'default'
      default: return 'default'
    }
  }

  const filteredReports = reports.filter(report => {
    const statusMatch = filter === "all" || report.status === filter
    const typeMatch = typeFilter === "all" || report.type === typeFilter
    return statusMatch && typeMatch
  })

  const filteredAppeals = appeals.filter(appeal => {
    const statusMatch = filter === "all" || appeal.status === filter
    return statusMatch
  })

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
          <h1 className="text-2xl font-bold text-readable">User Reports & Appeals</h1>
          <p className="text-muted-readable">Review and manage user-submitted complaints and appeals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {reports.filter(r => r.status === 'open').length} Open Complaints
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {appeals.filter(a => a.status === 'pending').length} Pending Appeals
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "complaints"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Complaints ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("appeals")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "appeals"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Appeals ({appeals.length})
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {activeTab === "complaints" ? (
                  <>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {activeTab === "complaints" && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Fraudulent Listing">Fraudulent Listing</SelectItem>
                  <SelectItem value="Inappropriate Behavior">Inappropriate Behavior</SelectItem>
                  <SelectItem value="Payment Issues">Payment Issues</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center space-x-2">
              {activeTab === "complaints" ? (
                <>
                  <Badge variant="outline">{reports.length} Total</Badge>
                  <Badge variant="destructive">{reports.filter(r => r.type === 'Fraudulent Listing').length} Fraud</Badge>
                  <Badge variant="secondary">{reports.filter(r => r.type === 'Inappropriate Behavior').length} Behavior</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline">{appeals.length} Total</Badge>
                  <Badge variant="secondary">{appeals.filter(a => a.status === 'pending').length} Pending</Badge>
                  <Badge variant="default">{appeals.filter(a => a.status === 'approved').length} Approved</Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "complaints" ? "User Complaints" : "Property Appeals"}</CardTitle>
          <CardDescription>
            {activeTab === "complaints" 
              ? "Review and take action on user complaints" 
              : "Review and take action on property owner appeals"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "complaints" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Complainant</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.type)}
                        <div>
                          <Badge variant={getTypeColor(report.type)} className="text-xs">
                            {report.type}
                          </Badge>
                          <div className="text-sm text-muted-readable mt-1">
                            {report.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{report.complainant.name}</div>
                          <div className="text-sm text-muted-readable">{report.complainant.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {report.targetType === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                        <div>
                          <div className="font-medium">{report.target.name}</div>
                          <div className="text-sm text-muted-readable">{report.target.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                        <div className="text-muted-readable">
                          {new Date(report.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              {getTypeIcon(report.type)}
                              <span>{report.type}</span>
                            </DialogTitle>
                            <DialogDescription>
                              Review complaint details and take appropriate action
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Complainant</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Name:</strong> {report.complainant.name}</div>
                                  <div><strong>Email:</strong> {report.complainant.email}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Target</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Type:</strong> {report.targetType}</div>
                                  <div><strong>Name:</strong> {report.target.name}</div>
                                  <div><strong>Email:</strong> {report.target.email}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-muted-readable bg-gray-50 p-3 rounded">
                                {report.description}
                              </p>
                            </div>
                            
                            {report.evidence && report.evidence.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Evidence</h4>
                                <div className="text-sm space-y-1">
                                  {report.evidence.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="font-medium mb-2">Status</h4>
                              <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Resolution</h4>
                              <Textarea
                                placeholder="Describe the resolution or action taken..."
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Admin Notes</h4>
                              <Textarea
                                placeholder="Add internal notes about this case..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedReport(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateStatus} disabled={!status}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Update Status
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Complaint Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppeals.map((appeal) => (
                  <TableRow key={appeal._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{appeal.property_title || 'Unknown Property'}</div>
                          <div className="text-sm text-muted-readable">
                            {appeal.message.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{appeal.owner_name || 'Unknown Owner'}</div>
                          <div className="text-sm text-muted-readable">Property Owner</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {appeal.complaint_type || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(appeal.status)}>
                        {appeal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(appeal.created_at).toLocaleDateString()}</div>
                        <div className="text-muted-readable">
                          {new Date(appeal.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAppeal(appeal)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Appeal Review</span>
                            </DialogTitle>
                            <DialogDescription>
                              Review appeal details and take appropriate action
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Property</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Title:</strong> {appeal.property_title || 'Unknown'}</div>
                                  <div><strong>Owner:</strong> {appeal.owner_name || 'Unknown'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Original Complaint</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Type:</strong> {appeal.complaint_type || 'Unknown'}</div>
                                  <div><strong>Status:</strong> {appeal.complaint_status || 'Unknown'}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Original Complaint Description</h4>
                              <p className="text-sm text-muted-readable bg-gray-50 p-3 rounded">
                                {appeal.complaint_description || 'No description available'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Owner's Appeal Message</h4>
                              <p className="text-sm text-muted-readable bg-blue-50 p-3 rounded">
                                {appeal.message}
                              </p>
                            </div>
                            
                            {appeal.admin_response && (
                              <div>
                                <h4 className="font-medium mb-2">Previous Admin Response</h4>
                                <p className="text-sm text-muted-readable bg-green-50 p-3 rounded">
                                  {appeal.admin_response}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="font-medium mb-2">Status</h4>
                              <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Admin Response</h4>
                              <Textarea
                                placeholder="Add your response to the appeal..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedAppeal(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateAppealStatus} disabled={!status}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Update Status
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
