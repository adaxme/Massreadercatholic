import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DailyReadingOutput } from '../services/daily-reading-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface SaintCardProps {
  saint: DailyReadingOutput['saintOfTheDay'];
}

export function SaintCard({ saint }: SaintCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<Icon name="person" size={24} color="#ffffff" />}>
          Saint of the Day
        </CardTitle>
        <CardDescription>
          <Text style={styles.saintName}>{saint.name}</Text>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Text style={styles.biography}>{saint.biography}</Text>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  saintName: {
    fontSize: 16,
    color: '#94a3b8',
  },
  biography: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});