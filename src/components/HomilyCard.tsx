import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface HomilyCardProps {
  homily: string;
}

export function HomilyCard({ homily }: HomilyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homily</CardTitle>
      </CardHeader>
      <CardContent>
        <Text style={styles.homilyText}>{homily}</Text>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  homilyText: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
});