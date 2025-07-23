import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  Building2,
  PlusCircle,
  ListChecks,
  Calendar,
  MessageSquare,
  User,
  Bell,
  Settings,
  Shield,
  Database
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Create Listing", href: "/create-listing", icon: PlusCircle },
  { name: "My Listings", href: "/my-listings", icon: ListChecks },
  { name: "My Bookings", href: "/my-bookings", icon: Calendar },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Preferences", href: "/notification-preferences", icon: Settings },
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield },
  { name: "Seed Database", href: "/admin/seed", icon: Database },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isProfileActive = location.pathname === "/profile"

  return (
    <div className="flex h-full w-64 flex-col bg-card-solid border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">

        {/* Username button styled as nav item */}
        <Link
          to="/profile"
          className={cn(
            "group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors mb-2",
            isProfileActive
              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
              : "text-muted-readable hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-readable"
          )}
        >
          <User
            className={cn(
              "mr-3 h-5 w-5 flex-shrink-0",
              isProfileActive
                ? "text-blue-500"
                : "text-muted-readable group-hover:text-readable"
            )}
          />
          {user?.name || "Unknown User"}
        </Link>

        {/* Main navigation items */}
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "text-muted-readable hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-readable"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-blue-500"
                      : "text-muted-readable group-hover:text-readable"
                  )}
                />
                {item.name}
              </Link>
            )
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
              <div className="px-2 py-2">
                <h3 className="text-xs font-semibold text-muted-readable uppercase tracking-wider">
                  Admin
                </h3>
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
                        : "text-muted-readable hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-readable"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-red-500"
                          : "text-muted-readable group-hover:text-readable"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  )
}