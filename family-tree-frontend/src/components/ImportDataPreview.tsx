import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";

interface PreviewData {
  headers: string[];
  rows: Array<Record<string, any>>;
  totalRows: number;
  sampleRows: number;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  dataType: string;
}

interface ImportDataPreviewProps {
  data: PreviewData;
  onMappingChange?: (mappings: ColumnMapping[]) => void;
  onProceed?: () => void;
}

const FIELD_MAPPINGS = {
  name: { label: "Name", required: true, type: "string" },
  gender: { label: "Gender", required: false, type: "enum" },
  status: { label: "Status", required: false, type: "enum" },
  color: { label: "Color", required: false, type: "string" },
  bio: { label: "Biography", required: false, type: "string" },
  birth_date: { label: "Birth Date", required: false, type: "date" },
  birth_place: { label: "Birth Place", required: false, type: "string" },
  occupation: { label: "Occupation", required: false, type: "string" },
  parent_names: { label: "Parent Names", required: false, type: "array" },
  spouse_names: { label: "Spouse Names", required: false, type: "array" },
  family_name: { label: "Family Name", required: false, type: "string" },
  family_role: { label: "Family Role", required: false, type: "enum" },
};

export const ImportDataPreview: React.FC<ImportDataPreviewProps> = ({
  data,
  onMappingChange,
  onProceed,
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    // Initialize mappings based on headers
    const initialMappings = data.headers.map((header) => ({
      sourceColumn: header,
      targetField: getSuggestedMapping(header),
      required: false,
      dataType: "string",
    }));
    setMappings(initialMappings);
  }, [data.headers]);

  const getSuggestedMapping = (header: string): string => {
    const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    const suggestions: Record<string, string> = {
      name: "name",
      fullname: "name",
      firstname: "name",
      lastname: "name",
      gender: "gender",
      sex: "gender",
      status: "status",
      color: "color",
      bio: "bio",
      biography: "bio",
      birthdate: "birth_date",
      birth_date: "birth_date",
      dob: "birth_date",
      dateofbirth: "birth_date",
      birthplace: "birth_place",
      birth_place: "birth_place",
      occupation: "occupation",
      job: "occupation",
      profession: "occupation",
      parents: "parent_names",
      parentnames: "parent_names",
      parent_names: "parent_names",
      spouses: "spouse_names",
      spousenames: "spouse_names",
      spouse_names: "spouse_names",
      family: "family_name",
      familyname: "family_name",
      family_name: "family_name",
      role: "family_role",
      familyrole: "family_role",
      family_role: "family_role",
    };

    return suggestions[lowerHeader] || "";
  };

  const updateMapping = (index: number, targetField: string) => {
    const newMappings = [...mappings];
    const fieldInfo =
      FIELD_MAPPINGS[targetField as keyof typeof FIELD_MAPPINGS];

    newMappings[index] = {
      ...newMappings[index],
      targetField,
      required: fieldInfo?.required || false,
      dataType: fieldInfo?.type || "string",
    };

    setMappings(newMappings);
  };

  const validateMappings = (): string[] => {
    const errors: string[] = [];

    // Check for required fields
    const requiredFields = Object.entries(FIELD_MAPPINGS)
      .filter(([, info]) => info.required)
      .map(([field]) => field);

    const mappedFields = mappings
      .filter((m) => m.targetField)
      .map((m) => m.targetField);

    const missingRequired = requiredFields.filter(
      (field) => !mappedFields.includes(field)
    );

    if (missingRequired.length > 0) {
      errors.push(
        `Missing required field mappings: ${missingRequired.join(", ")}`
      );
    }

    // Check for duplicate mappings
    const duplicates = mappings
      .filter((m) => m.targetField)
      .reduce((acc, mapping) => {
        acc[mapping.targetField] = (acc[mapping.targetField] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const duplicateFields = Object.entries(duplicates)
      .filter(([, count]) => count > 1)
      .map(([field]) => field);

    if (duplicateFields.length > 0) {
      errors.push(
        `Duplicate field mappings found: ${duplicateFields.join(", ")}`
      );
    }

    return errors;
  };

  const handleProceed = () => {
    const errors = validateMappings();
    setValidationErrors(errors);

    if (errors.length === 0) {
      onMappingChange?.(mappings);
      onProceed?.();
    }
  };

  const getFieldBadgeVariant = (field: string) => {
    const fieldInfo = FIELD_MAPPINGS[field as keyof typeof FIELD_MAPPINGS];
    return fieldInfo?.required ? "default" : "secondary";
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case "enum":
        return "🏷️";
      case "date":
        return "📅";
      case "array":
        return "📋";
      default:
        return "📝";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Preview
          </CardTitle>
          <CardDescription>
            Preview your data and configure field mappings before importing.
            {data.totalRows > data.sampleRows && (
              <span className="block mt-1 text-amber-600">
                Showing {data.sampleRows} of {data.totalRows} rows
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.headers.map((header, index) => (
                    <TableHead key={index} className="font-medium">
                      {header}
                      {mappings[index]?.targetField && (
                        <Badge
                          variant={getFieldBadgeVariant(
                            mappings[index].targetField
                          )}
                          className="ml-2 text-xs"
                        >
                          {getDataTypeIcon(mappings[index].dataType)}
                          {FIELD_MAPPINGS[
                            mappings[index]
                              .targetField as keyof typeof FIELD_MAPPINGS
                          ]?.label || mappings[index].targetField}
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {data.headers.map((header, colIndex) => (
                      <TableCell key={colIndex} className="max-w-xs truncate">
                        {String(row[header] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mapping Configuration */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {mappings.filter((m) => m.targetField).length} of{" "}
              {data.headers.length} columns mapped
            </div>

            <Dialog
              open={showMappingDialog}
              onOpenChange={setShowMappingDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Mappings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Field Mapping Configuration</DialogTitle>
                  <DialogDescription>
                    Map your data columns to the appropriate family tree fields.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {mappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {mapping.sourceColumn}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sample:{" "}
                          {String(
                            data.rows[0]?.[mapping.sourceColumn] || "N/A"
                          )}
                        </p>
                      </div>

                      <div className="w-48">
                        <Select
                          value={mapping.targetField}
                          onValueChange={(value) => updateMapping(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- No Mapping --</SelectItem>
                            {Object.entries(FIELD_MAPPINGS).map(
                              ([field, info]) => (
                                <SelectItem key={field} value={field}>
                                  {info.label}
                                  {info.required && " *"}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {mapping.targetField && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getFieldBadgeVariant(mapping.targetField)}
                          >
                            {getDataTypeIcon(mapping.dataType)}
                            {mapping.dataType}
                          </Badge>
                          {FIELD_MAPPINGS[
                            mapping.targetField as keyof typeof FIELD_MAPPINGS
                          ]?.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMappingDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setShowMappingDialog(false)}>
                    Apply Mappings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Proceed Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleProceed}
              disabled={validationErrors.length > 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Proceed with Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportDataPreview;
