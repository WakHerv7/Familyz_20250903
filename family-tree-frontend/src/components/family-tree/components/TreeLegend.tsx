import React from "react";

export const TreeLegend: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 text-xs">
      <div className="flex items-center space-x-1">
        <div className="w-3 h-0.5 bg-blue-500"></div>
        <span>Parent</span>
      </div>
      <div className="flex items-center space-x-1">
        <div
          className="w-3 h-0.5 bg-pink-500"
          style={{ borderTop: "2px dashed #EC4899", height: "0" }}
        ></div>
        <span>Spouse</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-0.5 bg-green-500"></div>
        <span>Child</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-dashed"></div>
        <span>You</span>
      </div>
    </div>
  );
};
