"use client";

import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { useSoftDeleteFamily, useRestoreFamily } from "@/hooks/api";

interface DeleteFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  familyName: string;
  isDeleted?: boolean;
  onSuccess?: () => void;
}

export default function DeleteFamilyDialog({
  open,
  onOpenChange,
  familyId,
  familyName,
  isDeleted = false,
  onSuccess,
}: DeleteFamilyDialogProps) {
  const softDeleteFamily = useSoftDeleteFamily();
  const restoreFamily = useRestoreFamily();

  const handleDelete = async () => {
    try {
      await softDeleteFamily.mutateAsync(familyId);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRestore = async () => {
    try {
      await restoreFamily.mutateAsync(familyId);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isPending = softDeleteFamily.isPending || restoreFamily.isPending;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-md">
        <CustomDialogHeader>
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${
                isDeleted ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isDeleted ? (
                <RefreshCw className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <CustomDialogTitle className="text-lg font-semibold">
                {isDeleted ? "Restore Family" : "Delete Family"}
              </CustomDialogTitle>
              <CustomDialogDescription className="mt-1">
                {isDeleted
                  ? `Restore "${familyName}" and make it visible again?`
                  : `Are you sure you want to delete "${familyName}"?`}
              </CustomDialogDescription>
            </div>
          </div>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        <div className="space-y-4">
          {!isDeleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">This action will:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Hide the family from all members</li>
                    <li>Keep all data intact for restoration</li>
                    <li>Prevent new activities in the family</li>
                    <li>Allow restoration by the family creator</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isDeleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <RefreshCw className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Restoring will:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Make the family visible to all members again</li>
                    <li>Restore all previous data and relationships</li>
                    <li>Allow new activities in the family</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={isDeleted ? handleRestore : handleDelete}
              disabled={isPending}
              className={
                isDeleted
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isPending ? (
                <>
                  <ClipLoader size={16} color="#ffffff" className="mr-2" />
                  {isDeleted ? "Restoring..." : "Deleting..."}
                </>
              ) : (
                <>
                  {isDeleted ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restore Family
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Family
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </CustomDialogContent>
    </CustomDialog>
  );
}
