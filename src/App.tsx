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
import { LibraryPanel } from './components/LibraryPanel';
import { StorageSettings } from './components/StorageSettings';
import { loadStudyFromLibrary } from './services/storage/library';
import { KEYBOARD_SHORTCUTS } from './constants/toolIds';
import type { ToolName } from './types/tools';

function App() {
  const { isInitialized, error: initError } = useCornerstoneInit();
  const { loadFiles } = useDicomLoader();
  const hasImages = useHasImages();
  const { 
    setActiveTool, 
    toggleInverted, 
    toggleLibraryPanel,
    toggleThumbnailStrip,
    showMetadataSidebar,
    showHelp,
    setShowHelp,
    showLibraryPanel,
    setShowLibraryPanel,
    showStorageSettings,
    setShowStorageSettings,
    setCurrentImageIds,
    setCurrentStudyId,
    setLoading,
    setLoadingProgress,
    setError,
    error 
  } = useStore();

  // Load study from library
  const handleLoadStudyFromLibrary = useCallback(async (studyId: string) => {
    setLoading(true);
    setLoadingProgress(0);
    setError(null);

    try {
      const result = await loadStudyFromLibrary(studyId);
      
      if (!result) {
        throw new Error('Study not found in library');
      }

      setCurrentImageIds(result.imageIds);
      setCurrentStudyId(studyId);
      setLoadingProgress(100);
    } catch (err) {
      console.error('Failed to load study from library:', err);
      setError(err instanceof Error ? err.message : 'Failed to load study');
    } finally {
      setLoading(false);
    }
  }, [setCurrentImageIds, setCurrentStudyId, setLoading, setLoadingProgress, setError]);

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

    // Additional shortcuts
    switch (key) {
      case 'l':
        if (!e.ctrlKey && !e.metaKey) {
          toggleLibraryPanel();
        }
        break;
      case 't':
        if (!e.ctrlKey && !e.metaKey) {
          toggleThumbnailStrip();
        }
        break;
      case 's':
        if (!e.ctrlKey && !e.metaKey && hasImages) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('save-to-library'));
        }
        break;
      case '?':
      case 'h':
        if (!e.ctrlKey && !e.metaKey) {
          setShowHelp(!showHelp);
        }
        break;
      case 'escape':
        setShowHelp(false);
        setShowLibraryPanel(false);
        setShowStorageSettings(false);
        break;
    }
  }, [
    setActiveTool, 
    toggleInverted, 
    toggleLibraryPanel, 
    toggleThumbnailStrip,
    showHelp, 
    setShowHelp, 
    setShowLibraryPanel,
    setShowStorageSettings,
    hasImages
  ]);

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
      <Header onLoadStudyFromLibrary={handleLoadStudyFromLibrary} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Library Panel (slides in from left) */}
        <LibraryPanel 
          isOpen={showLibraryPanel}
          onClose={() => setShowLibraryPanel(false)}
          onLoadStudy={handleLoadStudyFromLibrary}
        />

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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg shadow-lg max-w-md z-20">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="absolute top-1 right-1 p-1 hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Metadata Sidebar */}
        {showMetadataSidebar && hasImages && <MetadataSidebar />}
      </div>

      {/* Modals */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showStorageSettings && <StorageSettings onClose={() => setShowStorageSettings(false)} />}
    </div>
  );
}

export default App;
