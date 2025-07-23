import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/useToast"
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences as NotificationPreferencesType } from "@/api/notifications"

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await getNotificationPreferences() as { success: boolean; preferences: NotificationPreferencesType }
      if (response.success) {
        setPreferences(response.preferences)
      }
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

  const handlePreferenceChange = (key: keyof NotificationPreferencesType, value: boolean) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [key]: value
      })
    }
  }

  const handleSave = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const response = await updateNotificationPreferences(preferences) as { success: boolean; message: string }
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-readable">Failed to load notification preferences.</p>
        <Button onClick={fetchPreferences} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-readable">Notification Preferences</h1>
        <p className="text-muted-readable mt-1">
          Manage how you receive notifications
        </p>
      </div>

      <Card className="bg-card-solid border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-readable">Notification Settings</CardTitle>
          <CardDescription className="text-muted-readable">
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-notifications" className="text-readable font-medium">
                  Booking Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Get notified about booking requests and updates
                </p>
              </div>
              <Switch
                id="booking-notifications"
                checked={preferences.bookingNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('bookingNotifications', checked)}
              />
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payment-notifications" className="text-readable font-medium">
                  Payment Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Get notified about payment confirmations and issues
                </p>
              </div>
              <Switch
                id="payment-notifications"
                checked={preferences.paymentNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('paymentNotifications', checked)}
              />
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="message-notifications" className="text-readable font-medium">
                  Message Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Get notified about new messages from other users
                </p>
              </div>
              <Switch
                id="message-notifications"
                checked={preferences.messageNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('messageNotifications', checked)}
              />
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin-notifications" className="text-readable font-medium">
                  Admin Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Get notified about admin actions and account changes
                </p>
              </div>
              <Switch
                id="admin-notifications"
                checked={preferences.adminNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('adminNotifications', checked)}
              />
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-notifications" className="text-readable font-medium">
                  System Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Get notified about system updates and maintenance
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={preferences.systemNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('systemNotifications', checked)}
              />
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-readable font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-readable">
                  Receive notifications via email as well
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}