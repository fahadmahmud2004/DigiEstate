import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { getAdminUsers, toggleUserBlock, getAdminProperties, updatePropertyStatus, AdminUser, AdminProperty } from "@/api/admin"
import { getAdminComplaints, updateComplaintStatus, Complaint } from "@/api/complaints"
import { 
  Users, 
  Home, 
  AlertTriangle, 
  Shield, 
  Eye, 
  MessageSquare, 
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Wifi,
  UserCheck,
  FileText,
  Gavel,
  Search,
  UserPlus,
  Building2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [properties, setProperties] = useState<AdminProperty[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [complaintStatus, setComplaintStatus] = useState("")
  const [resolution, setResolution] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  // Mock data for alerts (in real app, these would come from API)
  const urgentAlerts = {
    fraudFlags: 3,
    automatedSuspensions: 2,
    paymentDisputes: 1
  }

  const userReports = {
    newComplaints: 5,
    newAppeals: 2
  }

  const proactiveWork = {
    pendingListings: 12,
    newSellersAgents: 8,
    highRiskListings: 3
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersResponse, propertiesResponse, complaintsResponse] = await Promise.all([
        getAdminUsers(1, 50),
        getAdminProperties(1, 50),
        getAdminComplaints(1, 50)
      ])

      setUsers(usersResponse.users)
      setProperties(propertiesResponse.properties)
      setComplaints(complaintsResponse.complaints)
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

  const handleToggleUserBlock = async (userId: string) => {
    try {
      const response = await toggleUserBlock(userId)
      setUsers(users.map(user =>
        user._id === userId ? response.user : user
      ))
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

  const handleUpdatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const response = await updatePropertyStatus(propertyId, status)
      setProperties(properties.map(property =>
        property._id === propertyId ? response.property : property
      ))
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

  const handleUpdateComplaintStatus = async () => {
    if (!selectedComplaint || !complaintStatus) return

    try {
      const response = await updateComplaintStatus(
        selectedComplaint._id,
        complaintStatus,
        resolution,
        adminNotes
      )
      setComplaints(complaints.map(complaint =>
        complaint._id === selectedComplaint._id ? response.complaint : complaint
      ))
      setSelectedComplaint(null)
      setComplaintStatus("")
      setResolution("")
      setAdminNotes("")
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'Active':
      case 'resolved':
        return 'default'
      case 'blocked':
      case 'Flagged':
      case 'Rejected':
        return 'destructive'
      case 'Pending Verification':
      case 'open':
      case 'in-progress':
        return 'secondary'
      default:
        return 'outline'
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
      {/* Header: Admin Name + System Status + Quick Stats */}
      <div className="bg-card-solid border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-readable">
                {user?.name || "Admin"} Dashboard
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">System Online</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-muted-readable">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-readable">{users.length}</div>
              <div className="text-xs text-muted-readable">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-readable">{properties.length}</div>
              <div className="text-xs text-muted-readable">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-readable">
                {complaints.filter(c => c.status === 'open').length}
              </div>
              <div className="text-xs text-muted-readable">Open Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-readable">
                {properties.filter(p => p.status === 'Pending Verification').length}
              </div>
              <div className="text-xs text-muted-readable">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Alert Sections */}
      <div className="space-y-6">
        {/* URGENT ALERTS - Red Banner */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>URGENT ALERTS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">
                    Fraud Flags: {urgentAlerts.fraudFlags}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Potential fraudulent activities detected
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-200">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">
                    Automated Suspensions for Review: {urgentAlerts.automatedSuspensions}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    System-triggered suspensions need manual review
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-200">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">
                    Payment Disputes: {urgentAlerts.paymentDisputes}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Disputed transactions requiring attention
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-200">
                Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* USER REPORTS - Orange Banner */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>USER REPORTS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-orange-900 dark:text-orange-100">
                    New Complaints: {userReports.newComplaints}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    User-submitted complaints awaiting review
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-200">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Gavel className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-orange-900 dark:text-orange-100">
                    New Appeals: {userReports.newAppeals}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    Appeals against previous decisions
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-200">
                Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PROACTIVE WORK - Blue Banner */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>PROACTIVE WORK</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Pending Listings for Approval: {proactiveWork.pendingListings}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">NEW</Badge>
                    <span>New property listings awaiting verification</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    New Sellers/Agents to Review: {proactiveWork.newSellersAgents}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Recently registered sellers and agents
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    High-Risk Listings to Spot-Check: {proactiveWork.highRiskListings}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Listings flagged for potential issues
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}