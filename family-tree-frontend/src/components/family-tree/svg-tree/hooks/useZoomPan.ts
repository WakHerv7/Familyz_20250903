import { useRef, useEffect, useState } from "react";
import { CONFIG } from "../utils/constants";

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoomPanState {
  zoomLevel: number;
  viewBox: ViewBox;
  isPanning: boolean;
  panStart: { x: number; y: number };
  isMouseOverSvg: boolean;
  isViewBoxCustom: boolean;
}

export interface ZoomPanActions {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleReset: () => void;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (event: React.WheelEvent) => void;
  updateViewBox: (zoom: number, mouseEvent?: React.WheelEvent) => void;
  downloadSVG: () => void;
  setMouseOverSvg: (isOver: boolean) => void;
}

export function useZoomPan(
  svgRef: React.RefObject<SVGSVGElement>,
  baseViewBox: ViewBox
): ZoomPanState & ZoomPanActions {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBox, setViewBox] = useState<ViewBox>(baseViewBox);
  const viewBoxRef = useRef<ViewBox>(baseViewBox);
  const zoomLevelRef = useRef(1); // Track zoom level to avoid stale closures

  // Sync refs with state changes
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isMouseOverSvg, setIsMouseOverSvg] = useState(false);
  const [isViewBoxCustom, setIsViewBoxCustom] = useState(false);

  // Sync viewBox with baseViewBox changes (when data loads)
  useEffect(() => {
    console.log("🔄 BASE VIEWBOX CHANGED:", {
      oldViewBox: viewBox,
      newBaseViewBox: baseViewBox,
      zoomLevel: zoomLevelRef.current,
      isViewBoxCustom,
    });

    // Only update if we're still at the default zoom level and haven't customized the view
    if (zoomLevelRef.current === 1 && !isViewBoxCustom) {
      setViewBox(baseViewBox);
      viewBoxRef.current = baseViewBox;
      console.log("🔄 VIEWBOX SYNCED WITH BASE VIEWBOX:", baseViewBox);
    }
  }, [baseViewBox]);

  // Also depend on isViewBoxCustom to re-run when it changes
  useEffect(() => {
    if (!isViewBoxCustom && zoomLevelRef.current === 1) {
      console.log(
        "🔄 VIEWBOX RESET TO BASE (custom flag cleared):",
        baseViewBox
      );
      setViewBox(baseViewBox);
      viewBoxRef.current = baseViewBox;
    }
  }, [isViewBoxCustom]);

  // Zoom controls
  const handleZoomIn = () => {
    console.log("🔍 ZOOM IN (Button):", {
      currentZoom: zoomLevelRef.current,
      currentViewBox: viewBox,
      source: "button",
    });
    const newZoom = Math.min(
      zoomLevelRef.current + CONFIG.zoomStep,
      CONFIG.maxZoom
    );
    setZoomLevel(newZoom);
    updateViewBox(newZoom); // No mouse event for button controls
    setIsViewBoxCustom(true);
  };

  const handleZoomOut = () => {
    console.log("🔍 ZOOM OUT (Button):", {
      currentZoom: zoomLevelRef.current,
      currentViewBox: viewBox,
      source: "button",
    });
    const newZoom = Math.max(
      zoomLevelRef.current - CONFIG.zoomStep,
      CONFIG.minZoom
    );
    setZoomLevel(newZoom);
    updateViewBox(newZoom); // No mouse event for button controls
    setIsViewBoxCustom(true);
  };

  const handleReset = () => {
    console.log("🔄 RESET VIEW:", {
      oldZoom: zoomLevelRef.current,
      oldViewBox: viewBox,
      oldBaseViewBox: baseViewBox,
    });
    setZoomLevel(1);
    setViewBox(baseViewBox);
    viewBoxRef.current = baseViewBox; // Update ref to avoid stale closures
    setIsViewBoxCustom(false);
    console.log("🔄 VIEW RESET COMPLETE:", {
      newZoom: 1,
      newViewBox: baseViewBox,
      newBaseViewBox: baseViewBox,
    });
  };

  const updateViewBox = (zoom: number, mouseEvent?: React.WheelEvent) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    let centerX: number;
    let centerY: number;
    let zoomSource: string;

    if (mouseEvent) {
      // Use mouse position for zoom center when mouse event is provided
      const mouseX = mouseEvent.clientX - rect.left;
      const mouseY = mouseEvent.clientY - rect.top;
      centerX = mouseX;
      centerY = mouseY;
      zoomSource = "mouse_wheel";
    } else {
      // Use SVG center for button zoom operations
      centerX = rect.width / 2;
      centerY = rect.height / 2;
      zoomSource = "button";
    }

    console.log("📐 UPDATE VIEWBOX:", {
      zoom: zoom,
      zoomSource: zoomSource,
      svgRect: {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      },
      centerPoint: { x: centerX, y: centerY },
      currentViewBox: viewBox,
      baseViewBox: baseViewBox,
    });

    // Calculate the SVG coordinate that corresponds to the zoom center
    const currentViewBox = viewBoxRef.current; // Use ref to avoid stale closures
    const svgX = currentViewBox.x + (centerX / rect.width) * currentViewBox.w;
    const svgY = currentViewBox.y + (centerY / rect.height) * currentViewBox.h;

    // Calculate new viewBox dimensions based on base viewBox size at zoom level 1.0
    const newW = baseViewBox.w / zoom;
    const newH = baseViewBox.h / zoom;

    // Center the new viewBox on the zoom center point
    const newX = svgX - (centerX / rect.width) * newW;
    const newY = svgY - (centerY / rect.height) * newH;

    const newViewBox = { x: newX, y: newY, w: newW, h: newH };

    console.log("📐 VIEWBOX UPDATED:", {
      oldViewBox: viewBox,
      newViewBox: newViewBox,
      svgCoordinates: { svgX, svgY },
      calculations: {
        newW: newW,
        newH: newH,
        centerRatioX: centerX / rect.width,
        centerRatioY: centerY / rect.height,
      },
    });

    setViewBox(newViewBox);
    viewBoxRef.current = newViewBox; // Update ref to avoid stale closures
  };

  // Pan functionality
  const handleMouseDown = (event: React.MouseEvent) => {
    console.log("🖱️ PAN START:", {
      mousePosition: { clientX: event.clientX, clientY: event.clientY },
      currentViewBox: viewBox,
      zoomLevel: zoomLevelRef.current,
    });
    setIsPanning(true);
    setPanStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning) return;

    const dx = event.clientX - panStart.x;
    const dy = event.clientY - panStart.y;

    // Adjust panning speed based on zoom level, but make it more responsive
    // At higher zoom levels, we want faster panning to feel more natural
    const panSpeed = Math.max(3, zoomLevelRef.current * 0.95); // Scale pan speed with zoom level for better responsiveness

    const oldViewBox = viewBox;
    const newViewBox = {
      ...oldViewBox,
      x: oldViewBox.x - dx * panSpeed,
      y: oldViewBox.y - dy * panSpeed,
    };

    console.log("🖱️ PAN MOVE:", {
      delta: { dx, dy },
      panSpeed: panSpeed,
      zoomLevel: zoomLevelRef.current,
      panSpeedMultiplier: 1.5,
      oldViewBox: oldViewBox,
      newViewBox: newViewBox,
      mousePosition: { clientX: event.clientX, clientY: event.clientY },
      panStart: panStart,
    });

    setViewBox(newViewBox);
    viewBoxRef.current = newViewBox; // Update ref to avoid stale closures
    setPanStart({ x: event.clientX, y: event.clientY });
    setIsViewBoxCustom(true);
  };

  const handleMouseUp = () => {
    console.log("🖱️ PAN END:", {
      finalViewBox: viewBox,
      zoomLevel: zoomLevelRef.current,
    });
    setIsPanning(false);
  };

  // Mouse wheel zoom functionality - only fires when mouse is over SVG
  const handleWheel = (event: React.WheelEvent) => {
    console.log("🎯 WHEEL EVENT:", {
      isMouseOverSvg,
      isPanning,
      deltaY: event.deltaY,
      zoomLevel: zoomLevelRef.current,
    });

    if (!isMouseOverSvg) {
      console.log("❌ WHEEL IGNORED: Mouse not over SVG");
      return; // Only handle wheel when mouse is over SVG
    }

    event.preventDefault();
    event.stopPropagation();

    // Only zoom if we're not panning and the event is significant enough
    if (isPanning) {
      console.log("❌ WHEEL IGNORED: Currently panning");
      return;
    }

    if (Math.abs(event.deltaY) < 10) {
      console.log("❌ WHEEL IGNORED: Delta too small", event.deltaY);
      return;
    }

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom out on scroll down, zoom in on scroll up
    const newZoom = Math.max(
      CONFIG.minZoom,
      Math.min(CONFIG.maxZoom, zoomLevelRef.current * zoomFactor)
    );

    console.log("🔍 ZOOM CALCULATION:", {
      currentZoom: zoomLevelRef.current,
      zoomFactor: zoomFactor,
      newZoom: newZoom,
      willZoom: newZoom !== zoomLevelRef.current,
    });

    if (newZoom !== zoomLevelRef.current) {
      console.log("🔍 ZOOM WHEEL EXECUTING:", {
        currentZoom: zoomLevelRef.current,
        newZoom: newZoom,
        zoomFactor: zoomFactor,
        deltaY: event.deltaY,
        mousePosition: { clientX: event.clientX, clientY: event.clientY },
        currentViewBox: viewBox,
        source: "mouse_wheel",
      });
      setZoomLevel(newZoom);
      updateViewBox(newZoom, event);
      setIsViewBoxCustom(true);
    } else {
      console.log("❌ ZOOM BLOCKED: New zoom equals current zoom");
    }
  };

  // Download SVG
  const downloadSVG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "family-tree.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Set mouse over state
  const setMouseOverSvg = (isOver: boolean) => {
    console.log("🐭 SET MOUSE OVER SVG:", { isOver, previous: isMouseOverSvg });
    setIsMouseOverSvg(isOver);
  };

  // Add non-passive wheel event listener to ensure preventDefault works
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      console.log("❌ WHEEL LISTENER: SVG element not found");
      return;
    }

    console.log("✅ WHEEL LISTENER: Attaching to SVG element", {
      isMouseOverSvg,
    });

    const fn = (e: WheelEvent) => {
      console.log("🎯 RAW WHEEL EVENT:", {
        deltaY: e.deltaY,
        isMouseOverSvg,
        type: e.type,
      });

      if (isMouseOverSvg) {
        e.preventDefault();
        handleWheel(e as any);
      } else {
        console.log("❌ RAW WHEEL IGNORED: Mouse not over SVG");
      }
    };

    svgEl.addEventListener("wheel", fn, { passive: false });
    console.log("✅ WHEEL LISTENER: Attached successfully");

    return () => {
      console.log("🗑️ WHEEL LISTENER: Removing listener");
      svgEl.removeEventListener("wheel", fn);
    };
  }, [isMouseOverSvg]); // Removed zoomLevel dependency to prevent unnecessary re-attachments

  return {
    // State
    zoomLevel,
    viewBox,
    isPanning,
    panStart,
    isMouseOverSvg,
    isViewBoxCustom,

    // Actions
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    updateViewBox,
    downloadSVG,
    setMouseOverSvg,
  };
}
