import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { DailyReadingOutput, getDailyReading } from './services/daily-reading-service';
import { Header } from './components/Header';
import { ReadingsCard } from './components/ReadingsCard';
import { HomilyCard } from './components/HomilyCard';
import { SaintCard } from './components/SaintCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(true);
  const [readingData, setReadingData] = useState<DailyReadingOutput | null>(null);

  const showToast = useCallback((title: string, description: string, type: 'error' | 'success' = 'error') => {
    Toast.show({
      type,
      text1: title,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
    });
  }, []);

  const handleGenerate = useCallback(async (lang: string) => {
    setLoading(true);
    setReadingData(null);
    try {
      const data = await getDailyReading({ language: lang });
      setReadingData(data);
    } catch (error) {
      console.error(error);
      showToast(
        'Error Generating Content',
        'There was an issue fetching the daily readings. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    handleGenerate(language);
  }, [language, handleGenerate]);

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      <Header 
        language={language} 
        onLanguageChange={handleLanguageChange} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          readingData && (
            <View style={styles.content}>
              <View style={styles.mainContent}>
                <ReadingsCard readings={readingData} />
                <HomilyCard homily={readingData.homily} />
              </View>
              <View style={styles.sideContent}>
                <SaintCard saint={readingData.saintOfTheDay} />
              </View>
            </View>
          )
        )}
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
    gap: 24,
  },
  mainContent: {
    gap: 24,
  },
  sideContent: {
    // Will be styled in individual components
  },
});