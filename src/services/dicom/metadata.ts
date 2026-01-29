// DICOM metadata extraction service

import { metaData } from '@cornerstonejs/core';
import type { DicomMetadata } from '../../types/dicom';

// Extract metadata from a loaded image
export async function extractMetadata(imageId: string): Promise<DicomMetadata> {
  try {
    // Get image plane module for pixel spacing
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId) || {};
    
    // Get general image module
    const generalImageModule = metaData.get('generalImageModule', imageId) || {};
    
    // Get patient module
    const patientModule = metaData.get('patientModule', imageId) || {};
    
    // Get general study module
    const generalStudyModule = metaData.get('generalStudyModule', imageId) || {};
    
    // Get general series module  
    const generalSeriesModule = metaData.get('generalSeriesModule', imageId) || {};
    
    // Get SOP common module
    const sopCommonModule = metaData.get('sopCommonModule', imageId) || {};
    
    // Get image pixel module
    const imagePixelModule = metaData.get('imagePixelModule', imageId) || {};
    
    // Get VOI LUT module
    const voiLutModule = metaData.get('voiLutModule', imageId) || {};
    
    // Get modality LUT module
    const modalityLutModule = metaData.get('modalityLutModule', imageId) || {};

    // Get transfer syntax
    const transferSyntax = metaData.get('transferSyntax', imageId);

    const metadata: DicomMetadata = {
      // Patient info
      patientName: patientModule.patientName,
      patientId: patientModule.patientId,
      patientBirthDate: patientModule.patientBirthDate,
      patientSex: patientModule.patientSex,

      // Study info
      studyInstanceUid: generalStudyModule.studyInstanceUID,
      studyDate: generalStudyModule.studyDate,
      studyTime: generalStudyModule.studyTime,
      studyDescription: generalStudyModule.studyDescription,
      accessionNumber: generalStudyModule.accessionNumber,

      // Series info
      seriesInstanceUid: generalSeriesModule.seriesInstanceUID,
      seriesNumber: generalSeriesModule.seriesNumber,
      seriesDescription: generalSeriesModule.seriesDescription,
      modality: generalSeriesModule.modality,

      // Instance info
      sopInstanceUid: sopCommonModule.sopInstanceUID,
      instanceNumber: generalImageModule.instanceNumber,

      // Image info
      rows: imagePixelModule.rows,
      columns: imagePixelModule.columns,
      bitsAllocated: imagePixelModule.bitsAllocated,
      bitsStored: imagePixelModule.bitsStored,
      highBit: imagePixelModule.highBit,
      pixelRepresentation: imagePixelModule.pixelRepresentation,
      photometricInterpretation: imagePixelModule.photometricInterpretation,
      samplesPerPixel: imagePixelModule.samplesPerPixel,

      // Pixel spacing
      pixelSpacing: imagePlaneModule.pixelSpacing || imagePlaneModule.rowPixelSpacing 
        ? [
            imagePlaneModule.rowPixelSpacing || imagePlaneModule.pixelSpacing?.[0],
            imagePlaneModule.columnPixelSpacing || imagePlaneModule.pixelSpacing?.[1]
          ]
        : undefined,

      // Window/Level
      windowCenter: voiLutModule.windowCenter,
      windowWidth: voiLutModule.windowWidth,

      // Rescale
      rescaleSlope: modalityLutModule.rescaleSlope,
      rescaleIntercept: modalityLutModule.rescaleIntercept,

      // Transfer syntax
      transferSyntaxUid: transferSyntax?.transferSyntaxUID,
    };

    return metadata;
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return {};
  }
}

// Get a specific metadata value
export function getMetadataValue(
  imageId: string,
  module: string,
  key: string
): unknown {
  try {
    const moduleData = metaData.get(module, imageId);
    return moduleData?.[key];
  } catch {
    return undefined;
  }
}

// Check if image has pixel spacing info (for measurements)
export function hasPixelSpacing(imageId: string): boolean {
  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
  return !!(
    imagePlaneModule?.pixelSpacing ||
    imagePlaneModule?.rowPixelSpacing ||
    imagePlaneModule?.columnPixelSpacing
  );
}

// Get pixel spacing values
export function getPixelSpacing(imageId: string): [number, number] | null {
  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
  
  if (imagePlaneModule?.pixelSpacing) {
    return imagePlaneModule.pixelSpacing;
  }
  
  if (imagePlaneModule?.rowPixelSpacing && imagePlaneModule?.columnPixelSpacing) {
    return [imagePlaneModule.rowPixelSpacing, imagePlaneModule.columnPixelSpacing];
  }
  
  return null;
}
