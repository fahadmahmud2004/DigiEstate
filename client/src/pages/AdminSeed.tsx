import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/useToast"
import { seedAdmin, seedProperties } from "@/api/seed"
import { Database, Users, Home, CheckCircle, AlertCircle } from "lucide-react"

export function AdminSeed() {
  const { toast } = useToast()
  const [adminSeeding, setAdminSeeding] = useState(false)
  const [propertiesSeeding, setPropertiesSeeding] = useState(false)
  const [adminSeeded, setAdminSeeded] = useState(false)
  const [propertiesSeeded, setPropertiesSeeded] = useState(false)

  const handleSeedAdmin = async () => {
    setAdminSeeding(true)
    try {
      const response = await seedAdmin()
      setAdminSeeded(true)
      toast({
        title: "Success",
        description: response.data.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAdminSeeding(false)
    }
  }

  const handleSeedProperties = async () => {
    setPropertiesSeeding(true)
    try {
      const response = await seedProperties()
      setPropertiesSeeded(true)
      toast({
        title: "Success",
        description: response.data.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setPropertiesSeeding(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Database Seeding</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Initialize the database with admin user and sample data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin User Seeding */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Admin User
            </CardTitle>
            <CardDescription>
              Create the default admin user for system administration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email:</span>
                <Badge variant="outline">admin@example.com</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Password:</span>
                <Badge variant="outline">admin123</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adminSeeded && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Seeded</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSeedAdmin}
              disabled={adminSeeding}
              className="w-full"
            >
              {adminSeeding ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Admin...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Admin User
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Properties Seeding */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-600" />
              Sample Properties
            </CardTitle>
            <CardDescription>
              Create sample property listings for testing and demonstration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Properties:</span>
                <Badge variant="outline">5 samples</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Types:</span>
                <Badge variant="outline">Mixed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Owner:</span>
                <Badge variant="secondary">owner@example.com</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {propertiesSeeded && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Seeded</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSeedProperties}
              disabled={propertiesSeeding}
              className="w-full"
            >
              {propertiesSeeding ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Properties...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Sample Properties
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <AlertCircle className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300">
          <ol className="list-decimal list-inside space-y-2">
            <li>First, seed the admin user to create system administrator account</li>
            <li>Then, seed the sample properties to populate the database with test data</li>
            <li>You can now login with admin credentials: admin@example.com / admin123</li>
            <li>Visit the properties page to see the sample listings</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}