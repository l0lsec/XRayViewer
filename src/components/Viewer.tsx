import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useViewport } from '../hooks/useViewport';

export function Viewer() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { 
    currentImageIds, 
    currentImageIndex, 
    setCurrentImageIndex,
    activeTool,
    isInverted
  } = useStore();

  const { 
    viewportId, 
    resetView, 
    fitToWindow, 
    exportImage,
    setInvert
  } = useViewport(viewportRef, currentImageIds);

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

  return (
    <div className="h-full w-full bg-black relative">
      {/* Viewport container */}
      <div
        ref={viewportRef}
        id={viewportId}
        className={`w-full h-full ${getCursorClass()}`}
      />

      {/* Image navigation for stacks */}
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

      {/* Current image indicator line (scrollbar) */}
      {currentImageIds.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-gray-700 rounded">
          <div
            className="w-full bg-dicom-accent rounded transition-all"
            style={{
              height: `${100 / currentImageIds.length}%`,
              top: `${(currentImageIndex / (currentImageIds.length - 1)) * (100 - 100 / currentImageIds.length)}%`,
              position: 'relative'
            }}
          />
        </div>
      )}
    </div>
  );
}
