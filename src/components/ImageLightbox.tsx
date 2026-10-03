import React, { useState } from 'react';
import { X, Download, Copy, Check, Sparkles, Heart } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  prompt: string;
  aspectRatio?: string;
  style?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClose: () => void;
  onUsePrompt?: (prompt: string) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  prompt,
  aspectRatio = '1:1',
  style,
  isFavorite = false,
  onToggleFavorite,
  onClose,
  onUsePrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!imageUrl) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // Fetch blob to download cleanly
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (prompt.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_') || 'korea_ai_image') + '.png';
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = imageUrl;
      link.target = '_blank';
      link.download = 'korea_ai_image.png';
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] bg-[#1e1f20] border border-[#333537] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333537] bg-[#1b1c1e]">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-semibold text-white">Korea AI Studio</span>
            <span>·</span>
            <span>Ratio {aspectRatio}</span>
            {style && (
              <>
                <span>·</span>
                <span className="text-[#9b72cb]">{style}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2b2c2d] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#131314]">
          <img
            src={imageUrl}
            alt={prompt}
            className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg border border-[#2d2f31]"
          />
        </div>

        {/* Bottom Details & Actions */}
        <div className="p-4 bg-[#1e1f20] border-t border-[#333537] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs text-gray-400 uppercase font-mono tracking-wider mb-1">Prompt</p>
            <p className="text-sm text-gray-200 line-clamp-2 select-text font-normal">{prompt}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-500/50'
                    : 'bg-[#2b2c2d] text-gray-200 hover:bg-[#383a3c] hover:text-rose-400'
                }`}
                title={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            )}

            {onUsePrompt && (
              <button
                onClick={() => {
                  onUsePrompt(prompt);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#2b2c2d] text-gray-200 hover:bg-[#383a3c] hover:text-white transition-colors cursor-pointer"
                title="Use prompt again"
              >
                <Sparkles className="w-4 h-4 text-[#9b72cb]" />
                <span>Use Prompt</span>
              </button>
            )}

            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#2b2c2d] text-gray-200 hover:bg-[#383a3c] hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#4285f4] text-white hover:bg-[#3367d6] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Saving...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
