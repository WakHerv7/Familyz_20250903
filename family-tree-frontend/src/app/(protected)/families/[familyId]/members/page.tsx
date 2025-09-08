"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useFamilyMembers,
  useFamily,
  useRemoveMemberFromFamily,
  useProfileFromStore,
} from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipLoader } from "react-spinners";
import {
  MoreHorizontal,
  UserPlus,
  Eye,
  Edit,
  UserPlus as AddRelation,
  UserMinus,
  Users,
  UserX,
  Network,
} from "lucide-react";
import { Member } from "@/types";
import MemberDetailsDialog from "@/components/dialogs/MemberDetailsDialog";
import EditMemberDialog from "@/components/dialogs/EditMemberDialog";
import AddRelationshipDialog from "@/components/dialogs/AddRelationshipDialog";
import RemoveRelationshipDialog from "@/components/dialogs/RemoveRelationshipDialog";
import AddFamilyMemberDialog from "@/components/dialogs/AddFamilyMemberDialog";
import CustomTable, {
  TableColumn,
  TableFilter,
  FilterOption,
} from "@/components/ui/custom-table";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";

export default function FamilyMembersPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;

  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDetailsOpen, setMemberDetailsOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);
  const [removeRelationshipOpen, setRemoveRelationshipOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useFamilyMembers(familyId);

  const { data: family, isLoading: familyLoading } = useFamily(familyId);
  const { profile } = useProfileFromStore();
  const removeMemberFromFamily = useRemoveMemberFromFamily();

  // Define table columns
  const columns: TableColumn<Member>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      accessor: (member) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm font-medium">
            {member.gender === "MALE"
              ? "👨"
              : member.gender === "FEMALE"
              ? "👩"
              : "🧑"}
          </div>
          <span className="font-medium text-gray-900">{member.name}</span>
        </div>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      sortable: true,
      accessor: (member) => (
        <span className="text-gray-600">
          {member.gender || "Not specified"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (member) => (
        <Badge
          variant={
            member.status === "ACTIVE"
              ? "default"
              : member.status === "INACTIVE"
              ? "secondary"
              : member.status === "DECEASED"
              ? "destructive"
              : "outline"
          }
        >
          {member.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      accessor: (member) => (
        <span className="text-gray-600">
          {new Date(member.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (member) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleMemberAction("view", member.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleMemberAction("edit", member.id)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleMemberAction("add-relationship", member.id)}
            >
              <AddRelation className="h-4 w-4 mr-2" />
              Add Relationship
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleMemberAction("remove-relationship", member.id)
              }
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove Relationship
            </DropdownMenuItem>
            {canManageMembers(member) && (
              <DropdownMenuItem
                onClick={() =>
                  handleMemberAction("remove-from-family", member.id)
                }
                className="text-red-600 focus:text-red-600"
              >
                <UserX className="h-4 w-4 mr-2" />
                Remove from Family
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Define filters
  const filters: TableFilter[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "ACTIVE", label: "Active", icon: "🟢" },
        { value: "INACTIVE", label: "Inactive", icon: "🟡" },
        { value: "DECEASED", label: "Deceased", icon: "🔴" },
        { value: "ARCHIVED", label: "Archived", icon: "⚫" },
      ],
    },
  ];

  const handleMemberAction = (action: string, memberId: string) => {
    switch (action) {
      case "view":
        setSelectedMemberId(memberId);
        setMemberDetailsOpen(true);
        break;
      case "edit":
        setSelectedMemberId(memberId);
        setEditMemberOpen(true);
        break;
      case "add-relationship":
        setSelectedMemberId(memberId);
        setAddRelationshipOpen(true);
        break;
      case "remove-relationship":
        setSelectedMemberId(memberId);
        setRemoveRelationshipOpen(true);
        break;
      case "remove-from-family":
        handleRemoveMember(memberId);
        break;
      default:
        break;
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    if (member) {
      setMemberToRemove(member);
      setRemoveMemberConfirmOpen(true);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMemberFromFamily.mutateAsync({
        familyId,
        memberId: memberToRemove.id,
      });
      setRemoveMemberConfirmOpen(false);
      setMemberToRemove(null);
      refetch(); // Refresh the member list
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleCancelRemoveMember = () => {
    setRemoveMemberConfirmOpen(false);
    setMemberToRemove(null);
  };

  // Check if user can manage members (admin or head)
  const canManageMembers = (member: Member) => {
    // Can't remove yourself if you're the family creator
    if (profile?.id === member.id && family?.creatorId === profile?.id) {
      return false;
    }
    return true; // For now, allow all members to see the option (backend will enforce permissions)
  };

  const handleMemberUpdate = () => {
    // Refresh the member list after successful update
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ClipLoader size={32} color="#3B82F6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Error loading family members: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {familyLoading ? (
                    <span className="flex items-center space-x-2">
                      <span>Loading...</span>
                      <ClipLoader size={20} color="#3B82F6" />
                    </span>
                  ) : (
                    `${family?.name || "Family"} Members`
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {family?.description
                    ? family.description
                    : "Manage and view all members of this family"}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{members?.length || 0} members</span>
                  </div>
                  {family && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>
                        Created{" "}
                        {new Date(family.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() =>
                  router.push(`/families/${familyId}/visualization`)
                }
              >
                <Network className="h-4 w-4" />
                <span>View Visualization</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => router.push("/families")}
              >
                <Users className="h-4 w-4" />
                <span>Back to Families</span>
              </Button>
              <Button
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                onClick={() => setAddMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span>Add New Member</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <CustomTable
        data={members || []}
        columns={columns}
        filters={filters}
        searchable={true}
        searchPlaceholder="Search members by name..."
        pagination={true}
        pageSize={10}
        loading={isLoading}
        emptyMessage="No family members found"
        emptyIcon={<Users className="h-12 w-12 text-gray-400" />}
        onRefresh={() => refetch()}
        // title={`Family Members (${members?.length || 0})`}
        // subtitle="Manage and view all members of this family"
        // actions={
        //   <Button
        //     className="flex items-center space-x-2 bg-green-600 hover:bg-greeen-700"
        //     onClick={() => setAddMemberOpen(true)}
        //   >
        //     <UserPlus className="h-4 w-4" />
        //     <span>Add New Member</span>
        //   </Button>
        // }
      />

      {/* Member Details Dialog */}
      <MemberDetailsDialog
        memberId={selectedMemberId}
        open={memberDetailsOpen}
        onOpenChange={setMemberDetailsOpen}
      />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        memberId={selectedMemberId}
        open={editMemberOpen}
        onOpenChange={setEditMemberOpen}
        onSuccess={handleMemberUpdate}
      />

      {/* Add Relationship Dialog */}
      <AddRelationshipDialog
        memberId={selectedMemberId}
        familyId={familyId}
        open={addRelationshipOpen}
        onOpenChange={setAddRelationshipOpen}
        onSuccess={handleMemberUpdate}
      />

      {/* Remove Relationship Dialog */}
      <RemoveRelationshipDialog
        memberId={selectedMemberId}
        open={removeRelationshipOpen}
        onOpenChange={setRemoveRelationshipOpen}
        onSuccess={handleMemberUpdate}
      />

      {/* Add Family Member Dialog */}
      <AddFamilyMemberDialog
        familyId={familyId}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSuccess={handleMemberUpdate}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmationDialog
        open={removeMemberConfirmOpen}
        onOpenChange={setRemoveMemberConfirmOpen}
        title="Remove Member from Family"
        description={`Are you sure you want to remove ${memberToRemove?.name} from this family? This action cannot be undone.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmRemoveMember}
        onCancel={handleCancelRemoveMember}
        loading={removeMemberFromFamily.isPending}
      />
    </div>
  );
}
