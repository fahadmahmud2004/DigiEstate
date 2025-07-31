import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { Home } from "./pages/Home"
import { Properties } from "./pages/Properties"
import { PropertyDetails } from "./pages/PropertyDetails"
import { CreateListing } from "./pages/CreateListing"
import { MyListings } from "./pages/MyListings"
import { MyBookings } from "./pages/MyBookings"
import { Messages } from "./pages/Messages"
import { Profile } from "./pages/Profile"
import { Notifications } from "./pages/Notifications"
import { NotificationPreferences } from "./pages/NotificationPreferences"
import { AdminSeed } from "./pages/AdminSeed"
import { AdminDashboard } from "./pages/AdminDashboard"
import { AdminProperties } from "./pages/AdminProperties"
import { AdminPropertyDetails } from "./pages/AdminPropertyDetails"
import { AdminFraudAlerts } from "./pages/AdminFraudAlerts"
import { AdminUserReports } from "./pages/AdminUserReports"
import { AdminProactiveReviews } from "./pages/AdminProactiveReviews"
import { BlankPage } from "./pages/BlankPage"

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="properties" element={<Properties />} />
              <Route path="properties/:id" element={<PropertyDetails />} />
              <Route path="create-listing" element={<CreateListing />} />
              <Route path="my-listings" element={<MyListings />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="notification-preferences" element={<NotificationPreferences />} />
              <Route path="admin/seed" element={<AdminSeed />} />
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/properties" element={<AdminProperties />} />
              <Route path="admin/properties/:id" element={<AdminPropertyDetails />} />
              <Route path="admin/fraud-alerts" element={<AdminFraudAlerts />} />
              <Route path="admin/user-reports" element={<AdminUserReports />} />
              <Route path="admin/proactive-reviews" element={<AdminProactiveReviews />} />
            </Route>
            <Route path="*" element={<BlankPage />} />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App