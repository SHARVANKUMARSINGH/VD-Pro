import { create } from 'zustand';
import { VideoProject, AspectRatio, ProjectTimeline } from '../types';

interface ProjectState {
  projects: VideoProject[];
  activeProjectId: string | null;
  createNewProject: (name?: string, aspectRatio?: AspectRatio) => VideoProject;
  setActiveProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  updateProjectTimeline: (projectId: string, timeline: ProjectTimeline) => void;
  getActiveProject: () => VideoProject | undefined;
}

const DEFAULT_TIMELINE_16_9: ProjectTimeline = {
  durationMs: 30000,
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  tracks: [
    {
      id: 'track-text-1',
      name: 'Subtitles & Titles',
      type: 'text',
      isVisible: true,
      clips: [
        {
          id: 'clip-text-intro',
          trackId: 'track-text-1',
          title: 'Title Overlay',
          type: 'text',
          startTimeMs: 1000,
          durationMs: 4000,
          text: 'VDPRO AI DIRECTOR',
          textStyle: {
            fontSize: 48,
            textColor: '#FFE600',
            isBold: true,
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
          position: { x: 0.5, y: 0.2 },
        },
        {
          id: 'clip-text-beat',
          trackId: 'track-text-1',
          title: 'Beat Sync Caption',
          type: 'text',
          startTimeMs: 6500,
          durationMs: 3500,
          text: 'DYNAMIC SPEED RAMP',
          textStyle: {
            fontSize: 36,
            textColor: '#FFFFFF',
            isBold: true,
            textAlign: 'center',
          },
          position: { x: 0.5, y: 0.8 },
        },
      ],
    },
    {
      id: 'track-effect-1',
      name: 'Visual FX',
      type: 'effect',
      isVisible: true,
      clips: [
        {
          id: 'clip-fx-glitch',
          trackId: 'track-effect-1',
          title: 'Glitch Transition',
          type: 'effect',
          startTimeMs: 5000,
          durationMs: 1500,
          effectType: 'glitch',
          effectIntensity: 0.8,
        },
        {
          id: 'clip-fx-shake',
          trackId: 'track-effect-1',
          title: 'Bass Drop Shake',
          type: 'effect',
          startTimeMs: 12000,
          durationMs: 2000,
          effectType: 'beat_shake',
          effectIntensity: 0.9,
        },
      ],
    },
    {
      id: 'track-video-1',
      name: 'Main Video Track',
      type: 'video',
      isVisible: true,
      clips: [
        {
          id: 'clip-vid-1',
          trackId: 'track-video-1',
          title: 'Cyberpunk City Drone',
          type: 'video',
          startTimeMs: 0,
          durationMs: 6000,
          sourceUri: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000',
          color: '#1a1f3c',
        },
        {
          id: 'clip-vid-2',
          trackId: 'track-video-1',
          title: 'Neon Street Walk',
          type: 'video',
          startTimeMs: 6000,
          durationMs: 8000,
          sourceUri: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000',
          color: '#2d1b4e',
        },
        {
          id: 'clip-vid-3',
          trackId: 'track-video-1',
          title: 'Supercar Accelerating',
          type: 'video',
          startTimeMs: 14000,
          durationMs: 10000,
          sourceUri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000',
          color: '#3b1c28',
        },
        {
          id: 'clip-vid-4',
          trackId: 'track-video-1',
          title: 'Sunset Skyline Outro',
          type: 'video',
          startTimeMs: 24000,
          durationMs: 6000,
          sourceUri: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000',
          color: '#382218',
        },
      ],
    },
    {
      id: 'track-audio-1',
      name: 'Master Soundtrack',
      type: 'audio',
      isVisible: true,
      clips: [
        {
          id: 'clip-aud-synth',
          trackId: 'track-audio-1',
          title: 'Synthwave 128BPM Electro',
          type: 'audio',
          startTimeMs: 0,
          durationMs: 30000,
          volume: 0.95,
          fadeInMs: 500,
          fadeOutMs: 1200,
          color: '#00D26A',
        },
      ],
    },
  ],
};

const INITIAL_PROJECTS: VideoProject[] = [
  {
    id: 'proj-cyberpunk-01',
    name: 'Cyberpunk 2026 Trailer',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    timeline: DEFAULT_TIMELINE_16_9,
    thumbnailUri: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600',
  },
  {
    id: 'proj-reel-tokyo',
    name: 'Tokyo Neon Nights (Reel)',
    aspectRatio: '9:16',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 12,
    timeline: {
      ...DEFAULT_TIMELINE_16_9,
      resolution: { width: 1080, height: 1920 },
      durationMs: 15000,
    },
    thumbnailUri: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600',
  },
  {
    id: 'proj-square-promo',
    name: 'Hardware Launch Promo',
    aspectRatio: '1:1',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 20,
    timeline: {
      ...DEFAULT_TIMELINE_16_9,
      resolution: { width: 1080, height: 1080 },
      durationMs: 20000,
    },
    thumbnailUri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
  },
];

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: INITIAL_PROJECTS,
  activeProjectId: INITIAL_PROJECTS[0].id,

  createNewProject: (name = 'New Project', aspectRatio: AspectRatio = '16:9') => {
    const id = `proj-${Date.now().toString(36)}`;
    const resolution =
      aspectRatio === '9:16'
        ? { width: 1080, height: 1920 }
        : aspectRatio === '1:1'
        ? { width: 1080, height: 1080 }
        : aspectRatio === '4:5'
        ? { width: 1080, height: 1350 }
        : { width: 1920, height: 1080 };

    const newProject: VideoProject = {
      id,
      name,
      aspectRatio,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeline: {
        durationMs: 30000,
        fps: 30,
        resolution,
        tracks: [
          {
            id: `track-text-${id}`,
            name: 'Text & Titles',
            type: 'text',
            isVisible: true,
            clips: [],
          },
          {
            id: `track-effect-${id}`,
            name: 'Effects',
            type: 'effect',
            isVisible: true,
            clips: [],
          },
          {
            id: `track-video-${id}`,
            name: 'Video 1',
            type: 'video',
            isVisible: true,
            clips: [],
          },
          {
            id: `track-audio-${id}`,
            name: 'Audio 1',
            type: 'audio',
            isVisible: true,
            clips: [],
          },
        ],
      },
    };

    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProjectId: id,
    }));

    return newProject;
  },

  setActiveProject: (projectId: string) => {
    set({ activeProjectId: projectId });
  },

  deleteProject: (projectId: string) => {
    set((state) => {
      const remaining = state.projects.filter((p) => p.id !== projectId);
      const nextActive =
        state.activeProjectId === projectId
          ? remaining[0]?.id || null
          : state.activeProjectId;
      return {
        projects: remaining,
        activeProjectId: nextActive,
      };
    });
  },

  updateProjectTimeline: (projectId: string, timeline: ProjectTimeline) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, timeline, updatedAt: Date.now() }
          : p
      ),
    }));
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId);
  },
}));
