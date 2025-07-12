import { useEffect, useState } from 'react';
import { AdMobService } from '../services/admob-service';

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      await AdMobService.initialize();
      setIsInitialized(true);
    };

    initializeAdMob();
  }, []);

  const showBanner = async () => {
    if (!isInitialized) return;
    await AdMobService.showBannerAd();
    setBannerVisible(true);
  };

  const hideBanner = async () => {
    if (!isInitialized) return;
    await AdMobService.hideBannerAd();
    setBannerVisible(false);
  };

  const showInterstitial = async (): Promise<boolean> => {
    if (!isInitialized) return false;
    return await AdMobService.showInterstitialAd();
  };

  const showReward = async (): Promise<boolean> => {
    if (!isInitialized) return false;
    return await AdMobService.showRewardAd();
  };

  return {
    isInitialized,
    bannerVisible,
    showBanner,
    hideBanner,
    showInterstitial,
    showReward
  };
}