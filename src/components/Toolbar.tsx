import { useStore, useHasImages } from '../store/useStore';
import type { ToolName } from '../types/tools';

interface ToolButtonProps {
  name: ToolName;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolButton({ 
  icon, 
  label, 
  shortcut, 
  isActive, 
  onClick, 
  disabled 
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-12 h-12 flex items-center justify-center rounded-lg transition-all
        ${isActive 
          ? 'bg-dicom-accent text-white' 
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={shortcut ? `${label} (${shortcut.toUpperCase()})` : label}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="h-px w-8 bg-gray-700 mx-2" />;
}

export function Toolbar() {
  const hasImages = useHasImages();
  const { activeTool, setActiveTool, isInverted, toggleInverted } = useStore();

  const handleViewerAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('viewer-action', { detail: action }));
  };

  return (
    <aside className="w-16 bg-dicom-dark border-r border-gray-700 flex flex-col items-center py-4 gap-2">
      {/* Primary Tools */}
      <ToolButton
        name="WindowLevel"
        isActive={activeTool === 'WindowLevel'}
        onClick={() => setActiveTool('WindowLevel')}
        disabled={!hasImages}
        label="Window/Level"
        shortcut="W"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />

      <ToolButton
        name="Pan"
        isActive={activeTool === 'Pan'}
        onClick={() => setActiveTool('Pan')}
        disabled={!hasImages}
        label="Pan"
        shortcut="P"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        }
      />

      <ToolButton
        name="Zoom"
        isActive={activeTool === 'Zoom'}
        onClick={() => setActiveTool('Zoom')}
        disabled={!hasImages}
        label="Zoom"
        shortcut="Z"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        }
      />

      <ToolButton
        name="Length"
        isActive={activeTool === 'Length'}
        onClick={() => setActiveTool('Length')}
        disabled={!hasImages}
        label="Measure"
        shortcut="M"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      <Divider />

      {/* View Actions */}
      <button
        onClick={() => handleViewerAction('Fit')}
        disabled={!hasImages}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all
          text-gray-400 hover:bg-white/10 hover:text-white
          ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Fit to Window (F)"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <button
        onClick={() => handleViewerAction('Reset')}
        disabled={!hasImages}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all
          text-gray-400 hover:bg-white/10 hover:text-white
          ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Reset View (R)"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <button
        onClick={() => toggleInverted()}
        disabled={!hasImages}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all
          ${isInverted 
            ? 'bg-dicom-accent text-white' 
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }
          ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Invert (I)"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <Divider />

      {/* Export */}
      <button
        onClick={() => handleViewerAction('Export')}
        disabled={!hasImages}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all
          text-gray-400 hover:bg-white/10 hover:text-white
          ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Export PNG"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>
    </aside>
  );
}
