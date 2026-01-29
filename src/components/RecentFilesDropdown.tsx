import { useState, useEffect, useRef } from 'react';
import { getRecentFiles, clearRecentFiles, type RecentFile } from '../services/storage/preferences';
import { isStudyInLibrary } from '../services/storage/library';

interface RecentFilesDropdownProps {
  onLoadStudy: (studyId: string) => void;
}

export function RecentFilesDropdown({ onLoadStudy }: RecentFilesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<Map<string, boolean>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent files when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadRecentFiles();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadRecentFiles = async () => {
    const files = await getRecentFiles(10);
    setRecentFiles(files);

    // Check which files are in library
    const statusMap = new Map<string, boolean>();
    for (const file of files) {
      if (file.studyId) {
        const inLibrary = await isStudyInLibrary(file.studyId);
        statusMap.set(file.studyId, inLibrary);
      }
    }
    setLibraryStatus(statusMap);
  };

  const handleClear = async () => {
    await clearRecentFiles();
    setRecentFiles([]);
    setIsOpen(false);
  };

  const handleItemClick = (file: RecentFile) => {
    if (file.studyId && libraryStatus.get(file.studyId)) {
      onLoadStudy(file.studyId);
      setIsOpen(false);
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        title="Recent files"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dicom-dark border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-sm font-medium text-white">Recent Files</span>
            {recentFiles.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recentFiles.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No recent files
              </div>
            ) : (
              <div className="py-1">
                {recentFiles.map((file) => {
                  const inLibrary = file.studyId ? libraryStatus.get(file.studyId) : false;
                  
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleItemClick(file)}
                      disabled={!inLibrary}
                      className={`
                        w-full px-3 py-2 text-left transition-colors
                        ${inLibrary 
                          ? 'hover:bg-white/5 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {/* Icon */}
                        <div className={`mt-0.5 ${inLibrary ? 'text-dicom-accent' : 'text-gray-500'}`}>
                          {inLibrary ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {file.studyDescription || file.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {file.modality && (
                              <span className="px-1 py-0.5 bg-gray-700/50 rounded">
                                {file.modality}
                              </span>
                            )}
                            {file.imageCount && (
                              <span>{file.imageCount} images</span>
                            )}
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatRelativeTime(file.timestamp)}
                        </span>
                      </div>

                      {!inLibrary && (
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Not in library
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
