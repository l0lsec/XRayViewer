import { useState, useEffect, useCallback } from 'react';
import {
  getLibraryStudies,
  deleteStudyFromLibrary,
  getLibraryStats,
  clearLibrary,
  formatBytes,
  type StoredStudy,
} from '../services/storage/library';
import { useStore } from '../store/useStore';

interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadStudy: (studyId: string) => void;
}

export function LibraryPanel({ isOpen, onClose, onLoadStudy }: LibraryPanelProps) {
  const [studies, setStudies] = useState<StoredStudy[]>([]);
  const [stats, setStats] = useState<{
    studyCount: number;
    totalImages: number;
    totalSize: number;
    storageUsed: number;
    storageQuota: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showPhiData } = useStore();

  // Load library data
  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studyList, libraryStats] = await Promise.all([
        getLibraryStudies(),
        getLibraryStats(),
      ]);
      setStudies(studyList);
      setStats(libraryStats);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen, loadLibrary]);

  const handleDelete = async (studyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Delete this study from your library? This cannot be undone.')) {
      return;
    }

    setDeletingId(studyId);
    try {
      await deleteStudyFromLibrary(studyId);
      await loadLibrary();
    } catch (error) {
      console.error('Failed to delete study:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear entire library? This will delete all stored studies and cannot be undone.')) {
      return;
    }

    try {
      await clearLibrary();
      await loadLibrary();
    } catch (error) {
      console.error('Failed to clear library:', error);
    }
  };

  const handleLoadStudy = (studyId: string) => {
    onLoadStudy(studyId);
    onClose();
  };

  // Format patient name for display
  const formatPatientName = (name?: string) => {
    if (!name) return 'Unknown Patient';
    if (!showPhiData) return '••••••••';
    // DICOM format: LastName^FirstName
    const parts = name.split('^');
    if (parts.length >= 2) {
      return `${parts[1]} ${parts[0]}`.trim();
    }
    return name;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-dicom-dark border-r border-gray-700 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-white">Image Library</h2>
          <p className="text-xs text-gray-400">
            {stats ? `${stats.studyCount} studies • ${formatBytes(stats.totalSize)}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Storage indicator */}
      {stats && stats.storageQuota > 0 && (
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Storage Used</span>
            <span>{formatBytes(stats.storageUsed)} / {formatBytes(stats.storageQuota)}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-dicom-accent transition-all"
              style={{ width: `${Math.min(100, (stats.storageUsed / stats.storageQuota) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Study list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dicom-accent"></div>
          </div>
        ) : studies.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400 text-sm mb-2">No studies in library</p>
            <p className="text-gray-500 text-xs">
              Import studies to access them offline
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {studies.map((study) => (
              <div
                key={study.id}
                onClick={() => handleLoadStudy(study.id)}
                className="p-3 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-800 rounded flex-shrink-0 overflow-hidden">
                    {study.thumbnailDataUrl ? (
                      <img
                        src={study.thumbnailDataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {study.studyDescription || 'Unknown Study'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {formatPatientName(study.patientName)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {study.modality && (
                        <span className="px-1.5 py-0.5 bg-gray-700 rounded">
                          {study.modality}
                        </span>
                      )}
                      <span>{study.imageCount} images</span>
                      <span>{formatBytes(study.totalSize)}</span>
                    </div>
                    {study.studyDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatStudyDate(study.studyDate)}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(study.id, e)}
                    disabled={deletingId === study.id}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors self-start"
                    title="Delete study"
                  >
                    {deletingId === study.id ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {studies.length > 0 && (
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleClearAll}
            className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors"
          >
            Clear All Studies
          </button>
        </div>
      )}
    </div>
  );
}

// Format DICOM date (YYYYMMDD) for display
function formatStudyDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${month}/${day}/${year}`;
}
