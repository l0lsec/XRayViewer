import { useEffect, useCallback } from 'react';
import { useStore, useHasImages } from './store/useStore';
import { useCornerstoneInit } from './hooks/useCornerstone';
import { useDicomLoader } from './hooks/useDicomLoader';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { Viewer } from './components/Viewer';
import { FileDropZone } from './components/FileDropZone';
import { MetadataSidebar } from './components/MetadataSidebar';
import { HelpModal } from './components/HelpModal';
import { KEYBOARD_SHORTCUTS } from './constants/toolIds';
import type { ToolName } from './types/tools';

function App() {
  const { isInitialized, error: initError } = useCornerstoneInit();
  const { loadFiles } = useDicomLoader();
  const hasImages = useHasImages();
  const { 
    setActiveTool, 
    toggleInverted, 
    showMetadataSidebar,
    showHelp,
    setShowHelp,
    error 
  } = useStore();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toLowerCase();
    const action = KEYBOARD_SHORTCUTS[key];

    if (action) {
      e.preventDefault();
      
      if (action === 'Invert') {
        toggleInverted();
      } else if (action === 'Reset' || action === 'Fit') {
        // These are handled by the viewer directly
        window.dispatchEvent(new CustomEvent('viewer-action', { detail: action }));
      } else {
        setActiveTool(action as ToolName);
      }
    }

    // Help modal
    if (key === '?' || (key === 'h' && !e.ctrlKey && !e.metaKey)) {
      setShowHelp(!showHelp);
    }

    // Escape to close modals
    if (key === 'escape') {
      setShowHelp(false);
    }
  }, [setActiveTool, toggleInverted, showHelp, setShowHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show initialization error
  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-dicom-darker text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Initialization Error</h1>
          <p className="text-gray-400 mb-4">{initError}</p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page. If the problem persists, 
            check that your browser supports WebGL.
          </p>
        </div>
      </div>
    );
  }

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-dicom-darker text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dicom-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing viewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dicom-darker text-white overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <Toolbar />

        {/* Viewer / Drop Zone */}
        <div className="flex-1 relative">
          {hasImages ? (
            <Viewer />
          ) : (
            <FileDropZone onFilesSelected={loadFiles} />
          )}
          
          {/* Error toast */}
          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg shadow-lg max-w-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Metadata Sidebar */}
        {showMetadataSidebar && hasImages && <MetadataSidebar />}
      </div>

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
