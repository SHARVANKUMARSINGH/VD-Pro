import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjectStore } from '../store/useProjectStore';
import { useAgentStore } from '../store/useAgentStore';
import { useEditorStore } from '../store/useEditorStore';
import { DockButton } from '../components/common/DockButton';
import { AgentConfigModal } from '../components/modals/AgentConfigModal';
import { VideoProject } from '../types';
import { HarnessController } from '../services/mobileHarness/HarnessController';

interface HomeScreenProps {
  onNavigateToEditor: (projectId: string) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToEditor,
  onOpenSettings,
}) => {
  const { projects, createNewProject, setActiveProject } = useProjectStore();
  const { status, config } = useAgentStore();
  const { loadProjectTimeline } = useEditorStore();
  const [isAgentConfigVisible, setIsAgentConfigVisible] = useState(false);
  const [heartbeatCount, setHeartbeatCount] = useState(0);

  // Subscribe to Mobile Harness heartbeats
  useEffect(() => {
    const harness = HarnessController.getInstance();
    const unsub = harness.onHeartbeat(() => {
      setHeartbeatCount((c) => c + 1);
    });
    return () => unsub();
  }, []);

  const handleCreateNew = () => {
    const newProj = createNewProject(`Project ${projects.length + 1}`, '16:9');
    loadProjectTimeline(newProj.timeline, newProj.aspectRatio);
    onNavigateToEditor(newProj.id);
  };

  const handleOpenProject = (project: VideoProject) => {
    setActiveProject(project.id);
    loadProjectTimeline(project.timeline, project.aspectRatio);
    onNavigateToEditor(project.id);
  };

  const isAgentActive =
    status.state === 'thinking' ||
    status.state === 'running_tool' ||
    status.state === 'rendering_background';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.canvas}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoPill}>
              <MaterialCommunityIcons name="video-vintage" size={20} color="#000000" />
            </View>
            <View>
              <Text style={styles.appTitle}>VDPRO</Text>
              <Text style={styles.appSubtitle}>Autonomous Studio</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setIsAgentConfigVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="tune-variant" size={22} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Central Viewport Area */}
        <ScrollView
          style={styles.centralViewport}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Background Agent Status Widget */}
          <View style={styles.agentStatusWidget}>
            <View style={styles.widgetHeader}>
              <View style={styles.agentLiveBadge}>
                <View
                  style={[
                    styles.pulsingDot,
                    { backgroundColor: isAgentActive ? '#00F0FF' : '#00E676' },
                  ]}
                />
                <Text style={styles.agentLiveText}>
                  {isAgentActive ? 'AI AGENT ACTIVE' : 'DAEMON STANDBY'}
                </Text>
              </View>

              <View style={styles.modelTag}>
                <Text style={styles.modelTagText}>{config.model}</Text>
              </View>
            </View>

            <View style={styles.widgetBody}>
              <Text style={styles.widgetStateTitle}>
                {status.state === 'running_tool'
                  ? `Executing ${status.activeToolName}`
                  : status.state === 'rendering_background'
                  ? 'Rendering Video in Background'
                  : status.state === 'thinking'
                  ? 'Analyzing & Planning Timeline'
                  : 'Ready for Autonomous Directing'}
              </Text>
              <Text style={styles.widgetStateDesc} numberOfLines={2}>
                {status.activeToolDetail || status.message || 'Submit a prompt in the editor to initiate autonomous editing.'}
              </Text>

              {status.progressPercent !== undefined && status.progressPercent > 0 ? (
                <View style={styles.widgetProgressBar}>
                  <View
                    style={[
                      styles.widgetProgressFill,
                      { width: `${status.progressPercent}%` },
                    ]}
                  />
                </View>
              ) : null}

              <View style={styles.widgetFooter}>
                <View style={styles.daemonStat}>
                  <MaterialCommunityIcons
                    name={status.isBackgroundActive ? 'shield-check' : 'shield-outline'}
                    size={14}
                    color={status.isBackgroundActive ? '#00E676' : '#6B7280'}
                  />
                  <Text style={styles.daemonStatText}>
                    Background Service: {status.isBackgroundActive ? 'PERSISTENT' : 'PAUSED'}
                  </Text>
                </View>
                <Text style={styles.heartbeatText}>Pulse #{heartbeatCount}</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{projects.length}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#00F0FF' }]}>7</Text>
              <Text style={styles.statLabel}>Active Tools</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#00E676' }]}>ARM64</Text>
              <Text style={styles.statLabel}>CLI Engine</Text>
            </View>
          </View>

          {/* Recent Projects Workspace */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>RECENT WORKSPACES</Text>
            <TouchableOpacity onPress={handleCreateNew}>
              <Text style={styles.sectionAction}>+ New Project</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.projectsList}>
            {projects.map((proj) => {
              const durationSec = Math.round(proj.timeline.durationMs / 1000);
              const trackCount = proj.timeline.tracks.length;

              return (
                <TouchableOpacity
                  key={proj.id}
                  style={styles.projectCard}
                  onPress={() => handleOpenProject(proj)}
                  activeOpacity={0.8}
                >
                  <View style={styles.projectThumbnailWrapper}>
                    {proj.thumbnailUri ? (
                      <Image
                        source={{ uri: proj.thumbnailUri }}
                        style={styles.projectThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.emptyThumbnail}>
                        <MaterialCommunityIcons name="movie-play" size={28} color="#4B5563" />
                      </View>
                    )}
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>{durationSec}s</Text>
                    </View>
                    <View style={styles.ratioBadge}>
                      <Text style={styles.ratioBadgeText}>{proj.aspectRatio}</Text>
                    </View>
                  </View>

                  <View style={styles.projectDetails}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {proj.name}
                    </Text>
                    <Text style={styles.projectMeta}>
                      {trackCount} Tracks • Updated {new Date(proj.updatedAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.openPill}>
                      <Text style={styles.openPillText}>Open Editor</Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color="#00F0FF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Rounded Dock Container */}
        <View style={styles.bottomDockContainer}>
          <View style={styles.dockBar}>
            {/* Create Button (Create Icon) */}
            <DockButton
              label="Create"
              sublabel="New Timeline"
              iconName="plus-circle"
              onPress={handleCreateNew}
            />

            {/* Agent Button (Agent Icon) */}
            <DockButton
              label="Agent"
              sublabel="Configure AI"
              iconName="robot"
              badge="AGY"
              onPress={() => setIsAgentConfigVisible(true)}
            />
          </View>
        </View>

        {/* Agent Configuration Modal */}
        <AgentConfigModal
          visible={isAgentConfigVisible}
          onClose={() => setIsAgentConfigVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#000000', // Pure #000000 canvas
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralViewport: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110, // Space for bottom dock
  },
  agentStatusWidget: {
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  agentLiveText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modelTag: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modelTagText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },
  widgetBody: {
    marginTop: 2,
  },
  widgetStateTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  widgetStateDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  widgetProgressBar: {
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  widgetProgressFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  widgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingTop: 8,
  },
  daemonStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daemonStatText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  heartbeatText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionAction: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242424',
    flexDirection: 'row',
  },
  projectThumbnailWrapper: {
    width: 120,
    height: 90,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  projectThumbnail: {
    width: '100%',
    height: '100%',
  },
  emptyThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  ratioBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratioBadgeText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '800',
  },
  projectDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  projectName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectMeta: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 8,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  openPillText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  bottomDockContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  dockBar: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F', // Rounded grey pill/dock bar
    borderRadius: 36,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
});
