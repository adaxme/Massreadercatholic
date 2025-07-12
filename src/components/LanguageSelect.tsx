import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

interface LanguageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function LanguageSelect({ value, onValueChange }: LanguageSelectProps) {
  const languages = [
    { label: 'English', value: 'English' },
    { label: 'Español', value: 'Spanish' },
    { label: 'Italiano', value: 'Italian' },
    { label: 'Deutsch', value: 'German' },
  ];

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={onValueChange}
        items={languages}
        value={value}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
        placeholder={{}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 120,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 6,
    color: '#ffffff',
    backgroundColor: '#334155',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 6,
    color: '#ffffff',
    backgroundColor: '#334155',
    paddingRight: 30,
  },
});