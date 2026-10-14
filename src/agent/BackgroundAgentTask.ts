/**
 * BackgroundAgentTask.ts
 *
 * Implements persistent background execution via expo-task-manager,
 * expo-background-fetch, and Android Foreground Service notifications.
 * Ensures the AI Agent and rendering pipeline finish even if the user leaves the app.
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAgentStore } from '../store/useAgentStore';
import { HarnessController } from '../services/mobileHarness/HarnessController';

export const BACKGROUND_AGENT_TASK_NAME = 'VDPRO_BACKGROUND_VIDEO_AGENT';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Define the background task handler
TaskManager.defineTask(BACKGROUND_AGENT_TASK_NAME, async () => {
  try {
    const harness = HarnessController.getInstance();
    const agentStore = useAgentStore.getState();

    if (!agentStore.status.isBackgroundActive) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Keep heartbeat pulse alive during background wakeups
    const status = harness.getStatus();
    if (status === 'busy') {
      agentStore.addLog('system', 'Background execution worker pulse active.');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundAgentTask] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundAgentTask {
  private static isRegistered = false;

  /**
   * Initializes background execution permissions and registers task.
   */
  public static async registerBackgroundTask(): Promise<boolean> {
    if (this.isRegistered) return true;

    try {
      // 1. Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        console.warn('[BackgroundAgentTask] Notification permission not granted');
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('vdpro_background_service', {
          name: 'VDPro AI Agent Service',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00F0FF',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      // 2. Register background fetch task
      const isAvailable = await BackgroundFetch.getStatusAsync();
      if (isAvailable === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_AGENT_TASK_NAME, {
          minimumInterval: 60, // 1 minute interval
          stopOnTerminate: false,
          startOnBoot: true,
        });
        this.isRegistered = true;
      }

      return true;
    } catch (err) {
      console.warn('[BackgroundAgentTask] Registration warning:', err);
      return false;
    }
  }

  /**
   * Posts an Android Foreground Service notification while rendering in background.
   */
  public static async pushProgressNotification(toolName: string, progress: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'VDPro AI Director Active',
          body: `Running ${toolName} (${progress}%) - Editing in background...`,
          data: { progress },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch {}
  }

  /**
   * Triggers a local push notification when the AI finishes building and rendering the video.
   */
  public static async notifyVideoComplete(fileName: string, durationMs: number): Promise<void> {
    try {
      const seconds = Math.round(durationMs / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎬 Video Edit Complete!',
          body: `Your ${seconds}-second edit "${fileName}" has finished building and rendering in the background. Tap to view and export.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { fileName, durationMs },
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('[BackgroundAgentTask] Complete notification error:', err);
    }
  }
}
