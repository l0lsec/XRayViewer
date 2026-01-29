import { useStore } from '../store/useStore';
import { PHI_WARNING_MESSAGE, formatPatientName } from '../utils/phi';
import { TRANSFER_SYNTAX_NAMES, MODALITY_NAMES } from '../constants/dicomTags';

interface MetadataRowProps {
  label: string;
  value: string | number | undefined;
  isPhi?: boolean;
  showPhi?: boolean;
}

function MetadataRow({ label, value, isPhi, showPhi }: MetadataRowProps) {
  if (value === undefined || value === null || value === '') return null;

  let displayValue = String(value);
  
  if (isPhi && !showPhi) {
    displayValue = '••••••••';
  }

  return (
    <div className="flex justify-between py-1.5 border-b border-gray-700/50 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-mono ${isPhi && !showPhi ? 'text-gray-600' : 'text-white'}`}>
        {displayValue}
      </span>
    </div>
  );
}

function MetadataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-dicom-accent uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="bg-dicom-darker/50 rounded-lg p-3">
        {children}
      </div>
    </div>
  );
}

export function MetadataSidebar() {
  const { currentMetadata, showPhiData, setShowPhiData } = useStore();

  const handlePhiToggle = () => {
    if (!showPhiData) {
      const confirmed = window.confirm(PHI_WARNING_MESSAGE);
      if (confirmed) {
        setShowPhiData(true);
      }
    } else {
      setShowPhiData(false);
    }
  };

  if (!currentMetadata) {
    return (
      <aside className="w-72 bg-dicom-dark border-l border-gray-700 p-4">
        <p className="text-gray-400 text-sm">No image loaded</p>
      </aside>
    );
  }

  const {
    patientName,
    patientId,
    patientBirthDate,
    patientSex,
    studyDate,
    studyDescription,
    seriesDescription,
    modality,
    rows,
    columns,
    bitsStored,
    bitsAllocated,
    pixelSpacing,
    photometricInterpretation,
    windowCenter,
    windowWidth,
    rescaleSlope,
    rescaleIntercept,
    transferSyntaxUid,
  } = currentMetadata;

  // Format modality
  const modalityDisplay = modality 
    ? `${modality}${MODALITY_NAMES[modality] ? ` (${MODALITY_NAMES[modality]})` : ''}`
    : undefined;

  // Format pixel spacing
  const pixelSpacingDisplay = pixelSpacing 
    ? `${pixelSpacing[0].toFixed(3)} × ${pixelSpacing[1].toFixed(3)} mm`
    : undefined;

  // Format window values
  const wcDisplay = Array.isArray(windowCenter) ? windowCenter[0] : windowCenter;
  const wwDisplay = Array.isArray(windowWidth) ? windowWidth[0] : windowWidth;

  // Format transfer syntax
  const transferSyntaxDisplay = transferSyntaxUid
    ? TRANSFER_SYNTAX_NAMES[transferSyntaxUid] || transferSyntaxUid
    : undefined;

  return (
    <aside className="w-72 bg-dicom-dark border-l border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Image Info</h2>
        </div>

        {/* PHI Section */}
        <MetadataSection title="Patient Information">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">Protected Health Info</span>
            <button
              onClick={handlePhiToggle}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showPhiData 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showPhiData ? 'Hide PHI' : 'Show PHI'}
            </button>
          </div>
          <MetadataRow 
            label="Name" 
            value={patientName ? formatPatientName(patientName) : undefined} 
            isPhi 
            showPhi={showPhiData} 
          />
          <MetadataRow label="ID" value={patientId} isPhi showPhi={showPhiData} />
          <MetadataRow label="DOB" value={patientBirthDate} isPhi showPhi={showPhiData} />
          <MetadataRow label="Sex" value={patientSex} isPhi showPhi={showPhiData} />
        </MetadataSection>

        {/* Study/Series Section */}
        <MetadataSection title="Study Information">
          <MetadataRow label="Date" value={studyDate} />
          <MetadataRow label="Study" value={studyDescription} />
          <MetadataRow label="Series" value={seriesDescription} />
          <MetadataRow label="Modality" value={modalityDisplay} />
        </MetadataSection>

        {/* Image Technical Section */}
        <MetadataSection title="Image Properties">
          <MetadataRow label="Dimensions" value={rows && columns ? `${columns} × ${rows}` : undefined} />
          <MetadataRow label="Bits Stored" value={bitsStored} />
          <MetadataRow label="Bits Allocated" value={bitsAllocated} />
          <MetadataRow label="Pixel Spacing" value={pixelSpacingDisplay} />
          <MetadataRow label="Photometric" value={photometricInterpretation} />
        </MetadataSection>

        {/* Display Settings Section */}
        <MetadataSection title="Display Settings">
          <MetadataRow label="Window Center" value={wcDisplay?.toFixed(1)} />
          <MetadataRow label="Window Width" value={wwDisplay?.toFixed(1)} />
          <MetadataRow label="Rescale Slope" value={rescaleSlope} />
          <MetadataRow label="Rescale Intercept" value={rescaleIntercept} />
        </MetadataSection>

        {/* Transfer Syntax */}
        <MetadataSection title="Transfer Syntax">
          <p className="text-sm text-white font-mono break-all">
            {transferSyntaxDisplay || 'Unknown'}
          </p>
        </MetadataSection>
      </div>
    </aside>
  );
}
