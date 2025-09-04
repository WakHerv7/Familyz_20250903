'use client';

import { useState } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { useProfile, useLogout, useUnreadNotificationCount } from '@/hooks/api';
import { MemberWithRelationships } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipLoader } from 'react-spinners';
import FamilyTree from '@/components/FamilyTree';
import InteractiveFamilyTree from '@/components/InteractiveFamilyTree';
import FolderTreeView from '@/components/FolderTreeView';
import ExportManager from '@/components/ExportManager';
import AdvancedSearch from '@/components/AdvancedSearch';
import SocialFeed from '@/components/SocialFeed';
import NotificationPanel from '@/components/NotificationPanel';
import AddFamilyMemberDialog from '@/components/dialogs/AddFamilyMemberDialog';
import InviteOthersDialog from '@/components/dialogs/InviteOthersDialog';
import SettingsDialog from '@/components/dialogs/SettingsDialog';
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
  Bell
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const logout = useLogout();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: unreadCount } = useUnreadNotificationCount();

  const [currentView, setCurrentView] = useState<'dashboard' | 'tree' | 'interactive' | 'folder' | 'search' | 'export' | 'social' | 'notifications'>('dashboard');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInviteOthers, setShowInviteOthers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check if current user is admin
  const isAdmin = profile?.familyMemberships?.some(membership =>
    membership.role === 'ADMIN' || membership.role === 'HEAD'
  ) || false;

  const handleMemberClick = (member: MemberWithRelationships | string) => {
    // Could navigate to member details or show in modal
    const memberId = typeof member === 'string' ? member : member.id;
    console.log('Member clicked:', memberId);
  };

  const handleRelationshipChange = () => {
    // Refetch profile to update relationships
    refetchProfile();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Family Tree Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('notifications')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount && unreadCount.unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount.unreadCount > 9 ? '9+' : unreadCount.unreadCount}
                  </Badge>
                )}
              </Button>

              <span className="text-gray-700">
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
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>

            <Button
              variant={currentView === 'social' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('social')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <MessagesSquare className="h-4 w-4" />
              <span>Social Feed</span>
            </Button>

            <Button
              variant={currentView === 'tree' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tree')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <GitBranch className="h-4 w-4" />
              <span>Family Tree</span>
            </Button>

            <Button
              variant={currentView === 'interactive' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('interactive')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <Network className="h-4 w-4" />
              <span>Interactive Tree</span>
            </Button>

            <Button
              variant={currentView === 'folder' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('folder')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <Folder className="h-4 w-4" />
              <span>Folder View</span>
            </Button>

            <Button
              variant={currentView === 'search' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('search')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>

            <Button
              variant={currentView === 'export' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('export')}
              disabled={!profile}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>

            {isAdmin && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </Badge>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : currentView === 'social' && profile ? (
          <SocialFeed isAdmin={isAdmin} />
        ) : currentView === 'notifications' ? (
          <NotificationPanel />
        ) : currentView === 'tree' && profile ? (
          <FamilyTree currentMember={profile} onRelationshipChange={handleRelationshipChange} />
        ) : currentView === 'interactive' && profile ? (
          <InteractiveFamilyTree currentMember={profile} onMemberClick={handleMemberClick} />
        ) : currentView === 'folder' && profile ? (
          <FolderTreeView currentMember={profile} isAdmin={isAdmin} onMemberClick={handleMemberClick} />
        ) : currentView === 'search' && profile ? (
          <AdvancedSearch isAdmin={isAdmin} onMemberSelect={handleMemberClick} />
        ) : currentView === 'export' && profile ? (
          <ExportManager currentMember={profile} isAdmin={isAdmin} />
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your family tree and social feed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setCurrentView('social')}
                    disabled={!profile}
                  >
                    <MessagesSquare className="h-6 w-6" />
                    <span>Social Feed</span>
                  </Button>

                  <Button
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setCurrentView('tree')}
                    disabled={!profile}
                  >
                    <GitBranch className="h-6 w-6" />
                    <span>View Family Tree</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setShowAddMember(true)}
                  >
                    <UserPlus className="h-6 w-6" />
                    <span>Add Family Member</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setShowInviteOthers(true)}
                  >
                    <Mail className="h-6 w-6" />
                    <span>Invite Others</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Your family tree profile</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile ? (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {profile.name}</p>
                      <p><strong>Gender:</strong> {profile.gender || 'Not specified'}</p>
                      <p><strong>Status:</strong> {profile.status}</p>
                      <p><strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading profile...</p>
                  )}
                </CardContent>
              </Card>

              {/* Family Memberships */}
              <Card>
                <CardHeader>
                  <CardTitle>Family Memberships</CardTitle>
                  <CardDescription>Families you belong to</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.familyMemberships && profile.familyMemberships.length > 0 ? (
                    <div className="space-y-3">
                      {profile.familyMemberships.map((membership) => (
                        <div key={membership.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{membership.familyName}</p>
                          <p className="text-sm text-gray-600">Role: {membership.role}</p>
                          <p className="text-sm text-gray-600">
                            Joined: {new Date(membership.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No family memberships found</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    {unreadCount && unreadCount.unreadCount > 0 && (
                      <Badge variant="destructive">
                        {unreadCount.unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest family updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationPanel showOnlyUnread={true} maxHeight="200px" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => setCurrentView('notifications')}
                  >
                    View All Notifications
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddFamilyMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
      />

      <InviteOthersDialog
        open={showInviteOthers}
        onOpenChange={setShowInviteOthers}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
