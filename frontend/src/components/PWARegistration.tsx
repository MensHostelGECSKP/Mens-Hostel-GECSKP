"use client";
import { useEffect } from 'react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Window interface to include our custom properties
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    triggerPWAInstall?: () => Promise<boolean>;
    triggerPWAUpdate?: (worker: ServiceWorker) => void;
  }
}

export default function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // Register the service worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          // Check if there is an update already waiting
          if (registration.waiting) {
            window.dispatchEvent(
              new CustomEvent('pwaUpdateAvailable', { detail: registration.waiting })
            );
          }

          // Monitor the lifecycle of incoming service workers
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new worker is installed and waiting to take control
                  window.dispatchEvent(
                    new CustomEvent('pwaUpdateAvailable', { detail: registration.waiting || installingWorker })
                  );
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });

      // Handle controller change (reloads page when the new worker takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed. Reloading page...');
        window.location.reload();
      });

      // Expose a method to force service worker skip waiting
      window.triggerPWAUpdate = (worker: ServiceWorker) => {
        if (worker) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      };
    }

    // Handle PWA installation prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PWA] App is installable');
      // Dispatch event for UI to show install button
      window.dispatchEvent(new CustomEvent('pwaInstallable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    // Handle app installed event
    const handleAppInstalled = () => {
      deferredPrompt = null;
      console.log('[PWA] App was installed');
      // Dispatch event for UI to hide install button
      window.dispatchEvent(new CustomEvent('pwaInstalled'));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Handle offline/online status
    const handleOnline = () => {
      document.body.classList.remove('offline');
      // Dispatch custom event for UI banners
      window.dispatchEvent(new CustomEvent('pwaOnline'));
      
      // Attempt to sync online sync
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ONLINE_SYNC' });
      }
    };

    const handleOffline = () => {
      document.body.classList.add('offline');
      // Dispatch custom event for UI banners
      window.dispatchEvent(new CustomEvent('pwaOffline'));
    };

    // Set initial offline status
    if (!navigator.onLine) handleOffline();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Expose PWA install prompt for other components
    window.triggerPWAInstall = async () => {
      if (!deferredPrompt) {
        console.warn('[PWA] Cannot trigger install: prompt event not deferred yet');
        return false;
      }
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return outcome === 'accepted';
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      delete window.triggerPWAInstall;
      delete window.triggerPWAUpdate;
    };
  }, []);

  return null; // This component doesn't render anything
} 