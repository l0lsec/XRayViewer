import { useState, useEffect } from 'react';
import { init as initCore } from '@cornerstonejs/core';
import { init as initTools, addTool, ToolGroupManager } from '@cornerstonejs/tools';
import * as cornerstoneTools from '@cornerstonejs/tools';
import * as cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { TOOL_GROUP_ID, RENDERING_ENGINE_ID, VIEWPORT_ID } from '../constants/toolIds';

// Track initialization state globally
let isGloballyInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializeCornerstoneOnce(): Promise<void> {
  if (isGloballyInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Initialize cornerstone core
      await initCore();
      
      // Initialize tools
      await initTools();

      // Initialize DICOM image loader
      await cornerstoneDICOMImageLoader.init();

      // Register tools
      addTool(cornerstoneTools.WindowLevelTool);
      addTool(cornerstoneTools.PanTool);
      addTool(cornerstoneTools.ZoomTool);
      addTool(cornerstoneTools.LengthTool);
      addTool(cornerstoneTools.StackScrollTool);

      // Create default tool group
      const toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID);
      if (toolGroup) {
        // Add tools to the group
        toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
        toolGroup.addTool(cornerstoneTools.PanTool.toolName);
        toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
        toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
        toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);

        // Set default tool as active for left mouse button
        toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
          bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
        });

        // Set scroll as active for mouse wheel
        toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName);
      }

      isGloballyInitialized = true;
      console.log('Cornerstone initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Cornerstone:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

export function useCornerstoneInit() {
  const [isInitialized, setIsInitialized] = useState(isGloballyInitialized);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    initializeCornerstoneOnce()
      .then(() => {
        if (mounted) {
          setIsInitialized(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isInitialized, error };
}

export function getToolGroup() {
  return ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
}

export function setActiveTool(toolName: string) {
  const toolGroup = getToolGroup();
  if (!toolGroup) return;

  // Deactivate all tools first
  const tools = [
    cornerstoneTools.WindowLevelTool.toolName,
    cornerstoneTools.PanTool.toolName,
    cornerstoneTools.ZoomTool.toolName,
    cornerstoneTools.LengthTool.toolName,
  ];

  tools.forEach((tool) => {
    toolGroup.setToolPassive(tool);
  });

  // Map our tool names to Cornerstone tool names
  const toolNameMap: Record<string, string> = {
    WindowLevel: cornerstoneTools.WindowLevelTool.toolName,
    Pan: cornerstoneTools.PanTool.toolName,
    Zoom: cornerstoneTools.ZoomTool.toolName,
    Length: cornerstoneTools.LengthTool.toolName,
  };

  const csToolName = toolNameMap[toolName];
  if (csToolName) {
    toolGroup.setToolActive(csToolName, {
      bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
    });
  }
}

export { cornerstoneDICOMImageLoader, RENDERING_ENGINE_ID, TOOL_GROUP_ID, VIEWPORT_ID };
