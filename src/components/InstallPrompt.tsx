import { useState, useEffect, useCallback } from 'react';
import { Download, X, Share, ChevronUp } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) return;
    if (sessionStorage.getItem('install-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing to not be intrusive on load
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS fallback — show after delay
    if (isIOS) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone, isIOS]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setShowIOSGuide(false);
    sessionStorage.setItem('install-dismissed', '1');
  };

  if (isStandalone || !showBanner || dismissed) return null;

  // iOS instructions modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 mb-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Install on iPhone</h3>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</div>
              <p className="text-sm text-muted-foreground">Tap the <Share className="inline h-4 w-4 text-primary" /> <strong className="text-foreground">Share</strong> button in Safari</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">2</div>
              <p className="text-sm text-muted-foreground">Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">3</div>
              <p className="text-sm text-muted-foreground">Tap <strong className="text-foreground">"Add"</strong> and the app will appear on your home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full mt-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Floating install banner
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative bg-card border border-primary/30 rounded-2xl p-4 shadow-lg shadow-primary/10">
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
            <Download className="h-6 w-6 text-primary animate-bounce" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-chart-4 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install PrecisionFlow</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS ? 'Add to your home screen for the best experience' : 'Get the full app experience on your phone'}
            </p>
          </div>
        </div>

        <button
          onClick={handleInstall}
          className="w-full mt-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Download className="h-4 w-4" />
          {isIOS ? 'Show me how' : 'Install App'}
        </button>
      </div>
    </div>
  );
}
