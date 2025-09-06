import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Users,
  Layers,
  Download,
  Image,
  Network,
  GitBranch,
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
  const viewModeOptions = [
    {
      value: "explorer" as ViewMode,
      label: "Explorer",
      icon: Layers,
      description: "Explorer tree view",
    },
    // {
    //   value: "folder" as ViewMode,
    //   label: "Folder",
    //   icon: Users,
    //   description: "Folder tree view",
    // },
    {
      value: "svg" as ViewMode,
      label: "Hierarchical",
      icon: Network, //Image,
      description: "Hierarchical visualization", //"Pure SVG visualization",
    },
    {
      value: "force" as ViewMode,
      label: "Structured",
      icon: GitBranch, //Network, //Users,
      description: "Structured layout",
    },
    // {
    //   value: "force" as ViewMode,
    //   label: "Force",
    //   icon: Network,
    //   description: "Dynamic force layout",
    // },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* View Mode Tabs */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 w-full">
          {/* <span className="text-sm font-medium text-gray-700">View Mode:</span> */}
          <Tabs
            className="w-fit"
            value={viewMode}
            onValueChange={(value) => onViewModeChange(value as ViewMode)}
          >
            <TabsList className="grid w-full h-[50px] px-3 grid-cols-3 gap-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
              {viewModeOptions.map((option, index) => {
                const Icon = option.icon;
                const colors = [
                  "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25",
                  "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25",
                  "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25",

                  // "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25",
                ];
                return (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className={`flex items-center space-x-1 text-md font-medium transition-all duration-200 rounded-md px-2 py-1.5 hover:scale-105 ${
                      viewMode === option.value
                        ? `${colors[index]} text-white shadow-lg transform scale-105`
                        : "dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 dark:hover:text-gray-100"
                    }`}
                    title={option.description}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        viewMode === option.value
                          ? "text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                    <span
                      className={`${
                        viewMode === option.value ? "text-white" : ""
                      } hidden sm:inline`}
                    >
                      {option.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Operational Controls - only for visual modes */}
        {/* {viewMode !== "explorer" && (
          <div className="flex items-center space-x-1">
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
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              title="Download SVG"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
};
