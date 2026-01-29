// Common DICOM Tag Definitions
// Format: (group, element) in hex

export const DICOM_TAGS = {
  // Patient Module
  PatientName: 'x00100010',
  PatientID: 'x00100020',
  PatientBirthDate: 'x00100030',
  PatientSex: 'x00100040',
  PatientAge: 'x00101010',
  PatientWeight: 'x00101030',

  // Study Module
  StudyInstanceUID: 'x0020000d',
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  StudyDescription: 'x00081030',
  AccessionNumber: 'x00080050',
  ReferringPhysicianName: 'x00080090',

  // Series Module
  SeriesInstanceUID: 'x0020000e',
  SeriesNumber: 'x00200011',
  SeriesDescription: 'x0008103e',
  Modality: 'x00080060',
  BodyPartExamined: 'x00180015',

  // Instance Module
  SOPInstanceUID: 'x00080018',
  SOPClassUID: 'x00080016',
  InstanceNumber: 'x00200013',

  // Image Pixel Module
  Rows: 'x00280010',
  Columns: 'x00280011',
  BitsAllocated: 'x00280100',
  BitsStored: 'x00280101',
  HighBit: 'x00280102',
  PixelRepresentation: 'x00280103',
  PhotometricInterpretation: 'x00280004',
  SamplesPerPixel: 'x00280002',
  PixelData: 'x7fe00010',

  // Pixel Spacing
  PixelSpacing: 'x00280030',
  ImagerPixelSpacing: 'x00181164',

  // Modality LUT Module
  RescaleIntercept: 'x00281052',
  RescaleSlope: 'x00281053',
  RescaleType: 'x00281054',

  // VOI LUT Module
  WindowCenter: 'x00281050',
  WindowWidth: 'x00281051',
  WindowCenterWidthExplanation: 'x00281055',

  // Transfer Syntax
  TransferSyntaxUID: 'x00020010',

  // Institution
  InstitutionName: 'x00080080',
  InstitutionAddress: 'x00080081',

  // Equipment
  Manufacturer: 'x00080070',
  ManufacturerModelName: 'x00081090',
  StationName: 'x00081010',
} as const;

export type DicomTagName = keyof typeof DICOM_TAGS;

// Transfer Syntax UIDs
export const TRANSFER_SYNTAX = {
  ImplicitVRLittleEndian: '1.2.840.10008.1.2',
  ExplicitVRLittleEndian: '1.2.840.10008.1.2.1',
  ExplicitVRBigEndian: '1.2.840.10008.1.2.2',
  JPEGBaseline: '1.2.840.10008.1.2.4.50',
  JPEGExtended: '1.2.840.10008.1.2.4.51',
  JPEGLossless: '1.2.840.10008.1.2.4.70',
  JPEGLSLossless: '1.2.840.10008.1.2.4.80',
  JPEGLSNearLossless: '1.2.840.10008.1.2.4.81',
  JPEG2000Lossless: '1.2.840.10008.1.2.4.90',
  JPEG2000: '1.2.840.10008.1.2.4.91',
  RLELossless: '1.2.840.10008.1.2.5',
} as const;

// Transfer syntax display names
export const TRANSFER_SYNTAX_NAMES: Record<string, string> = {
  '1.2.840.10008.1.2': 'Implicit VR Little Endian',
  '1.2.840.10008.1.2.1': 'Explicit VR Little Endian',
  '1.2.840.10008.1.2.2': 'Explicit VR Big Endian',
  '1.2.840.10008.1.2.4.50': 'JPEG Baseline',
  '1.2.840.10008.1.2.4.51': 'JPEG Extended',
  '1.2.840.10008.1.2.4.70': 'JPEG Lossless',
  '1.2.840.10008.1.2.4.80': 'JPEG-LS Lossless',
  '1.2.840.10008.1.2.4.81': 'JPEG-LS Near Lossless',
  '1.2.840.10008.1.2.4.90': 'JPEG 2000 Lossless',
  '1.2.840.10008.1.2.4.91': 'JPEG 2000',
  '1.2.840.10008.1.2.5': 'RLE Lossless',
};

// Modality display names
export const MODALITY_NAMES: Record<string, string> = {
  CR: 'Computed Radiography',
  CT: 'Computed Tomography',
  DX: 'Digital Radiography',
  MR: 'Magnetic Resonance',
  NM: 'Nuclear Medicine',
  OT: 'Other',
  PT: 'PET',
  RF: 'Radio Fluoroscopy',
  RG: 'Radiographic imaging',
  SC: 'Secondary Capture',
  US: 'Ultrasound',
  XA: 'X-Ray Angiography',
};
