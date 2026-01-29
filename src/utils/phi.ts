// PHI (Protected Health Information) Tag Definitions and Utilities
// These tags contain patient-identifiable information and are hidden by default

import { DICOM_TAGS } from '../constants/dicomTags';

// Tags that contain PHI - hidden by default per HIPAA
export const PHI_TAGS = [
  DICOM_TAGS.PatientName,
  DICOM_TAGS.PatientID,
  DICOM_TAGS.PatientBirthDate,
  DICOM_TAGS.PatientSex,
  DICOM_TAGS.PatientAge,
  DICOM_TAGS.PatientWeight,
  DICOM_TAGS.AccessionNumber,
  DICOM_TAGS.ReferringPhysicianName,
  DICOM_TAGS.InstitutionName,
  DICOM_TAGS.InstitutionAddress,
  DICOM_TAGS.StationName,
] as const;

// Tag names for display purposes
export const PHI_TAG_NAMES: Record<string, string> = {
  [DICOM_TAGS.PatientName]: 'Patient Name',
  [DICOM_TAGS.PatientID]: 'Patient ID',
  [DICOM_TAGS.PatientBirthDate]: 'Date of Birth',
  [DICOM_TAGS.PatientSex]: 'Sex',
  [DICOM_TAGS.PatientAge]: 'Age',
  [DICOM_TAGS.PatientWeight]: 'Weight',
  [DICOM_TAGS.AccessionNumber]: 'Accession Number',
  [DICOM_TAGS.ReferringPhysicianName]: 'Referring Physician',
  [DICOM_TAGS.InstitutionName]: 'Institution',
  [DICOM_TAGS.InstitutionAddress]: 'Institution Address',
  [DICOM_TAGS.StationName]: 'Station Name',
};

// Technical tags that are safe to display
export const SAFE_DISPLAY_TAGS = [
  DICOM_TAGS.Modality,
  DICOM_TAGS.Rows,
  DICOM_TAGS.Columns,
  DICOM_TAGS.BitsAllocated,
  DICOM_TAGS.BitsStored,
  DICOM_TAGS.PixelSpacing,
  DICOM_TAGS.PhotometricInterpretation,
  DICOM_TAGS.TransferSyntaxUID,
  DICOM_TAGS.WindowCenter,
  DICOM_TAGS.WindowWidth,
  DICOM_TAGS.RescaleSlope,
  DICOM_TAGS.RescaleIntercept,
  DICOM_TAGS.SeriesDescription,
  DICOM_TAGS.StudyDescription,
  DICOM_TAGS.BodyPartExamined,
  DICOM_TAGS.Manufacturer,
  DICOM_TAGS.ManufacturerModelName,
] as const;

// Check if a tag contains PHI
export function isPhiTag(tagId: string): boolean {
  return (PHI_TAGS as readonly string[]).includes(tagId);
}

// Redact PHI value for display
export function redactPhiValue(value: string): string {
  if (!value) return '';
  // Show length indication but not content
  return `[REDACTED - ${value.length} chars]`;
}

// Format patient name (if showing PHI)
export function formatPatientName(name: string | undefined): string {
  if (!name) return 'Unknown';
  // DICOM format: LastName^FirstName^MiddleName^Prefix^Suffix
  const parts = name.split('^');
  if (parts.length >= 2) {
    return `${parts[1]} ${parts[0]}`.trim();
  }
  return name;
}

// PHI warning message
export const PHI_WARNING_MESSAGE = `
Warning: You are about to view Protected Health Information (PHI).

This includes patient name, ID, date of birth, and other identifying information.

Please ensure:
• You have authorization to view this information
• Your screen is not visible to unauthorized individuals
• You comply with applicable privacy regulations (HIPAA, GDPR, etc.)

Do you want to proceed?
`.trim();
