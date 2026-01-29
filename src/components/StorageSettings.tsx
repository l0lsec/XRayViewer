import { useState, useEffect } from 'react';
import {
  getLibraryStats,
  getLibraryStudies,
  deleteStudyFromLibrary,
  clearLibrary,
  formatBytes,
  type StoredStudy,
} from '../services/storage/library';
import { clearAllThumbnails } from '../services/storage/thumbnails';
import { clearRecentFiles, clearAllStorage } from '../services/storage/preferences';

interface StorageSettingsProps {
  onClose: () => void;
}

export function StorageSettings({ onClose }: StorageSettingsProps) {
  const [stats, setStats] = useState<{
    studyCount: number;
    totalImages: number;
    totalSize: number;
    storageUsed: number;
    storageQuota: number;
  } | null>(null);
  const [studies, setStudies] = useState<StoredStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [libraryStats, studyList] = await Promise.all([
        getLibraryStats(),
        getLibraryStudies(),
      ]);
      setStats(libraryStats);
      setStudies(studyList);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudy = async (studyId: string) => {
    if (!window.confirm('Delete this study? This cannot be undone.')) return;
    
    try {
      await deleteStudyFromLibrary(studyId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete study:', error);
    }
  };

  const handleClearLibrary = async () => {
    if (!window.confirm('Clear entire library? This will delete all stored studies and cannot be undone.')) return;
    
    setIsClearing(true);
    try {
      await clearLibrary();
      await loadData();
    } catch (error) {
      console.error('Failed to clear library:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearThumbnails = async () => {
    if (!window.confirm('Clear all cached thumbnails?')) return;
    
    try {
      await clearAllThumbnails();
      alert('Thumbnails cleared');
    } catch (error) {
      console.error('Failed to clear thumbnails:', error);
    }
  };

  const handleClearRecent = async () => {
    if (!window.confirm('Clear recent files history?')) return;
    
    try {
      await clearRecentFiles();
      alert('Recent files cleared');
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear ALL local data? This includes library, thumbnails, preferences, and recent files. This cannot be undone.')) return;
    
    setIsClearing(true);
    try {
      await clearAllStorage();
      await loadData();
      alert('All local data cleared');
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const storagePercent = stats && stats.storageQuota > 0
    ? (stats.storageUsed / stats.storageQuota) * 100
    : 0;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-dicom-dark rounded-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Storage Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dicom-accent"></div>
            </div>
          ) : (
            <>
              {/* Storage Overview */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-3">
                  Storage Usage
                </h3>
                
                {stats && (
                  <div className="bg-dicom-darker rounded-lg p-4">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Used</span>
                      <span>{formatBytes(stats.storageUsed)} / {formatBytes(stats.storageQuota)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full transition-all ${
                          storagePercent > 90 ? 'bg-red-500' :
                          storagePercent > 70 ? 'bg-yellow-500' :
                          'bg-dicom-accent'
                        }`}
                        style={{ width: `${Math.min(100, storagePercent)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-white">{stats.studyCount}</p>
                        <p className="text-xs text-gray-400">Studies</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-white">{stats.totalImages}</p>
                        <p className="text-xs text-gray-400">Images</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-white">{formatBytes(stats.totalSize)}</p>
                        <p className="text-xs text-gray-400">Library Size</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Studies by Size */}
              {studies.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-3">
                    Studies by Size
                  </h3>
                  <div className="space-y-2">
                    {studies
                      .sort((a, b) => b.totalSize - a.totalSize)
                      .slice(0, 5)
                      .map((study) => (
                        <div
                          key={study.id}
                          className="flex items-center justify-between bg-dicom-darker rounded-lg p-3"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm text-white truncate">
                              {study.studyDescription || 'Unknown Study'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {study.imageCount} images • {formatBytes(study.totalSize)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteStudy(study.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete study"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Actions */}
              <section>
                <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-3">
                  Clear Data
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleClearThumbnails}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Clear Thumbnail Cache
                  </button>
                  <button
                    onClick={handleClearRecent}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Clear Recent Files
                  </button>
                  <button
                    onClick={handleClearLibrary}
                    disabled={isClearing || studies.length === 0}
                    className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Clear Library ({studies.length} studies)
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Clear All Local Data
                  </button>
                </div>
              </section>

              {/* Privacy Note */}
              <div className="mt-6 p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
                <p className="text-xs text-green-400">
                  All data is stored locally on your device. Nothing is uploaded to any server.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
