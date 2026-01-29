// Tool-related type definitions

export type ToolName = 
  | 'WindowLevel'
  | 'Pan'
  | 'Zoom'
  | 'Length'
  | 'StackScroll';

export interface ToolState {
  activeTool: ToolName;
  isInverted: boolean;
  showMeasurements: boolean;
}

export interface Measurement {
  id: string;
  type: 'length' | 'angle' | 'area';
  value: number;
  unit: string;
  points: Array<{ x: number; y: number }>;
  imageId: string;
}

export interface ToolConfig {
  name: ToolName;
  icon: string;
  label: string;
  shortcut?: string;
  mouseButton?: 'left' | 'middle' | 'right';
}

export const TOOL_CONFIGS: Record<ToolName, ToolConfig> = {
  WindowLevel: {
    name: 'WindowLevel',
    icon: 'brightness',
    label: 'Window/Level',
    shortcut: 'W',
    mouseButton: 'left'
  },
  Pan: {
    name: 'Pan',
    icon: 'move',
    label: 'Pan',
    shortcut: 'P',
    mouseButton: 'left'
  },
  Zoom: {
    name: 'Zoom',
    icon: 'zoom',
    label: 'Zoom',
    shortcut: 'Z',
    mouseButton: 'left'
  },
  Length: {
    name: 'Length',
    icon: 'ruler',
    label: 'Measure',
    shortcut: 'M',
    mouseButton: 'left'
  },
  StackScroll: {
    name: 'StackScroll',
    icon: 'layers',
    label: 'Scroll',
    shortcut: 'S',
    mouseButton: 'left'
  }
};
