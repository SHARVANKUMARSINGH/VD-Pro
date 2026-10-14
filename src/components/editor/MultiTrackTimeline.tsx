import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditorStore } from '../../store/useEditorStore';
import { TimelineClip, TimelineTrack, TrackType } from '../../types';

export const MultiTrackTimeline: React.FC = () => {
  const {
    timeline,
    playheadMs,
    selectedClipId,
    selectedTrackId,
    scalePixelsPerSecond,
    setPlayheadMs,
    setSelectedClipId,
    setSelectedTrackId,
  } = useEditorStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const totalWidth = Math.max(
    Dimensions.get('window').width,
    (timeline.durationMs / 1000) * scalePixelsPerSecond + 100
  );

  const playheadX = (playheadMs / 1000) * scalePixelsPerSecond;

  const handleTimelinePress = (event: any) => {
    const x = event.nativeEvent.locationX;
    const clickedMs = (x / scalePixelsPerSecond) * 1000;
    setPlayheadMs(clickedMs);
  };

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'video':
        return 'filmstrip';
      case 'audio':
        return 'music';
      case 'text':
        return 'format-title';
      case 'effect':
        return 'auto-fix';
      case 'solid':
        return 'palette';
      default:
        return 'layers-outline';
    }
  };

  const getClipBackgroundColor = (clip: TimelineClip) => {
    if (clip.type === 'text') return '#EAB308'; // Bold Yellow text
    if (clip.type === 'effect') return '#06B6D4'; // Cyan
    if (clip.type === 'audio') return '#10B981'; // Green
    if (clip.type === 'solid') return clip.color || '#EC4899';
    return clip.color || '#3B82F6'; // Blue default video
  };

  const renderRuler = () => {
    const totalSeconds = Math.ceil(timeline.durationMs / 1000);
    const markers = [];

    for (let s = 0; s <= totalSeconds; s += 2) {
      const left = s * scalePixelsPerSecond;
      const min = Math.floor(s / 60);
      const sec = s % 60;
      const label = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      markers.push(
        <View key={s} style={[styles.rulerMarker, { left }]}>
          <View style={styles.rulerTick} />
          <Text style={styles.rulerLabel}>{label}</Text>
        </View>
      );
    }

    return <View style={[styles.rulerContainer, { width: totalWidth }]}>{markers}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Tracks Area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { width: totalWidth }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTimelinePress}
          style={styles.clickableCanvas}
        >
          {/* Timeline Ruler */}
          {renderRuler()}

          {/* Red Playhead Vertical Scrubber Bar */}
          <View style={[styles.playheadLine, { left: playheadX }]}>
            <View style={styles.playheadCap}>
              <View style={styles.playheadInner} />
            </View>
          </View>

          {/* Render Tracks */}
          <View style={styles.tracksContainer}>
            {timeline.tracks.map((track) => (
              <View
                key={track.id}
                style={[
                  styles.trackRow,
                  selectedTrackId === track.id && styles.trackRowSelected,
                ]}
              >
                {/* Track Label Badge */}
                <TouchableOpacity
                  style={styles.trackHeader}
                  onPress={() => setSelectedTrackId(track.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={getTrackIcon(track.type) as any}
                    size={14}
                    color="#9CA3AF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.trackHeaderText} numberOfLines={1}>
                    {track.name}
                  </Text>
                </TouchableOpacity>

                {/* Track Clips Area */}
                <View style={styles.trackLane}>
                  {track.clips.map((clip) => {
                    const left = (clip.startTimeMs / 1000) * scalePixelsPerSecond;
                    const width = Math.max(
                      30,
                      (clip.durationMs / 1000) * scalePixelsPerSecond
                    );
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <TouchableOpacity
                        key={clip.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedClipId(clip.id);
                          setSelectedTrackId(track.id);
                        }}
                        style={[
                          styles.clipBlock,
                          {
                            left,
                            width,
                            backgroundColor: getClipBackgroundColor(clip),
                          },
                          isSelected && styles.clipBlockSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.clipTitle,
                            clip.type === 'text' && { color: '#000000', fontWeight: '900' },
                          ]}
                          numberOfLines={1}
                        >
                          {clip.type === 'text'
                            ? `"${clip.text || 'Text'}"`
                            : clip.title}
                        </Text>
                        <Text
                          style={[
                            styles.clipDuration,
                            clip.type === 'text' && { color: '#1F2937' },
                          ]}
                        >
                          {(clip.durationMs / 1000).toFixed(1)}s
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  scrollContent: {
    height: '100%',
  },
  clickableCanvas: {
    flex: 1,
    position: 'relative',
  },
  rulerContainer: {
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    position: 'relative',
    backgroundColor: '#111111',
  },
  rulerMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'flex-start',
  },
  rulerTick: {
    width: 1,
    height: 6,
    backgroundColor: '#4B5563',
  },
  rulerLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontFamily: 'monospace',
    marginLeft: 2,
  },
  playheadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FF3B30',
    zIndex: 99,
  },
  playheadCap: {
    position: 'absolute',
    top: 0,
    left: -6,
    width: 14,
    height: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playheadInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  tracksContainer: {
    flex: 1,
    paddingTop: 6,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    marginBottom: 4,
  },
  trackRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  trackHeader: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    paddingHorizontal: 6,
    height: '100%',
    borderRadius: 4,
    marginRight: 6,
  },
  trackHeaderText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  trackLane: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#141414',
    borderRadius: 4,
  },
  clipBlock: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  clipBlockSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clipTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  clipDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '600',
  },
});
