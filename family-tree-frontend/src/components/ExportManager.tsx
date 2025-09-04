'use client';

import { useState } from 'react';
import { useExportFamilyData, useGetFolderTreeData } from '@/hooks/api';
import { MemberWithRelationships, ExportRequest, ExportConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, Users, Folder, Check } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';

interface ExportManagerProps {
  currentMember: MemberWithRelationships;
  isAdmin?: boolean;
}

interface ExportOptions {
  format: 'pdf' | 'excel';
  scope: 'current-family' | 'all-families' | 'selected-families';
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

export default function ExportManager({ currentMember, isAdmin = false }: ExportManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    scope: 'current-family',
    config: {
      formats: ['pdf', 'excel'],
      familyTree: {
        structure: 'folderTree',
        includeMembersList: true,
        memberDetails: ['parent', 'children', 'spouses'],
      },
    },
    includeData: {
      personalInfo: true,
      relationships: true,
      contactInfo: false,
      profileImages: true,
    },
  });

  const { data: folderTreeData, isLoading: loadingTreeData } = useGetFolderTreeData();
  const exportFamilyData = useExportFamilyData();

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConfigChange = (configPath: string, value: any) => {
    setExportOptions(prev => {
      const newConfig = { ...prev.config };
      const keys = configPath.split('.');
      let current = newConfig as any;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      return { ...prev, config: newConfig };
    });
  };

  const handleIncludeDataChange = (key: keyof ExportOptions['includeData'], value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      includeData: {
        ...prev.includeData,
        [key]: value,
      },
    }));
  };

  const handleMemberDetailsChange = (detail: string, checked: boolean) => {
    const currentDetails = exportOptions.config.familyTree.memberDetails;
    const newDetails = checked
      ? [...currentDetails, detail]
      : currentDetails.filter(d => d !== detail);

    handleConfigChange('familyTree.memberDetails', newDetails);
  };

  const handleFamilySelection = (familyId: string, checked: boolean) => {
    const currentIds = exportOptions.familyIds || [];
    const newIds = checked
      ? [...currentIds, familyId]
      : currentIds.filter(id => id !== familyId);

    handleExportOptionChange('familyIds', newIds);
  };

  const handleExport = async () => {
    if (!folderTreeData) {
      toast.error('No data available for export');
      return;
    }

    if (exportOptions.scope === 'selected-families' && (!exportOptions.familyIds || exportOptions.familyIds.length === 0)) {
      toast.error('Please select at least one family');
      return;
    }

    try {
      const exportRequest: ExportRequest = {
        format: exportOptions.format,
        scope: exportOptions.scope,
        familyIds: exportOptions.familyIds,
        config: exportOptions.config,
        includeData: exportOptions.includeData,
      };

      await exportFamilyData.mutateAsync(exportRequest);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getPreviewData = () => {
    if (!folderTreeData) return null;

    let totalFamilies = folderTreeData.families.length;
    let totalMembers = folderTreeData.membersList.length;

    if (exportOptions.scope === 'current-family') {
      const currentFamilyId = currentMember.familyMemberships?.[0]?.familyId;
      const currentFamily = folderTreeData.families.find(f => f.id === currentFamilyId);
      totalFamilies = 1;
      totalMembers = currentFamily?.members.length || 0;
    } else if (exportOptions.scope === 'selected-families' && exportOptions.familyIds) {
      const selectedFamilies = folderTreeData.families.filter(f =>
        exportOptions.familyIds!.includes(f.id)
      );
      totalFamilies = selectedFamilies.length;
      totalMembers = selectedFamilies.reduce((sum, family) => sum + family.members.length, 0);
    }

    return { totalFamilies, totalMembers };
  };

  const previewData = getPreviewData();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Enhanced Export Manager</span>
          {isAdmin && <Badge variant="outline">Admin</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingTreeData ? (
          <div className="flex items-center justify-center py-8">
            <ClipLoader size={24} color="#3B82F6" />
            <span className="ml-2">Loading export data...</span>
          </div>
        ) : (
          <>
            {/* Export Format */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: 'pdf' | 'excel') =>
                  handleExportOptionChange('format', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>PDF Document</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center space-x-2">
                      <Table className="h-4 w-4" />
                      <span>Excel Spreadsheet</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Scope */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Export Scope</Label>
              <Select
                value={exportOptions.scope}
                onValueChange={(value: 'current-family' | 'all-families' | 'selected-families') =>
                  handleExportOptionChange('scope', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-family">Current Family Only</SelectItem>
                  {isAdmin && <SelectItem value="all-families">All Families</SelectItem>}
                  {isAdmin && <SelectItem value="selected-families">Selected Families</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Family Selection */}
            {exportOptions.scope === 'selected-families' && isAdmin && folderTreeData && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Select Families</Label>
                <div className="max-h-32 overflow-y-auto border rounded p-3 space-y-2">
                  {folderTreeData.families.map((family) => (
                    <div key={family.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`family-${family.id}`}
                        checked={exportOptions.familyIds?.includes(family.id) || false}
                        onCheckedChange={(checked) => {
                          handleFamilySelection(family.id, checked as boolean);
                        }}
                      />
                      <Label htmlFor={`family-${family.id}`} className="text-sm flex-1">
                        {family.name}
                        <span className="text-gray-500 ml-1">({family.members.length} members)</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Family Tree Structure Configuration */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <Label className="text-base font-medium flex items-center space-x-2">
                <Folder className="h-4 w-4" />
                <span>Family Tree Structure</span>
              </Label>

              <div className="space-y-3">
                {/* Structure Type */}
                <div className="space-y-2">
                  <Label className="text-sm">Structure Format</Label>
                  <Select
                    value={exportOptions.config.familyTree.structure}
                    onValueChange={(value) => handleConfigChange('familyTree.structure', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="folderTree">
                        <div className="flex items-center space-x-2">
                          <Folder className="h-4 w-4" />
                          <span>Folder Tree (Hierarchical)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="traditional">Traditional Tree</SelectItem>
                      <SelectItem value="interactive">Interactive Layout</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    Folder Tree organizes families and generations hierarchically
                  </p>
                </div>

                {/* Include Members List */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-members-list"
                    checked={exportOptions.config.familyTree.includeMembersList}
                    onCheckedChange={(checked) =>
                      handleConfigChange('familyTree.includeMembersList', checked)
                    }
                  />
                  <Label htmlFor="include-members-list" className="text-sm">
                    Include complete members list
                  </Label>
                </div>

                {/* Member Details */}
                <div className="space-y-2">
                  <Label className="text-sm">Include Member Details</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'parent', label: 'Parents' },
                      { key: 'children', label: 'Children' },
                      { key: 'spouses', label: 'Spouses' },
                      { key: 'personalInfo', label: 'Personal Info' },
                      { key: 'contact', label: 'Contact Info' },
                    ].map((detail) => (
                      <div key={detail.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`detail-${detail.key}`}
                          checked={exportOptions.config.familyTree.memberDetails.includes(detail.key as any)}
                          onCheckedChange={(checked) =>
                            handleMemberDetailsChange(detail.key, checked as boolean)
                          }
                        />
                        <Label htmlFor={`detail-${detail.key}`} className="text-xs">
                          {detail.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Inclusion Options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Data Inclusion</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="personal-info"
                    checked={exportOptions.includeData.personalInfo}
                    onCheckedChange={(checked) =>
                      handleIncludeDataChange('personalInfo', checked as boolean)
                    }
                  />
                  <Label htmlFor="personal-info" className="text-sm">
                    Personal Information (birth date, occupation, bio, etc.)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contact-info"
                    checked={exportOptions.includeData.contactInfo}
                    onCheckedChange={(checked) =>
                      handleIncludeDataChange('contactInfo', checked as boolean)
                    }
                  />
                  <Label htmlFor="contact-info" className="text-sm">
                    Contact Information (email, phone)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relationships"
                    checked={exportOptions.includeData.relationships}
                    onCheckedChange={(checked) =>
                      handleIncludeDataChange('relationships', checked as boolean)
                    }
                  />
                  <Label htmlFor="relationships" className="text-sm">
                    Family Relationships
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="profile-images"
                    checked={exportOptions.includeData.profileImages}
                    onCheckedChange={(checked) =>
                      handleIncludeDataChange('profileImages', checked as boolean)
                    }
                  />
                  <Label htmlFor="profile-images" className="text-sm">
                    Profile Images (PDF only)
                  </Label>
                </div>
              </div>
            </div>

            {/* Export Preview */}
            {previewData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Export Preview</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    <strong>{previewData.totalFamilies}</strong> {previewData.totalFamilies === 1 ? 'family' : 'families'} •
                    <strong> {previewData.totalMembers}</strong> {previewData.totalMembers === 1 ? 'member' : 'members'}
                  </p>
                  <p>Format: <strong>{exportOptions.format.toUpperCase()}</strong></p>
                  <p>Structure: <strong>{exportOptions.config.familyTree.structure}</strong></p>
                  <p>
                    Details: {exportOptions.config.familyTree.memberDetails.join(', ') || 'None'}
                  </p>
                </div>
              </div>
            )}

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exportFamilyData.isPending || !previewData}
              className="w-full"
              size="lg"
            >
              {exportFamilyData.isPending ? (
                <div className="flex items-center space-x-2">
                  <ClipLoader size={16} color="white" />
                  <span>Generating {exportOptions.format.toUpperCase()}...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export {exportOptions.format.toUpperCase()}</span>
                </div>
              )}
            </Button>

            {/* Feature Highlights */}
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">✨ Enhanced Export Features:</p>
              <p>• Folder Tree structure with hierarchical family organization</p>
              <p>• Complete member lists with configurable details</p>
              <p>• Profile image inclusion (PDF exports)</p>
              <p>• Relationship mapping (parents, children, spouses)</p>
              <p>• Professional formatting with generation timestamps</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
