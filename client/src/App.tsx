import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
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
<<<<<<< HEAD
import { AdminFraudAlerts } from "./pages/AdminFraudAlerts"
import { AdminUserReports } from "./pages/AdminUserReports"
import { AdminProactiveReviews } from "./pages/AdminProactiveReviews"
=======
import { AdminUserReports } from "./pages/AdminUserReports"
>>>>>>> 52e8353 (Saving my latest work before merging)
import { BlankPage } from "./pages/BlankPage"
import { useAuth } from "./contexts/AuthContext"

// Admin Route Protection Component (minimal addition for complaint & appeal system)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes with Layout */}
            <Route path="/" element={<Layout />}>
              {/* Public Routes within Layout */}
              <Route index element={<Home />} />
              <Route path="properties" element={<Properties />} />
              <Route path="properties/:id" element={<PropertyDetails />} />
              
              {/* Protected User Routes */}
              <Route path="create-listing" element={
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              } />
              
              <Route path="my-listings" element={
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              } />
              
              <Route path="my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              
              <Route path="messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              
              <Route path="notification-preferences" element={
                <ProtectedRoute>
                  <NotificationPreferences />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="admin/properties" element={
                <AdminRoute>
                  <AdminProperties />
                </AdminRoute>
              } />
              
              <Route path="admin/properties/:id" element={
                <AdminRoute>
                  <AdminPropertyDetails />
                </AdminRoute>
              } />
              
              <Route path="admin/user-reports" element={
                <AdminRoute>
                  <AdminUserReports />
                </AdminRoute>
              } />
              
              <Route path="admin/seed" element={
                <AdminRoute>
                  <AdminSeed />
                </AdminRoute>
              } />

              {/* Utility Routes */}
              <Route path="blank" element={<BlankPage />} />
              
              {/* Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          
          {/* Global Toast Notifications */}
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  )
}

function App() {
  return (
    <AuthProvider>
<<<<<<< HEAD
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
              <Route path="edit-listing/:id" element={<CreateListing />} />
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
=======
      <AppContent />
>>>>>>> 52e8353 (Saving my latest work before merging)
    </AuthProvider>
  )
}

export default App
