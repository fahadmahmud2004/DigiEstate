import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { getAdminProperties, updatePropertyStatus, AdminProperty } from "@/api/admin"
import { getAdminUsers, toggleUserBlock, AdminUser } from "@/api/admin"
import { 
  Building2, 
  UserPlus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  User,
  Home,
  AlertTriangle,
  Clock,
  Calendar,
  Filter,
  Shield,
  TrendingUp
} from "lucide-react"

interface PendingListing extends AdminProperty {
  _id: string
  title: string
  description: string
  type: string
  price: number
  location: string
  owner: {
    _id: string
    name: string
    email: string
    reputation: number
  }
  status: string
  createdAt: string
  riskScore?: number
  flags?: string[]
}

interface NewUser extends AdminUser {
  _id: string
  name: string
  email: string
  role: string
  status: string
  joinDate: string
  lastLogin: string
  reputation: number
  verificationStatus?: 'pending' | 'verified' | 'flagged'
  riskFactors?: string[]
}

interface HighRiskListing extends AdminProperty {
  _id: string
  title: string
  description: string
  type: string
  price: number
  location: string
  owner: {
    _id: string
    name: string
    email: string
    reputation: number
  }
  status: string
  riskScore: number
  riskFactors: string[]
  flags: string[]
}

export function AdminProactiveReviews() {
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [highRiskListings, setHighRiskListings] = useState<HighRiskListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [action, setAction] = useState("")
  const [notes, setNotes] = useState("")
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'high-risk'>('listings')
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [propertiesResponse, usersResponse] = await Promise.all([
        getAdminProperties(1, 100),
        getAdminUsers(1, 100)
      ])

      // Filter pending listings
      const pending = propertiesResponse.properties.filter(
        (p: any) => p.status === 'Pending Verification'
      )
      setPendingListings(pending)

      // Filter new users (registered in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const newUsersList = usersResponse.users.filter((user: any) => 
        new Date(user.joinDate) > sevenDaysAgo
      )
      setNewUsers(newUsersList)

      // Mock high-risk listings (in real app, this would be calculated based on risk factors)
      const highRisk = propertiesResponse.properties.slice(0, 3).map((p: any) => ({
        ...p,
        riskScore: Math.floor(Math.random() * 40) + 60, // 60-100
        riskFactors: [
          'Price significantly below market',
          'New seller account',
          'Multiple similar listings'
        ],
        flags: ['Suspicious pricing', 'New account']
      }))
      setHighRiskListings(highRisk)

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

  const handleUpdatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const response = await updatePropertyStatus(propertyId, status, notes)
      
      setPendingListings(pendingListings.map(property =>
        property._id === propertyId ? response.property : property
      ))
      
      setSelectedItem(null)
      setAction("")
      setNotes("")
      
      toast({
        title: "Success",
        description: `Property status updated to ${status}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleToggleUserBlock = async (userId: string) => {
    try {
      const response = await toggleUserBlock(userId, notes)
      
      setNewUsers(newUsers.map(user =>
        user._id === userId ? response.user : user
      ))
      
      setSelectedItem(null)
      setAction("")
      setNotes("")
      
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

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'destructive'
    if (score >= 60) return 'secondary'
    return 'outline'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'Active':
        return 'default'
      case 'blocked':
      case 'Flagged':
      case 'Rejected':
        return 'destructive'
      case 'Pending Verification':
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-readable">Proactive Reviews</h1>
          <p className="text-muted-readable">Review pending listings, new users, and high-risk items</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {pendingListings.length} Pending Listings
          </Badge>
          <Badge variant="outline" className="text-sm">
            {newUsers.length} New Users
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {highRiskListings.length} High Risk
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'listings' ? 'default' : 'outline'}
              onClick={() => setActiveTab('listings')}
              className="flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span>Pending Listings ({pendingListings.length})</span>
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Users ({newUsers.length})</span>
            </Button>
            <Button
              variant={activeTab === 'high-risk' ? 'default' : 'outline'}
              onClick={() => setActiveTab('high-risk')}
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>High Risk ({highRiskListings.length})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'listings' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Listings for Approval</CardTitle>
            <CardDescription>
              Review and approve new property listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingListings.map((listing) => (
                  <TableRow key={listing._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-muted-readable">{listing.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{listing.owner.name}</div>
                          <div className="text-sm text-muted-readable">{listing.owner.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${listing.price.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{listing.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedItem({ ...listing, type: 'listing' })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>Review Property Listing</span>
                            </DialogTitle>
                            <DialogDescription>
                              Review property details and approve or reject
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Property Details</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Title:</strong> {listing.title}</div>
                                  <div><strong>Type:</strong> {listing.type}</div>
                                  <div><strong>Price:</strong> ${listing.price.toLocaleString()}</div>
                                  <div><strong>Location:</strong> {listing.location}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Owner Details</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Name:</strong> {listing.owner.name}</div>
                                  <div><strong>Email:</strong> {listing.owner.email}</div>
                                  <div><strong>Reputation:</strong> {listing.owner.reputation}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-muted-readable bg-gray-50 p-3 rounded">
                                {listing.description}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Action</h4>
                              <Select value={action} onValueChange={setAction}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Approve Listing</SelectItem>
                                  <SelectItem value="Rejected">Reject Listing</SelectItem>
                                  <SelectItem value="Flagged">Flag for Review</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Notes</h4>
                              <Textarea
                                placeholder="Add notes about this decision..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedItem(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleUpdatePropertyStatus(listing._id, action)} disabled={!action}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Take Action
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
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>New Sellers & Agents</CardTitle>
            <CardDescription>
              Review recently registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-readable">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedItem({ ...user, type: 'user' })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Review User Account</span>
                            </DialogTitle>
                            <DialogDescription>
                              Review user details and take action if needed
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">User Details</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Name:</strong> {user.name}</div>
                                  <div><strong>Email:</strong> {user.email}</div>
                                  <div><strong>Role:</strong> {user.role}</div>
                                  <div><strong>Reputation:</strong> {user.reputation}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Account Info</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Join Date:</strong> {new Date(user.joinDate).toLocaleDateString()}</div>
                                  <div><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleDateString()}</div>
                                  <div><strong>Status:</strong> {user.status}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Action</h4>
                              <Select value={action} onValueChange={setAction}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="block">Block User</SelectItem>
                                  <SelectItem value="unblock">Unblock User</SelectItem>
                                  <SelectItem value="verify">Mark as Verified</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Notes</h4>
                              <Textarea
                                placeholder="Add notes about this decision..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedItem(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleToggleUserBlock(user._id)} disabled={!action}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Take Action
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
      )}

      {activeTab === 'high-risk' && (
        <Card>
          <CardHeader>
            <CardTitle>High-Risk Listings</CardTitle>
            <CardDescription>
              Review listings flagged for potential issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Factors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highRiskListings.map((listing) => (
                  <TableRow key={listing._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-muted-readable">{listing.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{listing.owner.name}</div>
                          <div className="text-sm text-muted-readable">{listing.owner.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              listing.riskScore >= 80 ? 'bg-red-500' :
                              listing.riskScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${listing.riskScore}%` }}
                          ></div>
                        </div>
                        <Badge variant={getRiskColor(listing.riskScore)}>
                          {listing.riskScore}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {listing.riskFactors.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(listing.status)}>
                        {listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedItem({ ...listing, type: 'high-risk' })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Review High-Risk Listing</span>
                            </DialogTitle>
                            <DialogDescription>
                              Review risk factors and take appropriate action
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Property Details</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Title:</strong> {listing.title}</div>
                                  <div><strong>Type:</strong> {listing.type}</div>
                                  <div><strong>Price:</strong> ${listing.price.toLocaleString()}</div>
                                  <div><strong>Location:</strong> {listing.location}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Risk Assessment</h4>
                                <div className="text-sm space-y-1">
                                  <div><strong>Risk Score:</strong> {listing.riskScore}%</div>
                                  <div><strong>Status:</strong> {listing.status}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Risk Factors</h4>
                              <div className="space-y-2">
                                {listing.riskFactors.map((factor, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <span>{factor}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Action</h4>
                              <Select value={action} onValueChange={setAction}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Approve (Low Risk)</SelectItem>
                                  <SelectItem value="Flagged">Flag for Review</SelectItem>
                                  <SelectItem value="Rejected">Reject (High Risk)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Notes</h4>
                              <Textarea
                                placeholder="Add notes about risk assessment and decision..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedItem(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleUpdatePropertyStatus(listing._id, action)} disabled={!action}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Take Action
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
      )}
    </div>
  )
} 