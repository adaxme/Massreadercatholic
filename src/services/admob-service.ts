import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions, RewardAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class AdMobService {
  private static isInitialized = false;
  
  // Test Ad Unit IDs - Replace with your real ones in production
  private static readonly AD_UNITS = {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    reward: 'ca-app-pub-3940256099942544/5224354917'
  };

  static async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isInitialized) {
      return;
    }

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ['YOUR_DEVICE_ID_HERE'],
        initializeForTesting: true
      });
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }

  static async showBannerAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Banner ad would show here (web environment)');
      return;
    }

    try {
      const options: BannerAdOptions = {
        adId: this.AD_UNITS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true
      };

      await AdMob.showBanner(options);
      console.log('Banner ad shown');
    } catch (error) {
      console.error('Failed to show banner ad:', error);
    }
  }

  static async hideBannerAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.hideBanner();
      console.log('Banner ad hidden');
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
    }
  }

  static async showInterstitialAd(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Interstitial ad would show here (web environment)');
      return true;
    }

    try {
      const options: InterstitialAdOptions = {
        adId: this.AD_UNITS.interstitial,
        isTesting: true
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('Interstitial ad shown');
      return true;
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      return false;
    }
  }

  static async showRewardAd(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Reward ad would show here (web environment)');
      return true;
    }

    try {
      const options: RewardAdOptions = {
        adId: this.AD_UNITS.reward,
        isTesting: true
      };

      await AdMob.prepareRewardVideoAd(options);
      const result = await AdMob.showRewardVideoAd();
      console.log('Reward ad completed:', result);
      return result.rewarded;
    } catch (error) {
      console.error('Failed to show reward ad:', error);
      return false;
    }
  }
}