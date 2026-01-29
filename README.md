# DICOM X-Ray Viewer

A local-first, privacy-focused DICOM X-ray viewer that runs entirely in your browser. No server uploads, no cloud storage - your medical images stay on your device.

## Features

- **Privacy-First**: All processing happens locally. Files never leave your device.
- **Offline Capable**: Works without an internet connection (PWA)
- **DICOM Support**: Handles standard DICOM files including medical CDs
- **Viewing Tools**:
  - Window/Level adjustment (brightness/contrast)
  - Zoom and Pan
  - Distance measurements (in mm when pixel spacing available)
  - Image inversion
- **PHI Protection**: Patient information hidden by default
- **Export**: Save images as PNG without PHI

## Quick Start

```bash
# Install dependencies
npm install

# Build and run (recommended)
npm run build && npm run preview

# Preview production build
npm run preview
```

> **Note**: Due to Vite's handling of Cornerstone.js WASM codecs, use `npm run preview` 
> (production build) for the best experience. The app runs at http://localhost:4173/

## Usage

1. **Open the viewer** in your browser (http://localhost:5173 in development)
2. **Load images** by:
   - Dragging and dropping DICOM files/folders
   - Clicking "Open Files" or "Open Folder"
3. **Use tools** from the toolbar:
   - `W` - Window/Level (adjust brightness/contrast by dragging)
   - `P` - Pan (move the image)
   - `Z` - Zoom
   - `M` - Measure (draw distance lines)
   - `R` - Reset view
   - `I` - Invert colors
   - `F` - Fit to window
   - `?` - Help

## Opening Medical CDs

### Recommended Method
1. Insert the CD and open it in your file manager
2. Copy the contents to a folder on your computer
3. Use "Open Folder" in the viewer and select that folder

### Direct Method
1. Insert the CD
2. Use "Open Folder" and navigate to the CD
3. Select the DICOM folder (usually contains files without extensions)

## Supported Formats

- Transfer Syntaxes:
  - Implicit VR Little Endian
  - Explicit VR Little Endian
  - JPEG Baseline/Lossless
  - JPEG 2000
  - JPEG-LS
  - RLE Lossless

## Technology Stack

- React 18 + TypeScript
- Vite
- Cornerstone.js (medical imaging library)
- Tailwind CSS
- Zustand (state management)
- IndexedDB (local persistence)

## Privacy & Security

- No network requests for image data
- No telemetry or analytics
- PHI (Protected Health Information) hidden by default
- Content Security Policy enforced
- Service worker caches app only, never image data

## License

MIT
