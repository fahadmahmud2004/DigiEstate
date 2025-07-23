import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Users, Home, AlertTriangle, Shield, Eye, MessageSquare, Calendar } from "lucide-react"

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
      <div>
        <h1 className="text-3xl font-bold text-readable">Admin Dashboard</h1>
        <p className="text-muted-readable mt-1">
          Manage users, properties, and complaints
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-readable">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-readable" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-readable">{users.length}</div>
            <p className="text-xs text-muted-readable">
              {users.filter(u => u.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-readable">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-readable" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-readable">{properties.length}</div>
            <p className="text-xs text-muted-readable">
              {properties.filter(p => p.status === 'Pending Verification').length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-readable">Open Complaints</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-readable" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-readable">
              {complaints.filter(c => c.status === 'open').length}
            </div>
            <p className="text-xs text-muted-readable">
              {complaints.filter(c => c.status === 'in-progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-readable">Admin Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-readable" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-readable">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-readable">resolved this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card-solid border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            Users
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            Properties
          </TabsTrigger>
          <TabsTrigger value="complaints" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            Complaints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">User Management</CardTitle>
              <CardDescription className="text-muted-readable">
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-readable">User</TableHead>
                    <TableHead className="text-readable">Email</TableHead>
                    <TableHead className="text-readable">Role</TableHead>
                    <TableHead className="text-readable">Status</TableHead>
                    <TableHead className="text-readable">Joined</TableHead>
                    <TableHead className="text-readable">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="border-gray-200 dark:border-gray-700">
                      <TableCell className="text-readable">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-readable">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-readable">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserBlock(user._id)}
                          disabled={user.role === 'admin'}
                        >
                          {user.status === 'active' ? 'Block' : 'Unblock'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Property Management</CardTitle>
              <CardDescription className="text-muted-readable">
                Review and approve property listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-readable">Property</TableHead>
                    <TableHead className="text-readable">Owner</TableHead>
                    <TableHead className="text-readable">Type</TableHead>
                    <TableHead className="text-readable">Price</TableHead>
                    <TableHead className="text-readable">Status</TableHead>
                    <TableHead className="text-readable">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property._id} className="border-gray-200 dark:border-gray-700">
                      <TableCell className="text-readable">
                        <div>
                          <div className="font-medium">{property.title}</div>
                          <div className="text-sm text-muted-readable">{property.location}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-readable">{property.owner.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{property.type}</Badge>
                      </TableCell>
                      <TableCell className="text-readable">
                        ${property.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(property.status)}>
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {property.status === 'Pending Verification' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePropertyStatus(property._id, 'Active')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdatePropertyStatus(property._id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {property.status === 'Active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUpdatePropertyStatus(property._id, 'Flagged')}
                            >
                              Flag
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-readable">Complaint Management</CardTitle>
              <CardDescription className="text-muted-readable">
                Review and resolve user complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-readable">Complainant</TableHead>
                    <TableHead className="text-readable">Target</TableHead>
                    <TableHead className="text-readable">Type</TableHead>
                    <TableHead className="text-readable">Status</TableHead>
                    <TableHead className="text-readable">Date</TableHead>
                    <TableHead className="text-readable">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint._id} className="border-gray-200 dark:border-gray-700">
                      <TableCell className="text-readable">{complaint.complainant.name}</TableCell>
                      <TableCell className="text-readable">
                        <div>
                          <div className="font-medium">{complaint.target.name}</div>
                          <div className="text-sm text-muted-readable">
                            {complaint.targetType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{complaint.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-readable">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setComplaintStatus(complaint.status)
                                setResolution(complaint.resolution)
                                setAdminNotes(complaint.adminNotes)
                              }}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-readable">Manage Complaint</DialogTitle>
                              <DialogDescription className="text-muted-readable">
                                Update the status and resolution of this complaint
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-readable">Description</label>
                                <p className="text-sm text-muted-readable mt-1">
                                  {selectedComplaint?.description}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-readable">Status</label>
                                <Select value={complaintStatus} onValueChange={setComplaintStatus}>
                                  <SelectTrigger className="bg-card-solid border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card-solid border-gray-200 dark:border-gray-700">
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="dismissed">Dismissed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-readable">Resolution</label>
                                <Textarea
                                  value={resolution}
                                  onChange={(e) => setResolution(e.target.value)}
                                  placeholder="Enter resolution details..."
                                  className="bg-card-solid border-gray-200 dark:border-gray-700"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-readable">Admin Notes</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Internal admin notes..."
                                  className="bg-card-solid border-gray-200 dark:border-gray-700"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleUpdateComplaintStatus}>
                                Update Complaint
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
        </TabsContent>
      </Tabs>
    </div>
  )
}