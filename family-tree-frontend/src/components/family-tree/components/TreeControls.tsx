import React from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Users,
  Layers,
  Download,
} from "lucide-react";
import { ViewMode } from "../types";

interface TreeControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFitToScreen: () => void;
  onDownload: () => void;
}

export const TreeControls: React.FC<TreeControlsProps> = ({
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToScreen,
  onDownload,
}) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Zoom controls only for visual modes */}
      {viewMode !== "explorer" && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onFitToScreen}
            title="Fit to Screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* View mode buttons */}
      <Button
        variant={viewMode === "explorer" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("explorer")}
        title="Explorer View"
      >
        <Layers className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "hierarchical" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("hierarchical")}
        title="Hierarchical View"
      >
        <Users className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "force" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("force")}
        title="Force View"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* Download only for visual modes */}
      {viewMode !== "explorer" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          title="Download SVG"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
