// Cornerstone Tool Identifiers

export const TOOL_IDS = {
  WindowLevel: 'WindowLevel',
  Pan: 'Pan',
  Zoom: 'Zoom',
  Length: 'Length',
  StackScroll: 'StackScrollMouseWheel',
  StackScrollWheel: 'StackScrollMouseWheel',
} as const;

export const TOOL_GROUP_ID = 'DicomViewerToolGroup';

export const VIEWPORT_ID = 'DicomViewport';

export const RENDERING_ENGINE_ID = 'DicomRenderingEngine';

// Mouse button bindings
export const MOUSE_BINDINGS = {
  PRIMARY: 1,   // Left click
  SECONDARY: 2, // Right click
  AUXILIARY: 4, // Middle click / wheel
} as const;

// Keyboard bindings
export const KEYBOARD_SHORTCUTS: Record<string, string> = {
  w: 'WindowLevel',
  p: 'Pan',
  z: 'Zoom',
  m: 'Length',
  r: 'Reset',
  i: 'Invert',
  f: 'Fit',
  ' ': 'Pan', // Spacebar for temporary pan
};
