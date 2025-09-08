import { useState, useCallback, RefObject, useEffect } from "react";

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseZoomPanProps {
  svgRef: RefObject<SVGSVGElement>;
  baseViewBox: ViewBox;
}

export function useZoomPan({ svgRef, baseViewBox }: UseZoomPanProps) {
  const [viewBox, setViewBox] = useState<ViewBox>(baseViewBox);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseOverSvg, setMouseOverSvg] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.2, 4);
    setZoomLevel(newZoom);

    const scale = baseViewBox.w / newZoom;
    const newViewBox = {
      ...viewBox,
      w: scale,
      h: scale * (baseViewBox.h / baseViewBox.w),
    };
    setViewBox(newViewBox);
  }, [zoomLevel, viewBox, baseViewBox]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.1);
    setZoomLevel(newZoom);

    const scale = baseViewBox.w / newZoom;
    const newViewBox = {
      ...viewBox,
      w: scale,
      h: scale * (baseViewBox.h / baseViewBox.w),
    };
    setViewBox(newViewBox);
  }, [zoomLevel, viewBox, baseViewBox]);

  const handleReset = useCallback(() => {
    setZoomLevel(1);
    setViewBox(baseViewBox);
  }, [baseViewBox]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) {
      // Left mouse button
      setIsPanning(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isPanning && dragStart) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;

        // Convert screen coordinates to SVG coordinates
        const scaleX = viewBox.w / (svgRef.current?.clientWidth || 1);
        const scaleY = viewBox.h / (svgRef.current?.clientHeight || 1);

        const newViewBox = {
          ...viewBox,
          x: viewBox.x - deltaX * scaleX,
          y: viewBox.y - deltaY * scaleY,
        };

        setViewBox(newViewBox);
        setDragStart({ x: event.clientX, y: event.clientY });
      }
    },
    [isPanning, dragStart, viewBox, svgRef]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragStart(null);
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!mouseOverSvg) return; // Only handle wheel when mouse is over SVG

      event.preventDefault();
      event.stopPropagation();

      console.log("🔍 Wheel event received by SVG - handling zoom");

      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.1, Math.min(4, zoomLevel * zoomFactor));
      setZoomLevel(newZoom);

      // Zoom towards mouse position
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const scale = baseViewBox.w / newZoom;
        const newViewBox = {
          x: viewBox.x + (mouseX / rect.width) * (viewBox.w - scale),
          y:
            viewBox.y +
            (mouseY / rect.height) *
              (viewBox.h - scale * (baseViewBox.h / baseViewBox.w)),
          w: scale,
          h: scale * (baseViewBox.h / baseViewBox.w),
        };

        setViewBox(newViewBox);
      }
    },
    [mouseOverSvg, zoomLevel, viewBox, baseViewBox, svgRef]
  );

  const downloadSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `family-tree-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }, [svgRef]);

  // Non-passive wheel event listener to guarantee preventDefault works
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const fn = (e: WheelEvent) => {
      if (mouseOverSvg) {
        e.preventDefault();
        handleWheel(e as any);
      }
    };

    svgEl.addEventListener("wheel", fn, { passive: false });
    return () => svgEl.removeEventListener("wheel", fn);
  }, [mouseOverSvg, handleWheel, svgRef]);

  return {
    viewBox,
    zoomLevel,
    isPanning,
    mouseOverSvg,
    setMouseOverSvg,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    downloadSVG,
  };
}
