/**
 * HarnessController.ts
 *
 * Mobile Harness Orchestration Layer Ported to TypeScript.
 * Manages daemon lifecycle, heartbeats, and prioritize command queues
 * between React Native UI and the local Antigravity CLI daemon.
 */

import {
  HarnessCommand,
  HarnessHeartbeat,
  MobileHarnessStatus,
  CliProcessHandle,
} from '../../types/mobileHarness';
import { AntigravityCliManager } from '../antigravityCli/AntigravityCliManager';
import { useAgentStore } from '../../store/useAgentStore';

export class HarnessController {
  private static instance: HarnessController;
  private status: MobileHarnessStatus = 'uninitialized';
  private commandQueue: HarnessCommand[] = [];
  private activeCommand: HarnessCommand | null = null;
  private activeProcess: CliProcessHandle | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private startedAt: number = 0;
  private isProcessingQueue: boolean = false;
  private subscribers: ((heartbeat: HarnessHeartbeat) => void)[] = [];

  private constructor() {}

  public static getInstance(): HarnessController {
    if (!HarnessController.instance) {
      HarnessController.instance = new HarnessController();
    }
    return HarnessController.instance;
  }

  /**
   * Initializes the Harness Controller and starts heartbeat monitoring.
   */
  public async initialize(): Promise<boolean> {
    if (this.status === 'ready' || this.status === 'busy') {
      return true;
    }

    this.status = 'starting';
    this.startedAt = Date.now();

    const cliManager = AntigravityCliManager.getInstance();
    const installed = await cliManager.isBinaryInstalled();
    if (!installed) {
      await cliManager.installBinary();
    }

    this.status = 'ready';
    this.startHeartbeat();

    useAgentStore.getState().addLog('system', 'Mobile Harness Controller initialized.');
    return true;
  }

  /**
   * Current harness operational status.
   */
  public getStatus(): MobileHarnessStatus {
    return this.status;
  }

  /**
   * Starts periodic heartbeat to monitor CLI daemon and background task health.
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.emitHeartbeat();
    }, 5000);
  }

  /**
   * Emits a heartbeat telemetry packet to listeners.
   */
  private emitHeartbeat(): void {
    const isBackgroundActive = useAgentStore.getState().status.isBackgroundActive;
    const heartbeat: HarnessHeartbeat = {
      timestamp: Date.now(),
      daemonPid: this.activeProcess?.pid,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      activeSessions: this.activeCommand ? 1 : 0,
      isBackgroundServiceRunning: isBackgroundActive,
      cpuLoadEstimate: this.activeCommand ? 0.45 : 0.05,
      memoryUsageMb: 85 + (this.activeCommand ? 40 : 0),
    };

    for (const sub of this.subscribers) {
      try {
        sub(heartbeat);
      } catch (err) {
        console.warn('[HarnessController] Heartbeat subscriber error:', err);
      }
    }
  }

  /**
   * Subscribes to heartbeat telemetry.
   */
  public onHeartbeat(callback: (heartbeat: HarnessHeartbeat) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  /**
   * Enqueues a command (prompt, tool_call, render) with priority ordering.
   */
  public enqueueCommand<T = any>(
    type: HarnessCommand['type'],
    payload: T,
    priority: number = 1
  ): string {
    const id = `cmd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const cmd: HarnessCommand<T> = {
      id,
      type,
      payload,
      priority,
      createdAt: Date.now(),
      timeoutMs: 120000,
    };

    // Insert sorted by priority (higher priority first)
    const index = this.commandQueue.findIndex((c) => c.priority < priority);
    if (index === -1) {
      this.commandQueue.push(cmd);
    } else {
      this.commandQueue.splice(index, 0, cmd);
    }

    this.processQueue();
    return id;
  }

  /**
   * Processes queued commands sequentially.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.status = 'busy';

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift()!;
      this.activeCommand = command;

      try {
        await this.executeCommand(command);
      } catch (err: any) {
        console.error(`[HarnessController] Error executing command ${command.id}:`, err);
        useAgentStore.getState().addLog('error', `Command failed: ${err?.message || err}`);
      } finally {
        this.activeCommand = null;
      }
    }

    this.isProcessingQueue = false;
    this.status = 'ready';
  }

  /**
   * Dispatches the active command to the SessionBridge or Execution Handler.
   */
  private async executeCommand(command: HarnessCommand): Promise<void> {
    // Dynamic import to prevent circular dependency
    const { SessionBridge } = await import('./SessionBridge');
    const bridge = SessionBridge.getInstance();

    switch (command.type) {
      case 'prompt':
        await bridge.executePrompt(command.payload.prompt, command.payload.projectId);
        break;
      case 'tool_call':
        await bridge.dispatchToolCall(command.payload.toolName, command.payload.parameters);
        break;
      case 'render':
        await bridge.triggerBackgroundRender(command.payload);
        break;
      case 'cancel':
        await this.cancelActiveSession();
        break;
      default:
        console.log(`[HarnessController] Unhandled command type: ${command.type}`);
    }
  }

  /**
   * Cancels the currently running CLI session or background task.
   */
  public async cancelActiveSession(): Promise<boolean> {
    if (this.activeProcess) {
      await this.activeProcess.kill(15);
      this.activeProcess = null;
    }
    this.commandQueue = [];
    this.activeCommand = null;
    this.status = 'ready';
    useAgentStore.getState().setAgentState('idle', 'Task cancelled by user.');
    return true;
  }

  /**
   * Sets the active process handle.
   */
  public setActiveProcess(handle: CliProcessHandle | null): void {
    this.activeProcess = handle;
  }

  /**
   * Shuts down the Harness Controller.
   */
  public shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.cancelActiveSession();
    this.status = 'stopped';
  }
}
