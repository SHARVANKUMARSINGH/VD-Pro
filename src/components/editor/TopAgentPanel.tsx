import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAgentStore } from '../../store/useAgentStore';
import { useProjectStore } from '../../store/useProjectStore';
import { HarnessController } from '../../services/mobileHarness/HarnessController';

const SUGGESTED_PROMPTS = [
  'Fast-paced beat edit + yellow captions',
  'Add glitch transition & color grade',
  'Speed ramp supercar clip + 128BPM sync',
  'Full autonomous 30s TikTok/Reel cut',
];

interface TopAgentPanelProps {
  onOpenSettings?: () => void;
}

export const TopAgentPanel: React.FC<TopAgentPanelProps> = ({ onOpenSettings }) => {
  const { status, toggleBackgroundActive, logs } = useAgentStore();
  const { activeProjectId } = useProjectStore();
  const [promptText, setPromptText] = useState('');
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);

  const handleSubmit = () => {
    const text = promptText.trim();
    if (!text || !activeProjectId) return;

    const harness = HarnessController.getInstance();
    harness.enqueueCommand('prompt', {
      prompt: text,
      projectId: activeProjectId,
    }, 2);

    setPromptText('');
  };

  const isBusy =
    status.state === 'thinking' ||
    status.state === 'running_tool' ||
    status.state === 'rendering_background';

  const getStatusBadgeColor = () => {
    switch (status.state) {
      case 'running_tool':
        return '#00F0FF';
      case 'thinking':
        return '#FFB800';
      case 'rendering_background':
        return '#9D00FF';
      case 'completed':
        return '#00E676';
      case 'error':
        return '#FF3B30';
      default:
        return '#4B5563';
    }
  };

  const getStatusLabel = () => {
    if (status.state === 'running_tool' && status.activeToolName) {
      return `Tool: ${status.activeToolName}`;
    }
    if (status.state === 'rendering_background') {
      return 'Rendering in Background...';
    }
    if (status.state === 'thinking') {
      return 'AI Thinking...';
    }
    if (status.state === 'completed') {
      return 'Edit Completed';
    }
    if (status.state === 'error') {
      return 'Error Encountered';
    }
    return 'Agent Ready';
  };

  return (
    <View style={styles.container}>
      {/* Top Header Row with Status Badge & Background Indicator */}
      <View style={styles.headerRow}>
        <View style={styles.agentBadgeGroup}>
          <View style={[styles.statusDot, { backgroundColor: getStatusBadgeColor() }]} />
          <Text style={styles.agentTitle}>ANTIGRAVITY AI DIRECTOR</Text>
          <View
            style={[
              styles.statusBadge,
              { borderColor: getStatusBadgeColor(), backgroundColor: `${getStatusBadgeColor()}20` },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator
                size="small"
                color={getStatusBadgeColor()}
                style={{ marginRight: 5, transform: [{ scale: 0.7 }] }}
              />
            ) : null}
            <Text style={[styles.statusBadgeText, { color: getStatusBadgeColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Background Execution Toggle & Indicator */}
        <View style={styles.backgroundActiveContainer}>
          <TouchableOpacity
            style={styles.bgInfoButton}
            onPress={toggleBackgroundActive}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.bgGlowIndicator,
                { backgroundColor: status.isBackgroundActive ? '#00E676' : '#6B7280' },
              ]}
            />
            <Text
              style={[
                styles.bgActiveText,
                { color: status.isBackgroundActive ? '#00E676' : '#9CA3AF' },
              ]}
            >
              Background {status.isBackgroundActive ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <Switch
            value={status.isBackgroundActive}
            onValueChange={toggleBackgroundActive}
            trackColor={{ false: '#374151', true: '#00E676' }}
            thumbColor={status.isBackgroundActive ? '#FFFFFF' : '#9CA3AF'}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Live Tool Detail Description or Status Message */}
      {status.activeToolDetail ? (
        <View style={styles.toolDetailBanner}>
          <MaterialCommunityIcons name="cube-send" size={14} color="#00F0FF" />
          <Text style={styles.toolDetailText} numberOfLines={1}>
            {status.activeToolDetail}
          </Text>
        </View>
      ) : null}

      {/* Main AI Prompt Bar */}
      <View style={styles.promptBarContainer}>
        <View style={styles.promptInputWrapper}>
          <MaterialCommunityIcons
            name="auto-fix"
            size={20}
            color="#9CA3AF"
            style={styles.promptIcon}
          />
          <TextInput
            style={styles.promptInput}
            placeholder="Direct the AI (e.g., 'Make a 30s fast edit with yellow subtitles')..."
            placeholderTextColor="#6B7280"
            value={promptText}
            onChangeText={setPromptText}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            editable={!isBusy}
          />
          {promptText.length > 0 ? (
            <TouchableOpacity onPress={() => setPromptText('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isBusy ? '#374151' : '#FFFFFF' },
          ]}
          onPress={handleSubmit}
          disabled={isBusy || !promptText.trim()}
          activeOpacity={0.8}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <MaterialCommunityIcons name="arrow-up" size={20} color="#000000" />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Prompt Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {SUGGESTED_PROMPTS.map((chip, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.chip}
            onPress={() => setPromptText(chip)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Collapsible Thoughts & CLI Stream Drawer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.logToggle}
          onPress={() => setIsLogsExpanded(!isLogsExpanded)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isLogsExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
          />
          <Text style={styles.logToggleText}>
            {isLogsExpanded ? 'Hide CLI Agent Log' : `Agent Logs (${logs.length})`}
          </Text>
        </TouchableOpacity>

        {status.progressPercent !== undefined && status.progressPercent > 0 ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${status.progressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{status.progressPercent}%</Text>
          </View>
        ) : null}
      </View>

      {isLogsExpanded ? (
        <View style={styles.logDrawer}>
          <ScrollView style={styles.logScrollView} nestedScrollEnabled>
            {logs.slice(0, 15).map((log) => (
              <View key={log.id} style={styles.logLine}>
                <Text style={styles.logTimestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <Text
                  style={[
                    styles.logMessage,
                    log.type === 'tool_start'
                      ? { color: '#00F0FF' }
                      : log.type === 'tool_done'
                      ? { color: '#00E676' }
                      : log.type === 'error'
                      ? { color: '#FF3B30' }
                      : { color: '#D1D5DB' },
                  ]}
                >
                  {log.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  agentTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backgroundActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bgInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  bgGlowIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  bgActiveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
  toolDetailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#00F0FF',
  },
  toolDetailText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  promptBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#333333',
  },
  promptIcon: {
    marginRight: 8,
  },
  promptInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chipsScroll: {
    paddingVertical: 2,
    gap: 6,
  },
  chip: {
    backgroundColor: '#222222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 6,
  },
  chipText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  logToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logToggleText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    width: 80,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
    marginRight: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  progressText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
  },
  logDrawer: {
    maxHeight: 120,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    marginTop: 6,
    padding: 8,
  },
  logScrollView: {
    flex: 1,
  },
  logLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logTimestamp: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
    marginRight: 6,
  },
  logMessage: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
