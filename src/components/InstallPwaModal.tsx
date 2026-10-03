import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  X,
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already installed / standalone
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          onInstalled?.();
          onClose();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-[#1e1f20] border border-[#333537] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#333537] bg-[#1b1c1e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Install Korea AI App</h2>
              <p className="text-[11px] text-gray-400">Add to your mobile home screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2b2c2d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-[#131314]">
          {/* App Card Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#1e1f20] border border-[#333537]">
            <img
              src="/pwa-192x192.png"
              alt="Korea AI App"
              className="w-12 h-12 rounded-xl shadow-md border border-[#3e4144]"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Korea AI Studio</h3>
              <p className="text-xs text-gray-400 truncate">Smart Chat & Ultra-Fast Images</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-[#2b2c2d] text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                  ✓ Instant Launch
                </span>
                <span className="text-[10px] bg-[#2b2c2d] text-blue-400 px-1.5 py-0.5 rounded font-medium">
                  ✓ Fullscreen PWA
                </span>
              </div>
            </div>
          </div>

          {/* Conditional Instructions based on platform */}
          {deferredPrompt ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                Install Korea AI on your device for a 1-tap fullscreen native app experience with zero browser address bar clutter!
              </p>
              <button
                onClick={handleNativeInstall}
                disabled={isInstalling}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4285f4] to-[#9b72cb] hover:from-[#3367d6] hover:to-[#8659b8] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Install Now (One-Tap)'}</span>
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-200">
                How to install on iPhone / iPad (Safari):
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1e1f20] border border-[#2d2f31]">
                  <div className="w-7 h-7 rounded-md bg-[#2b2c2d] flex items-center justify-center text-[#4285f4] shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-gray-300">
                    1. Tap the <span className="font-semibold text-white">Share</span> button at the bottom of Safari (<Share className="w-3.5 h-3.5 inline mx-0.5" />).
                  </p>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1e1f20] border border-[#2d2f31]">
                  <div className="w-7 h-7 rounded-md bg-[#2b2c2d] flex items-center justify-center text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-gray-300">
                    2. Scroll down and tap <span className="font-semibold text-white">"Add to Home Screen"</span>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-200">
                How to install from Chrome 3-dots (⋮) Menu:
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1e1f20] border border-[#2d2f31]">
                  <div className="w-7 h-7 rounded-md bg-[#2b2c2d] flex items-center justify-center text-[#4285f4] shrink-0 font-bold text-sm">
                    ⋮
                  </div>
                  <p className="text-xs text-gray-300">
                    1. Tap the <span className="font-semibold text-white">3 dots (⋮)</span> in the top-right corner of your browser.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1e1f20] border border-[#2d2f31]">
                  <div className="w-7 h-7 rounded-md bg-[#2b2c2d] flex items-center justify-center text-[#9b72cb] shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-gray-300">
                    2. Look for <span className="font-semibold text-white">"Install app"</span> or <span className="font-semibold text-white">"Add to Home screen"</span> in the menu list.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Direct Shareable Link */}
          <div className="pt-2 border-t border-[#2d2f31]">
            <p className="text-[11px] text-gray-400 mb-1">Open this URL on your phone:</p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#18191a] border border-[#333537] text-xs">
              <span className="font-mono text-gray-300 select-all truncate flex-1">
                https://ais-pre-mrrjvnyt2lwlzbv6n73xu4-737985845851.asia-east1.run.app
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    'https://ais-pre-mrrjvnyt2lwlzbv6n73xu4-737985845851.asia-east1.run.app'
                  );
                }}
                className="px-2.5 py-1 bg-[#2b2c2d] hover:bg-[#383a3c] text-white rounded text-[11px] cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MobileInstallBannerProps {
  onOpenModal: () => void;
  deferredPrompt: any;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  onOpenModal,
  deferredPrompt,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
  }, []);

  if (dismissed || isStandalone) return null;

  return (
    <div className="sm:hidden bg-[#1e1f20] border-b border-[#333537] px-3 py-2 flex items-center justify-between gap-2 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src="/pwa-192x192.png"
          alt="Korea AI"
          className="w-7 h-7 rounded-lg shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">Install Korea AI</p>
          <p className="text-[10px] text-gray-400 truncate">1-tap home screen app</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={async () => {
            if (deferredPrompt) {
              try {
                await deferredPrompt.prompt();
              } catch {
                onOpenModal();
              }
            } else {
              onOpenModal();
            }
          }}
          className="px-2.5 py-1 bg-gradient-to-r from-[#4285f4] to-[#9b72cb] text-white text-[11px] font-semibold rounded-lg shadow-sm cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-gray-400 hover:text-white rounded cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
