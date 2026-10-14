import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AntigravityCliManager, CliInstallProgress } from '../../services/antigravityCli/AntigravityCliManager';
import { useAgentStore } from '../../store/useAgentStore';

interface BootstrapperModalProps {
  visible: boolean;
  onAuthenticated: () => void;
}

export const BootstrapperModal: React.FC<BootstrapperModalProps> = ({
  visible,
  onAuthenticated,
}) => {
  const { setAuthToken } = useAgentStore();
  const [stage, setStage] = useState<'checking' | 'installing' | 'login' | 'authenticating'>('checking');
  const [installProgress, setInstallProgress] = useState<CliInstallProgress | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const cliManager = AntigravityCliManager.getInstance();

  useEffect(() => {
    if (!visible) return;

    const checkStatus = async () => {
      // 1. Check if token already exists in SecureStore
      const existingToken = await cliManager.getStoredAuthToken();
      const isInstalled = await cliManager.isBinaryInstalled();

      if (existingToken && isInstalled) {
        setAuthToken(existingToken);
        onAuthenticated();
        return;
      }

      if (!isInstalled) {
        setStage('installing');
        await runInstaller();
      } else {
        setStage('login');
      }
    };

    checkStatus();
  }, [visible]);

  const runInstaller = async () => {
    setStage('installing');
    const success = await cliManager.installBinary((prog) => {
      setInstallProgress(prog);
    });

    if (success) {
      setTimeout(() => {
        setStage('login');
      }, 500);
    } else {
      Alert.alert('Installation Error', 'Could not install ARM64 Antigravity CLI binary.');
    }
  };

  const handleLoginSubmit = async () => {
    const token = tokenInput.trim();
    if (!token) {
      Alert.alert('Authentication Token Required', 'Please enter your Antigravity or Gemini API token to initialize the CLI environment.');
      return;
    }

    setStage('authenticating');
    try {
      await cliManager.initializeCliAuth(token);
      await cliManager.saveAuthToken(token, emailInput.trim() || undefined);
      setAuthToken(token);
      setTimeout(() => {
        onAuthenticated();
      }, 400);
    } catch (e: any) {
      Alert.alert('Auth Error', e?.message || 'Failed to authenticate Antigravity CLI.');
      setStage('login');
    }
  };

  const handleQuickDemoToken = () => {
    setTokenInput('agy_live_token_77a98b041cfd8990a');
    setEmailInput('director@pocketdev.app');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <View style={styles.brandBox}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="video-vintage" size={40} color="#000000" />
          </View>
          <Text style={styles.brandName}>VDPRO</Text>
          <Text style={styles.brandSubtitle}>AI-Autonomous Multi-Track Video Editor</Text>
        </View>

        {stage === 'checking' && (
          <View style={styles.stageBox}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={styles.stageText}>Verifying ARM64 Antigravity CLI Sandbox...</Text>
          </View>
        )}

        {stage === 'installing' && (
          <View style={styles.stageBox}>
            <View style={styles.installerCard}>
              <MaterialCommunityIcons name="chip" size={32} color="#00F0FF" />
              <Text style={styles.installerTitle}>Installing ARM64 Binary</Text>
              <Text style={styles.installerMessage}>
                {installProgress?.message || 'Setting up sandbox environment...'}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round((installProgress?.progressFraction || 0.2) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPct}>
                {Math.round((installProgress?.progressFraction || 0.2) * 100)}%
              </Text>
            </View>
          </View>
        )}

        {(stage === 'login' || stage === 'authenticating') && (
          <View style={styles.loginCard}>
            <View style={styles.badgeRow}>
              <View style={styles.arm64Badge}>
                <Text style={styles.arm64BadgeText}>ARM64 READY (chmod 755)</Text>
              </View>
            </View>

            <Text style={styles.loginTitle}>Antigravity CLI Authentication</Text>
            <Text style={styles.loginDesc}>
              Authenticate to securely link your Antigravity agent daemon and unlock automated multi-track video editing.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="creator@studio.com"
                placeholderTextColor="#6B7280"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AUTH TOKEN / API KEY</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter agy_ or AI Studio token..."
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={tokenInput}
                onChangeText={setTokenInput}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.demoLink}
              onPress={handleQuickDemoToken}
              activeOpacity={0.7}
            >
              <Text style={styles.demoLinkText}>Use Sandbox Demo Session Key</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginSubmit}
              disabled={stage === 'authenticating'}
              activeOpacity={0.8}
            >
              {stage === 'authenticating' ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.loginButtonText}>Initialize & Launch Studio</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  stageBox: {
    alignItems: 'center',
    width: '100%',
  },
  stageText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  installerCard: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  installerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  installerMessage: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#262626',
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  progressPct: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  loginCard: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  arm64Badge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  arm64BadgeText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  loginDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  demoLink: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  demoLinkText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
