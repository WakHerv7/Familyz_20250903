'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { MemberWithRelationships, Gender, MemberStatus, FamilyRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Filter, X, Users, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface SearchFilters {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  familyRole?: FamilyRole;
  familyId?: string;
  birthYear?: number;
  birthPlace?: string;
  occupation?: string;
  ageRange?: {
    min?: number;
    max?: number;
  };
}

interface AdvancedSearchProps {
  isAdmin?: boolean;
  onMemberSelect?: (member: MemberWithRelationships) => void;
  onResultsChange?: (results: MemberWithRelationships[]) => void;
}

export default function AdvancedSearch({
  isAdmin = false,
  onMemberSelect,
  onResultsChange
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
  });
  const [searchResults, setSearchResults] = useState<MemberWithRelationships[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all families for filter options
  const { data: allFamilies = [] } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/families');
      return response;
    },
    enabled: isAdmin,
  });

  // Fetch all members for search (if admin)
  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members-search'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const response = await apiClient.get<MemberWithRelationships[]>('/members/all');
      return response;
    },
    enabled: isAdmin,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const performSearch = async () => {
    setIsSearching(true);

    try {
      let members: MemberWithRelationships[] = [];

      if (isAdmin) {
        // Admin can search all members
        members = allMembers;
      } else {
        // Regular users search within their families
        const response = await apiClient.get<MemberWithRelationships[]>('/members/family-search');
        members = response;
      }

      // Apply filters
      let filteredMembers = members.filter(member => {
        // Name filter
        if (filters.name && !member.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }

        // Gender filter
        if (filters.gender && member.gender !== filters.gender) {
          return false;
        }

        // Status filter
        if (filters.status && member.status !== filters.status) {
          return false;
        }

        // Family role filter
        if (filters.familyRole) {
          const hasRole = member.familyMemberships?.some(membership =>
            membership.role === filters.familyRole
          );
          if (!hasRole) return false;
        }

        // Family ID filter
        if (filters.familyId) {
          const inFamily = member.familyMemberships?.some(membership =>
            membership.familyId === filters.familyId
          );
          if (!inFamily) return false;
        }

        // Birth year filter
        if (filters.birthYear && member.personalInfo?.birthDate) {
          const birthYear = new Date(member.personalInfo.birthDate).getFullYear();
          if (birthYear !== filters.birthYear) return false;
        }

        // Birth place filter
        if (filters.birthPlace && member.personalInfo?.birthPlace) {
          if (!member.personalInfo.birthPlace.toLowerCase().includes(filters.birthPlace.toLowerCase())) {
            return false;
          }
        }

        // Occupation filter
        if (filters.occupation && member.personalInfo?.occupation) {
          if (!member.personalInfo.occupation.toLowerCase().includes(filters.occupation.toLowerCase())) {
            return false;
          }
        }

        // Age range filter
        if (filters.ageRange && member.personalInfo?.birthDate) {
          const age = calculateAge(member.personalInfo.birthDate);
          if (filters.ageRange.min && age < filters.ageRange.min) return false;
          if (filters.ageRange.max && age > filters.ageRange.max) return false;
        }

        return true;
      });

      setSearchResults(filteredMembers);
      onResultsChange?.(filteredMembers);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      onResultsChange?.([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters({ name: '' });
    setSearchResults([]);
    onResultsChange?.([]);
  };

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.values(filters).some(value => value !== '' && value !== undefined)) {
        performSearch();
      } else {
        setSearchResults([]);
        onResultsChange?.([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const activeFiltersCount = Object.values(filters).filter(value =>
    value !== '' && value !== undefined && value !== null
  ).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Advanced Search</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} filters</Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="space-y-2">
            <Label htmlFor="name-search">Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="name-search"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
                {activeFiltersCount > 1 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount - 1}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Options</h4>

                {/* Gender Filter */}
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={filters.gender || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        gender: value === '' ? undefined : value as Gender
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any gender</SelectItem>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                      <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        status: value === '' ? undefined : value as MemberStatus
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={MemberStatus.DECEASED}>Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Family Role Filter */}
                <div className="space-y-2">
                  <Label>Family Role</Label>
                  <Select
                    value={filters.familyRole || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        familyRole: value === '' ? undefined : value as FamilyRole
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any role</SelectItem>
                      <SelectItem value={FamilyRole.HEAD}>Head</SelectItem>
                      <SelectItem value={FamilyRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={FamilyRole.MEMBER}>Member</SelectItem>
                      <SelectItem value={FamilyRole.VIEWER}>Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Family Filter (Admin only) */}
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Family</Label>
                    <Select
                      value={filters.familyId || ''}
                      onValueChange={(value) =>
                        setFilters(prev => ({
                          ...prev,
                          familyId: value === '' ? undefined : value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any family</SelectItem>
                        {allFamilies.map((family: any) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Birth Year Filter */}
                <div className="space-y-2">
                  <Label>Birth Year</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1990"
                    value={filters.birthYear || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        birthYear: e.target.value ? parseInt(e.target.value) : undefined
                      }))
                    }
                  />
                </div>

                {/* Age Range Filter */}
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min age"
                      value={filters.ageRange?.min || ''}
                      onChange={(e) =>
                        setFilters(prev => ({
                          ...prev,
                          ageRange: {
                            ...prev.ageRange,
                            min: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max age"
                      value={filters.ageRange?.max || ''}
                      onChange={(e) =>
                        setFilters(prev => ({
                          ...prev,
                          ageRange: {
                            ...prev.ageRange,
                            max: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Birth Place Filter */}
                <div className="space-y-2">
                  <Label>Birth Place</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="e.g., New York"
                      value={filters.birthPlace || ''}
                      onChange={(e) =>
                        setFilters(prev => ({ ...prev, birthPlace: e.target.value || undefined }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Occupation Filter */}
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="e.g., Teacher"
                      value={filters.occupation || ''}
                      onChange={(e) =>
                        setFilters(prev => ({ ...prev, occupation: e.target.value || undefined }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Search Results */}
      {(isSearching || searchResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Search Results</span>
              {!isSearching && (
                <Badge variant="outline">{searchResults.length} found</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onMemberSelect?.(member)}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {member.gender && <span>{member.gender}</span>}
                        {member.personalInfo?.birthDate && (
                          <span>Age {calculateAge(member.personalInfo.birthDate)}</span>
                        )}
                        {member.personalInfo?.occupation && (
                          <span>• {member.personalInfo.occupation}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {member.familyMemberships?.map(membership => (
                          <Badge key={membership.familyId} variant="outline" className="text-xs">
                            {membership.familyName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No members found matching your criteria</p>
                <p className="text-sm">Try adjusting your search filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
