import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/useAgentStore';
import { AutonomyLevel } from '../../types';
import { AntigravityCliManager } from '../../services/antigravityCli/AntigravityCliManager';

interface AgentConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

const MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: 'Fast & Creative' },
  { id: 'gemini-3.8-pro', label: 'Gemini 3.8 Pro', tag: 'Deep Reasoning' },
  { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', tag: 'High Precision' },
  { id: 'custom-endpoint', label: 'Custom Local Daemon', tag: 'Self-Hosted' },
];

const AUTONOMY_LEVELS: { id: AutonomyLevel; title: string; desc: string }[] = [
  {
    id: 'full_autonomous',
    title: 'Full Autonomous Director',
    desc: 'Agent plans, cuts, adds effects, and renders directly without pausing.',
  },
  {
    id: 'supervised',
    title: 'Supervised Assistant',
    desc: 'Agent proposes timeline changes and waits for your confirmation.',
  },
  {
    id: 'manual_only',
    title: 'Manual Only',
    desc: 'Disable AI orchestration; user manually tweaks all timeline tracks.',
  },
];

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ visible, onClose }) => {
  const { config, updateConfig, token, setAuthToken } = useAgentStore();
  const [tokenInput, setTokenInput] = useState(token || '');
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Empty Token', 'Please enter a valid Antigravity API or OAuth token.');
      return;
    }
    const cliManager = AntigravityCliManager.getInstance();
    await cliManager.initializeCliAuth(tokenInput);
    setAuthToken(tokenInput);
    Alert.alert('Authenticated', 'Antigravity CLI token securely persisted and injected.');
  };

  const handleSaveConfig = () => {
    updateConfig({
      systemPrompt,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="robot" size={24} color="#00F0FF" />
              <Text style={styles.headerTitle}>Antigravity Agent Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Section 1: Authentication & Token Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AUTH & TOKEN INJECTION</Text>
              <Text style={styles.sectionSubtitle}>
                Session credentials injected into CLI daemon environment
              </Text>
              <View style={styles.tokenRow}>
                <TextInput
                  style={styles.tokenInput}
                  placeholder="Enter Antigravity / Gemini API Token..."
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                  value={tokenInput}
                  onChangeText={setTokenInput}
                />
                <TouchableOpacity style={styles.tokenSaveBtn} onPress={handleSaveToken}>
                  <Text style={styles.tokenSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Model Endpoint */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MODEL ENDPOINT</Text>
              {MODELS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.modelOption,
                    config.model === m.id && styles.modelOptionSelected,
                  ]}
                  onPress={() => updateConfig({ model: m.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelLabel}>{m.label}</Text>
                    <Text style={styles.modelTag}>{m.tag}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      config.model === m.id && styles.radioCircleSelected,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Section 3: Autonomy Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AUTONOMY LEVEL</Text>
              {AUTONOMY_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.autonomyOption,
                    config.autonomyLevel === lvl.id && styles.autonomyOptionSelected,
                  ]}
                  onPress={() => updateConfig({ autonomyLevel: lvl.id })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.autonomyTitle}>{lvl.title}</Text>
                  <Text style={styles.autonomyDesc}>{lvl.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section 4: Active Tool Permissions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACTIVE TOOL PERMISSIONS</Text>
              <Text style={styles.sectionSubtitle}>
                Control which timeline tools the Antigravity Agent can invoke
              </Text>

              {[
                { key: 'importMedia', label: 'import_media (Clips & Footage)' },
                { key: 'splitAndTrim', label: 'split_and_trim_clip (Rhythm Cuts)' },
                { key: 'solidColorLayers', label: 'add_solid_color_layer (Backdrops)' },
                { key: 'textOverlays', label: 'add_text_overlay (Subtitles & Titles)' },
                { key: 'visualEffects', label: 'apply_visual_effect (Beat-Shake/FX)' },
                { key: 'audioSync', label: 'sync_audio_track (BGM & SFX)' },
                { key: 'videoExport', label: 'export_and_render_video (Background FFmpeg)' },
              ].map((tool) => (
                <View key={tool.key} style={styles.toolPermRow}>
                  <Text style={styles.toolPermLabel}>{tool.label}</Text>
                  <Switch
                    value={(config.allowedTools as any)[tool.key]}
                    onValueChange={(val) =>
                      updateConfig({
                        allowedTools: {
                          ...config.allowedTools,
                          [tool.key]: val,
                        },
                      })
                    }
                    trackColor={{ false: '#374151', true: '#00F0FF' }}
                    thumbColor="#FFFFFF"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              ))}
            </View>

            {/* Section 5: CLI Flags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CLI FLAGS</Text>
              <View style={styles.flagRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flagTitle}>--dangerously-skip-permissions</Text>
                  <Text style={styles.flagDesc}>Allow non-interactive tool execution</Text>
                </View>
                <Switch
                  value={config.dangerouslySkipPermissions}
                  onValueChange={(val) => updateConfig({ dangerouslySkipPermissions: val })}
                  trackColor={{ false: '#374151', true: '#00F0FF' }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            </View>

            {/* Section 6: System Prompt */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SYSTEM PROMPT</Text>
              <TextInput
                style={styles.systemPromptInput}
                multiline
                numberOfLines={4}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Agent instructions..."
                placeholderTextColor="#6B7280"
              />
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig}>
              <Text style={styles.saveBtnText}>Apply Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#262626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 10,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tokenSaveBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tokenSaveText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  modelOptionSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  modelInfo: {
    flex: 1,
  },
  modelLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modelTag: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  radioCircleSelected: {
    borderColor: '#00F0FF',
    backgroundColor: '#00F0FF',
  },
  autonomyOption: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  autonomyOptionSelected: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
  },
  autonomyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  autonomyDesc: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  toolPermRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toolPermLabel: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flagTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  flagDesc: {
    color: '#6B7280',
    fontSize: 11,
  },
  systemPromptInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
