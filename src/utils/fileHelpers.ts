// File and folder handling utilities

// Check if a file is likely a DICOM file
export function isDicomFile(file: File): boolean {
  // DICOM files can have .dcm extension or no extension
  const name = file.name.toLowerCase();
  
  // Accept .dcm files
  if (name.endsWith('.dcm')) return true;
  
  // Accept files with no extension (common for DICOM CDs)
  if (!name.includes('.') || name.lastIndexOf('.') < name.length - 10) {
    return true;
  }
  
  // Reject known non-DICOM extensions
  const nonDicomExtensions = [
    '.exe', '.dll', '.ini', '.txt', '.pdf', '.doc', '.docx',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
    '.html', '.htm', '.xml', '.json', '.csv',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.mp3', '.mp4', '.avi', '.mov', '.wav',
    '.ppt', '.pptx', '.xls', '.xlsx'
  ];
  
  for (const ext of nonDicomExtensions) {
    if (name.endsWith(ext)) return false;
  }
  
  return true;
}

// Filter files to only include potential DICOM files
export function filterDicomFiles(files: File[]): File[] {
  return files.filter(isDicomFile);
}

// Read all files from a directory entry (recursive)
export async function readDirectoryRecursive(
  directoryEntry: FileSystemDirectoryEntry
): Promise<File[]> {
  const files: File[] = [];
  
  async function readEntries(entry: FileSystemDirectoryEntry): Promise<void> {
    const reader = entry.createReader();
    
    const readBatch = (): Promise<FileSystemEntry[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
    };
    
    let entries: FileSystemEntry[] = [];
    let batch: FileSystemEntry[];
    
    // readEntries returns results in batches, need to keep reading
    do {
      batch = await readBatch();
      entries = entries.concat(batch);
    } while (batch.length > 0);
    
    for (const entry of entries) {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        files.push(file);
      } else if (entry.isDirectory) {
        await readEntries(entry as FileSystemDirectoryEntry);
      }
    }
  }
  
  await readEntries(directoryEntry);
  return files;
}

// Get files from DataTransfer (drag & drop)
export async function getFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<File[]> {
  const files: File[] = [];
  const items = dataTransfer.items;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry?.();
      
      if (entry) {
        if (entry.isDirectory) {
          const dirFiles = await readDirectoryRecursive(
            entry as FileSystemDirectoryEntry
          );
          files.push(...dirFiles);
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      } else {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }
  
  return files;
}

// Get files from input element (file picker)
export function getFilesFromInput(input: HTMLInputElement): File[] {
  if (!input.files) return [];
  return Array.from(input.files);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Group files by directory path
export function groupFilesByDirectory(files: File[]): Map<string, File[]> {
  const groups = new Map<string, File[]>();
  
  for (const file of files) {
    // webkitRelativePath contains the folder path for folder uploads
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
    const dir = path ? path.substring(0, path.lastIndexOf('/')) : 'root';
    
    if (!groups.has(dir)) {
      groups.set(dir, []);
    }
    groups.get(dir)!.push(file);
  }
  
  return groups;
}

// Check if DICOMDIR file exists in file list
export function hasDicomDir(files: File[]): boolean {
  return files.some(f => f.name.toUpperCase() === 'DICOMDIR');
}

// Get DICOMDIR file from list
export function getDicomDir(files: File[]): File | undefined {
  return files.find(f => f.name.toUpperCase() === 'DICOMDIR');
}
