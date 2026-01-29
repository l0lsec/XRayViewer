import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { useViewport } from '../hooks/useViewport';
import { ThumbnailStrip } from './ThumbnailStrip';
import { generateThumbnail, saveThumbnail } from '../services/storage/thumbnails';

export function Viewer() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [seriesBoundaries, setSeriesBoundaries] = useState<number[]>([]);
  
  const { 
    currentImageIds, 
    currentImageIndex, 
    setCurrentImageIndex,
    activeTool,
    isInverted,
    showThumbnailStrip,
    studies
  } = useStore();

  const { 
    viewportId, 
    resetView, 
    fitToWindow, 
    exportImage,
    setInvert,
    getViewportCanvas
  } = useViewport(viewportRef, currentImageIds);

  // Calculate series boundaries from studies
  useEffect(() => {
    if (studies.length === 0) {
      setSeriesBoundaries([]);
      return;
    }

    const boundaries: number[] = [];
    let imageIndex = 0;
    
    for (const study of studies) {
      for (const series of study.series) {
        if (imageIndex > 0) {
          boundaries.push(imageIndex);
        }
        imageIndex += series.images.length;
      }
    }
    
    setSeriesBoundaries(boundaries);
  }, [studies]);

  // Generate thumbnail for current image
  useEffect(() => {
    if (currentImageIds.length === 0) return;
    
    const currentImageId = currentImageIds[currentImageIndex];
    if (!currentImageId || thumbnails.has(currentImageId)) return;

    // Delay thumbnail generation to allow image to render
    const timeout = setTimeout(async () => {
      const canvas = getViewportCanvas();
      if (!canvas) return;

      try {
        const dataUrl = generateThumbnail(canvas, 128);
        if (dataUrl) {
          setThumbnails(prev => {
            const next = new Map(prev);
            next.set(currentImageId, dataUrl);
            return next;
          });

          // Save to IndexedDB for persistence
          saveThumbnail(currentImageId, dataUrl, canvas.width, canvas.height);
        }
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentImageIndex, currentImageIds, thumbnails, getViewportCanvas]);

  // Handle viewer actions from toolbar/keyboard
  useEffect(() => {
    const handleViewerAction = (e: CustomEvent<string>) => {
      switch (e.detail) {
        case 'Reset':
          resetView();
          break;
        case 'Fit':
          fitToWindow();
          break;
        case 'Export':
          exportImage();
          break;
      }
    };

    window.addEventListener('viewer-action', handleViewerAction as EventListener);
    return () => {
      window.removeEventListener('viewer-action', handleViewerAction as EventListener);
    };
  }, [resetView, fitToWindow, exportImage]);

  // Handle invert changes
  useEffect(() => {
    setInvert(isInverted);
  }, [isInverted, setInvert]);

  // Handle scroll wheel for stack navigation
  const handleWheel = useCallback((e: WheelEvent) => {
    if (currentImageIds.length <= 1) return;
    
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(currentImageIds.length - 1, currentImageIndex + delta));
    
    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
    }
  }, [currentImageIds.length, currentImageIndex, setCurrentImageIndex]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    // Only add wheel handler if we have multiple images and not using zoom tool
    if (currentImageIds.length > 1 && activeTool !== 'Zoom') {
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel, currentImageIds.length, activeTool]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setCurrentImageIndex(Math.min(currentImageIds.length - 1, currentImageIndex + 1));
          break;
        case 'Home':
          e.preventDefault();
          setCurrentImageIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentImageIndex(currentImageIds.length - 1);
          break;
        case 'PageUp':
          // Jump to previous series
          e.preventDefault();
          const prevBoundary = [...seriesBoundaries].reverse().find(b => b < currentImageIndex);
          setCurrentImageIndex(prevBoundary ?? 0);
          break;
        case 'PageDown':
          // Jump to next series
          e.preventDefault();
          const nextBoundary = seriesBoundaries.find(b => b > currentImageIndex);
          setCurrentImageIndex(nextBoundary ?? currentImageIds.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, currentImageIds.length, setCurrentImageIndex, seriesBoundaries]);

  // Get cursor class based on active tool
  const getCursorClass = () => {
    switch (activeTool) {
      case 'WindowLevel':
        return 'cursor-crosshair';
      case 'Pan':
        return 'cursor-grab active:cursor-grabbing';
      case 'Zoom':
        return 'cursor-zoom-in';
      case 'Length':
        return 'cursor-crosshair';
      default:
        return '';
    }
  };

  // Get current series info
  const getCurrentSeriesInfo = () => {
    if (seriesBoundaries.length === 0) return null;
    
    let seriesIndex = 0;
    for (let i = 0; i < seriesBoundaries.length; i++) {
      if (currentImageIndex >= seriesBoundaries[i]) {
        seriesIndex = i + 1;
      }
    }
    
    return {
      current: seriesIndex + 1,
      total: seriesBoundaries.length + 1,
    };
  };

  const seriesInfo = getCurrentSeriesInfo();

  return (
    <div className="h-full w-full bg-black flex flex-col">
      {/* Main viewport */}
      <div className="flex-1 relative">
        <div
          ref={viewportRef}
          id={viewportId}
          className={`w-full h-full ${getCursorClass()}`}
        />

        {/* Series indicator */}
        {seriesInfo && seriesInfo.total > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded text-sm text-white">
            Series {seriesInfo.current} of {seriesInfo.total}
          </div>
        )}

        {/* Image navigation overlay */}
        {currentImageIds.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 px-4 py-2 rounded-lg">
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              className="p-1 text-white disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-white text-sm font-mono">
              {currentImageIndex + 1} / {currentImageIds.length}
            </div>
            
            <button
              onClick={() => setCurrentImageIndex(Math.min(currentImageIds.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === currentImageIds.length - 1}
              className="p-1 text-white disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Vertical scroll indicator */}
        {currentImageIds.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-gray-700 rounded">
            <div
              className="w-full bg-dicom-accent rounded transition-all"
              style={{
                height: `${100 / currentImageIds.length}%`,
                top: `${(currentImageIndex / Math.max(1, currentImageIds.length - 1)) * (100 - 100 / currentImageIds.length)}%`,
                position: 'relative'
              }}
            />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnailStrip && currentImageIds.length > 1 && (
        <ThumbnailStrip
          imageIds={currentImageIds}
          currentIndex={currentImageIndex}
          onSelect={setCurrentImageIndex}
          thumbnails={thumbnails}
          seriesBoundaries={seriesBoundaries}
        />
      )}
    </div>
  );
}
