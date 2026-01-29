// DICOM file grouping service - groups files by Study and Series

import { metaData } from '@cornerstonejs/core';
import type { DicomStudy, DicomImage } from '../../types/dicom';

// Group image IDs by study and series
export async function groupDicomFiles(imageIds: string[]): Promise<DicomStudy[]> {
  const studyMap = new Map<string, DicomStudy>();

  for (const imageId of imageIds) {
    try {
      // Get study info
      const generalStudyModule = metaData.get('generalStudyModule', imageId) || {};
      const generalSeriesModule = metaData.get('generalSeriesModule', imageId) || {};
      const generalImageModule = metaData.get('generalImageModule', imageId) || {};
      const patientModule = metaData.get('patientModule', imageId) || {};

      const studyInstanceUid = generalStudyModule.studyInstanceUID || 'unknown-study';
      const seriesInstanceUid = generalSeriesModule.seriesInstanceUID || 'unknown-series';

      // Get or create study
      let study = studyMap.get(studyInstanceUid);
      if (!study) {
        study = {
          studyInstanceUid,
          studyDate: generalStudyModule.studyDate,
          studyDescription: generalStudyModule.studyDescription,
          patientName: patientModule.patientName,
          patientId: patientModule.patientId,
          series: [],
        };
        studyMap.set(studyInstanceUid, study);
      }

      // Get or create series within study
      let series = study.series.find(s => s.seriesInstanceUid === seriesInstanceUid);
      if (!series) {
        series = {
          seriesInstanceUid,
          seriesNumber: generalSeriesModule.seriesNumber,
          seriesDescription: generalSeriesModule.seriesDescription,
          modality: generalSeriesModule.modality,
          images: [],
        };
        study.series.push(series);
      }

      // Add image to series
      const dicomImage: DicomImage = {
        imageId,
        file: null as unknown as File, // File reference not available from imageId
        metadata: {
          instanceNumber: generalImageModule.instanceNumber,
        },
        loaded: true,
      };
      series.images.push(dicomImage);
    } catch (error) {
      console.warn(`Failed to group image: ${imageId}`, error);
      // Add to unknown study/series
      addToUnknown(studyMap, imageId);
    }
  }

  // Convert map to array and sort
  const studies = Array.from(studyMap.values());

  // Sort series within each study by series number
  for (const study of studies) {
    study.series.sort((a, b) => {
      const aNum = a.seriesNumber ?? Infinity;
      const bNum = b.seriesNumber ?? Infinity;
      return aNum - bNum;
    });

    // Sort images within each series by instance number
    for (const series of study.series) {
      series.images.sort((a, b) => {
        const aNum = a.metadata.instanceNumber ?? Infinity;
        const bNum = b.metadata.instanceNumber ?? Infinity;
        return aNum - bNum;
      });
    }
  }

  // Sort studies by date (newest first)
  studies.sort((a, b) => {
    if (!a.studyDate && !b.studyDate) return 0;
    if (!a.studyDate) return 1;
    if (!b.studyDate) return -1;
    return b.studyDate.localeCompare(a.studyDate);
  });

  return studies;
}

// Add image to unknown study/series
function addToUnknown(studyMap: Map<string, DicomStudy>, imageId: string): void {
  const unknownStudyId = 'unknown-study';
  const unknownSeriesId = 'unknown-series';

  let study = studyMap.get(unknownStudyId);
  if (!study) {
    study = {
      studyInstanceUid: unknownStudyId,
      studyDescription: 'Unknown Study',
      series: [],
    };
    studyMap.set(unknownStudyId, study);
  }

  let series = study.series.find(s => s.seriesInstanceUid === unknownSeriesId);
  if (!series) {
    series = {
      seriesInstanceUid: unknownSeriesId,
      seriesDescription: 'Unknown Series',
      images: [],
    };
    study.series.push(series);
  }

  series.images.push({
    imageId,
    file: null as unknown as File,
    metadata: {},
    loaded: true,
  });
}

// Get total image count from studies
export function getImageCount(studies: DicomStudy[]): number {
  return studies.reduce((total, study) => {
    return total + study.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.images.length;
    }, 0);
  }, 0);
}

// Flatten studies to get all image IDs in order
export function flattenToImageIds(studies: DicomStudy[]): string[] {
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
