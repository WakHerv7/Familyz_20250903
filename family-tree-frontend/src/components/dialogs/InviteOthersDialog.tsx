"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCreateInvitation,
  useFamilies,
  useMyInvitations,
} from "@/hooks/api";
import {
  createInvitationSchema,
  CreateInvitationFormData,
} from "@/schemas/family";
import { ClipLoader } from "react-spinners";
import { Copy, Mail, Share2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { Invitation } from "@/types";

interface InviteOthersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteOthersDialog({
  open,
  onOpenChange,
}: InviteOthersDialogProps) {
  const { data: families = [] } = useFamilies();
  const { data: myInvitations = [], refetch: refetchInvitations } =
    useMyInvitations();
  const createInvitationMutation = useCreateInvitation();
  const [generatedInvitation, setGeneratedInvitation] =
    useState<Invitation | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
  });

  const selectedFamilyId = watch("familyId");

  const onSubmit = async (data: CreateInvitationFormData) => {
    try {
      const invitation = await createInvitationMutation.mutateAsync(data);
      setGeneratedInvitation(invitation);
      refetchInvitations();
      reset();
    } catch (error) {
      console.error("Failed to create invitation:", error);
    }
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invitation code copied to clipboard!");
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}?invitation=${encodeURIComponent(
      code
    )}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard!");
  };

  const shareViaEmail = (code: string, familyName: string) => {
    const subject = `Invitation to join ${familyName} family tree`;
    const body = `You've been invited to join the ${familyName} family tree!

Use this invitation code: ${code}

Or click this link: ${window.location.origin}?invitation=${encodeURIComponent(
      code
    )}

Join us to explore and build our family history together!`;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedInvitation(null);
    reset();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "VALID":
        return "default" as const;
      case "USED":
        return "secondary" as const;
      case "EXPIRED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <CustomDialog open={open} onOpenChange={handleClose}>
      <CustomDialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle>
            Invite Others to Join Your Family
          </CustomDialogTitle>
          <CustomDialogDescription>
            Create invitation codes to invite family members to join your family
            tree.
          </CustomDialogDescription>
          <CustomDialogClose onClick={handleClose} />
        </CustomDialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Invitation</TabsTrigger>
            <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
          </TabsList>

          {/* Create Invitation Tab */}
          <TabsContent value="create" className="space-y-6">
            {generatedInvitation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">
                    ✅ Invitation Created!
                  </CardTitle>
                  <CardDescription>
                    Share this invitation code or link with your family member.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invitation Code</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={generatedInvitation.code}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyInvitationCode(generatedInvitation.code)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyInvitationLink(generatedInvitation.code)
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        shareViaEmail(
                          generatedInvitation.code,
                          generatedInvitation.familyName
                        )
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Share via Email
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `Join ${generatedInvitation.familyName} family tree`,
                            text: `You've been invited to join our family tree!`,
                            url: `${
                              window.location.origin
                            }?invitation=${encodeURIComponent(
                              generatedInvitation.code
                            )}`,
                          });
                        } else {
                          copyInvitationLink(generatedInvitation.code);
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Family:</strong> {generatedInvitation.familyName}
                    </p>
                    <p>
                      <strong>Expires:</strong>{" "}
                      {new Date(
                        generatedInvitation.expiresAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setGeneratedInvitation(null)}
                    className="w-full"
                  >
                    Create Another Invitation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Family Selection */}
                <div className="space-y-2">
                  <Label htmlFor="familyId">Family *</Label>
                  <Select
                    onValueChange={(value) => setValue("familyId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a family to invite to" />
                    </SelectTrigger>
                    <SelectContent>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.familyId && (
                    <p className="text-red-500 text-sm">
                      {errors.familyId.message}
                    </p>
                  )}
                </div>

                {/* Member Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Invited Member Information (Optional)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Provide information about the person you're inviting to help
                    them get started.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="memberName">Expected Name</Label>
                    <Input
                      id="memberName"
                      {...register("memberStub.name")}
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship to You</Label>
                    <Input
                      id="relationship"
                      {...register("memberStub.relationship")}
                      placeholder="e.g., Brother, Cousin, Uncle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note for Invitee</Label>
                    <Textarea
                      id="note"
                      {...register("memberStub.note")}
                      placeholder="Add a personal message or additional context"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={createInvitationMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createInvitationMutation.isPending || !selectedFamilyId
                    }
                  >
                    {createInvitationMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <ClipLoader size={16} color="white" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Invitation"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* Manage Invitations Tab */}
          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Sent Invitations</h3>

              {myInvitations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No invitations sent yet. Create your first invitation to get
                  started!
                </p>
              ) : (
                <div className="space-y-3">
                  {myInvitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">
                                {invitation.familyName}
                              </h4>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  invitation.status
                                )}
                              >
                                {invitation.status}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <strong>Created:</strong>{" "}
                                {new Date(
                                  invitation.createdAt
                                ).toLocaleDateString()}
                              </p>
                              <p>
                                <strong>Expires:</strong>{" "}
                                {new Date(
                                  invitation.expiresAt
                                ).toLocaleDateString()}
                              </p>
                              {invitation.memberStub?.name &&
                              typeof invitation.memberStub.name === "string" ? (
                                <p>
                                  <strong>For:</strong>{" "}
                                  {invitation.memberStub.name}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {invitation.status === "VALID" && (
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyInvitationCode(invitation.code)
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  shareViaEmail(
                                    invitation.code,
                                    invitation.familyName
                                  )
                                }
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CustomDialogContent>
    </CustomDialog>
  );
}
