import { create } from 'zustand';
import {
  ProjectTimeline,
  TimelineClip,
  TimelineTrack,
  AspectRatio,
  TrackType,
  TextStyle,
  VisualEffectType,
} from '../types';

interface EditorState {
  timeline: ProjectTimeline;
  aspectRatio: AspectRatio;
  playheadMs: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  scalePixelsPerSecond: number; // For timeline zoom

  // Undo / Redo history stacks
  historyPast: ProjectTimeline[];
  historyFuture: ProjectTimeline[];

  // Actions
  loadProjectTimeline: (timeline: ProjectTimeline, aspectRatio?: AspectRatio) => void;
  setPlayheadMs: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  setSelectedClipId: (clipId: string | null) => void;
  setSelectedTrackId: (trackId: string | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setScalePixelsPerSecond: (scale: number) => void;

  // Timeline Mutations
  addClip: (trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => TimelineClip;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  removeClip: (clipId: string) => void;
  splitClipAtPlayhead: (clipId?: string) => { leftClip?: TimelineClip; rightClip?: TimelineClip };
  trimClip: (clipId: string, newStartMs: number, newDurationMs: number) => void;
  addTrack: (type: TrackType, name?: string) => TimelineTrack;
  removeTrack: (trackId: string) => void;

  // History controls
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const DEFAULT_TIMELINE: ProjectTimeline = {
  durationMs: 30000,
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  tracks: [
    {
      id: 'track-text-default',
      name: 'Subtitles & Titles',
      type: 'text',
      isVisible: true,
      clips: [],
    },
    {
      id: 'track-effect-default',
      name: 'Visual Effects',
      type: 'effect',
      isVisible: true,
      clips: [],
    },
    {
      id: 'track-video-default',
      name: 'Main Video',
      type: 'video',
      isVisible: true,
      clips: [],
    },
    {
      id: 'track-audio-default',
      name: 'Audio Track',
      type: 'audio',
      isVisible: true,
      clips: [],
    },
  ],
};

const cloneTimeline = (t: ProjectTimeline): ProjectTimeline =>
  JSON.parse(JSON.stringify(t));

export const useEditorStore = create<EditorState>((set, get) => ({
  timeline: DEFAULT_TIMELINE,
  aspectRatio: '16:9',
  playheadMs: 0,
  isPlaying: false,
  selectedClipId: null,
  selectedTrackId: null,
  scalePixelsPerSecond: 20, // 20px per second default
  historyPast: [],
  historyFuture: [],

  loadProjectTimeline: (timeline: ProjectTimeline, aspectRatio: AspectRatio = '16:9') => {
    set({
      timeline: cloneTimeline(timeline),
      aspectRatio,
      playheadMs: 0,
      isPlaying: false,
      selectedClipId: null,
      selectedTrackId: null,
      historyPast: [],
      historyFuture: [],
    });
  },

  setPlayheadMs: (ms: number) => {
    const { timeline } = get();
    const clamped = Math.max(0, Math.min(ms, timeline.durationMs));
    set({ playheadMs: clamped });
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSelectedClipId: (clipId: string | null) => set({ selectedClipId: clipId }),

  setSelectedTrackId: (trackId: string | null) => set({ selectedTrackId: trackId }),

  setAspectRatio: (ratio: AspectRatio) => {
    const resolution =
      ratio === '9:16'
        ? { width: 1080, height: 1920 }
        : ratio === '1:1'
        ? { width: 1080, height: 1080 }
        : ratio === '4:5'
        ? { width: 1080, height: 1350 }
        : { width: 1920, height: 1080 };

    set((state) => ({
      aspectRatio: ratio,
      timeline: {
        ...state.timeline,
        resolution,
      },
    }));
  },

  setScalePixelsPerSecond: (scale: number) =>
    set({ scalePixelsPerSecond: Math.max(5, Math.min(scale, 100)) }),

  addClip: (trackId: string, clipData: Omit<TimelineClip, 'id' | 'trackId'>) => {
    const { timeline, historyPast } = get();
    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    const newClipId = `clip-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newClip: TimelineClip = {
      ...clipData,
      id: newClipId,
      trackId,
    };

    const updatedTracks = timeline.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: [...track.clips, newClip].sort((a, b) => a.startTimeMs - b.startTimeMs),
      };
    });

    // Update timeline duration if clip overflows
    const clipEnd = newClip.startTimeMs + newClip.durationMs;
    const newDuration = Math.max(timeline.durationMs, clipEnd);

    set({
      timeline: {
        ...timeline,
        tracks: updatedTracks,
        durationMs: newDuration,
      },
      selectedClipId: newClipId,
      historyPast: newPast,
      historyFuture: [],
    });

    return newClip;
  },

  updateClip: (clipId: string, updates: Partial<TimelineClip>) => {
    const { timeline, historyPast } = get();
    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    let maxEndMs = timeline.durationMs;
    const updatedTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id !== clipId) return clip;
        const updated = { ...clip, ...updates };
        maxEndMs = Math.max(maxEndMs, updated.startTimeMs + updated.durationMs);
        return updated;
      }),
    }));

    set({
      timeline: {
        ...timeline,
        tracks: updatedTracks,
        durationMs: maxEndMs,
      },
      historyPast: newPast,
      historyFuture: [],
    });
  },

  removeClip: (clipId: string) => {
    const { timeline, historyPast, selectedClipId } = get();
    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    const updatedTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => clip.id !== clipId),
    }));

    set({
      timeline: {
        ...timeline,
        tracks: updatedTracks,
      },
      selectedClipId: selectedClipId === clipId ? null : selectedClipId,
      historyPast: newPast,
      historyFuture: [],
    });
  },

  splitClipAtPlayhead: (targetClipId?: string) => {
    const { timeline, playheadMs, selectedClipId, historyPast } = get();
    const clipIdToSplit = targetClipId || selectedClipId;
    if (!clipIdToSplit) return {};

    // Find track and clip
    let foundTrack: TimelineTrack | undefined;
    let foundClip: TimelineClip | undefined;

    for (const track of timeline.tracks) {
      const match = track.clips.find((c) => c.id === clipIdToSplit);
      if (match) {
        foundTrack = track;
        foundClip = match;
        break;
      }
    }

    if (!foundTrack || !foundClip) return {};

    const clipStart = foundClip.startTimeMs;
    const clipEnd = foundClip.startTimeMs + foundClip.durationMs;

    // Check if playhead is strictly inside the clip
    if (playheadMs <= clipStart + 200 || playheadMs >= clipEnd - 200) {
      return {};
    }

    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    const leftDuration = playheadMs - clipStart;
    const rightDuration = clipEnd - playheadMs;

    const leftClip: TimelineClip = {
      ...foundClip,
      durationMs: leftDuration,
    };

    const rightClipId = `clip-${Date.now().toString(36)}-split`;
    const rightClip: TimelineClip = {
      ...foundClip,
      id: rightClipId,
      startTimeMs: playheadMs,
      durationMs: rightDuration,
      sourceStartMs: (foundClip.sourceStartMs || 0) + leftDuration,
    };

    const updatedTracks = timeline.tracks.map((track) => {
      if (track.id !== foundTrack!.id) return track;
      const filtered = track.clips.filter((c) => c.id !== foundClip!.id);
      return {
        ...track,
        clips: [...filtered, leftClip, rightClip].sort((a, b) => a.startTimeMs - b.startTimeMs),
      };
    });

    set({
      timeline: {
        ...timeline,
        tracks: updatedTracks,
      },
      selectedClipId: rightClipId,
      historyPast: newPast,
      historyFuture: [],
    });

    return { leftClip, rightClip };
  },

  trimClip: (clipId: string, newStartMs: number, newDurationMs: number) => {
    get().updateClip(clipId, {
      startTimeMs: Math.max(0, newStartMs),
      durationMs: Math.max(200, newDurationMs),
    });
  },

  addTrack: (type: TrackType, name?: string) => {
    const { timeline, historyPast } = get();
    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    const trackId = `track-${type}-${Date.now().toString(36)}`;
    const newTrack: TimelineTrack = {
      id: trackId,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      type,
      isVisible: true,
      clips: [],
    };

    set({
      timeline: {
        ...timeline,
        tracks: [...timeline.tracks, newTrack],
      },
      selectedTrackId: trackId,
      historyPast: newPast,
      historyFuture: [],
    });

    return newTrack;
  },

  removeTrack: (trackId: string) => {
    const { timeline, historyPast, selectedTrackId } = get();
    const newPast = [...historyPast, cloneTimeline(timeline)].slice(-25);

    set({
      timeline: {
        ...timeline,
        tracks: timeline.tracks.filter((t) => t.id !== trackId),
      },
      selectedTrackId: selectedTrackId === trackId ? null : selectedTrackId,
      historyPast: newPast,
      historyFuture: [],
    });
  },

  undo: () => {
    const { historyPast, historyFuture, timeline } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);
    const newFuture = [cloneTimeline(timeline), ...historyFuture];

    set({
      timeline: previous,
      historyPast: newPast,
      historyFuture: newFuture,
    });
  },

  redo: () => {
    const { historyPast, historyFuture, timeline } = get();
    if (historyFuture.length === 0) return;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    const newPast = [...historyPast, cloneTimeline(timeline)];

    set({
      timeline: next,
      historyPast: newPast,
      historyFuture: newFuture,
    });
  },

  canUndo: () => get().historyPast.length > 0,
  canRedo: () => get().historyFuture.length > 0,
}));
