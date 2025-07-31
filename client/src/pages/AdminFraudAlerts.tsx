import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { getFraudAlerts } from "@/api/admin"
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  XCircle,
  User,
  Building2,
  DollarSign,
  Calendar,
  Search
} from "lucide-react"

interface FraudAlert {
  id: string
  type: 'fraud_flag' | 'automated_suspension' | 'payment_dispute'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  targetType: 'user' | 'property' | 'transaction'
  targetId: string
  targetName: string
  evidence: string[]
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  riskScore: number
}

export function AdminFraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [action, setAction] = useState("")
  const [notes, setNotes] = useState("")
  const [filter, setFilter] = useState("all")
  const { toast } = useToast()



  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await getFraudAlerts(1, 100)
      setAlerts(response.alerts)
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

  const handleReviewAlert = async () => {
    if (!selectedAlert || !action) return

    try {
      // In real app, this would be an API call
      setAlerts(alerts.map(alert =>
        alert.id === selectedAlert.id
          ? { ...alert, status: action as any }
          : alert
      ))
      
      setSelectedAlert(null)
      setAction("")
      setNotes("")
      
      toast({
        title: "Success",
        description: `Alert ${action} successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud_flag': return <Shield className="h-4 w-4" />
      case 'automated_suspension': return <Clock className="h-4 w-4" />
      case 'payment_dispute': return <DollarSign className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "all") return true
    return alert.status === filter
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
          <h1 className="text-2xl font-bold text-readable">Fraud Alerts & Security</h1>
          <p className="text-muted-readable">Review and manage security alerts and suspicious activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {alerts.filter(a => a.status === 'pending').length} Pending
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
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{alerts.length} Total</Badge>
              <Badge variant="destructive">{alerts.filter(a => a.severity === 'high').length} High Risk</Badge>
              <Badge variant="secondary">{alerts.filter(a => a.severity === 'medium').length} Medium Risk</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>
            Review and take action on security alerts and suspicious activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-readable">{alert.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {alert.targetType === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : alert.targetType === 'property' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      <span className="font-medium">{alert.targetName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            alert.riskScore >= 80 ? 'bg-red-500' :
                            alert.riskScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${alert.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{alert.riskScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(alert.createdAt).toLocaleDateString()}</div>
                      <div className="text-muted-readable">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            {getTypeIcon(alert.type)}
                            <span>{alert.title}</span>
                          </DialogTitle>
                          <DialogDescription>
                            Review details and take appropriate action
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Alert Details</h4>
                            <p className="text-sm text-muted-readable">{alert.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Evidence</h4>
                            <ul className="text-sm space-y-1">
                              {alert.evidence.map((item, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Action</h4>
                            <Select value={action} onValueChange={setAction}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="resolved">Resolve Alert</SelectItem>
                                <SelectItem value="dismissed">Dismiss Alert</SelectItem>
                                <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Admin Notes</h4>
                            <Textarea
                              placeholder="Add notes about this alert..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleReviewAlert} disabled={!action}>
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
    </div>
  )
} 