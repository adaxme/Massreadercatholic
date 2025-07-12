import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LanguageSelect } from './LanguageSelect';

interface HeaderProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Icon name="church" size={24} color="#ffffff" />
        <Text style={styles.title}>Daily Catholic Readings</Text>
      </View>
      <View style={styles.controls}>
        <Icon name="language" size={20} color="#94a3b8" />
        <LanguageSelect 
          value={language} 
          onValueChange={onLanguageChange} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});