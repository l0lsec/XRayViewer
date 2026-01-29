import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { cornerstoneDICOMImageLoader } from './useCornerstone';
import { groupDicomFiles } from '../services/dicom/grouping';
import { filterDicomFiles } from '../utils/fileHelpers';
import type { DicomStudy } from '../types/dicom';

export function useDicomLoader() {
  const {
    setStudies,
    setCurrentImageIds,
    setLoadedFiles,
    setIsInLibrary,
    setLoading,
    setLoadingProgress,
    setError,
  } = useStore();

  const loadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setError('No files selected');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setError(null);

    try {
      // Filter to only DICOM files
      const dicomFiles = filterDicomFiles(files);
      
      if (dicomFiles.length === 0) {
        throw new Error('No DICOM images found. Please select a folder containing DICOM files or .dcm files.');
      }

      // Create image IDs for each file
      const imageIds: string[] = [];
      const totalFiles = dicomFiles.length;

      for (let i = 0; i < dicomFiles.length; i++) {
        const file = dicomFiles[i];
        
        try {
          // Add file to cornerstone's file manager
          const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
          imageIds.push(imageId);
        } catch (error) {
          // Skip files that fail to load
          console.warn(`Failed to load file: ${file.name}`, error);
        }

        // Update progress
        setLoadingProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (imageIds.length === 0) {
        throw new Error('No valid DICOM images could be loaded. The files may be corrupted or in an unsupported format.');
      }

      // Group files by study/series
      const studies = await groupDicomFiles(imageIds);
      setStudies(studies);

      // Get all image IDs in order
      const orderedImageIds = flattenStudies(studies);
      setCurrentImageIds(orderedImageIds);
      
      // Store the original files for potential library saving
      setLoadedFiles(dicomFiles);
      setIsInLibrary(false);

      setLoading(false);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error loading DICOM files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load DICOM files');
      setLoading(false);
    }
  }, [setStudies, setCurrentImageIds, setLoading, setLoadingProgress, setError]);

  return { loadFiles };
}

// Flatten studies into a single array of image IDs
function flattenStudies(studies: DicomStudy[]): string[] {
  const imageIds: string[] = [];
  
  for (const study of studies) {
    for (const series of study.series) {
      for (const image of series.images) {
        imageIds.push(image.imageId);
      }
    }
  }
  
  return imageIds;
}
