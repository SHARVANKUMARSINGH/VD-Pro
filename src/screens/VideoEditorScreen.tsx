import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TopAgentPanel } from '../components/editor/TopAgentPanel';
import { VideoPreviewViewport } from '../components/editor/VideoPreviewViewport';
import { MultiTrackTimeline } from '../components/editor/MultiTrackTimeline';
import { TimelineToolDock } from '../components/editor/TimelineToolDock';
import { ExportModal } from '../components/modals/ExportModal';
import { AgentConfigModal } from '../components/modals/AgentConfigModal';
import { useProjectStore } from '../store/useProjectStore';
import { useEditorStore } from '../store/useEditorStore';

interface VideoEditorScreenProps {
  onBack: () => void;
}

export const VideoEditorScreen: React.FC<VideoEditorScreenProps> = ({ onBack }) => {
  const { getActiveProject, updateProjectTimeline } = useProjectStore();
  const { timeline } = useEditorStore();
  const activeProject = getActiveProject();

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const handleBack = () => {
    if (activeProject) {
      updateProjectTimeline(activeProject.id, timeline);
    }
    onBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={handleBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            <Text style={styles.navBackText}>Home</Text>
          </TouchableOpacity>

          <View style={styles.projectTitleContainer}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {activeProject?.name || 'Untitled Edit'}
            </Text>
            <Text style={styles.projectSubtitle}>
              {timeline.tracks.length} Tracks • {activeProject?.aspectRatio || '16:9'}
            </Text>
          </View>

          <View style={styles.navRightRow}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={() => setIsConfigModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="robot" size={20} color="#00F0FF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navExportBtn}
              onPress={() => setIsExportModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.navExportText}>Render</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Top AI Agent Panel (Pinned at Top) */}
        <TopAgentPanel onOpenSettings={() => setIsConfigModalVisible(true)} />

        {/* 2. Interactive Video Preview Viewport (Center) */}
        <View style={styles.viewportArea}>
          <VideoPreviewViewport />
        </View>

        {/* 3. Multi-Track Timeline */}
        <MultiTrackTimeline />

        {/* 4. Manual Editing Tool Dock (Bottom) */}
        <TimelineToolDock onExportPress={() => setIsExportModalVisible(true)} />

        {/* Modals */}
        <ExportModal
          visible={isExportModalVisible}
          onClose={() => setIsExportModalVisible(false)}
        />
        <AgentConfigModal
          visible={isConfigModalVisible}
          onClose={() => setIsConfigModalVisible(false)}
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  navBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  projectTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  projectTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  projectSubtitle: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 1,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  navExportBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  navExportText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  viewportArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
