"use client";

import { useState } from "react";
import { usePosts, useProfile } from "@/hooks/api";
import { PostVisibility, PostQueryParams } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import PostCreator from "./PostCreator";
import PostCard from "./PostCard";
import {
  MessagesSquare,
  Filter,
  RefreshCw,
  Users,
  Sparkles,
  Heart,
  Camera,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

interface SocialFeedProps {
  isAdmin?: boolean;
}

export default function SocialFeed({ isAdmin = false }: SocialFeedProps) {
  const [queryParams, setQueryParams] = useState<PostQueryParams>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: profile } = useProfile();
  const {
    data: postsData,
    isLoading,
    refetch,
    isFetching,
  } = usePosts(queryParams);

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;

  const handleFilterChange = (key: keyof PostQueryParams, value: any) => {
    setQueryParams((prev) => ({
      ...prev,
      [key]:
        value === "" || value === "all" || value === "all-families"
          ? undefined
          : value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setQueryParams({
      page: 1,
      limit: 10,
    });
    setShowFilters(false);
  };

  const activeFiltersCount = Object.values(queryParams).filter(
    (value) => value !== undefined && value !== 1 && value !== 10
  ).length;

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100/50 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <MessagesSquare className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Family Stories
              </h2>
              <p className="text-gray-600 text-sm">
                Discover moments that matter to your family
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Users className="h-3 w-3 mr-1" />
                Admin View
              </Badge>
            )}

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-blue-200 hover:bg-blue-50 transition-all duration-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-purple-200 hover:bg-purple-50 transition-all duration-300"
              >
                {isFetching ? (
                  <ClipLoader size={14} color="currentColor" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Filter Posts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Visibility
                </label>
                <Select
                  value={queryParams.visibility || ""}
                  onValueChange={(value) =>
                    handleFilterChange("visibility", value)
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="All posts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌟 All posts</SelectItem>
                    <SelectItem value={PostVisibility.PUBLIC}>
                      🌍 Public
                    </SelectItem>
                    <SelectItem value={PostVisibility.FAMILY}>
                      🏠 Family
                    </SelectItem>
                    <SelectItem value={PostVisibility.SUBFAMILY}>
                      👨‍👩‍👧‍👦 Sub-family
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profile?.familyMemberships && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Family
                  </label>
                  <Select
                    value={queryParams.familyId || ""}
                    onValueChange={(value) =>
                      handleFilterChange("familyId", value)
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="All families" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-families">
                        🌈 All families
                      </SelectItem>
                      {profile.familyMemberships.map((membership) => (
                        <SelectItem
                          key={membership.familyId}
                          value={membership.familyId}
                        >
                          {membership.familyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  Posts per page
                </label>
                <Select
                  value={queryParams.limit?.toString() || "10"}
                  onValueChange={(value) =>
                    handleFilterChange("limit", parseInt(value))
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">📝 5 posts</SelectItem>
                    <SelectItem value="10">📄 10 posts</SelectItem>
                    <SelectItem value="20">📚 20 posts</SelectItem>
                    <SelectItem value="50">📖 50 posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Post Creator */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-2xl p-6 border border-blue-100/50 shadow-lg">
        <PostCreator />
      </div>

      {/* Feed Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg animate-pulse">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-2 animate-bounce">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">
                Loading family memories...
              </p>
            </div>
          </div>
        ) : posts.length > 0 ? (
          <>
            {/* Posts with enhanced spacing */}
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="transform transition-all duration-300 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>

            {/* Modern Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="font-medium">
                      Showing {(pagination.current - 1) * pagination.limit + 1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.current * pagination.limit,
                        pagination.total
                      )}{" "}
                      of {pagination.total} posts
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current - 1)}
                      disabled={pagination.current === 1}
                      className="border-gray-200 hover:bg-gray-50 transition-all duration-300"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          const page = i + 1;
                          const isActive = pagination.current === page;
                          return (
                            <Button
                              key={page}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={`transition-all duration-300 ${
                                isActive
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </Button>
                          );
                        }
                      )}
                      {pagination.pages > 5 && (
                        <>
                          <span className="text-gray-400 px-2">...</span>
                          <Button
                            variant={
                              pagination.current === pagination.pages
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pagination.pages)}
                            className={`transition-all duration-300 ${
                              pagination.current === pagination.pages
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {pagination.pages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current + 1)}
                      disabled={pagination.current === pagination.pages}
                      className="border-gray-200 hover:bg-gray-50 transition-all duration-300"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl p-12 border border-blue-100/50 shadow-lg text-center">
            <div className="relative mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full shadow-lg mx-auto w-fit">
                <Camera className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-pink-500 rounded-full p-3 animate-bounce">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Be the first to share something special with your family! Create
              memories that will last forever.
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear filters to see all posts
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
