import { useStore, useHasImages, useImageCount } from '../store/useStore';
import { RecentFilesDropdown } from './RecentFilesDropdown';

interface HeaderProps {
  onLoadStudyFromLibrary: (studyId: string) => void;
}

export function Header({ onLoadStudyFromLibrary }: HeaderProps) {
  const hasImages = useHasImages();
  const imageCount = useImageCount();
  const { 
    currentImageIndex, 
    isLoading, 
    loadingProgress,
    toggleMetadataSidebar,
    showMetadataSidebar,
    toggleLibraryPanel,
    showLibraryPanel,
    toggleThumbnailStrip,
    showThumbnailStrip,
    setShowHelp,
    setShowStorageSettings,
    reset
  } = useStore();

  const handleNewSession = () => {
    if (hasImages) {
      const confirmed = window.confirm(
        'Start a new session? This will clear all loaded images.'
      );
      if (confirmed) {
        reset();
        window.location.reload();
      }
    }
  };

  return (
    <header className="h-14 bg-dicom-dark border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left side - Logo and Library */}
      <div className="flex items-center gap-3">
        {/* Library button */}
        <button
          onClick={() => toggleLibraryPanel()}
          className={`p-2 rounded-lg transition-colors ${
            showLibraryPanel 
              ? 'bg-dicom-accent text-white' 
              : 'text-gray-400 hover:bg-white/10'
          }`}
          title="Image Library (L)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        {/* Logo */}
        <svg 
          className="w-8 h-8" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="15" fill="#1a1a2e"/>
          <rect x="20" y="15" width="60" height="70" rx="5" fill="#0f0f1a" stroke="#4a90d9" strokeWidth="4"/>
          <circle cx="50" cy="40" r="12" stroke="#4a90d9" strokeWidth="3"/>
          <circle cx="50" cy="40" r="4" fill="#4a90d9"/>
        </svg>
        <div>
          <h1 className="text-lg font-semibold text-white">DICOM Viewer</h1>
          <p className="text-xs text-gray-400">Local-first • Privacy-focused</p>
        </div>
      </div>

      {/* Center - Image counter / Progress */}
      <div className="flex items-center gap-4">
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-dicom-accent transition-all duration-200"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        )}
        
        {hasImages && !isLoading && (
          <div className="text-sm text-gray-300">
            Image {currentImageIndex + 1} of {imageCount}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Recent Files */}
        <RecentFilesDropdown onLoadStudy={onLoadStudyFromLibrary} />

        {hasImages && (
          <>
            {/* Toggle Thumbnails */}
            <button
              onClick={() => toggleThumbnailStrip()}
              className={`p-2 rounded-lg transition-colors ${
                showThumbnailStrip 
                  ? 'bg-dicom-accent text-white' 
                  : 'text-gray-400 hover:bg-white/10'
              }`}
              title="Toggle thumbnail strip (T)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Toggle Sidebar */}
            <button
              onClick={() => toggleMetadataSidebar()}
              className={`p-2 rounded-lg transition-colors ${
                showMetadataSidebar 
                  ? 'bg-dicom-accent text-white' 
                  : 'text-gray-400 hover:bg-white/10'
              }`}
              title="Toggle metadata sidebar (I)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* New Session */}
            <button
              onClick={handleNewSession}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              title="New session"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </>
        )}

        {/* Settings */}
        <button
          onClick={() => setShowStorageSettings(true)}
          className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
          title="Storage Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
          title="Help (?)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
