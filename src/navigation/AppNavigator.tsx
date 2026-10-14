import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { VideoEditorScreen } from '../screens/VideoEditorScreen';
import { BootstrapperModal } from '../components/modals/BootstrapperModal';
import { AgentConfigModal } from '../components/modals/AgentConfigModal';
import { useAgentStore } from '../store/useAgentStore';
import { HarnessController } from '../services/mobileHarness/HarnessController';
import { BackgroundAgentTask } from '../agent/BackgroundAgentTask';
import { AntigravityCliManager } from '../services/antigravityCli/AntigravityCliManager';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, setAuthToken } = useAgentStore();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'editor'>('home');
  const [isBootstrapperVisible, setIsBootstrapperVisible] = useState(false);
  const [isAgentConfigVisible, setIsAgentConfigVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const startup = async () => {
      // 1. Register background execution tasks & notifications
      await BackgroundAgentTask.registerBackgroundTask();

      // 2. Check credentials & CLI installation
      const cliManager = AntigravityCliManager.getInstance();
      const storedToken = await cliManager.getStoredAuthToken();
      const isInstalled = await cliManager.isBinaryInstalled();

      if (storedToken && isInstalled) {
        setAuthToken(storedToken);
        setIsBootstrapperVisible(false);
      } else {
        // Show bootstrapper modal for first-launch installation and login
        setIsBootstrapperVisible(true);
      }

      // 3. Initialize Mobile Harness orchestration controller
      await HarnessController.getInstance().initialize();

      setIsInitializing(false);
    };

    startup();
  }, []);

  const handleAuthenticated = () => {
    setIsBootstrapperVisible(false);
    setCurrentScreen('home');
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'home' ? (
        <HomeScreen
          onNavigateToEditor={() => setCurrentScreen('editor')}
          onOpenSettings={() => setIsAgentConfigVisible(true)}
        />
      ) : (
        <VideoEditorScreen onBack={() => setCurrentScreen('home')} />
      )}

      {/* Bootstrapper Screen / Modal */}
      <BootstrapperModal
        visible={isBootstrapperVisible}
        onAuthenticated={handleAuthenticated}
      />

      {/* Global Agent Config Modal */}
      <AgentConfigModal
        visible={isAgentConfigVisible}
        onClose={() => setIsAgentConfigVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
