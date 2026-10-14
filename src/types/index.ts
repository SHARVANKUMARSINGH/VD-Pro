/**
 * VDPro - Core Data Models & Type Definitions
 */

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type TrackType = 'video' | 'audio' | 'text' | 'solid' | 'effect';

export type VisualEffectType =
  | 'beat_shake'
  | 'zoom_in'
  | 'zoom_out'
  | 'glitch'
  | 'blur'
  | 'color_grade'
  | 'vignette'
  | 'fade_black';

export interface TextStyle {
  fontFamily?: string;
  fontSize: number;
  textColor: string;
  backgroundColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  type: TrackType;
  startTimeMs: number;
  durationMs: number;
  sourceStartMs?: number;
  sourceUri?: string;
  color?: string; // For solid color layers
  text?: string; // For text/subtitle overlays
  textStyle?: TextStyle;
  effectType?: VisualEffectType;
  effectIntensity?: number; // 0.0 to 1.0
  volume?: number; // 0.0 to 1.0 for audio
  fadeInMs?: number;
  fadeOutMs?: number;
  position?: { x: number; y: number }; // normalized 0..1 or px
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  isMuted?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
  clips: TimelineClip[];
}

export interface ProjectTimeline {
  tracks: TimelineTrack[];
  durationMs: number;
  fps: number;
  resolution: { width: number; height: number };
}

export interface VideoProject {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  updatedAt: number;
  timeline: ProjectTimeline;
  thumbnailUri?: string;
  lastRenderedUri?: string;
}

export type AutonomyLevel = 'full_autonomous' | 'supervised' | 'manual_only';

export interface AgentCliConfig {
  model: string;
  effort: 'low' | 'medium' | 'high';
  customEndpoint?: string;
  autonomyLevel: AutonomyLevel;
  dangerouslySkipPermissions: boolean;
  printTimeout: string;
  systemPrompt: string;
  allowedTools: {
    importMedia: boolean;
    splitAndTrim: boolean;
    solidColorLayers: boolean;
    textOverlays: boolean;
    visualEffects: boolean;
    audioSync: boolean;
    videoExport: boolean;
  };
}

export type AgentExecutionState =
  | 'idle'
  | 'starting'
  | 'thinking'
  | 'running_tool'
  | 'rendering_background'
  | 'completed'
  | 'error';

export interface AgentStatusInfo {
  state: AgentExecutionState;
  activeToolName?: string;
  activeToolDetail?: string;
  progressPercent?: number;
  currentPrompt?: string;
  message?: string;
  thoughtSnippet?: string;
  isBackgroundActive: boolean;
  lastUpdated: number;
}
