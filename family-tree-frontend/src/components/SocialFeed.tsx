'use client';

import { useState } from 'react';
import { usePosts, useProfile } from '@/hooks/api';
import { PostVisibility, PostQueryParams } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipLoader } from 'react-spinners';
import PostCreator from './PostCreator';
import PostCard from './PostCard';
import { MessagesSquare, Filter, RefreshCw, Users } from 'lucide-react';

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
  const { data: postsData, isLoading, refetch, isFetching } = usePosts(queryParams);

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;

  const handleFilterChange = (key: keyof PostQueryParams, value: any) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setQueryParams({
      page: 1,
      limit: 10,
    });
    setShowFilters(false);
  };

  const activeFiltersCount = Object.values(queryParams).filter(
    value => value !== undefined && value !== 1 && value !== 10
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessagesSquare className="h-5 w-5" />
              <span>Family Social Feed</span>
              {isAdmin && <Badge variant="outline">Admin View</Badge>}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <ClipLoader size={14} color="currentColor" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <Select
                    value={queryParams.visibility || ''}
                    onValueChange={(value) => handleFilterChange('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All posts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All posts</SelectItem>
                      <SelectItem value={PostVisibility.PUBLIC}>Public</SelectItem>
                      <SelectItem value={PostVisibility.FAMILY}>Family</SelectItem>
                      <SelectItem value={PostVisibility.SUBFAMILY}>Sub-family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {profile?.familyMemberships && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Family</label>
                    <Select
                      value={queryParams.familyId || ''}
                      onValueChange={(value) => handleFilterChange('familyId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All families" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All families</SelectItem>
                        {profile.familyMemberships.map((membership) => (
                          <SelectItem key={membership.familyId} value={membership.familyId}>
                            {membership.familyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Posts per page</label>
                  <Select
                    value={queryParams.limit?.toString() || '10'}
                    onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 posts</SelectItem>
                      <SelectItem value="10">10 posts</SelectItem>
                      <SelectItem value="20">20 posts</SelectItem>
                      <SelectItem value="50">50 posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Post Creator */}
      <PostCreator />

      {/* Feed Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : posts.length > 0 ? (
          <>
            {/* Posts */}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} posts
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={pagination.current === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        {pagination.pages > 5 && (
                          <>
                            <span className="text-gray-400">...</span>
                            <Button
                              variant={pagination.current === pagination.pages ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pagination.pages)}
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
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to share something with your family!
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters to see all posts
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
