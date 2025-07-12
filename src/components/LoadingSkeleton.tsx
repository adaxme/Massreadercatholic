import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function LoadingSkeleton() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {/* Readings Card Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Animated.View style={[styles.skeletonTitle, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonSubtitle, { opacity: shimmerOpacity }]} />
          </View>
          <View style={styles.cardContent}>
            <Animated.View style={[styles.skeletonItem, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonItem, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonItem, { opacity: shimmerOpacity }]} />
          </View>
        </View>

        {/* Homily Card Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Animated.View style={[styles.skeletonSmallTitle, { opacity: shimmerOpacity }]} />
          </View>
          <View style={styles.cardContent}>
            <Animated.View style={[styles.skeletonLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLineShort, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, { opacity: shimmerOpacity }]} />
          </View>
        </View>
      </View>

      {/* Saint Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Animated.View style={[styles.skeletonMediumTitle, { opacity: shimmerOpacity }]} />
        </View>
        <View style={styles.cardContent}>
          <Animated.View style={[styles.skeletonLine, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.skeletonLine, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.skeletonLineShort, { opacity: shimmerOpacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  mainContent: {
    gap: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '75%',
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '50%',
  },
  skeletonSmallTitle: {
    height: 20,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '25%',
  },
  skeletonMediumTitle: {
    height: 20,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '50%',
  },
  skeletonItem: {
    height: 40,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginVertical: 4,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '80%',
  },
});