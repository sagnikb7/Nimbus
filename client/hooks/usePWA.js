import { useCallback, useEffect, useState } from 'react';

/**
 * PWA install state.
 *
 * Chrome/Edge/Brave fire `beforeinstallprompt` when the app is installable; we
 * stash the event and expose `promptInstall()` so the in-app "Install" button
 * (Settings → About) can trigger the native dialog on demand. iOS Safari never
 * fires this event, so we detect it and show A2HS instructions instead.
 *
 * Returns:
 *  - canInstall  — true when a native prompt is available (non-iOS, not installed)
 *  - promptInstall() — shows the native dialog; resolves to 'accepted'|'dismissed'|null
 *  - isInstalled — running as an installed app (standalone display mode)
 *  - isIOS       — iOS Safari (needs manual Add to Home Screen)
 */
export default function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => getStandalone());

  const isIOS = getIsIOS();

  useEffect(() => {
    const onBeforeInstall = (e) => {
      // Prevent Chrome's mini-infobar; we drive the prompt from Settings.
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Keep isInstalled in sync if the user installs/uninstalls while open.
    const mq = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = (ev) => setIsInstalled(ev.matches);
    mq.addEventListener?.('change', onDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', onDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // A prompt can only be used once — drop it either way.
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    promptInstall,
    isInstalled,
    isIOS,
  };
}

function getStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes navigator.standalone instead of display-mode.
    window.navigator.standalone === true
  );
}

function getIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch points.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}
