/**
 * Mobile Harness TypeScript Port - Protocol & Bridge Types
 * Ported from com.jarves.mh runtime definitions
 */

export type MobileHarnessStatus =
  | 'uninitialized'
  | 'starting'
  | 'ready'
  | 'busy'
  | 'background_active'
  | 'error'
  | 'stopped';

export interface HarnessHeartbeat {
  timestamp: number;
  daemonPid?: number;
  uptimeSeconds: number;
  activeSessions: number;
  isBackgroundServiceRunning: boolean;
  cpuLoadEstimate?: number;
  memoryUsageMb?: number;
}

export interface HarnessCommand<T = any> {
  id: string;
  type: 'prompt' | 'tool_call' | 'ping' | 'cancel' | 'checkpoint' | 'render';
  payload: T;
  priority: number; // 0 = low, 1 = normal, 2 = urgent
  createdAt: number;
  timeoutMs?: number;
}

export type AntigravityCliEvent =
  | { event: 'init'; conversation_id: string }
  | {
      event: 'step_update';
      step_update: {
        step_type: string;
        text_delta?: string;
        tool_name?: string;
        state?: 'IN_PROGRESS' | 'DONE' | 'ERROR';
        tool_info?: {
          name?: string;
          parameters?: Record<string, any>;
          output?: string;
          error?: { message?: string };
        };
      };
    }
  | {
      event: 'result';
      result: {
        conversation_id?: string;
        status: 'SUCCESS' | 'ERROR';
        response?: string;
        error?: string;
      };
    };

export interface SessionExecutionOptions {
  sessionId: string;
  projectId: string;
  prompt: string;
  conversationId?: string;
  allowBackgroundExecution?: boolean;
  onAssistantText?: (delta: string) => void;
  onToolStart?: (toolName: string, detail: string) => void;
  onToolComplete?: (toolName: string, result: any) => void;
  onProgress?: (progress: number, label: string) => void;
  onError?: (err: Error) => void;
  onComplete?: (response: string) => void;
}

export interface CliProcessHandle {
  pid: number;
  kill: (signal?: number) => Promise<boolean>;
  writeStdin: (data: string) => Promise<void>;
  isAlive: () => boolean;
}
