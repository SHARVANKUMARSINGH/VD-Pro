import { create } from 'zustand';
import {
  AgentCliConfig,
  AgentExecutionState,
  AgentStatusInfo,
} from '../types';

interface AgentLogEntry {
  id: string;
  timestamp: number;
  type: 'thought' | 'tool_start' | 'tool_done' | 'error' | 'system';
  message: string;
  toolName?: string;
}

interface AgentState {
  status: AgentStatusInfo;
  config: AgentCliConfig;
  logs: AgentLogEntry[];
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setStatus: (statusUpdates: Partial<AgentStatusInfo>) => void;
  setAgentState: (state: AgentExecutionState, message?: string) => void;
  setActiveTool: (toolName?: string, detail?: string) => void;
  setProgress: (percent: number) => void;
  toggleBackgroundActive: () => void;
  setBackgroundActive: (active: boolean) => void;
  updateConfig: (updates: Partial<AgentCliConfig>) => void;
  setAuthToken: (token: string | null) => void;
  addLog: (type: AgentLogEntry['type'], message: string, toolName?: string) => void;
  clearLogs: () => void;
}

const DEFAULT_CONFIG: AgentCliConfig = {
  model: 'gemini-3.8-flash',
  effort: 'high',
  autonomyLevel: 'full_autonomous',
  dangerouslySkipPermissions: true,
  printTimeout: '2m',
  systemPrompt: `You are the VDPro AI Video Director. You have access to professional multi-track timeline tools (import_media, split_and_trim_clip, add_solid_color_layer, add_text_overlay, apply_visual_effect, sync_audio_track, export_and_render_video).
Analyze the user's creative prompt, inspect the timeline assets, and execute precise tool calls to generate high-retention video compositions.`,
  allowedTools: {
    importMedia: true,
    splitAndTrim: true,
    solidColorLayers: true,
    textOverlays: true,
    visualEffects: true,
    audioSync: true,
    videoExport: true,
  },
};

const DEFAULT_STATUS: AgentStatusInfo = {
  state: 'idle',
  isBackgroundActive: true, // Default to true so user can leave app
  lastUpdated: Date.now(),
  message: 'Agent ready. Type a prompt above to direct the video.',
};

export const useAgentStore = create<AgentState>((set, get) => ({
  status: DEFAULT_STATUS,
  config: DEFAULT_CONFIG,
  logs: [
    {
      id: 'init-1',
      timestamp: Date.now(),
      type: 'system',
      message: 'Antigravity CLI Agent runtime initialized in background-ready mode.',
    },
  ],
  token: null,
  isAuthenticated: false,

  setStatus: (statusUpdates: Partial<AgentStatusInfo>) => {
    set((state) => ({
      status: {
        ...state.status,
        ...statusUpdates,
        lastUpdated: Date.now(),
      },
    }));
  },

  setAgentState: (state: AgentExecutionState, message?: string) => {
    set((s) => ({
      status: {
        ...s.status,
        state,
        message: message || s.status.message,
        lastUpdated: Date.now(),
      },
    }));
  },

  setActiveTool: (toolName?: string, detail?: string) => {
    set((s) => ({
      status: {
        ...s.status,
        state: toolName ? 'running_tool' : 'thinking',
        activeToolName: toolName,
        activeToolDetail: detail,
        lastUpdated: Date.now(),
      },
    }));
    if (toolName) {
      get().addLog('tool_start', `Running tool ${toolName}: ${detail || ''}`, toolName);
    }
  },

  setProgress: (percent: number) => {
    set((s) => ({
      status: {
        ...s.status,
        progressPercent: Math.max(0, Math.min(percent, 100)),
        lastUpdated: Date.now(),
      },
    }));
  },

  toggleBackgroundActive: () => {
    set((s) => ({
      status: {
        ...s.status,
        isBackgroundActive: !s.status.isBackgroundActive,
        lastUpdated: Date.now(),
      },
    }));
  },

  setBackgroundActive: (active: boolean) => {
    set((s) => ({
      status: {
        ...s.status,
        isBackgroundActive: active,
        lastUpdated: Date.now(),
      },
    }));
  },

  updateConfig: (updates: Partial<AgentCliConfig>) => {
    set((s) => ({
      config: {
        ...s.config,
        ...updates,
      },
    }));
  },

  setAuthToken: (token: string | null) => {
    set({
      token,
      isAuthenticated: Boolean(token && token.trim().length > 0),
    });
  },

  addLog: (type: AgentLogEntry['type'], message: string, toolName?: string) => {
    const entry: AgentLogEntry = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      message,
      toolName,
    };
    set((s) => ({
      logs: [entry, ...s.logs].slice(0, 100),
    }));
  },

  clearLogs: () => set({ logs: [] }),
}));
