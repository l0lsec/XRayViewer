import { useState, useCallback, useRef } from 'react';
import { getFilesFromDataTransfer, filterDicomFiles } from '../utils/fileHelpers';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileDropZone({ onFilesSelected }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = await getFilesFromDataTransfer(e.dataTransfer);
    const dicomFiles = filterDicomFiles(files);
    
    if (dicomFiles.length > 0) {
      onFilesSelected(dicomFiles);
    }
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const dicomFiles = filterDicomFiles(files);
    
    if (dicomFiles.length > 0) {
      onFilesSelected(dicomFiles);
    }
    
    // Reset input so same files can be selected again
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      className={`h-full flex items-center justify-center p-8 transition-colors ${
        isDragging ? 'bg-dicom-accent/10' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`max-w-lg w-full border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          isDragging 
            ? 'border-dicom-accent bg-dicom-accent/5' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {/* Icon */}
        <div className="mb-6">
          <svg 
            className={`w-20 h-20 mx-auto transition-colors ${
              isDragging ? 'text-dicom-accent' : 'text-gray-500'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {isDragging ? 'Drop files here' : 'Open DICOM Images'}
        </h2>
        <p className="text-gray-400 mb-6">
          Drag & drop DICOM files or folders here, or click to browse
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-dicom-accent hover:bg-dicom-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            Open Files
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Open Folder
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".dcm,application/dicom,*/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error - webkitdirectory is not in the type definitions
          webkitdirectory=""
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Help text */}
        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">Supported formats:</p>
          <ul className="space-y-1">
            <li>• DICOM files (.dcm or no extension)</li>
            <li>• Medical imaging CD/DVD folders</li>
            <li>• Multiple files or entire folders</li>
          </ul>
        </div>

        {/* Privacy note */}
        <div className="mt-6 p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
          <p className="text-xs text-green-400">
            🔒 Your files stay on your device. Nothing is uploaded to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
