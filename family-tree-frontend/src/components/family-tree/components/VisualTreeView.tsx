import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Network, GitBranch } from "lucide-react";
import { ViewMode } from "../types";
import { TreeLegend } from "./TreeLegend";

interface VisualTreeViewProps {
  viewMode: ViewMode;
  containerRef: React.RefObject<HTMLDivElement>;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const VisualTreeView: React.FC<VisualTreeViewProps> = ({
  viewMode,
  containerRef,
  svgRef,
}) => {
  return (
    <Card className="w-full border-gray-200">
      <CardHeader className="w-full pb-3">
        <div className="w-full flex justify-between gap-5">
          <div className=" ">
            <CardTitle className="text-lg flex items-center space-x-2">
              <GitBranch className="text-blue-600 h-5 w-5" />
              <span>Force-Directed Family Tree</span>
              {/* {viewMode === "hierarchical" ? (
            <>
              <Users className="h-5 w-5" />
              <span>Hierarchical Family Tree</span>
            </>
          ) : (
            <>
              <Network className="h-5 w-5" />
              <span>Force-Directed Family Tree</span>
            </>
          )} */}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {viewMode === "hierarchical"
                ? "Structured layout with clear generational hierarchy"
                : "Dynamic force-directed layout with interactive node positioning"}
            </div>
          </div>
          <div>
            <TreeLegend />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          ref={containerRef}
          className="w-full h-96 border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50"
          style={{ minHeight: "500px" }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="cursor-move"
          />
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1 mt-4">
          <p>
            •{" "}
            <strong>
              {viewMode === "force"
                ? "Drag nodes to rearrange"
                : "Click nodes to explore"}
            </strong>{" "}
            the family tree
          </p>
          <p>
            • <strong>Click nodes</strong> to view member details
          </p>
          <p>
            • <strong>Scroll or use controls</strong> to zoom in/out
          </p>
          <p>
            • <strong>Drag background</strong> to pan around the tree
          </p>
          <p>
            • <strong>Generation rings:</strong> Blue (parents), Amber (same),
            Green (children)
          </p>
          <p>
            • <strong>Current view:</strong>{" "}
            {viewMode === "hierarchical"
              ? "Structured layout"
              : "Dynamic force layout"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
