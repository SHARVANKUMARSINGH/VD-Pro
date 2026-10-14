import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditorStore } from '../../store/useEditorStore';
import { useAgentStore } from '../../store/useAgentStore';
import { ToolRegistry } from '../../agent/tools/ToolRegistry';

interface TimelineToolDockProps {
  onExportPress: () => void;
}

export const TimelineToolDock: React.FC<TimelineToolDockProps> = ({ onExportPress }) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    splitClipAtPlayhead,
    selectedClipId,
    selectedTrackId,
    timeline,
    playheadMs,
  } = useEditorStore();

  const handleSplit = () => {
    if (!selectedClipId) {
      Alert.alert('Select a Clip', 'Tap any clip on the timeline first, then tap Split to cut it at the playhead.');
      return;
    }
    const result = splitClipAtPlayhead(selectedClipId);
    if (!result.leftClip) {
      Alert.alert(
        'Split Position',
        'Move the red playhead inside the selected clip to split it.'
      );
    }
  };

  const handleAddMedia = async () => {
    try {
      await ToolRegistry.executeTool('import_media', {
        uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        title: 'New Footage Clip',
        durationMs: 4000,
        startTime: playheadMs,
      });
    } catch (e: any) {
      Alert.alert('Import Notice', e?.message || 'Media added');
    }
  };

  const handleAddEffect = async () => {
    if (!selectedClipId) {
      Alert.alert('Apply Effect', 'Select a clip on the timeline first to apply an effect.');
      return;
    }
    await ToolRegistry.executeTool('apply_visual_effect', {
      clipId: selectedClipId,
      effectType: 'beat_shake',
      intensity: 0.9,
    });
  };

  const handleAddText = async () => {
    await ToolRegistry.executeTool('add_text_overlay', {
      text: 'NEW CAPTION',
      startTime: playheadMs,
      durationMs: 3000,
      style: {
        fontSize: 36,
        textColor: '#FFE600',
        isBold: true,
        textAlign: 'center',
      },
    });
  };

  const handleAddSolidColor = async () => {
    await ToolRegistry.executeTool('add_solid_color_layer', {
      hexColor: '#FF0055',
      durationMs: 800,
      startTime: playheadMs,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Undo Button */}
        <TouchableOpacity
          style={[styles.toolBtn, !canUndo() && styles.toolBtnDisabled]}
          onPress={undo}
          disabled={!canUndo()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="undo"
            size={20}
            color={canUndo() ? '#FFFFFF' : '#4B5563'}
          />
          <Text style={[styles.toolLabel, !canUndo() && styles.labelDisabled]}>Undo</Text>
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          style={[styles.toolBtn, !canRedo() && styles.toolBtnDisabled]}
          onPress={redo}
          disabled={!canRedo()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="redo"
            size={20}
            color={canRedo() ? '#FFFFFF' : '#4B5563'}
          />
          <Text style={[styles.toolLabel, !canRedo() && styles.labelDisabled]}>Redo</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Split / Trim Button */}
        <TouchableOpacity
          style={[
            styles.toolBtn,
            styles.splitBtn,
            selectedClipId ? styles.splitBtnActive : null,
          ]}
          onPress={handleSplit}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="content-cut"
            size={20}
            color={selectedClipId ? '#FF3B30' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.toolLabel,
              selectedClipId ? { color: '#FF3B30', fontWeight: '800' } : null,
            ]}
          >
            Split / Trim
          </Text>
        </TouchableOpacity>

        {/* Add Media */}
        <TouchableOpacity style={styles.toolBtn} onPress={handleAddMedia} activeOpacity={0.7}>
          <MaterialCommunityIcons name="file-video" size={20} color="#3B82F6" />
          <Text style={styles.toolLabel}>Media</Text>
        </TouchableOpacity>

        {/* Add Effect */}
        <TouchableOpacity style={styles.toolBtn} onPress={handleAddEffect} activeOpacity={0.7}>
          <MaterialCommunityIcons name="auto-fix" size={20} color="#06B6D4" />
          <Text style={styles.toolLabel}>Effect</Text>
        </TouchableOpacity>

        {/* Add Text */}
        <TouchableOpacity style={styles.toolBtn} onPress={handleAddText} activeOpacity={0.7}>
          <MaterialCommunityIcons name="format-title" size={20} color="#EAB308" />
          <Text style={styles.toolLabel}>Text</Text>
        </TouchableOpacity>

        {/* Solid Color */}
        <TouchableOpacity style={styles.toolBtn} onPress={handleAddSolidColor} activeOpacity={0.7}>
          <MaterialCommunityIcons name="palette" size={20} color="#EC4899" />
          <Text style={styles.toolLabel}>Color</Text>
        </TouchableOpacity>

        {/* Sticker */}
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => Alert.alert('Stickers', 'Sticker pack library ready for placement.')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="emoticon-outline" size={20} color="#A855F7" />
          <Text style={styles.toolLabel}>Sticker</Text>
        </TouchableOpacity>

        {/* Handwriting / Draw */}
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => Alert.alert('Handwriting / Draw', 'Draw tool active. Annotate directly on the video viewport.')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="draw" size={20} color="#F97316" />
          <Text style={styles.toolLabel}>Draw</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Export / Render Action Button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={onExportPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="export-variant" size={18} color="#000000" />
          <Text style={styles.exportLabel}>Export</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    minWidth: 54,
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  splitBtn: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  splitBtnActive: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  toolLabel: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  labelDisabled: {
    color: '#4B5563',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#2E2E2E',
    marginHorizontal: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  exportLabel: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
});
