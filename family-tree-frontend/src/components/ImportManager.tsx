import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ImportProgress {
  importId: string;
  status: "pending" | "processing" | "completed" | "failed" | "rolled_back";
  progress: number;
  currentStep: string;
  totalRecords: number;
  processedRecords: number;
  errors: Array<{ row: number; message: string }>;
  startTime: string;
  endTime?: string;
}

interface ValidationResult {
  isValid: boolean;
  fileType: "excel" | "json" | "unknown";
  errors: string[];
  warnings: string[];
}

interface ImportManagerProps {
  familyId?: string;
}

export const ImportManager: React.FC<ImportManagerProps> = ({ familyId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [importId, setImportId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importName, setImportName] = useState("");
  const [templateSize, setTemplateSize] = useState<
    "small" | "medium" | "large"
  >("medium");
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setImportProgress(null);
      setImportId(null);
    }
  };

  const validateFile = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (familyId) {
        formData.append("familyId", familyId);
      }

      const response = await fetch("/api/import/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({
        isValid: false,
        fileType: "unknown",
        errors: ["Failed to validate file. Please try again."],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const startImport = async () => {
    if (!selectedFile || !validationResult?.isValid) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (familyId) {
        formData.append("familyId", familyId);
      }
      if (importName.trim()) {
        formData.append("importName", importName.trim());
      }

      const response = await fetch("/api/import/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed to start");
      }

      const result = await response.json();
      setImportId(result.importId);

      // Start polling for progress
      pollImportProgress(result.importId);
    } catch (error) {
      console.error("Import error:", error);
      setImportProgress({
        importId: "",
        status: "failed",
        progress: 0,
        currentStep: "Failed to start import",
        totalRecords: 0,
        processedRecords: 0,
        errors: [
          { row: 0, message: "Failed to start import. Please try again." },
        ],
        startTime: new Date().toISOString(),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const pollImportProgress = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/import/progress/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to get progress");
        }

        const result = await response.json();

        if (result.success) {
          setImportProgress(result.progress);

          // Stop polling if import is completed or failed
          if (
            result.progress.status === "completed" ||
            result.progress.status === "failed"
          ) {
            clearInterval(pollInterval);
          }
        } else {
          // Import not found or expired
          clearInterval(pollInterval);
          setImportProgress({
            importId: id,
            status: "failed",
            progress: 0,
            currentStep: "Import not found",
            totalRecords: 0,
            processedRecords: 0,
            errors: [{ row: 0, message: "Import not found or has expired." }],
            startTime: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Progress polling error:", error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10 * 60 * 1000);
  };

  const downloadTemplate = async (format: "excel" | "json") => {
    try {
      const params = new URLSearchParams({
        sampleData: includeSampleData.toString(),
        size: templateSize,
      });

      const response = await fetch(`/api/import/template/${format}?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `family-import-template-${templateSize}${
        includeSampleData ? "-with-sample-data" : ""
      }.${format === "excel" ? "xlsx" : "json"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Template download error:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "processing":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Family Data
          </CardTitle>
          <CardDescription>
            Import family members from Excel (.xlsx) or JSON files. Download
            templates to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Data</TabsTrigger>
              <TabsTrigger value="templates">Download Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              {/* File Selection */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.json"
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Import Name */}
              <div className="space-y-2">
                <Label htmlFor="import-name">Import Name (Optional)</Label>
                <Input
                  id="import-name"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g., Smith Family Import"
                />
              </div>

              {/* Validation */}
              {selectedFile && !validationResult && (
                <Button
                  onClick={validateFile}
                  disabled={isValidating}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate File"
                  )}
                </Button>
              )}

              {/* Validation Results */}
              {validationResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {validationResult.isValid
                        ? "File is valid"
                        : "File has errors"}
                    </span>
                    <Badge variant="outline" className="ml-auto">
                      {validationResult.fileType.toUpperCase()}
                    </Badge>
                  </div>

                  {validationResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Import Button */}
              {validationResult?.isValid && (
                <Button
                  onClick={startImport}
                  disabled={isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Import...
                    </>
                  ) : (
                    "Start Import"
                  )}
                </Button>
              )}

              {/* Import Progress */}
              {importProgress && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(importProgress.status)}
                      <span className="font-medium capitalize">
                        {importProgress.status}
                      </span>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(importProgress.status)}
                    >
                      {importProgress.progress}%
                    </Badge>
                  </div>

                  <Progress
                    value={importProgress.progress}
                    className="w-full"
                  />

                  <div className="text-sm text-muted-foreground">
                    {importProgress.currentStep}
                  </div>

                  {importProgress.totalRecords > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Processed: {importProgress.processedRecords} /{" "}
                      {importProgress.totalRecords} records
                    </div>
                  )}

                  {importProgress.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <div className="max-h-32 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-1">
                            {importProgress.errors
                              .slice(0, 5)
                              .map((error, index) => (
                                <li key={index}>
                                  Row {error.row}: {error.message}
                                </li>
                              ))}
                            {importProgress.errors.length > 5 && (
                              <li>
                                ... and {importProgress.errors.length - 5} more
                                errors
                              </li>
                            )}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Template Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Size</Label>
                        <Select
                          value={templateSize}
                          onValueChange={(
                            value: "small" | "medium" | "large"
                          ) => setTemplateSize(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">
                              Small (5 members)
                            </SelectItem>
                            <SelectItem value="medium">
                              Medium (10 members)
                            </SelectItem>
                            <SelectItem value="large">
                              Large (20+ members)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sample-data"
                          checked={includeSampleData}
                          onChange={(e) =>
                            setIncludeSampleData(e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="sample-data">Include sample data</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Download Buttons */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Download Templates
                      </CardTitle>
                      <CardDescription>
                        Choose your preferred format and download a template
                        with sample data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => downloadTemplate("excel")}
                        className="w-full"
                        variant="outline"
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Download Excel Template
                      </Button>

                      <Button
                        onClick={() => downloadTemplate("json")}
                        className="w-full"
                        variant="outline"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download JSON Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Excel Format:</strong> Use the first sheet for
                        member data with columns for name, gender, birth date,
                        etc.
                      </p>
                      <p>
                        <strong>JSON Format:</strong> Use a structured format
                        with families and members arrays.
                      </p>
                      <p>
                        <strong>Required Fields:</strong> At minimum, each
                        member needs a name.
                      </p>
                      <p>
                        <strong>Relationships:</strong> Use parent names and
                        spouse names to establish relationships.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportManager;
