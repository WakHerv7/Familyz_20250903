import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  FileText,
  MessageSquare,
  Crown,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient as api } from "@/lib/api";
import PermissionManager from "./PermissionManager";

interface FamilyStats {
  totalMembers: number;
  activeMembers: number;
  totalPermissions: number;
  recentActivities: Array<{
    id: string;
    action: string;
    member: string;
    timestamp: string;
  }>;
}

interface FamilyAdminDashboardProps {
  familyId: string;
}

const FamilyAdminDashboard: React.FC<FamilyAdminDashboardProps> = ({
  familyId,
}) => {
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [familyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // This would be implemented to fetch family statistics
      // For now, using mock data
      setStats({
        totalMembers: 12,
        activeMembers: 10,
        totalPermissions: 156,
        recentActivities: [
          {
            id: "1",
            action: "Granted VIEW_MEMBERS permission",
            member: "John Doe",
            timestamp: new Date().toISOString(),
          },
          {
            id: "2",
            action: "Reset permissions to defaults",
            member: "Jane Smith",
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
  }> = ({ title, value, icon, description }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Family Administration</h1>
      </div>

      <Alert>
        <Crown className="h-4 w-4" />
        <AlertDescription>
          Welcome to your family administration dashboard. Manage permissions,
          monitor activity, and oversee family operations.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats?.totalMembers || 0}
          icon={<Users className="w-8 h-8" />}
          description="Active family members"
        />
        <StatCard
          title="Active Members"
          value={stats?.activeMembers || 0}
          icon={<UserCheck className="w-8 h-8" />}
          description="Currently active"
        />
        <StatCard
          title="Total Permissions"
          value={stats?.totalPermissions || 0}
          icon={<Shield className="w-8 h-8" />}
          description="Permission assignments"
        />
        <StatCard
          title="Recent Activity"
          value={stats?.recentActivities.length || 0}
          icon={<BarChart3 className="w-8 h-8" />}
          description="Actions this week"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionManager familyId={familyId} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Family Members Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Manage family membership and roles
                  </p>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                {/* Member management interface would go here */}
                <div className="text-center py-8 text-gray-500">
                  Member management interface coming soon...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">
                          by {activity.member}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {(!stats?.recentActivities ||
                  stats.recentActivities.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Family Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Family Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter family name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Privacy Level</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Private</option>
                      <option>Family Only</option>
                      <option>Public</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button>Save Settings</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyAdminDashboard;
