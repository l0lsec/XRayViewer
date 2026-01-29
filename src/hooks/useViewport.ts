import { useEffect, useRef, useCallback, useState } from 'react';
import {
  RenderingEngine,
  Enums,
  getRenderingEngine,
  type Types,
} from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import { useStore } from '../store/useStore';
import { 
  RENDERING_ENGINE_ID, 
  TOOL_GROUP_ID,
  VIEWPORT_ID,
  setActiveTool 
} from './useCornerstone';
import { extractMetadata } from '../services/dicom/metadata';

export function useViewport(
  containerRef: React.RefObject<HTMLDivElement | null>,
  imageIds: string[]
) {
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const viewportIdRef = useRef(VIEWPORT_ID);
  const [isReady, setIsReady] = useState(false);
  
  const { 
    activeTool, 
    currentImageIndex, 
    setCurrentMetadata
  } = useStore();

  // Initialize rendering engine and viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container || imageIds.length === 0) return;

    let mounted = true;

    const setupViewport = async () => {
      try {
        // Get or create rendering engine
        let renderingEngine = getRenderingEngine(RENDERING_ENGINE_ID);
        if (!renderingEngine) {
          renderingEngine = new RenderingEngine(RENDERING_ENGINE_ID);
        }
        renderingEngineRef.current = renderingEngine;

        // Define viewport input
        const viewportInput: Types.PublicViewportInput = {
          viewportId: viewportIdRef.current,
          type: Enums.ViewportType.STACK,
          element: container,
          defaultOptions: {
            background: [0, 0, 0] as Types.Point3,
          },
        };

        // Enable the element
        renderingEngine.enableElement(viewportInput);

        // Get the viewport
        const viewport = renderingEngine.getViewport(viewportIdRef.current) as Types.IStackViewport;
        
        if (!viewport) {
          throw new Error('Failed to get viewport');
        }

        // Add viewport to tool group
        const toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
        if (toolGroup) {
          toolGroup.addViewport(viewportIdRef.current, RENDERING_ENGINE_ID);
        }

        // Set the stack
        await viewport.setStack(imageIds, currentImageIndex);
        
        // Render
        viewport.render();

        if (mounted) {
          setIsReady(true);
          
          // Extract and set metadata for first image
          if (imageIds[currentImageIndex]) {
            const metadata = await extractMetadata(imageIds[currentImageIndex]);
            setCurrentMetadata(metadata);
          }
        }
      } catch (error) {
        console.error('Failed to setup viewport:', error);
      }
    };

    setupViewport();

    return () => {
      mounted = false;
      // Cleanup viewport on unmount
      const renderingEngine = renderingEngineRef.current;
      if (renderingEngine) {
        try {
          const toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
          if (toolGroup) {
            toolGroup.removeViewports(RENDERING_ENGINE_ID, viewportIdRef.current);
          }
          renderingEngine.disableElement(viewportIdRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [containerRef, imageIds]);

  // Handle image index changes
  useEffect(() => {
    if (!isReady || imageIds.length === 0) return;

    const renderingEngine = renderingEngineRef.current;
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(viewportIdRef.current) as Types.IStackViewport;
    if (!viewport) return;

    const updateImage = async () => {
      try {
        await viewport.setImageIdIndex(currentImageIndex);
        viewport.render();

        // Update metadata
        if (imageIds[currentImageIndex]) {
          const metadata = await extractMetadata(imageIds[currentImageIndex]);
          setCurrentMetadata(metadata);
        }
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    };

    updateImage();
  }, [currentImageIndex, isReady, imageIds, setCurrentMetadata]);

  // Handle tool changes
  useEffect(() => {
    if (isReady) {
      setActiveTool(activeTool);
    }
  }, [activeTool, isReady]);

  // Reset view
  const resetView = useCallback(() => {
    const renderingEngine = renderingEngineRef.current;
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(viewportIdRef.current) as Types.IStackViewport;
    if (!viewport) return;

    viewport.resetCamera();
    viewport.resetProperties();
    viewport.render();
  }, []);

  // Fit to window
  const fitToWindow = useCallback(() => {
    const renderingEngine = renderingEngineRef.current;
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(viewportIdRef.current) as Types.IStackViewport;
    if (!viewport) return;

    viewport.resetCamera();
    viewport.render();
  }, []);

  // Set invert
  const setInvert = useCallback((invert: boolean) => {
    const renderingEngine = renderingEngineRef.current;
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(viewportIdRef.current) as Types.IStackViewport;
    if (!viewport) return;

    const properties = viewport.getProperties();
    viewport.setProperties({ ...properties, invert });
    viewport.render();
  }, []);

  // Export image as PNG
  const exportImage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Create a new canvas without annotations
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw only the image (no annotations)
    ctx.drawImage(canvas, 0, 0);

    // Create download link
    const link = document.createElement('a');
    link.download = `dicom-export-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [containerRef]);

  return {
    viewportId: viewportIdRef.current,
    isReady,
    resetView,
    fitToWindow,
    setInvert,
    exportImage,
  };
}
