// Global state management using Zustand

import { create } from 'zustand';
import type { DicomStudy, DicomMetadata } from '../types/dicom';
import type { ToolName } from '../types/tools';

interface ViewerState {
  // File/Image state
  studies: DicomStudy[];
  currentImageIds: string[];
  currentImageIndex: number;
  currentMetadata: DicomMetadata | null;
  currentStudyId: string | null;
  loadedFiles: File[];
  isInLibrary: boolean;
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Series navigation
  seriesRanges: Array<{ start: number; end: number; seriesId: string }>;
  currentSeriesIndex: number;
  
  // Tool state
  activeTool: ToolName;
  isInverted: boolean;
  
  // UI state
  showMetadataSidebar: boolean;
  showPhiData: boolean;
  showHelp: boolean;
  showLibraryPanel: boolean;
  showThumbnailStrip: boolean;
  showStorageSettings: boolean;
  
  // Actions
  setStudies: (studies: DicomStudy[]) => void;
  setCurrentImageIds: (imageIds: string[]) => void;
  setLoadedFiles: (files: File[]) => void;
  setIsInLibrary: (inLibrary: boolean) => void;
  setCurrentImageIndex: (index: number) => void;
  setCurrentMetadata: (metadata: DicomMetadata | null) => void;
  setCurrentStudyId: (studyId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setActiveTool: (tool: ToolName) => void;
  setInverted: (inverted: boolean) => void;
  toggleInverted: () => void;
  setShowMetadataSidebar: (show: boolean) => void;
  toggleMetadataSidebar: () => void;
  setShowPhiData: (show: boolean) => void;
  toggleShowPhiData: () => void;
  setShowHelp: (show: boolean) => void;
  toggleShowHelp: () => void;
  setShowLibraryPanel: (show: boolean) => void;
  toggleLibraryPanel: () => void;
  setShowThumbnailStrip: (show: boolean) => void;
  toggleThumbnailStrip: () => void;
  setShowStorageSettings: (show: boolean) => void;
  setSeriesRanges: (ranges: Array<{ start: number; end: number; seriesId: string }>) => void;
  setCurrentSeriesIndex: (index: number) => void;
  nextSeries: () => void;
  prevSeries: () => void;
  reset: () => void;
}

const initialState = {
  studies: [],
  currentImageIds: [],
  currentImageIndex: 0,
  currentMetadata: null,
  currentStudyId: null,
  loadedFiles: [] as File[],
  isInLibrary: false,
  isLoading: false,
  loadingProgress: 0,
  error: null,
  seriesRanges: [],
  currentSeriesIndex: 0,
  activeTool: 'WindowLevel' as ToolName,
  isInverted: false,
  showMetadataSidebar: true,
  showPhiData: false,
  showHelp: false,
  showLibraryPanel: false,
  showThumbnailStrip: true,
  showStorageSettings: false,
};

export const useStore = create<ViewerState>((set, get) => ({
  ...initialState,
  
  setStudies: (studies) => {
    // Calculate series ranges
    const ranges: Array<{ start: number; end: number; seriesId: string }> = [];
    let imageIndex = 0;
    
    for (const study of studies) {
      for (const series of study.series) {
        ranges.push({
          start: imageIndex,
          end: imageIndex + series.images.length - 1,
          seriesId: series.seriesInstanceUid,
        });
        imageIndex += series.images.length;
      }
    }
    
    set({ studies, seriesRanges: ranges });
  },
  
  setCurrentImageIds: (imageIds) => set({ 
    currentImageIds: imageIds,
    currentImageIndex: 0 
  }),
  
  setLoadedFiles: (files) => set({ loadedFiles: files }),
  
  setIsInLibrary: (inLibrary) => set({ isInLibrary: inLibrary }),
  
  setCurrentImageIndex: (index) => {
    const { seriesRanges } = get();
    
    // Find which series the new index belongs to
    let seriesIndex = 0;
    for (let i = 0; i < seriesRanges.length; i++) {
      if (index >= seriesRanges[i].start && index <= seriesRanges[i].end) {
        seriesIndex = i;
        break;
      }
    }
    
    set({ currentImageIndex: index, currentSeriesIndex: seriesIndex });
  },
  
  setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),
  
  setCurrentStudyId: (studyId) => set({ currentStudyId: studyId }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setError: (error) => set({ error }),
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  setInverted: (inverted) => set({ isInverted: inverted }),
  
  toggleInverted: () => set((state) => ({ isInverted: !state.isInverted })),
  
  setShowMetadataSidebar: (show) => set({ showMetadataSidebar: show }),
  
  toggleMetadataSidebar: () => set((state) => ({ 
    showMetadataSidebar: !state.showMetadataSidebar 
  })),
  
  setShowPhiData: (show) => set({ showPhiData: show }),
  
  toggleShowPhiData: () => set((state) => ({ showPhiData: !state.showPhiData })),
  
  setShowHelp: (show) => set({ showHelp: show }),
  
  toggleShowHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  
  setShowLibraryPanel: (show) => set({ showLibraryPanel: show }),
  
  toggleLibraryPanel: () => set((state) => ({ showLibraryPanel: !state.showLibraryPanel })),
  
  setShowThumbnailStrip: (show) => set({ showThumbnailStrip: show }),
  
  toggleThumbnailStrip: () => set((state) => ({ showThumbnailStrip: !state.showThumbnailStrip })),
  
  setShowStorageSettings: (show) => set({ showStorageSettings: show }),
  
  setSeriesRanges: (ranges) => set({ seriesRanges: ranges }),
  
  setCurrentSeriesIndex: (index) => {
    const { seriesRanges } = get();
    if (index >= 0 && index < seriesRanges.length) {
      set({ 
        currentSeriesIndex: index,
        currentImageIndex: seriesRanges[index].start
      });
    }
  },
  
  nextSeries: () => {
    const { currentSeriesIndex, seriesRanges } = get();
    if (currentSeriesIndex < seriesRanges.length - 1) {
      const nextIndex = currentSeriesIndex + 1;
      set({
        currentSeriesIndex: nextIndex,
        currentImageIndex: seriesRanges[nextIndex].start
      });
    }
  },
  
  prevSeries: () => {
    const { currentSeriesIndex, seriesRanges } = get();
    if (currentSeriesIndex > 0) {
      const prevIndex = currentSeriesIndex - 1;
      set({
        currentSeriesIndex: prevIndex,
        currentImageIndex: seriesRanges[prevIndex].start
      });
    }
  },
  
  reset: () => set(initialState),
}));

// Selector hooks for common patterns
export const useCurrentImageId = () => useStore((state) => 
  state.currentImageIds[state.currentImageIndex]
);

export const useHasImages = () => useStore((state) => 
  state.currentImageIds.length > 0
);

export const useImageCount = () => useStore((state) => 
  state.currentImageIds.length
);

export const useSeriesInfo = () => useStore((state) => ({
  currentSeries: state.currentSeriesIndex + 1,
  totalSeries: state.seriesRanges.length,
  seriesRanges: state.seriesRanges,
}));
