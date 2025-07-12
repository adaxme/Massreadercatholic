import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Church, Languages, UserCircle } from 'lucide-react';
import { DailyReadingOutput, getDailyReading } from './services/daily-reading-service';
import { useAdMob } from './hooks/use-admob';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Skeleton } from './components/ui/skeleton';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';

export default function App() {
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(true);
  const [readingData, setReadingData] = useState<DailyReadingOutput | null>(null);
  const { toast } = useToast();
  const { isInitialized: adMobInitialized, showBanner, showInterstitial } = useAdMob();

  const handleGenerate = useCallback(async (lang: string) => {
    setLoading(true);
    setReadingData(null);
    try {
      const data = await getDailyReading({ language: lang });
      setReadingData(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Content',
        description: 'There was an issue fetching the daily readings. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize Capacitor features
  useEffect(() => {
    const initializeCapacitor = async () => {
      if (Capacitor.isNativePlatform()) {
        // Set status bar style
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Handle app state changes
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active?', isActive);
        });
      }
    };

    initializeCapacitor();
  }, []);

  // Show banner ad when content loads
  useEffect(() => {
    if (adMobInitialized && readingData && !loading) {
      showBanner();
    }
  }, [adMobInitialized, readingData, loading, showBanner]);

  useEffect(() => {
    handleGenerate(language);
  }, [language, handleGenerate]);

  const handleLanguageChange = async (newLanguage: string) => {
    // Show interstitial ad occasionally when changing language
    if (adMobInitialized && Math.random() < 0.3) {
      await showInterstitial();
    }
    setLanguage(newLanguage);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <Church className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Daily Catholic Readings</h1>
        </div>
        <div className="flex items-center gap-4">
          <Languages className="h-5 w-5 text-muted-foreground" />
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Español</SelectItem>
              <SelectItem value="Italian">Italiano</SelectItem>
              <SelectItem value="German">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 md:p-8 pb-20">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          readingData && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="col-span-1 space-y-8 lg:col-span-2">
                <ReadingsCard readings={readingData} />
                <HomilyCard homily={readingData.homily} />
              </div>
              <div className="col-span-1">
                <SaintCard saint={readingData.saintOfTheDay} />
              </div>
            </div>
          )
        )}
      </main>
      <Toaster />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="col-span-1 space-y-8 lg:col-span-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SaintCard({ saint }: { saint: DailyReadingOutput['saintOfTheDay'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-6 w-6" />
          Saint of the Day
        </CardTitle>
        <CardDescription>{saint.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{saint.biography}</p>
      </CardContent>
    </Card>
  );
}

function ReadingsCard({ readings }: { readings: DailyReadingOutput }) {
  const feastParts = readings.feast.split(' or ');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Today's Readings
        </CardTitle>
        <CardDescription>
          <div>
            <p className="font-medium text-foreground">{feastParts[0]}</p>
            {feastParts.length > 1 && (
              <p className="text-xs italic">or {feastParts[1]}</p>
            )}
            <p className="mt-1">{readings.date}</p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="item-1">
          <ReadingItem value="item-1" title="First Reading" reference={readings.firstReading.reference} text={readings.firstReading.text} />
          <ReadingItem value="item-2" title="Responsorial Psalm" reference={readings.responsorialPsalm.reference} text={readings.responsorialPsalm.text} />
          <ReadingItem value="item-3" title="Gospel" reference={readings.gospel.reference} text={readings.gospel.text} />
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ReadingItem({ value, title, reference, text }: { value: string; title: string; reference: string; text: string }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-lg">
        <div>
          {title}
          <p className="text-sm font-normal text-muted-foreground">{reference}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
      </AccordionContent>
    </AccordionItem>
  );
}

function HomilyCard({ homily }: { homily: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homily</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{homily}</p>
      </CardContent>
    </Card>
  );
}