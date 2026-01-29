interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dicom-dark rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Help & Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Keyboard Shortcuts */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-5">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <ShortcutItem shortcut="W" description="Window/Level tool" />
              <ShortcutItem shortcut="P" description="Pan tool" />
              <ShortcutItem shortcut="Z" description="Zoom tool" />
              <ShortcutItem shortcut="M" description="Measure tool" />
              <ShortcutItem shortcut="R" description="Reset view" />
              <ShortcutItem shortcut="F" description="Fit to window" />
              <ShortcutItem shortcut="I" description="Invert colors" />
              <ShortcutItem shortcut="S" description="Save to library" />
              <ShortcutItem shortcut="L" description="Toggle library" />
              <ShortcutItem shortcut="T" description="Toggle thumbnails" />
              <ShortcutItem shortcut="?" description="Show help" />
              <ShortcutItem shortcut="Esc" description="Close dialogs" />
              <ShortcutItem shortcut="Scroll" description="Navigate images" />
            </div>
          </section>

          {/* Mouse Controls */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-5">
              Mouse Controls
            </h3>
            <div className="space-y-4 text-gray-300">
              <p><strong className="text-white">Window/Level:</strong> Click and drag to adjust brightness and contrast</p>
              <p><strong className="text-white">Pan:</strong> Click and drag to move the image</p>
              <p><strong className="text-white">Zoom:</strong> Click and drag up/down, or use scroll wheel</p>
              <p><strong className="text-white">Measure:</strong> Click to place points, double-click to complete</p>
            </div>
          </section>

          {/* Loading Images */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-5">
              Loading Images
            </h3>
            <div className="space-y-4 text-gray-300">
              <p>You can load DICOM images in several ways:</p>
              <ul className="list-disc space-y-2 ml-6">
                <li>Drag and drop files or folders onto the viewer</li>
                <li>Click "Open Files" to select individual DICOM files</li>
                <li>Click "Open Folder" to select a folder (e.g., from a medical CD)</li>
              </ul>
            </div>
          </section>

          {/* CD Import Instructions */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-dicom-accent uppercase tracking-wider mb-5">
              Opening Medical CDs
            </h3>
            <div className="space-y-4 text-gray-300">
              <p><strong className="text-white">Recommended method:</strong></p>
              <ol className="list-decimal space-y-2 ml-6">
                <li>Insert the CD and open it in your file manager</li>
                <li>Copy the contents to a folder on your computer</li>
                <li>Use "Open Folder" and select that folder</li>
              </ol>
              <p className="mt-5"><strong className="text-white">Direct method:</strong></p>
              <ol className="list-decimal space-y-2 ml-6">
                <li>Insert the CD</li>
                <li>Use "Open Folder" and navigate to the CD</li>
                <li>Select the DICOM folder (usually contains files without extensions)</li>
              </ol>
            </div>
          </section>

          {/* Privacy Notice */}
          <section className="bg-green-900/20 border border-green-800/30 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
              Privacy & Security
            </h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <p>This viewer is designed with privacy in mind:</p>
              <ul className="list-disc space-y-2 ml-6">
                <li>All processing happens locally on your device</li>
                <li>No data is sent to any server</li>
                <li>Patient information (PHI) is hidden by default</li>
                <li>Works completely offline</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center gap-4">
      <kbd className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm font-mono min-w-[3.5rem] text-center border border-gray-700">
        {shortcut}
      </kbd>
      <span className="text-gray-300">{description}</span>
    </div>
  );
}
