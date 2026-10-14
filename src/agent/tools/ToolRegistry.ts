/**
 * ToolRegistry.ts
 *
 * Exposes schemas and routes execution for all Antigravity CLI video editing tools.
 */

import { EditorTools } from './EditorTools';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class ToolRegistry {
  public static readonly TOOLS: ToolDefinition[] = [
    {
      name: 'import_media',
      description: 'Import video, image, or audio media into a timeline track at a given start time.',
      parameters: {
        type: 'object',
        properties: {
          uri: { type: 'string', description: 'Local path or URL to media file' },
          trackId: { type: 'string', description: 'Target track ID' },
          startTime: { type: 'number', description: 'Start time in milliseconds' },
          durationMs: { type: 'number', description: 'Clip duration in milliseconds' },
          title: { type: 'string', description: 'Clip title' },
        },
        required: ['uri'],
      },
    },
    {
      name: 'split_and_trim_clip',
      description: 'Split or trim a clip on the timeline between start and end millisecond boundaries.',
      parameters: {
        type: 'object',
        properties: {
          clipId: { type: 'string', description: 'Target clip ID' },
          startMs: { type: 'number', description: 'New start position in milliseconds' },
          endMs: { type: 'number', description: 'New end position in milliseconds' },
        },
        required: ['clipId', 'startMs', 'endMs'],
      },
    },
    {
      name: 'add_solid_color_layer',
      description: 'Add a solid color layer or transition backdrop (e.g. #000000, #00F0FF).',
      parameters: {
        type: 'object',
        properties: {
          hexColor: { type: 'string', description: 'Hex color code (e.g. #FF0055)' },
          durationMs: { type: 'number', description: 'Duration in milliseconds' },
          trackId: { type: 'string', description: 'Optional track ID' },
          startTime: { type: 'number', description: 'Optional start time in milliseconds' },
        },
        required: ['hexColor', 'durationMs'],
      },
    },
    {
      name: 'add_text_overlay',
      description: 'Add bold subtitles, titles, or lower thirds over the video with styling.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text content to display' },
          startTime: { type: 'number', description: 'Start time in milliseconds' },
          durationMs: { type: 'number', description: 'Duration in milliseconds' },
          style: {
            type: 'object',
            properties: {
              fontSize: { type: 'number' },
              textColor: { type: 'string' },
              backgroundColor: { type: 'string' },
              isBold: { type: 'boolean' },
            },
          },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
          },
        },
        required: ['text', 'startTime', 'durationMs'],
      },
    },
    {
      name: 'apply_visual_effect',
      description: 'Apply beat-shake, glitch, zoom, blur, or color-grade effect to a clip.',
      parameters: {
        type: 'object',
        properties: {
          clipId: { type: 'string', description: 'Target clip ID' },
          effectType: {
            type: 'string',
            enum: ['beat_shake', 'zoom_in', 'zoom_out', 'glitch', 'blur', 'color_grade', 'vignette'],
          },
          intensity: { type: 'number', description: 'Effect intensity from 0.0 to 1.0' },
        },
        required: ['clipId', 'effectType', 'intensity'],
      },
    },
    {
      name: 'sync_audio_track',
      description: 'Add or synchronize a music soundtrack or SFX layer with volume and fade.',
      parameters: {
        type: 'object',
        properties: {
          audioUri: { type: 'string', description: 'Path to audio file' },
          volume: { type: 'number', description: 'Volume multiplier 0.0 - 1.0' },
          fadeIn: { type: 'number', description: 'Fade in duration in ms' },
          fadeOut: { type: 'number', description: 'Fade out duration in ms' },
        },
        required: ['audioUri'],
      },
    },
    {
      name: 'export_and_render_video',
      description: 'Render the complete multi-track timeline into a final MP4 video file.',
      parameters: {
        type: 'object',
        properties: {
          resolution: { type: 'string', enum: ['720p', '1080p', '4k'] },
          fps: { type: 'number' },
          outputPath: { type: 'string' },
        },
      },
    },
  ];

  public static async executeTool(name: string, params: any): Promise<any> {
    switch (name) {
      case 'import_media':
        return EditorTools.import_media(params);
      case 'split_and_trim_clip':
        return EditorTools.split_and_trim_clip(params);
      case 'add_solid_color_layer':
        return EditorTools.add_solid_color_layer(params);
      case 'add_text_overlay':
        return EditorTools.add_text_overlay(params);
      case 'apply_visual_effect':
        return EditorTools.apply_visual_effect(params);
      case 'sync_audio_track':
        return EditorTools.sync_audio_track(params);
      case 'export_and_render_video':
        return EditorTools.export_and_render_video(params);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
