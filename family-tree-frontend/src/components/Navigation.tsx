"use client";

import { useAppSelector } from "@/hooks/redux";
import { useProfile, useLogout, useUnreadNotificationCount } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Network,
  Users,
  GitBranch,
  Settings,
  UserPlus,
  Mail,
  Search,
  Download,
  Folder,
  Shield,
  MessagesSquare,
  Bell,
  TreePine,
} from "lucide-react";

export default function Navigation() {
  const { user } = useAppSelector((state) => state.auth);
  const logout = useLogout();
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadNotificationCount();
  const pathname = usePathname();

  // Check if current user is admin
  const isAdmin =
    profile?.familyMemberships?.some(
      (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
    ) || false;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Users,
      requiresProfile: false,
    },

    {
      href: "/tree",
      label: "Family Tree",
      icon: GitBranch,
      requiresProfile: true,
    },
    {
      href: "/interactive",
      label: "Tree Visualization",
      icon: Network,
      requiresProfile: true,
    },
    {
      href: "/social",
      label: "Social Feed",
      icon: MessagesSquare,
      requiresProfile: true,
    },
    // {
    //   href: "/folder",
    //   label: "Folder View",
    //   icon: Folder,
    //   requiresProfile: false,
    // },
    // {
    //   href: "/search",
    //   label: "Search",
    //   icon: Search,
    //   requiresProfile: true,
    // },
    // {
    //   href: "/export",
    //   label: "Export",
    //   icon: Download,
    //   requiresProfile: true,
    // },
  ];

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-2">
              {/* <TreePine className="h-8 w-8 text-green-600" /> */}

              <Link
                href="/dashboard"
                className="text-2xl font-bold text-gray-900 text-green-600 transition-colors"
              >
                🌳 Familyz
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount && unreadCount.unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
                    >
                      {unreadCount.unreadCount > 9
                        ? "9+"
                        : unreadCount.unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <span className="text-sm text-gray-700">
                Welcome, {profile?.name || user?.email || user?.phone}
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isDisabled = false; //item.requiresProfile && !profile;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isDisabled ? "pointer-events-none" : ""}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    disabled={isDisabled}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    } ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed hover:bg-gray-50"
                        : ""
                    }`}
                    title={
                      isDisabled
                        ? "Complete your profile to access this feature"
                        : ""
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                    {isDisabled && (
                      <span className="text-xs opacity-60 ml-1">🔒</span>
                    )}
                  </Button>
                </Link>
              );
            })}

            {isAdmin && (
              <div className="flex items-center ml-4">
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1 px-3 py-1"
                >
                  <Shield className="h-3 w-3" />
                  <span className="text-xs font-medium">Admin</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
