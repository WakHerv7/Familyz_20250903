"use client";

import { useProfile } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import ExportManager from "@/components/ExportManager";

export default function ExportPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Check if current user is admin
  const isAdmin =
    profile?.familyMemberships?.some(
      (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
    ) || false;

  if (profileLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-12">
          <ClipLoader size={32} color="#3B82F6" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Profile Required
            </h2>
            <p className="text-gray-600">
              Please complete your profile to export data.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600 mt-2">
            Download your family tree data in various formats
          </p>
        </div>
        <ExportManager currentMember={profile} isAdmin={isAdmin} />
      </main>
    </>
  );
}
