import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditorStore } from '../../store/useEditorStore';
import { useAgentStore } from '../../store/useAgentStore';
import { ToolRegistry } from '../../agent/tools/ToolRegistry';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose }) => {
  const { timeline } = useEditorStore();
  const { status } = useAgentStore();
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportCompletePath, setExportCompletePath] = useState<string | null>(null);

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportCompletePath(null);

    try {
      const result = await ToolRegistry.executeTool('export_and_render_video', {
        resolution,
        fps,
        outputPath: `vdpro_export_${Date.now()}.mp4`,
      });
      setExportCompletePath(result.outputPath);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="movie-filter" size={24} color="#00E676" />
              <Text style={styles.headerTitle}>Export & Render Video</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Background Render Notice */}
            <View style={styles.bgNotice}>
              <MaterialCommunityIcons name="cloud-sync" size={20} color="#00E676" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bgNoticeTitle}>Persistent Background Rendering Active</Text>
                <Text style={styles.bgNoticeDesc}>
                  You can safely exit the app or lock your phone. The Android Foreground Service and CLI worker will finish encoding and notify you.
                </Text>
              </View>
            </View>

            {/* Resolution Selector */}
            <Text style={styles.label}>RESOLUTION</Text>
            <View style={styles.optionsRow}>
              {(['720p', '1080p', '4k'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.optionChip,
                    resolution === r && styles.optionChipActive,
                  ]}
                  onPress={() => setResolution(r)}
                  disabled={isExporting}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      resolution === r && styles.optionChipTextActive,
                    ]}
                  >
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frame Rate */}
            <Text style={styles.label}>FRAME RATE</Text>
            <View style={styles.optionsRow}>
              {[24, 30, 60].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.optionChip,
                    fps === f && styles.optionChipActive,
                  ]}
                  onPress={() => setFps(f)}
                  disabled={isExporting}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      fps === f && styles.optionChipTextActive,
                    ]}
                  >
                    {f} FPS
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Timeline Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Duration:</Text>
                <Text style={styles.summaryVal}>{(timeline.durationMs / 1000).toFixed(1)}s</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Total Tracks:</Text>
                <Text style={styles.summaryVal}>{timeline.tracks.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Audio & Subtitles:</Text>
                <Text style={styles.summaryVal}>Synced & Embedded</Text>
              </View>
            </View>

            {/* Exporting Progress */}
            {isExporting ? (
              <View style={styles.progressArea}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={styles.progressStatusText}>
                  {status.message || 'Rendering in Background...'}
                </Text>
                <Text style={styles.progressPercentText}>
                  {status.progressPercent || 0}%
                </Text>
              </View>
            ) : null}

            {/* Export Complete Notification */}
            {exportCompletePath ? (
              <View style={styles.completeCard}>
                <MaterialCommunityIcons name="check-circle" size={28} color="#00E676" />
                <Text style={styles.completeTitle}>Render Complete!</Text>
                <Text style={styles.completePath} numberOfLines={2}>
                  {exportCompletePath}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isExporting && { backgroundColor: '#374151' },
              ]}
              onPress={handleStartExport}
              disabled={isExporting}
            >
              <Text style={styles.actionBtnText}>
                {isExporting ? 'Encoding in Background...' : 'Start Background Render'}
              </Text>
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
    borderWidth: 1,
    borderColor: '#262626',
    paddingBottom: 24,
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
  content: {
    padding: 20,
  },
  bgNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    marginBottom: 16,
  },
  bgNoticeTitle: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '700',
  },
  bgNoticeDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionChip: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  optionChipActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  optionChipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#000000',
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryKey: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  progressStatusText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  progressPercentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  completeCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  completeTitle: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  completePath: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
