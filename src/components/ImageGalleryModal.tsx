import React, { useState } from 'react';
import { X, Download, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { ChatMessage } from '../types';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSelectImage: (msg: ChatMessage) => void;
  onUsePrompt: (prompt: string) => void;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (msgId: string) => void;
  initialTab?: 'all' | 'favorites';
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSelectImage,
  onUsePrompt,
  favoriteIds = new Set<string>(),
  onToggleFavorite,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>(initialTab);

  if (!isOpen) return null;

  // Extract all AI messages that contain an imageUrl
  const allImageMessages = messages.filter((m) => m.imageUrl);
  const favoriteMessages = allImageMessages.filter((m) => favoriteIds.has(m.id) || m.isFavorite);

  const displayedMessages = activeTab === 'favorites' ? favoriteMessages : allImageMessages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[88vh] bg-[#1e1f20] border border-[#333537] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[#333537] bg-[#1b1c1e] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2b2c2d] flex items-center justify-center text-[#9b72cb]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Generated Images Gallery</h2>
              <p className="text-xs text-gray-400">
                {allImageMessages.length} {allImageMessages.length === 1 ? 'image' : 'images'} created · {favoriteMessages.length} favorited
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Gallery Tabs: All Images vs Favorites */}
            <div className="flex items-center p-1 bg-[#141517] rounded-xl border border-[#333537]">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#2b2c2d] text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>All Images</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#1b1c1e] text-gray-300">
                  {allImageMessages.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-[#2b2c2d] text-rose-400 shadow-xs'
                    : 'text-gray-400 hover:text-rose-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
                <span>Favorites</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#1b1c1e] text-rose-300">
                  {favoriteMessages.length}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2b2c2d] transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#131314]">
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1e1f20] border border-[#333537] flex items-center justify-center text-gray-500 mb-3">
                {activeTab === 'favorites' ? (
                  <Heart className="w-7 h-7 text-rose-400/60" />
                ) : (
                  <ImageIcon className="w-7 h-7" />
                )}
              </div>
              <p className="text-gray-300 font-medium">
                {activeTab === 'favorites'
                  ? 'Abhi tak koi favorite image save nahi hui'
                  : 'Abhi tak koi image generate nahi hui'}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                {activeTab === 'favorites'
                  ? 'Generated images ke neeche bane Heart button par click karke apni pasandida images yahan Favorites tab me save karein!'
                  : 'Input bar me mode ko "🎨 Image" par switch karke apni pasand ki koi bhi tasweer generate karein!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayedMessages.map((msg) => {
                const isFav = favoriteIds.has(msg.id) || !!msg.isFavorite;
                return (
                  <div
                    key={msg.id}
                    className="group relative bg-[#1e1f20] border border-[#333537] rounded-xl overflow-hidden flex flex-col hover:border-[#4285f4]/60 transition-all shadow-md"
                  >
                    <div
                      className="relative aspect-square bg-[#17181a] overflow-hidden cursor-pointer"
                      onClick={() => {
                        onSelectImage(msg);
                      }}
                    >
                      <img
                        src={msg.imageUrl}
                        alt={msg.imagePrompt || 'Generated image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Right Heart Badge in Gallery */}
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(msg.id);
                          }}
                          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            isFav
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-sm'
                              : 'bg-black/60 text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100'
                          }`}
                          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                        <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
                          View Fullscreen
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed font-normal">
                        {msg.imagePrompt || msg.content}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2b2c2d] text-xs text-gray-400">
                        <span>{msg.imageAspectRatio || '1:1'}</span>
                        <div className="flex items-center gap-1.5">
                          {onToggleFavorite && (
                            <button
                              onClick={() => onToggleFavorite(msg.id)}
                              className={`p-1 rounded hover:bg-[#2b2c2d] transition-colors cursor-pointer ${
                                isFav ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                              }`}
                              title={isFav ? 'Remove favorite' : 'Add favorite'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => onUsePrompt(msg.imagePrompt || msg.content)}
                            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#2b2c2d] transition-colors cursor-pointer"
                            title="Use prompt again"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#9b72cb]" />
                          </button>
                          <a
                            href={msg.imageUrl}
                            download={`korea_ai_${msg.id}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#2b2c2d] transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5 text-[#4285f4]" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
