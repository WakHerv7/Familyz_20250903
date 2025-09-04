'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateMember, useFamilies, useFamilyMembers } from '@/hooks/api';
import { createMemberSchema, CreateMemberFormData } from '@/schemas/member';
import { Gender, MemberStatus, FamilyRole, RelationshipType, Member, CreateMemberRequest } from '@/types';
import { ClipLoader } from 'react-spinners';
import { useAppSelector } from '@/hooks/redux';
import { Check, ChevronsUpDown, Plus, Trash2, Users, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AddFamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RelationshipEntry {
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}

interface CreateMemberForm {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  familyId: string;
  role?: FamilyRole;
  personalInfo?: {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    phoneNumber?: string;
    email?: string;
  };
}

export default function AddFamilyMemberDialog({ open, onOpenChange }: AddFamilyMemberDialogProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { data: families = [] } = useFamilies();
  const createMemberMutation = useCreateMember();

  const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateMemberForm>({
    defaultValues: {
      name: '',
      gender: Gender.PREFER_NOT_TO_SAY,
      status: MemberStatus.ACTIVE,
      familyId: '',
      role: FamilyRole.MEMBER,
    },
    mode: 'onChange',
  });

  const selectedFamilyId = watch('familyId');
  const { data: familyMembers = [] } = useFamilyMembers(selectedFamilyId || '');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailableMembers = () => {
    const existingRelationshipIds = new Set(relationships.map(r => r.relatedMemberId));

    return familyMembers.filter(member =>
      !existingRelationshipIds.has(member.id) &&
      member.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const addRelationship = () => {
    if (!selectedMember || !relationshipType) return;

    const newRelationship: RelationshipEntry = {
      relatedMemberId: selectedMember.id,
      relatedMemberName: selectedMember.name,
      relationshipType,
    };

    setRelationships(prev => [...prev, newRelationship]);
    setSelectedMember(null);
    setRelationshipType(null);
    setComboboxOpen(false);
    setSearchValue('');
  };

  const removeRelationship = (index: number) => {
    setRelationships(prev => prev.filter((_, i) => i !== index));
  };

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    switch (type) {
      case RelationshipType.PARENT:
        return 'Parent';
      case RelationshipType.CHILD:
        return 'Child';
      case RelationshipType.SPOUSE:
        return 'Spouse';
      default:
        return type;
    }
  };

  const onSubmit = async (data: CreateMemberForm) => {
    // Validate required fields
    if (!data.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!data.familyId) {
      toast.error('Please select a family');
      return;
    }

    try {
      const submitData: CreateMemberRequest = {
        name: data.name.trim(),
        gender: data.gender,
        status: data.status || MemberStatus.ACTIVE,
        role: data.role || FamilyRole.MEMBER,
        familyId: data.familyId,
        personalInfo: data.personalInfo ? {
          bio: data.personalInfo.bio?.trim() || undefined,
          birthDate: data.personalInfo.birthDate || undefined,
          birthPlace: data.personalInfo.birthPlace?.trim() || undefined,
          occupation: data.personalInfo.occupation?.trim() || undefined,
          phoneNumber: data.personalInfo.phoneNumber?.trim() || undefined,
          email: data.personalInfo.email?.trim() || undefined,
        } : undefined,
        initialRelationships: relationships.length > 0 ? relationships.map(rel => ({
          relatedMemberId: rel.relatedMemberId,
          relationshipType: rel.relationshipType,
        })) : undefined,
      };

      console.log('Submitting member data:', submitData);
      await createMemberMutation.mutateAsync(submitData);

      // Close dialog and reset form
      onOpenChange(false);
      reset();
      setRelationships([]);
    } catch (error) {
      console.error('Failed to create member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create family member');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setRelationships([]);
    setSelectedMember(null);
    setRelationshipType(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Create a new family member and add them to your family tree. You can set initial relationships during creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Family Selection */}
          <div className="space-y-2">
            <Label htmlFor="familyId">Family *</Label>
            <Select
              onValueChange={(value) => {
                setValue('familyId', value, { shouldValidate: true });
                setRelationships([]); // Clear relationships when family changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a family" />
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
              <p className="text-red-500 text-sm">{errors.familyId.message}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 1, message: 'Name cannot be empty' }
                })}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                onValueChange={(value) => setValue('gender', value as Gender)}
                defaultValue={Gender.PREFER_NOT_TO_SAY}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                  <SelectItem value={Gender.MALE}>Male</SelectItem>
                  <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                  <SelectItem value={Gender.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => setValue('status', value as MemberStatus)}
                defaultValue={MemberStatus.ACTIVE}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={MemberStatus.DECEASED}>Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Family Role</Label>
              <Select
                onValueChange={(value) => setValue('role', value as FamilyRole)}
                defaultValue={FamilyRole.MEMBER}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FamilyRole.MEMBER}>Member</SelectItem>
                  <SelectItem value={FamilyRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={FamilyRole.HEAD}>Head</SelectItem>
                  <SelectItem value={FamilyRole.VIEWER}>Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initial Relationships */}
          {selectedFamilyId && familyMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Initial Relationships (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Relationship Form */}
                <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>Select Family Member</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full justify-between"
                        >
                          {selectedMember ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(selectedMember.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{selectedMember.name}</span>
                            </div>
                          ) : (
                            "Select a family member..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search family members..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                          />
                          <CommandEmpty>No family members found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {getAvailableMembers().map((member) => (
                                <CommandItem
                                  key={member.id}
                                  value={member.id}
                                  onSelect={() => {
                                    setSelectedMember(member);
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-2 w-full">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1">{member.name}</span>
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Relationship Type</Label>
                    <Select onValueChange={(value) => setRelationshipType(value as RelationshipType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RelationshipType.PARENT}>
                          {selectedMember?.name || 'This person'} is the Parent
                        </SelectItem>
                        <SelectItem value={RelationshipType.CHILD}>
                          {selectedMember?.name || 'This person'} is the Child
                        </SelectItem>
                        <SelectItem value={RelationshipType.SPOUSE}>
                          {selectedMember?.name || 'This person'} is the Spouse
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={addRelationship}
                    disabled={!selectedMember || !relationshipType}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Relationship
                  </Button>
                </div>

                {/* Existing Relationships */}
                {relationships.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Relationships</Label>
                    <div className="space-y-2">
                      {relationships.map((relationship, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(relationship.relatedMemberName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{relationship.relatedMemberName}</p>
                              <Badge variant="outline" className="text-xs">
                                {getRelationshipTypeLabel(relationship.relationshipType)}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRelationship(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information (Optional)</h3>

            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                {...register('personalInfo.bio')}
                placeholder="Brief biography or description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('personalInfo.birthDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthPlace">Birth Place</Label>
                <Input
                  id="birthPlace"
                  {...register('personalInfo.birthPlace')}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  {...register('personalInfo.occupation')}
                  placeholder="Job title or profession"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...register('personalInfo.phoneNumber')}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('personalInfo.email')}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
            >
              {createMemberMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <ClipLoader size={16} color="white" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
