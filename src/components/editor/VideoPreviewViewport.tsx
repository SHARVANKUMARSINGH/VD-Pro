import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditorStore } from '../../store/useEditorStore';
import { AspectRatio } from '../../types';

export const VideoPreviewViewport: React.FC = () => {
  const {
    timeline,
    playheadMs,
    isPlaying,
    aspectRatio,
    togglePlayPause,
    setPlayheadMs,
    setAspectRatio,
  } = useEditorStore();

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Active elements at current playhead position
  const activeClips = React.useMemo(() => {
    return timeline.tracks.flatMap((track) =>
      track.clips.filter(
        (clip) =>
          playheadMs >= clip.startTimeMs &&
          playheadMs < clip.startTimeMs + clip.durationMs
      )
    );
  }, [timeline, playheadMs]);

  const activeVideoClip = activeClips.find((c) => c.type === 'video');
  const activeColorClip = activeClips.find((c) => c.type === 'solid');
  const activeTextClips = activeClips.filter((c) => c.type === 'text');
  const activeEffectClip = activeClips.find((c) => c.type === 'effect');

  // Trigger beat-shake animation if active effect is beat_shake
  useEffect(() => {
    if (activeEffectClip?.effectType === 'beat_shake' && isPlaying) {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [activeEffectClip, isPlaying, playheadMs]);

  // Playback timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadMs(playheadMs + 100);
        if (playheadMs >= timeline.durationMs) {
          useEditorStore.getState().setIsPlaying(false);
          setPlayheadMs(0);
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playheadMs, timeline.durationMs]);

  // Format timecode as 00:00.000
  const formatTimecode = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    const pad = (n: number, size = 2) => n.toString().padStart(size, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  };

  // Dimensions based on aspect ratio
  const getViewportDimensions = () => {
    const screenWidth = Dimensions.get('window').width - 24;
    switch (aspectRatio) {
      case '9:16':
        return { width: 170, height: 260 };
      case '1:1':
        return { width: 220, height: 220 };
      case '4:5':
        return { width: 190, height: 238 };
      case '16:9':
      default:
        return { width: screenWidth, height: (screenWidth * 9) / 16 };
    }
  };

  const dimensions = getViewportDimensions();

  return (
    <View style={styles.container}>
      {/* Aspect Ratio Switcher Bar */}
      <View style={styles.ratioBar}>
        <Text style={styles.ratioLabel}>CANVAS</Text>
        {(['16:9', '9:16', '1:1', '4:5'] as AspectRatio[]).map((ratio) => (
          <TouchableOpacity
            key={ratio}
            style={[
              styles.ratioButton,
              aspectRatio === ratio && styles.ratioButtonActive,
            ]}
            onPress={() => setAspectRatio(ratio)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.ratioButtonText,
                aspectRatio === ratio && styles.ratioButtonTextActive,
              ]}
            >
              {ratio}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Viewport Frame */}
      <View style={styles.viewportWrapper}>
        <Animated.View
          style={[
            styles.viewportFrame,
            {
              width: dimensions.width,
              height: dimensions.height,
              transform: [{ translateX: shakeAnimation }],
            },
          ]}
        >
          {/* Layer 1: Solid Color Backdrop if active */}
          {activeColorClip ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: activeColorClip.color || '#000000', zIndex: 1 },
              ]}
            />
          ) : null}

          {/* Layer 2: Main Video Frame Canvas */}
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.videoCanvas,
              { backgroundColor: activeVideoClip?.color || '#111827' },
            ]}
          >
            <View style={styles.mockVideoContent}>
              <MaterialCommunityIcons
                name={activeVideoClip ? 'filmstrip' : 'video-off-outline'}
                size={36}
                color="rgba(255,255,255,0.25)"
              />
              <Text style={styles.activeClipTitle}>
                {activeVideoClip ? activeVideoClip.title : 'Black Canvas (Empty)'}
              </Text>
              {activeEffectClip ? (
                <View style={styles.effectIndicatorBadge}>
                  <MaterialCommunityIcons name="flash" size={14} color="#00F0FF" />
                  <Text style={styles.effectIndicatorText}>
                    FX: {activeEffectClip.effectType?.toUpperCase()} ({Math.round((activeEffectClip.effectIntensity || 0.8) * 100)}%)
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Layer 3: Text & Subtitle Overlays (e.g. Bold Yellow Subtitles) */}
          {activeTextClips.map((tClip) => {
            const style = tClip.textStyle;
            return (
              <View
                key={tClip.id}
                style={[
                  styles.subtitleContainer,
                  {
                    top: `${(tClip.position?.y ?? 0.8) * 100}%`,
                    left: 0,
                    right: 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.subtitleBadge,
                    {
                      backgroundColor: style?.backgroundColor || 'rgba(0,0,0,0.65)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subtitleText,
                      {
                        fontSize: Math.min(style?.fontSize || 20, 22),
                        color: style?.textColor || '#FFE500',
                        fontWeight: style?.isBold ? '900' : '600',
                        textAlign: style?.textAlign || 'center',
                      },
                    ]}
                  >
                    {tClip.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Viewport Playback Control Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.timecodeDisplay}>
          <Text style={styles.timecodeText}>{formatTimecode(playheadMs)}</Text>
          <Text style={styles.durationText}> / {formatTimecode(timeline.durationMs)}</Text>
        </View>

        <View style={styles.transportButtons}>
          <TouchableOpacity
            style={styles.transportBtn}
            onPress={() => setPlayheadMs(Math.max(0, playheadMs - 5000))}
          >
            <MaterialCommunityIcons name="rewind-5" size={24} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color="#000000"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.transportBtn}
            onPress={() => setPlayheadMs(Math.min(timeline.durationMs, playheadMs + 5000))}
          >
            <MaterialCommunityIcons name="fast-forward-5" size={24} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setPlayheadMs(0)}
        >
          <MaterialCommunityIcons name="skip-backward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    alignItems: 'center',
  },
  ratioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  ratioLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginRight: 8,
  },
  ratioButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 3,
  },
  ratioButtonActive: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  ratioButtonText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  ratioButtonTextActive: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  viewportWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewportFrame: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#262626',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  videoCanvas: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockVideoContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeClipTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  effectIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  effectIndicatorText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  subtitleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transform: [{ translateY: -15 }],
  },
  subtitleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '90%',
  },
  subtitleText: {
    letterSpacing: 0.5,
  },
  controlsBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 8,
  },
  timecodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timecodeText: {
    color: '#FF3B30',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  durationText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  transportButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportBtn: {
    padding: 6,
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#FFF',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  resetBtn: {
    padding: 6,
  },
});
