import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className = '' }: AdBannerProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // On web, show a placeholder for the ad space
  if (!isNative) {
    return (
      <div className={`bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">Ad Space (Mobile Only)</p>
      </div>
    );
  }

  // On native, the actual ad will be rendered by AdMob
  return <div className={`h-12 ${className}`} id="admob-banner-container" />;
}