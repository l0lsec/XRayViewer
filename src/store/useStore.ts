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
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Tool state
  activeTool: ToolName;
  isInverted: boolean;
  
  // UI state
  showMetadataSidebar: boolean;
  showPhiData: boolean;
  showHelp: boolean;
  
  // Actions
  setStudies: (studies: DicomStudy[]) => void;
  setCurrentImageIds: (imageIds: string[]) => void;
  setCurrentImageIndex: (index: number) => void;
  setCurrentMetadata: (metadata: DicomMetadata | null) => void;
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
  reset: () => void;
}

const initialState = {
  studies: [],
  currentImageIds: [],
  currentImageIndex: 0,
  currentMetadata: null,
  isLoading: false,
  loadingProgress: 0,
  error: null,
  activeTool: 'WindowLevel' as ToolName,
  isInverted: false,
  showMetadataSidebar: true,
  showPhiData: false,
  showHelp: false,
};

export const useStore = create<ViewerState>((set) => ({
  ...initialState,
  
  setStudies: (studies) => set({ studies }),
  
  setCurrentImageIds: (imageIds) => set({ 
    currentImageIds: imageIds,
    currentImageIndex: 0 
  }),
  
  setCurrentImageIndex: (index) => set({ currentImageIndex: index }),
  
  setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),
  
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
