import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
<<<<<<< HEAD
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { getAdminComplaints, updateComplaintStatus, Complaint } from "@/api/complaints"
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
  resolution?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export function AdminUserReports() {
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [status, setStatus] = useState("")
  const [resolution, setResolution] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [filter, setFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await getAdminComplaints(1, 100)
      setReports(response.complaints)
=======
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/useToast"
import { getAdminComplaints, updateComplaintStatus, resolveComplaintWithAction, Complaint } from "@/api/complaints"
import { getAdminAppeals, resolveAppeal, Appeal } from "@/api/appeals"
import { AlertTriangle, Flag, Scale, CheckCircle, XCircle, Clock, Eye, ImageIcon } from "lucide-react"

export function AdminUserReports() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const [complaintAction, setComplaintAction] = useState("")
  const [resolution, setResolution] = useState("")
  const [reason, setReason] = useState("")
  const [appealDecision, setAppealDecision] = useState("")
  const [adminResponse, setAdminResponse] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [complaintsResponse, appealsResponse] = await Promise.all([
        getAdminComplaints(1, 50),
        getAdminAppeals(1, 50)
      ])
      setComplaints(complaintsResponse.complaints)
      setAppeals(appealsResponse.appeals)
>>>>>>> 52e8353 (Saving my latest work before merging)
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

<<<<<<< HEAD
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
=======
  const handleResolveComplaint = async () => {
    if (!selectedComplaint || !complaintAction || !resolution) return

    try {
      const response = await resolveComplaintWithAction(
        selectedComplaint._id,
        resolution,
        complaintAction,
        reason
      )

      setComplaints(complaints.map(complaint =>
        complaint._id === selectedComplaint._id ? response.complaint : complaint
      ))

      // Reset form
      setSelectedComplaint(null)
      setComplaintAction("")
      setResolution("")
      setReason("")

      toast({
        title: "Success",
        description: response.message,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleResolveAppeal = async () => {
    if (!selectedAppeal || !appealDecision) return

    try {
      const response = await resolveAppeal(
        selectedAppeal._id,
        appealDecision,
        adminResponse
      )

      setAppeals(appeals.map(appeal =>
        appeal._id === selectedAppeal._id ? { ...appeal, ...response.appeal } : appeal
      ))

      // Reset form
      setSelectedAppeal(null)
      setAppealDecision("")
      setAdminResponse("")

      toast({
        title: "Success",
        description: response.message,
>>>>>>> 52e8353 (Saving my latest work before merging)
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
<<<<<<< HEAD
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
          <h1 className="text-2xl font-bold text-readable">User Reports & Complaints</h1>
          <p className="text-muted-readable">Review and manage user-submitted complaints and appeals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {reports.filter(r => r.status === 'open').length} Open
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {reports.filter(r => r.status === 'in-progress').length} In Progress
          </Badge>
        </div>
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

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
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{reports.length} Total</Badge>
              <Badge variant="destructive">{reports.filter(r => r.type === 'Fraudulent Listing').length} Fraud</Badge>
              <Badge variant="secondary">{reports.filter(r => r.type === 'Inappropriate Behavior').length} Behavior</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Reports</CardTitle>
          <CardDescription>
            Review and take action on user complaints and appeals
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
=======
      case 'resolved':
      case 'approved':
        return 'default'
      case 'open':
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'open':
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Reports</h1>
        <p className="text-muted-foreground">Manage complaints and appeals from users</p>
      </div>

      <Tabs defaultValue="complaints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Complaints ({complaints.filter(c => c.status === 'open').length})
          </TabsTrigger>
          <TabsTrigger value="appeals" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Appeals ({appeals.filter(a => a.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Property Complaints
              </CardTitle>
              <CardDescription>
                User-reported issues with properties and listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Complainant</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint._id}>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(complaint.status)} className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {complaint.target.name}
                      </TableCell>
                      <TableCell>{complaint.complainant.name}</TableCell>
                      <TableCell>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedComplaint(complaint)}
                          disabled={complaint.status === 'resolved'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {complaint.status === 'resolved' ? 'View' : 'Review'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Property Appeals
              </CardTitle>
              <CardDescription>
                Appeals from property owners against complaint decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Original Complaint</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow key={appeal._id}>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(appeal.status)} className="flex items-center gap-1">
                          {getStatusIcon(appeal.status)}
                          {appeal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {appeal.propertyTitle}
                      </TableCell>
                      <TableCell>{appeal.propertyOwner.name}</TableCell>
                      <TableCell>{appeal.complaintType}</TableCell>
                      <TableCell>
                        {new Date(appeal.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppeal(appeal)}
                          disabled={appeal.status !== 'pending'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {appeal.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complaint Review Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Complaint</DialogTitle>
            <DialogDescription>
              Examine the complaint details and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Complaint Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Property</Label>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.target.name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.status === 'open' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="action">Admin Action</Label>
                    <Select value={complaintAction} onValueChange={setComplaintAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action to take" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flag">Flag Property</SelectItem>
                        <SelectItem value="delete">Remove Property</SelectItem>
                        <SelectItem value="dismiss">Dismiss Complaint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Describe the resolution or action taken..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Additional reason or explanation for the action..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
              Close
            </Button>
            {selectedComplaint?.status === 'open' && (
              <Button 
                onClick={handleResolveComplaint}
                disabled={!complaintAction || !resolution}
              >
                Take Action
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Review Dialog */}
      <Dialog open={!!selectedAppeal} onOpenChange={() => setSelectedAppeal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Appeal</DialogTitle>
            <DialogDescription>
              Review the property owner's appeal against the complaint decision
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Property</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppeal.propertyTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Original Complaint</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppeal.complaintType}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Owner's Defense</Label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedAppeal.message}
                </p>
              </div>

              {selectedAppeal.evidencePhotos.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Evidence Photos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedAppeal.evidencePhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-20 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedAppeal.status === 'pending' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="decision">Decision</Label>
                    <Select value={appealDecision} onValueChange={setAppealDecision}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve Appeal (Restore Property)</SelectItem>
                        <SelectItem value="rejected">Reject Appeal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="admin-response">Admin Response</Label>
                    <Textarea
                      id="admin-response"
                      placeholder="Provide explanation for your decision..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedAppeal.adminResponse && (
                <div>
                  <Label className="text-sm font-medium">Admin Response</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedAppeal.adminResponse}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppeal(null)}>
              Close
            </Button>
            {selectedAppeal?.status === 'pending' && (
              <Button 
                onClick={handleResolveAppeal}
                disabled={!appealDecision}
              >
                Submit Decision
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
>>>>>>> 52e8353 (Saving my latest work before merging)
    </div>
  )
}
