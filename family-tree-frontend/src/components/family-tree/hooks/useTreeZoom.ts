import { useRef } from "react";
import * as d3 from "d3";

export const useTreeZoom = (containerRef?: React.RefObject<HTMLDivElement>) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svgRef.current);
      const newScale = Math.min(currentTransform.k * 1.2, 4); // Respect max zoom limit

      svg
        .transition()
        .duration(300)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
            .translate(currentTransform.x, currentTransform.y)
            .scale(newScale)
        );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svgRef.current);
      const newScale = Math.max(currentTransform.k * 0.8, 0.1); // Respect min zoom limit

      svg
        .transition()
        .duration(300)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
            .translate(currentTransform.x, currentTransform.y)
            .scale(newScale)
        );
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(500)
        .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    }
  };

  const handleFitToScreen = () => {
    if (svgRef.current && containerRef?.current) {
      const svg = d3.select(svgRef.current);
      const container = containerRef.current;
      const bounds = (
        svg.select(".main-group").node() as SVGGraphicsElement
      )?.getBBox();

      if (bounds && container) {
        const width = container.clientWidth;
        const height = container.clientHeight || 600;

        const scale =
          Math.min(
            width / (bounds.width + 100),
            height / (bounds.height + 100)
          ) * 0.8;

        const translate = [
          width / 2 - (bounds.x + bounds.width / 2) * scale,
          height / 2 - (bounds.y + bounds.height / 2) * scale,
        ];

        svg
          .transition()
          .duration(750)
          .call(
            d3.zoom<SVGSVGElement, unknown>().transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
      }
    }
  };

  const autoFitToScreen = () => {
    // Automatically fit to screen after a short delay to ensure DOM is ready
    console.log("🔄 Auto-fitting tree to screen...");
    setTimeout(() => {
      handleFitToScreen();
    }, 100);
  };

  return {
    svgRef,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleFitToScreen,
    autoFitToScreen,
  };
};
