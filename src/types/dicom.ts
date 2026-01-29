// DICOM-related type definitions

export interface DicomMetadata {
  // Patient Information (PHI)
  patientName?: string;
  patientId?: string;
  patientBirthDate?: string;
  patientSex?: string;

  // Study Information
  studyInstanceUid?: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  accessionNumber?: string;

  // Series Information
  seriesInstanceUid?: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: string;

  // Instance Information
  sopInstanceUid?: string;
  instanceNumber?: number;

  // Image Information
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  photometricInterpretation?: string;
  samplesPerPixel?: number;

  // Pixel Spacing
  pixelSpacing?: [number, number];
  imagerPixelSpacing?: [number, number];

  // Window/Level
  windowCenter?: number | number[];
  windowWidth?: number | number[];

  // Rescale
  rescaleSlope?: number;
  rescaleIntercept?: number;

  // Transfer Syntax
  transferSyntaxUid?: string;

  // Raw metadata for additional access
  raw?: Record<string, unknown>;
}

export interface DicomImage {
  imageId: string;
  file: File;
  metadata: DicomMetadata;
  loaded: boolean;
}

export interface DicomSeries {
  seriesInstanceUid: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: string;
  images: DicomImage[];
}

export interface DicomStudy {
  studyInstanceUid: string;
  studyDate?: string;
  studyDescription?: string;
  patientName?: string;
  patientId?: string;
  series: DicomSeries[];
}

export interface LoadedDicomState {
  studies: DicomStudy[];
  currentStudyIndex: number;
  currentSeriesIndex: number;
  currentImageIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface ViewportState {
  windowCenter: number;
  windowWidth: number;
  scale: number;
  translation: { x: number; y: number };
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  invert: boolean;
}

export type PhotometricInterpretation = 
  | 'MONOCHROME1'
  | 'MONOCHROME2'
  | 'RGB'
  | 'PALETTE COLOR'
  | 'YBR_FULL'
  | 'YBR_FULL_422';

export type TransferSyntax =
  | '1.2.840.10008.1.2'      // Implicit VR Little Endian
  | '1.2.840.10008.1.2.1'    // Explicit VR Little Endian
  | '1.2.840.10008.1.2.2'    // Explicit VR Big Endian
  | '1.2.840.10008.1.2.4.50' // JPEG Baseline
  | '1.2.840.10008.1.2.4.70' // JPEG Lossless
  | '1.2.840.10008.1.2.4.90' // JPEG 2000 Lossless
  | '1.2.840.10008.1.2.4.91' // JPEG 2000
  | '1.2.840.10008.1.2.5';   // RLE Lossless
